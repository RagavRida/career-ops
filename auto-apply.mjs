#!/usr/bin/env node
/**
 * auto-apply.mjs — Full automated job application pipeline
 *
 * One command: JD in → evaluation + tailored CV + draft email + tracker update
 *
 * Usage:
 *   node auto-apply.mjs "Paste full JD text here"
 *   node auto-apply.mjs --file ./jds/my-job.txt
 *   node auto-apply.mjs --url https://example.com/jobs/123
 *
 * Requires:
 *   GEMINI_API_KEY in .env (free tier works)
 *
 * Output:
 *   1. reports/{num}-{company}-{date}.md  — Full A-G evaluation
 *   2. output/{num}-{company}-cv.html     — Tailored CV (HTML)
 *   3. output/{num}-{company}-cv.pdf      — Tailored CV (PDF, if Playwright installed)
 *   4. output/{num}-{company}-email.md    — Draft application email
 *   5. batch/tracker-additions/{num}.tsv  — Tracker entry
 *   6. Auto-merges tracker
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
try {
  const { config } = await import('dotenv');
  config();
} catch { /* dotenv optional */ }

import { GoogleGenerativeAI } from '@google/generative-ai';

const ROOT = dirname(fileURLToPath(import.meta.url));

const PATHS = {
  shared:     join(ROOT, 'modes', '_shared.md'),
  evaluate:     join(ROOT, 'modes', 'oferta.md'),
  cv:         join(ROOT, 'cv.md'),
  profile:    join(ROOT, 'modes', '_profile.md'),
  profileYml: join(ROOT, 'config', 'profile.yml'),
  cvTemplate: join(ROOT, 'templates', 'cv-template.html'),
  reports:    join(ROOT, 'reports'),
  output:     join(ROOT, 'output'),
  tracker:    join(ROOT, 'batch', 'tracker-additions'),
};

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║        career-ops — Auto-Apply Pipeline (Gemini-powered)        ║
╚══════════════════════════════════════════════════════════════════╝

  One command: JD → Evaluation → Tailored CV → Draft Email → Tracker

  USAGE
    node auto-apply.mjs "Paste full JD text here"
    node auto-apply.mjs --file ./jds/my-job.txt

  OPTIONS
    --file <path>    Read JD from a file
    --model <name>   Gemini model (default: gemini-2.5-flash)
    --no-pdf         Skip PDF generation
    --help           Show this help

  SETUP
    1. Get a free API key at https://aistudio.google.com/apikey
    2. Add GEMINI_API_KEY=<your-key> to .env
    3. Run: npm install @google/generative-ai dotenv
`);
  process.exit(0);
}

let jdText = '';
let modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
let generatePdf = true;
let jobUrl = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file' && args[i + 1]) {
    const filePath = args[++i];
    if (!existsSync(filePath)) { console.error(`❌ File not found: ${filePath}`); process.exit(1); }
    jdText = readFileSync(filePath, 'utf-8').trim();
  } else if (args[i] === '--url' && args[i + 1]) {
    jobUrl = args[++i];
  } else if (args[i] === '--model' && args[i + 1]) {
    modelName = args[++i];
  } else if (args[i] === '--no-pdf') {
    generatePdf = false;
  } else if (!args[i].startsWith('--')) {
    jdText += (jdText ? '\n' : '') + args[i];
  }
}

if (!jdText && !jobUrl) { console.error('❌ No JD provided. Run with --help.'); process.exit(1); }

// Fetch URL if provided
if (jobUrl) {
  console.log(`\n🌐 Fetching Job Description from URL: ${jobUrl}...`);
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(jobUrl, { waitUntil: 'networkidle' });
    jdText = await page.locator('body').innerText();
    await browser.close();
    if (!jdText || jdText.length < 100) {
      console.error('❌ Failed to extract meaningful text from the URL.');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Playwright failed to fetch URL:', err.message);
    process.exit(1);
  }
}

const apiKey = process.env.GEMINI_API_KEY;
const featherlessKey = process.env.FEATHERLESS_API_KEY;
if (!apiKey && !featherlessKey) {
  console.error('❌ Neither GEMINI_API_KEY nor FEATHERLESS_API_KEY found in .env');
  process.exit(1);
}

async function askAI(prompt) {
  if (featherlessKey) {
    const res = await fetch('https://api.featherless.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${featherlessKey}`
      },
      body: JSON.stringify({
        model: modelName.startsWith('gemini') ? 'Qwen/Qwen2.5-72B-Instruct' : modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 8192
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Featherless API error: ${res.status} - ${errText}`);
    }
    const data = await res.json();
    return data.choices[0].message.content;
  } else {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
    });
    const result = await model.generateContent([{ text: prompt }]);
    return result.response.text();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function readFile(path, label) {
  if (!existsSync(path)) { console.warn(`⚠️  ${label} not found`); return `[${label} not found]`; }
  return readFileSync(path, 'utf-8').trim();
}

function nextNum() {
  if (!existsSync(PATHS.reports)) return '001';
  const nums = readdirSync(PATHS.reports)
    .filter(f => /^\d{3}-/.test(f))
    .map(f => parseInt(f.slice(0, 3)))
    .filter(n => !isNaN(n));
  return nums.length === 0 ? '001' : String(Math.max(...nums) + 1).padStart(3, '0');
}

function ensureDir(dir) { if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); }

// ---------------------------------------------------------------------------
// Load context
// ---------------------------------------------------------------------------
console.log('\n🚀 career-ops AUTO-APPLY PIPELINE');
console.log('═'.repeat(50));
console.log('📂 Loading context...');

const cvContent      = readFile(PATHS.cv, 'cv.md');
const sharedContext   = readFile(PATHS.shared, '_shared.md');
const evaluateLogic     = readFile(PATHS.evaluate, 'oferta.md');
const profileContent  = readFile(PATHS.profile, '_profile.md');
const profileYml      = readFile(PATHS.profileYml, 'profile.yml');
const cvTemplate      = readFile(PATHS.cvTemplate, 'cv-template.html');

// ---------------------------------------------------------------------------
// STEP 1: Evaluate
// ---------------------------------------------------------------------------
console.log(`\n📋 STEP 1/4: Evaluating JD with Gemini (${modelName})...`);

const evalPrompt = `You are career-ops, an AI job search assistant.
Evaluate the job offer below against the candidate's CV using blocks A-G.

${sharedContext}

${evaluateLogic}

CANDIDATE CV:
${cvContent}

CANDIDATE PROFILE:
${profileYml}

CANDIDATE ARCHETYPES:
${profileContent}

RULES:
1. No WebSearch/Playwright — estimate comp from training data.
2. Full blocks A-G in English.
3. End with this exact format:

---SCORE_SUMMARY---
COMPANY: <company>
ROLE: <role>
SCORE: <decimal e.g. 4.2>
ARCHETYPE: <detected>
LEGITIMACY: <High Confidence | Proceed with Caution | Suspicious>
---END_SUMMARY---`;

let evalText;
try {
  evalText = await askAI(evalPrompt + `\n\nJOB DESCRIPTION:\n\n${jdText}`);
} catch (err) {
  console.error('❌ AI evaluation failed:', err.message?.replace(apiKey, '[REDACTED]').replace(featherlessKey, '[REDACTED]'));
  process.exit(1);
}

// Parse summary
const summaryMatch = evalText.match(/---SCORE_SUMMARY---\s*([\s\S]*?)---END_SUMMARY---/);
let company = 'unknown', role = 'unknown', score = '?', archetype = 'unknown', legitimacy = 'unknown';
if (summaryMatch) {
  const extract = (key) => {
    const m = summaryMatch[1].match(new RegExp(`${key}:\\s*(.+)`, 'i'));
    return m ? m[1].trim() : 'unknown';
  };
  company    = extract('COMPANY');
  role       = extract('ROLE');
  score      = extract('SCORE');
  archetype  = extract('ARCHETYPE');
  legitimacy = extract('LEGITIMACY');
}

const num = nextNum();
const today = new Date().toISOString().split('T')[0];
const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

console.log(`   ✅ ${company} — ${role} | Score: ${score}/5 | ${legitimacy}`);

// Save report
ensureDir(PATHS.reports);
const reportFile = `${num}-${slug}-${today}.md`;
const reportContent = `# Evaluation: ${company} — ${role}

**Date:** ${today}
**Archetype:** ${archetype}
**Score:** ${score}/5
**Legitimacy:** ${legitimacy}
**PDF:** pending
**Tool:** auto-apply (Gemini ${modelName})

---

${evalText.replace(/---SCORE_SUMMARY---[\s\S]*?---END_SUMMARY---/, '').trim()}
`;
writeFileSync(join(PATHS.reports, reportFile), reportContent, 'utf-8');
console.log(`   📄 Report: reports/${reportFile}`);

// ---------------------------------------------------------------------------
// STEP 2: Generate tailored CV
// ---------------------------------------------------------------------------
console.log(`\n📝 STEP 2/4: Generating tailored CV...`);

const cvPrompt = `Generate a complete HTML CV for this candidate, tailored for the job below.

Use this exact HTML template structure (fill in all {{PLACEHOLDERS}}):
- Use the career-ops CV template design (Space Grotesk headings, DM Sans body, teal/purple gradient)
- Font files are at ./fonts/space-grotesk-latin.woff2, ./fonts/dm-sans-latin.woff2, etc.
- Reorder and emphasize projects/skills that match the JD
- Write a tailored Professional Summary (3-4 lines) that maps candidate strengths to JD requirements
- Include only the most relevant 4-5 projects for this specific role
- Core Competencies tags should use JD keywords
- Keep to 1-2 pages max

CANDIDATE CV:
${cvContent}

CANDIDATE PROFILE:
${profileYml}

JOB DESCRIPTION:
${jdText}

COMPANY: ${company}
ROLE: ${role}

Output ONLY the complete HTML document, starting with <!DOCTYPE html> and ending with </html>. No markdown wrapping, no explanation.`;

let cvHtml;
try {
  cvHtml = await askAI(cvPrompt);
  // Strip markdown code fences if present
  cvHtml = cvHtml.replace(/^```html?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
} catch (err) {
  console.error('⚠️  CV generation failed, skipping:', err.message?.replace(apiKey, '[REDACTED]').replace(featherlessKey, '[REDACTED]'));
  cvHtml = null;
}

ensureDir(PATHS.output);
const cvHtmlFile = `${num}-${slug}-cv.html`;
const cvPdfFile  = `${num}-${slug}-cv.pdf`;

if (cvHtml) {
  writeFileSync(join(PATHS.output, cvHtmlFile), cvHtml, 'utf-8');
  console.log(`   ✅ HTML: output/${cvHtmlFile}`);

  // Try PDF generation
  if (generatePdf) {
    try {
      execSync(
        `node generate-pdf.mjs output/${cvHtmlFile} output/${cvPdfFile} --format=a4`,
        { cwd: ROOT, stdio: 'pipe' }
      );
      console.log(`   ✅ PDF:  output/${cvPdfFile}`);
    } catch {
      console.log(`   ⚠️  PDF generation skipped (Playwright not available)`);
    }
  }
} else {
  console.log(`   ⚠️  CV generation skipped`);
}

// ---------------------------------------------------------------------------
// STEP 3: Draft application email
// ---------------------------------------------------------------------------
console.log(`\n📧 STEP 3/4: Drafting application email...`);

const emailPrompt = `Draft a concise application email for this candidate applying to ${company} for ${role}.

Rules:
- Max 150 words in the body
- No "passionate about" or corporate-speak
- Lead with 2-3 most relevant proof points from the CV that match the JD
- Include "willing to relocate" if location differs
- End with "CV attached. Happy to discuss further."
- Sign off with name, phone (from profile), GitHub, and portfolio links
- Include a Subject line

CANDIDATE CV:
${cvContent}

CANDIDATE PROFILE:
${profileYml}

JOB DESCRIPTION (summary):
Company: ${company}
Role: ${role}
Archetype: ${archetype}

Key JD requirements (extracted from evaluation):
${jdText.slice(0, 2000)}

Output format:
Subject: <subject line>

<email body>`;

let emailDraft;
try {
  emailDraft = await askAI(emailPrompt);
} catch {
  emailDraft = `Subject: Application — ${role} | ${company}\n\n[Email generation failed — draft manually]`;
}

const emailFile = `${num}-${slug}-email.md`;
writeFileSync(join(PATHS.output, emailFile), emailDraft, 'utf-8');
console.log(`   ✅ Email: output/${emailFile}`);

// ---------------------------------------------------------------------------
// STEP 4: Update tracker
// ---------------------------------------------------------------------------
console.log(`\n📊 STEP 4/4: Updating tracker...`);

ensureDir(PATHS.tracker);
const pdfEmoji = existsSync(join(PATHS.output, cvPdfFile)) ? '✅' : '❌';
const tsvLine = `${parseInt(num)}\t${today}\t${company}\t${role}\tEvaluated\t${score}/5\t${pdfEmoji}\t[${num}](reports/${reportFile})\tauto-apply pipeline\n`;
writeFileSync(join(PATHS.tracker, `${num}-${slug}.tsv`), tsvLine, 'utf-8');

// Auto-merge
try {
  execSync('node merge-tracker.mjs', { cwd: ROOT, stdio: 'pipe' });
  console.log(`   ✅ Tracker merged`);
} catch {
  console.log(`   ⚠️  Auto-merge failed — run 'node merge-tracker.mjs' manually`);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\n' + '═'.repeat(50));
console.log('  ✅ AUTO-APPLY PIPELINE COMPLETE');
console.log('═'.repeat(50));
console.log(`
  Company:    ${company}
  Role:       ${role}
  Score:      ${score}/5
  Archetype:  ${archetype}
  Legitimacy: ${legitimacy}

  📄 Report:  reports/${reportFile}
  📝 CV HTML: output/${cvHtmlFile}
  📎 CV PDF:  output/${cvPdfFile}
  📧 Email:   output/${emailFile}

  Next steps:
  1. Review the report
  2. Review and send the email draft
  3. Attach the PDF to your application
`);

if (parseFloat(score) < 3.5) {
  console.log('  ⚠️  Score below 3.5 — consider whether this role is worth your time.\n');
}
