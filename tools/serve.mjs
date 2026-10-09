// Serveur statique de développement : sert site/ avec les MÊMES en-têtes de sécurité que
// la production (lus dans site/.htaccess — CSP incluse) et le même comportement 404.
// Un serveur sans CSP donne des faux positifs (inline bloqué en prod, accepté en local).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'site');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
};

// "Header always set Nom "Valeur"" — hors règles conditionnelles (HSTS : env=HTTPS)
const securityHeaders = Object.fromEntries(
  [...fs.readFileSync(path.join(SITE, '.htaccess'), 'utf8')
    .matchAll(/^\s*Header always set ([\w-]+) "([^"]+)"\s*$/gm)].map(m => [m[1], m[2]])
);

export function startServer(port = 0) {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(SITE, urlPath.endsWith('/') ? urlPath + 'index.html' : urlPath);
    const dotfile = /(^|\/)\.(?!well-known\/)/.test(urlPath);
    let status = 200;
    if (dotfile || !file.startsWith(SITE) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      status = dotfile ? 403 : 404;
      file = path.join(SITE, '404.html');
    }
    res.writeHead(status, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', ...securityHeaders });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve({
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise(r => server.close(r)),
  })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { url } = await startServer(8080);
  console.log(`Site servi avec les en-têtes de production sur ${url}  (tests : ${url}/tests.html)`);
}
