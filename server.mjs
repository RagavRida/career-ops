#!/usr/bin/env node

/**
 * server.mjs — Hosted SSE (Server-Sent Events) General-Purpose MCP Server for Apply-Jobs
 * Exposes stateless evaluation and LaTeX resume tailoring tools to any LLM client globally.
 * Callers provide their own CV and JD dynamically to perform evaluations.
 */

import http from 'http';
import { parse } from 'url';
import https from 'https';

const PORT = process.env.PORT || 3000;

// Embedded A-G Evaluation Methodology Prompt Context
const EVALUATION_METHODOLOGY = `
You evaluate job offers against a candidate's CV using a structured A-G scoring system:
- **Block A (Role Summary):** Archetype classification (Platform/Agentic/PM/SA/FDE/Transformation), domain, remote policy, TL;DR.
- **Block B (Match with CV):** Requirement-by-requirement mapping citing exact resume points, listing gaps and mitigation plans.
- **Block C (Level & Strategy):** Positioning advice, exit narrative, downlevel strategies.
- **Block D (Comp & Demand):** Comp range estimates based on market data, demand trends.
- **Block E (Customization):** Top 5 resume/LinkedIn adjustments for optimization.
- **Block F (Interview Plan):** 6-10 behavioral STAR+Reflection stories adapted to the JD.
- **Block G (Legitimacy):** Quality signals assessment (Tier classification: High Confidence / Proceed with Caution / Suspicious).
`;

// Embedded LaTeX CV Template Context for Tailoring
const LATEX_CV_TEMPLATE = `
\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\usepackage{multicol}
\\setlength{\\multicolsep}{-3.0pt}
\\setlength{\\columnsep}{-1pt}
\\input{glyphtounicode}
\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
\\addtolength{\\oddsidemargin}{-0.6in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.19in}
\\addtolength{\\topmargin}{-.7in}
\\addtolength{\\textheight}{1.4in}
\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}
\\titleformat{\\section}{\\vspace{-7pt}\\scshape\\raggedright\\large\\bfseries}{}{0em}{}[\\color{black}\\titlerule \\vspace{0pt}]
\\pdfgentounicode=1

\\newcommand{\\resumeItem}[1]{\\item\\small{{#1 \\vspace{-3pt}}}}
\\newcommand{\\resumeSubheading}[4]{\\vspace{-3pt}\\item\\begin{tabular*}{1.0\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}\\textbf{#1} & \\textbf{\\small #2} \\\\ \\textit{\\small#3} & \\textit{\\small #4} \\\\\\end{tabular*}\\vspace{-7pt}}
\\newcommand{\\resumeProjectHeading}[2]{\\vspace{-3pt}\\item\\begin{tabular*}{1.0\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}\\textbf{#1} & \\textbf{\\small #2} \\\\\\end{tabular*}\\vspace{-7pt}}
\\renewcommand\\labelitemi{$\\vcenter{\\hbox{\\tiny$\\bullet$}}$}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.0in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{0pt}}
`;

// Active client event streams mapped by sessionId
const activeStreams = new Map();

// General-Purpose Stateless Tools
const TOOLS = [
  {
    name: 'evaluate_offer',
    description: 'Statelessly evaluate any job offer / JD text against a candidate\'s custom CV. Performs a full 7-block A-G evaluation and calculates matching scores.',
    inputSchema: {
      type: 'object',
      properties: {
        cv: {
          type: 'string',
          description: 'The candidate\'s professional resume / CV text in Markdown or plain text format.'
        },
        jd: {
          type: 'string',
          description: 'The job description / posting details to evaluate against.'
        },
        apiKey: {
          type: 'string',
          description: 'Optional. Google Gemini API key to override the server default.'
        }
      },
      required: ['cv', 'jd']
    }
  },
  {
    name: 'tailor_latex_resume',
    description: 'Statelessly tailor a candidate\'s markdown CV into a highly optimized, single-page LaTeX document matching a specific job description. Reorders bullets, reframes summary, and outputs raw ready-to-compile LaTeX.',
    inputSchema: {
      type: 'object',
      properties: {
        cv: {
          type: 'string',
          description: 'The candidate\'s base resume / CV text in Markdown.'
        },
        jd: {
          type: 'string',
          description: 'The job description to tailor the resume for.'
        },
        apiKey: {
          type: 'string',
          description: 'Optional. Google Gemini API key to override the server default.'
        }
      },
      required: ['cv', 'jd']
    }
  }
];

// Helper to send a JSON-RPC response
function sendSseResponse(sendSse, id, result) {
  sendSse({
    jsonrpc: '2.0',
    id,
    result
  });
}

// Helper to make a stateless HTTP POST call to Gemini API
function callGemini(prompt, userApiKey, callback) {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return callback(new Error('API Key missing. Pass "apiKey" as a parameter or set GEMINI_API_KEY in the environment.'));
  }

  const postData = JSON.stringify({
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192
    }
  });

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', chunk => { body += chunk; });
    res.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        if (parsed.error) {
          return callback(new Error(parsed.error.message || 'Gemini API Error'));
        }
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          return callback(new Error('Invalid or empty response from Gemini API'));
        }
        callback(null, text);
      } catch (err) {
        callback(new Error(`Failed to parse Gemini response: ${err.message}`));
      }
    });
  });

  req.on('error', (err) => {
    callback(err);
  });

  req.write(postData);
  req.end();
}

// JSON-RPC Request Router
function handleMcpRequest(request, sendSse) {
  const { jsonrpc, method, params, id } = request;

  if (jsonrpc !== '2.0') {
    return sendSse({
      jsonrpc: '2.0',
      id,
      error: { code: -32600, message: 'Invalid request: expected JSON-RPC 2.0' }
    });
  }

  switch (method) {
    case 'initialize':
      return sendSseResponse(sendSse, id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'apply-jobs-cloud-mcp', version: '1.8.0' }
      });

    case 'tools/list':
      return sendSseResponse(sendSse, id, { tools: TOOLS });

    case 'tools/call': {
      const { name, arguments: toolArgs } = params || {};
      const { cv, jd, apiKey } = toolArgs || {};

      if (!cv || !jd) {
        return sendSse({
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: 'Missing required parameters: cv and jd are both required.' }
        });
      }

      if (name === 'evaluate_offer') {
        const prompt = `You are a professional recruiting evaluator.
Perform a full, rigorous 7-block A-G evaluation of the provided Job Description against the candidate's CV.

═══════════════════════════════════════════════════════
EVALUATION METHODOLOGY GUIDE
═══════════════════════════════════════════════════════
${EVALUATION_METHODOLOGY}

═══════════════════════════════════════════════════════
CANDIDATE CV
═══════════════════════════════════════════════════════
${cv}

═══════════════════════════════════════════════════════
JOB DESCRIPTION TO EVALUATE
═══════════════════════════════════════════════════════
${jd}

Deliver the structured evaluation in clean Markdown format with sections A) through G).
`;

        callGemini(prompt, apiKey, (err, text) => {
          if (err) {
            return sendSse({
              jsonrpc: '2.0',
              id,
              error: { code: -32000, message: err.message }
            });
          }
          sendSseResponse(sendSse, id, {
            content: [{ type: 'text', text }]
          });
        });

      } else if (name === 'tailor_latex_resume') {
        const prompt = `You are an expert ATS resume optimizer.
Generate a tailored, single-page LaTeX CV for the candidate matching the Job Description.

═══════════════════════════════════════════════════════
LATEX TEMPLATE PREAMBLE & HEADINGS
═══════════════════════════════════════════════════════
${LATEX_CV_TEMPLATE}

═══════════════════════════════════════════════════════
CANDIDATE BASE RESUME (cv.md)
═══════════════════════════════════════════════════════
${cv}

═══════════════════════════════════════════════════════
JOB DESCRIPTION
═══════════════════════════════════════════════════════
${jd}

RULES:
1. Reorder experience bullets and personal projects to highlight relevance to the JD requirements.
2. Reformulate summary and accomplishments to naturally incorporate keywords from the JD (NEVER invent metrics or skills).
3. Escape LaTeX special characters properly (e.g. & -> \\&, % -> \\%). Use standard headings.
4. Output the raw, complete LaTeX code ONLY inside the response (no markdown blocks around it, no additional commentary).
`;

        callGemini(prompt, apiKey, (err, text) => {
          if (err) {
            return sendSse({
              jsonrpc: '2.0',
              id,
              error: { code: -32000, message: err.message }
            });
          }
          // Strip out leading/trailing markdown code fences if LLM added them
          const cleanedText = text.replace(/^```latex\n?|```$/g, '').trim();
          sendSseResponse(sendSse, id, {
            content: [{ type: 'text', text: cleanedText }]
          });
        });

      } else {
        return sendSse({
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: `Tool not found: ${name}` }
        });
      }
      break;
    }

    default:
      return sendSse({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` }
      });
  }
}

// HTTP Server
const server = http.createServer((req, res) => {
  const parsedUrl = parse(req.url, true);
  const { pathname, query } = parsedUrl;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // 1. GET /sse — Establish SSE stream
  if (pathname === '/sse' && req.method === 'GET') {
    const sessionId = Math.random().toString(36).substring(2, 15);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Keep-alive heartbeat
    const interval = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, 15000);

    // Save stream
    const sendSse = (data) => {
      res.write(`event: message\ndata: ${JSON.stringify(data)}\n\n`);
    };

    activeStreams.set(sessionId, { res, sendSse, interval });

    console.log(`[MCP Server] Session created: ${sessionId}`);

    // Send the POST message redirection endpoint
    res.write(`event: endpoint\ndata: /messages?sessionId=${sessionId}\n\n`);

    req.on('close', () => {
      clearInterval(interval);
      activeStreams.delete(sessionId);
      console.log(`[MCP Server] Session closed: ${sessionId}`);
    });
    return;
  }

  // 2. POST /messages?sessionId=XXX — Handle client RPC calls
  if (pathname === '/messages' && req.method === 'POST') {
    const { sessionId } = query;
    const stream = activeStreams.get(sessionId);

    if (!stream) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Session not found or expired' }));
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const request = JSON.parse(body);
        handleMcpRequest(request, stream.sendSse);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Invalid JSON body: ${err.message}` }));
      }
    });
    return;
  }

  // Fallback health check
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Apply-Jobs Stateless Cloud MCP Server is active. Access via /sse.');
});

server.listen(PORT, () => {
  console.log(`[MCP Server] General-Purpose Cloud Server is running on port ${PORT}`);
});
