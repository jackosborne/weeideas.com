import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { OUTPUTS } from './lib/paths.mjs';
const root = path.resolve(OUTPUTS.test);
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
};
const server = http.createServer((request, response) => {
  try {
    let file = path.resolve(
      root,
      `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`,
    );
    if (!file.startsWith(`${root}${path.sep}`) && file !== root) throw new Error('Invalid path');
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    response.writeHead(200, {
      'content-type': types[path.extname(file)] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    fs.createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});
server.listen(8173, '127.0.0.1', () => console.log('Regression server: http://127.0.0.1:8173'));
for (const event of ['SIGTERM', 'SIGINT'])
  process.on(event, () => server.close(() => process.exit(0)));
