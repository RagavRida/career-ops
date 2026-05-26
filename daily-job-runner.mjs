#!/usr/bin/env node
/**
 * daily-job-runner.mjs
 * 
 * 1. Runs scan.mjs to get the latest jobs from portals
 * 2. Reads data/pipeline.md for pending jobs (- [ ])
 * 3. Takes the first N jobs and runs auto-apply.mjs on them
 * 4. Marks them as processed (- [x]) in data/pipeline.md
 * 
 * Usage:
 *   node daily-job-runner.mjs [limit]
 *   (limit defaults to 5)
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PIPELINE_FILE = join(ROOT, 'data', 'pipeline.md');

// Limit how many jobs to apply for per day to avoid API limits
const limit = parseInt(process.argv[2]) || 5;

console.log('🔄 Starting Daily Job Runner...');

// 1. Run the scanner to find new jobs
console.log('\n📡 Scanning portals for new jobs (this takes about 30 seconds)...');
try {
  execSync('node scan.mjs', { cwd: ROOT, stdio: 'inherit' });
} catch (err) {
  console.error('⚠️ Scanner failed or partially succeeded, continuing with existing pipeline...');
}

// 2. Read the pipeline file
if (!existsSync(PIPELINE_FILE)) {
  console.error('❌ data/pipeline.md not found. Exiting.');
  process.exit(1);
}

let pipelineText = readFileSync(PIPELINE_FILE, 'utf-8');
const lines = pipelineText.split('\n');

const pendingJobs = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.trim().startsWith('- [ ]')) {
    // Extract the URL (usually the first thing after - [ ])
    const match = line.match(/- \[ \] (https:\/\/[^\s|]+)/);
    if (match) {
      pendingJobs.push({ lineIndex: i, url: match[1], fullLine: line });
    }
  }
}

if (pendingJobs.length === 0) {
  console.log('✅ No pending jobs found in data/pipeline.md. You are all caught up!');
  process.exit(0);
}

console.log(`\n📋 Found ${pendingJobs.length} pending jobs. Processing the top ${Math.min(limit, pendingJobs.length)}...`);

let processedCount = 0;

// 3. Process jobs up to the limit
for (const job of pendingJobs.slice(0, limit)) {
  console.log(`\n======================================================`);
  console.log(`🚀 Processing Job ${processedCount + 1}/${limit}: ${job.url}`);
  console.log(`======================================================`);
  
  try {
    // Run auto-apply.mjs
    execSync(`node auto-apply.mjs --url "${job.url}"`, { cwd: ROOT, stdio: 'inherit' });
    
    // Mark as processed in the text
    lines[job.lineIndex] = lines[job.lineIndex].replace('- [ ]', '- [x]');
    processedCount++;
  } catch (err) {
    console.error(`❌ Failed to process ${job.url}. Marking as failed.`);
    lines[job.lineIndex] = lines[job.lineIndex].replace('- [ ]', '- [!] (Failed)');
  }
}

// 4. Update pipeline.md
writeFileSync(PIPELINE_FILE, lines.join('\n'), 'utf-8');

console.log(`\n🎉 Daily run complete! Processed ${processedCount} jobs.`);
console.log(`You can run this script via crontab to automate it every day.`);
