#!/usr/bin/env node

/**
 * cli.mjs — Unified CLI Entry Point for Career-Ops
 * Provides commands for manual execution and lets users spin up the stdio MCP server.
 */

import { fork, execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const command = args[0];

const HELP_MENU = `
apply-jobs — Unified Command Line Interface

Usage:
  apply-jobs <command> [arguments]

Commands:
  mcp             → Start the stdio Model Context Protocol (MCP) server
  evaluate <JD>   → Run single evaluation and generate PDF & tracker entries
  scan            → Scan GreenHouse, Ashby, and Lever applicant portals
  sync            → Validate cv.md matches profile templates
  doctor          → Run apply-jobs health check and dependencies check
  merge           → Merge pending tracker entries
  verify          → Run pipeline validation check
  normalize       → Normalize application statuses
  dedup           → Dedup tracker entries

Examples:
  apply-jobs mcp
  apply-jobs evaluate "JD text here"
  apply-jobs scan
`;

function runProcess(file, passArgs = []) {
  const filePath = resolve(__dirname, file);
  const child = fork(filePath, passArgs, { stdio: 'inherit' });
  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

switch (command) {
  case 'mcp':
    console.log('Starting apply-jobs stdio MCP Server...');
    runProcess('mcp-server.mjs');
    break;

  case 'evaluate':
    if (args.length < 2) {
      console.error('Error: Please provide job description text or a file path after "evaluate".');
      process.exit(1);
    }
    runProcess('gemini-eval.mjs', args.slice(1));
    break;

  case 'scan':
    runProcess('scan.mjs');
    break;

  case 'sync':
    runProcess('cv-sync-check.mjs');
    break;

  case 'doctor':
    runProcess('doctor.mjs');
    break;

  case 'merge':
    runProcess('merge-tracker.mjs');
    break;

  case 'verify':
    runProcess('verify-pipeline.mjs');
    break;

  case 'normalize':
    runProcess('normalize-statuses.mjs');
    break;

  case 'dedup':
    runProcess('dedup-tracker.mjs');
    break;

  case '--help':
  case '-h':
  case undefined:
    console.log(HELP_MENU);
    break;

  default:
    // If the command is unrecognized, treat the entire arguments array as a JD and evaluate it!
    // This maintains the high-agency "/apply-jobs {JD}" default behavior
    console.log('Unrecognized command. Treating input as a Job Description for direct evaluation...');
    runProcess('gemini-eval.mjs', [args.join(' ')]);
}
