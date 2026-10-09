// Tests de COMPORTEMENT dans un vrai navigateur (Chromium), contre un serveur qui envoie
// les mêmes en-têtes que la production (CSP comprise). Formspree est intercepté : aucun
// message réel n'est jamais envoyé. Lancer : npm test (depuis tools/).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';

let server, browser, BASE;
before(async () => {
  server = await startServer();
  BASE = server.url;
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
});
after(async () => { await browser?.close(); await server?.close(); });

const FINAL_STATS = ['10+', '4', '30+'];

// Ouvre une page ; `formspree` = { status, body } renvoyé par l'interception ; `posts` compte les envois.
async function open(url = '/', { context = {}, init, formspree = { status: 200, body: '{}' } } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...context });
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  const posts = [], problems = [];
  await page.route('https://formspree.io/**', async route => {
    posts.push(route.request().postData());
    await route.fulfill({ status: formspree.status, contentType: 'application/json', body: formspree.body });
  });
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (/Content.Security.Policy|integrity|Failed to load/i.test(m.text())) problems.push(m.text()); });
  const response = await page.goto(BASE + url);
  return { page, ctx, posts, problems, response };
}
async function fillValid(page) {
  await page.fill('#contact-name', 'Test Auto');
  await page.fill('#contact-email', 'test@example.com');
  await page.fill('#contact-message', 'Message de test suffisamment long.');
}
const contrast = (page, fg, bg) => page.evaluate(([fg, bg]) => {
  const lum = c => { const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const [a, b] = [lum(fg), lum(bg)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}, [fg, bg]);

// ── Intégrité de chargement (CSP + SRI réels) ──
for (const url of ['/', '/mentions-legales.html', '/404.html']) {
  test(`${url} : aucune erreur CSP/SRI/JS, CSS appliqué`, async () => {
    const { page, ctx, problems } = await open(url);
    await page.waitForTimeout(500);
    assert.deepEqual(problems, []);
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).fontFamily.includes('Manrope')), true, 'style.css appliqué');
    await ctx.close();
  });
}

test('tests.html (smoke live) affiche TOUT EST OK sous CSP réelle', async () => {
  const { page, ctx, problems } = await open('/tests.html');
  await page.waitForFunction(() => /tests passés|ÉCHEC|Impossible/.test(document.getElementById('summary').textContent), null, { timeout: 15000 });
  assert.match(await page.textContent('#summary'), /TOUT EST OK/);
  assert.deepEqual(problems, []);
  await ctx.close();
});

test('404 : statut 404 et contenu visible sans JS', async () => {
  const { page, ctx, response } = await open('/inexistant');
  assert.equal(response.status(), 404);
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.card')).opacity), '1');
  await ctx.close();
});

test('apple-touch-icon fait réellement 180×180', async () => {
  const buf = Buffer.from(await (await fetch(BASE + '/images/apple-touch-icon.png')).arrayBuffer());
  assert.deepEqual([buf.readUInt32BE(16), buf.readUInt32BE(20)], [180, 180]);
});

// ── 1. Formulaire ──
test('formulaire : champs vides / e-mail invalide / message court → aucun envoi', async () => {
  const { page, ctx, posts } = await open();
  await page.click('#contact-form button[type=submit]');
  await page.fill('#contact-name', 'A'); await page.fill('#contact-email', 'pas-un-email'); await page.fill('#contact-message', 'court');
  await page.click('#contact-form button[type=submit]');
  await page.fill('#contact-email', 'ok@example.com');
  await page.click('#contact-form button[type=submit]');
  await page.waitForTimeout(500);
  assert.equal(posts.length, 0);
  await ctx.close();
});

test('formulaire : saisie valide → un envoi, succès affiché, champs vidés', async () => {
  const { page, ctx, posts } = await open();
  await fillValid(page);
  await page.click('#contact-form button[type=submit]');
  await page.waitForSelector('#form-status.success');
  assert.equal(posts.length, 1);
  assert.match(await page.textContent('#form-status'), /Message envoyé/);
  assert.equal(await page.inputValue('#contact-name'), '');
  await ctx.close();
});

test('formulaire : erreur serveur → message d\'erreur, bouton de nouveau actif', async () => {
  const { page, ctx } = await open('/', { formspree: { status: 422, body: JSON.stringify({ errors: [{ message: 'Adresse refusée' }] }) } });
  await fillValid(page);
  await page.click('#contact-form button[type=submit]');
  await page.waitForSelector('#form-status.error');
  assert.match(await page.textContent('#form-status'), /Adresse refusée/);
  assert.equal(await page.isEnabled('#contact-form button[type=submit]'), true);
  await ctx.close();
});

test('honeypot _gotcha : invisible à l\'écran, hors tabulation', async () => {
  const { page, ctx } = await open();
  const box = await page.locator('input[name=_gotcha]').boundingBox();
  assert.ok(!box || (box.width <= 1 && box.height <= 1) || box.x < -100);
  await ctx.close();
});

// ── 2. Stockage bloqué ──
test('localStorage bloqué : le formulaire AJAX et le thème fonctionnent quand même', async () => {
  const { page, ctx, posts, problems } = await open('/', {
    init: () => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('denied', 'SecurityError'); } }),
  });
  assert.ok(await page.evaluate(() => window.__SITE_VERSION__), 'initialisation complète');
  await page.click('#theme-toggle');
  assert.equal(await page.evaluate(() => document.body.classList.contains('dark-mode')), true);
  await fillValid(page);
  await page.click('#contact-form button[type=submit]');
  await page.waitForSelector('#form-status.success');
  assert.equal(posts.length, 1);
  assert.deepEqual(problems, []);
  await ctx.close();
});

// ── 3. Clavier ──
test('nav cachée : aucun focus invisible ; focusable une fois affichée', async () => {
  const { page, ctx } = await open();
  for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => !!document.activeElement.closest('.site-nav')), false);
  assert.equal(await page.evaluate(() => { const a = document.querySelector('.nav-links a'); a.focus(); return document.activeElement === a; }), false);
  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForSelector('.site-nav.visible');
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(() => { const a = document.querySelector('.nav-links a'); a.focus(); return document.activeElement === a; }), true);
  await ctx.close();
});

test('mobile ≤480px : nav supprimée (choix assumé)', async () => {
  const { page, ctx } = await open('/', { context: { viewport: { width: 400, height: 800 } } });
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.site-nav')).display), 'none');
  await ctx.close();
});

// ── 4. Sans JavaScript ──
test('sans JavaScript : toutes les sections et les chiffres finaux sont visibles', async () => {
  const { page, ctx } = await open('/', { context: { javaScriptEnabled: false } });
  const opacities = await page.evaluate(() => [...document.querySelectorAll('main section')].map(s => getComputedStyle(s).opacity));
  assert.deepEqual([...new Set(opacities)], ['1']);
  assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('.stat-number')].map(e => e.textContent)), FINAL_STATS);
  await ctx.close();
});

// ── 5. Boutons en mode sombre ──
test('mode sombre : boutons lisibles (contraste ≥ 4,5:1, pas de soulignement parasite)', async () => {
  const { page, ctx } = await open('/', { init: () => localStorage.setItem('pe-theme', 'dark') });
  await page.waitForTimeout(600);
  const primary = await page.evaluate(() => { const s = getComputedStyle(document.querySelector('#a-propos .cta-button:not(.secondary)')); return [s.color, s.backgroundColor, s.textDecorationLine]; });
  assert.ok(await contrast(page, primary[0], primary[1]) >= 4.5, `contraste ${primary}`);
  assert.equal(primary[2], 'none');
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('#a-propos .cta-button.secondary')).color), 'rgb(255, 255, 255)');
  await ctx.close();
});

// ── 6. Compteurs ──
test('prefers-reduced-motion : compteurs directement à leur valeur finale', async () => {
  const { page, ctx } = await open('/', { context: { reducedMotion: 'reduce' } });
  await page.waitForTimeout(150);
  assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('.stat-number')].map(e => e.textContent)), FINAL_STATS);
  await ctx.close();
});

test('animation autorisée : compteurs animés puis valeurs finales', async () => {
  const { page, ctx } = await open();
  await page.waitForFunction(() => document.querySelector('.stat-number').textContent !== '10+', null, { timeout: 3000 });
  await page.waitForTimeout(1800);
  assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('.stat-number')].map(e => e.textContent)), FINAL_STATS);
  await ctx.close();
});

// ── 7. Copie d'e-mail ──
const copyCase = (name, init, expected) => test(`copie e-mail : ${name} → « ${expected} »`, async () => {
  const { page, ctx } = await open('/', { init });
  await page.click('#copy-email-btn');
  await page.waitForTimeout(200);
  assert.equal(await page.textContent('#copy-email-btn .copy-text'), expected);
  await ctx.close();
});
copyCase('API moderne OK', () => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => {} }, configurable: true }), 'Copié !');
copyCase('API moderne refusée', () => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('refus'); } }, configurable: true }), 'Erreur');
copyCase('repli réussi', () => { Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true }); document.execCommand = () => true; }, 'Copié !');
copyCase('repli retournant false', () => { Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true }); document.execCommand = () => false; }, 'Erreur');
copyCase('repli levant une exception', () => { Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true }); document.execCommand = () => { throw new Error('x'); }; }, 'Erreur');

// ── 8. Impression ──
test('impression avec thème sombre actif : rendu clair et lisible', async () => {
  const { page, ctx } = await open('/', { init: () => localStorage.setItem('pe-theme', 'dark') });
  await page.waitForTimeout(800); // laisse finir la transition d'apparition du thème
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(800);
  const [h2, bg] = await page.evaluate(() => { const s = document.querySelector('#a-propos'); return [getComputedStyle(s.querySelector('h2')).color, getComputedStyle(s).backgroundColor]; });
  assert.ok(await contrast(page, h2, 'rgb(255, 255, 255)') >= 4.5, `titre ${h2}`);
  assert.ok(await page.evaluate(c => { const [r, g, b, a = 1] = c.match(/[\d.]+/g).map(Number); return (r + g + b) / 3 * a + 255 * (1 - a) > 200; }, bg), `fond ${bg}`);
  await ctx.close();
});
