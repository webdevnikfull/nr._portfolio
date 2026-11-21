import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { createNetworkMonitor } from './network-agent.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('PORT must be between 1024 and 65535.');
const origin = `http://127.0.0.1:${port}`;
const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
const monitor = createNetworkMonitor();
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8', '.md': 'text/plain; charset=utf-8' };
const staticFiles = new Set(['index.html', 'app.js', 'controls.js', 'security-domain.js', 'live-network.js', 'security-languages.js', 'workspace-languages.js', 'styles.css', 'premium-controls.css', 'theme-init.js', 'favicon.svg', 'network-probe.json', 'README.md']);

const server = http.createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'same-origin');
  response.setHeader('Cache-Control', 'no-store');
  if (!allowedHosts.has(request.headers.host) || request.headers['sec-fetch-site'] === 'cross-site') {
    response.writeHead(403).end('Local requests only'); return;
  }
  if (request.headers.origin && ![origin, `http://localhost:${port}`].includes(request.headers.origin)) {
    response.writeHead(403).end('Origin denied'); return;
  }
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405).end(); return; }
  const url = new URL(request.url, origin);
  if (url.pathname === '/api/network') {
    const snapshot = monitor.getSnapshot();
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(request.method === 'HEAD' ? undefined : JSON.stringify(snapshot)); return;
  }
  let filename;
  try { filename = decodeURIComponent(url.pathname).replace(/^\//, '') || 'index.html'; }
  catch { response.writeHead(400).end(); return; }
  if (!staticFiles.has(filename)) { response.writeHead(404).end('Not found'); return; }
  try {
    const bytes = await readFile(path.join(root, filename));
    response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream' });
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch { response.writeHead(404).end('Not found'); }
});

server.on('error', error => {
  monitor.stop();
  console.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. Close the earlier preview or choose another PORT.` : error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(`IT Security Checkup — ${origin}`);
  console.log('Live device telemetry is read locally on Windows. Press Ctrl+C to stop.');
  if (process.argv.includes('--open') && process.platform === 'win32') execFile('cmd.exe', ['/c', 'start', '', origin], { windowsHide: true }, () => {});
});
const shutdown = () => { monitor.stop(); server.close(() => process.exit(0)); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
