// Serveur statique de développement : sert la racine du dépôt avec les MÊMES en-têtes de
// sécurité (CSP incluse) et les MÊMES refus [F] que la production, tous lus dans .htaccess,
// et le même comportement 404. Un serveur sans CSP donne des faux positifs (inline bloqué
// en prod, accepté en local) ; sans les refus, tools/ et README.md paraîtraient publics.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
};

const htaccess = fs.readFileSync(path.join(SITE, '.htaccess'), 'utf8');

// "Header always set Nom "Valeur"" — hors règles conditionnelles (HSTS : env=HTTPS)
const securityHeaders = Object.fromEntries(
  [...htaccess.matchAll(/^\s*Header always set ([\w-]+) "([^"]+)"\s*$/gm)].map(m => [m[1], m[2]])
);

// Refus : `RewriteRule MOTIF - [F]`, éventuellement précédé de `RewriteCond %{REQUEST_URI} !EXCEPTION`.
// Comme Apache en contexte .htaccess, le motif est testé sans le « / » initial.
const denyRules = [];
let except = null;
for (const line of htaccess.split('\n')) {
  const cond = line.match(/^\s*RewriteCond %\{REQUEST_URI\} !(\S+)\s*$/);
  if (cond) { except = new RegExp(cond[1]); continue; }
  const rule = line.match(/^\s*RewriteRule\s+("[^"]+"|\S+)\s+(\S+)\s+\[([^\]]*)\]/);
  if (!rule) continue;
  if (rule[2] === '-' && /\bF\b/.test(rule[3])) denyRules.push({ re: new RegExp(rule[1].replace(/^"|"$/g, '')), except });
  except = null;
}
const isDenied = urlPath => denyRules.some(r => r.re.test(urlPath.slice(1)) && !r.except?.test(urlPath));

export function startServer(port = 0) {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(SITE, urlPath.endsWith('/') ? urlPath + 'index.html' : urlPath);
    const denied = isDenied(urlPath);
    let status = 200;
    if (denied || !file.startsWith(SITE) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      status = denied ? 403 : 404;
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
