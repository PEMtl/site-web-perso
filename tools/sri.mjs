// Vérifie (ou corrige avec --write) les empreintes SRI de toutes les pages de site/.
// Supprime la principale source d'erreur de publication : un hash oublié après une
// modification de style.css / script.js / tests.js bloque silencieusement la ressource.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'site');
const write = process.argv.includes('--write');
let bad = 0, total = 0;

for (const page of fs.readdirSync(SITE).filter(f => f.endsWith('.html'))) {
  const file = path.join(SITE, page);
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<(?:link|script)\b[^>]*\bintegrity="sha384-([^"]+)"[^>]*>/g, (tag, current) => {
    const ref = tag.match(/\b(?:href|src)="\/([^"]+)"/)?.[1];
    if (!ref) return tag;
    const expected = crypto.createHash('sha384').update(fs.readFileSync(path.join(SITE, ref))).digest('base64');
    total++;
    if (expected === current) return tag;
    bad++;
    console.log(`${write ? 'CORRIGÉ' : 'ÉCART  '} ${page} → ${ref}`);
    return tag.replace(current, expected);
  });
  if (write) fs.writeFileSync(file, html);
}

console.log(`SRI : ${total - (write ? 0 : bad)}/${total} empreintes à jour${bad && write ? ` (${bad} corrigée(s))` : ''}`);
process.exit(bad && !write ? 1 : 0);
