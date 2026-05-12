#!/usr/bin/env node

/**
 * mcp-server.mjs — Model Context Protocol (MCP) Stdio Server for Apply-Jobs
 * Exposes core apply-jobs capabilities (evaluations, scanning, syncing) as tools to LLM agents.
 */

import { spawn, execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Helper to send a JSON-RPC response or notification
function sendResponse(response) {
  process.stdout.write(JSON.stringify(response) + '\n');
}

// Helper to send a JSON-RPC error
function sendError(id, code, message, data = null) {
  sendResponse({
    jsonrpc: '2.0',
    id,
    error: { code, message, data }
  });
}

// Helper to execute local scripts and capture output
function runScript(scriptPath, args = []) {
  try {
    const absPath = resolve(scriptPath);
    const result = execSync(`node ${absPath} ${args.join(' ')}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
      env: { ...process.env, PAGER: 'cat' }
    });
    return { success: true, output: result };
  } catch (err) {
    return { success: false, output: err.stdout || err.stderr || err.message };
  }
}

// Define the exposed tools
const TOOLS = [
  {
    name: 'evaluate_offer',
    description: 'Evaluate a job offer / Job Description text. Generates a tailored LaTeX CV, compiles it to PDF, saves the evaluation report, and registers it in applications.md.',
    inputSchema: {
      type: 'object',
      properties: {
        jd: {
          type: 'string',
          description: 'Full text of the job description.'
        }
      },
      required: ['jd']
    }
  },
  {
    name: 'scan_portals',
    description: 'Scan pre-configured applicant portals (Greenhouse, Ashby, Lever) for new job openings matching target filters in portals.yml.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'sync_cv_check',
    description: 'Run CV sync check to validate that the markdown CV (cv.md) is synchronized with the profile settings and templates.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_tracker_summary',
    description: 'Display all applications, scores, and statuses recorded in the applications tracker.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

// Handle incoming JSON-RPC requests
function handleRequest(request) {
  const { jsonrpc, method, params, id } = request;

  if (jsonrpc !== '2.0') {
    return sendError(id, -32600, 'Invalid Request: expected jsonrpc "2.0"');
  }

  // Debug messages to stderr (so they don't corrupt stdout JSON-RPC channel)
  console.error(`[MCP Server] Received request: ${method} (id: ${id})`);

  switch (method) {
    case 'initialize':
      return sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'apply-jobs-mcp',
            version: '1.8.0'
          }
        }
      });

    case 'tools/list':
      return sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          tools: TOOLS
        }
      });

    case 'tools/call': {
      const { name, arguments: toolArgs } = params || {};
      handleToolCall(id, name, toolArgs);
      break;
    }

    default:
      sendError(id, -32601, `Method not found: ${method}`);
  }
}

// Execute the requested tool
function handleToolCall(id, name, args) {
  console.error(`[MCP Server] Calling tool: ${name}`);

  switch (name) {
    case 'evaluate_offer': {
      const jdText = args.jd;
      if (!jdText) {
        return sendResponse({
          jsonrpc: '2.0',
          id,
          result: {
            isError: true,
            content: [{ type: 'text', text: 'Error: missing "jd" parameter.' }]
          }
        });
      }

      // Run gemini:eval or normal auto-pipeline
      const res = runScript('gemini-eval.mjs', [`"${jdText.replace(/"/g, '\\"')}"`]);
      return sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          isError: !res.success,
          content: [{ type: 'text', text: res.output }]
        }
      });
    }

    case 'scan_portals': {
      const res = runScript('scan.mjs');
      return sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          isError: !res.success,
          content: [{ type: 'text', text: res.output }]
        }
      });
    }

    case 'sync_cv_check': {
      const res = runScript('cv-sync-check.mjs');
      return sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          isError: !res.success,
          content: [{ type: 'text', text: res.output }]
        }
      });
    }

    case 'get_tracker_summary': {
      const trackerPath = resolve('data/applications.md');
      if (!existsSync(trackerPath)) {
        return sendResponse({
          jsonrpc: '2.0',
          id,
          result: {
            isError: false,
            content: [{ type: 'text', text: 'Tracker does not exist yet. Run an evaluation to start tracking.' }]
          }
        });
      }

      try {
        const data = readFileSync(trackerPath, 'utf-8');
        return sendResponse({
          jsonrpc: '2.0',
          id,
          result: {
            isError: false,
            content: [{ type: 'text', text: data }]
          }
        });
      } catch (err) {
        return sendResponse({
          jsonrpc: '2.0',
          id,
          result: {
            isError: true,
            content: [{ type: 'text', text: `Error reading tracker: ${err.message}` }]
          }
        });
      }
    }

    default:
      sendError(id, -32602, `Invalid tool name: ${name}`);
  }
}

// Log startup confirmation
console.error('[MCP Server] Apply-Jobs stdio MCP server successfully started.');

rl.on('line', (line) => {
  try {
    const request = JSON.parse(line);
    handleRequest(request);
  } catch (err) {
    console.error('[MCP Server] Error parsing line:', err.message);
  }
});
