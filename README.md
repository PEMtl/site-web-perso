# 🌐 pe-monreal.com — Site Web Personnel

Site vitrine one-page de Pierre-Etienne Monreal, Consultant Product Owner Senior basé à Montpellier.

**Live** : [https://pe-monreal.com](https://pe-monreal.com)  
**Version** : 2.0.1  
**Stack** : HTML5 · CSS3 · JS vanilla · Formspree · Service Worker · OVH

---

## ⚠️ AVANT DE DÉPLOYER — lire impérativement

1. **`.htaccess` est un fichier caché (dotfile).** La plupart des clients FTP (FileZilla…) le masquent par défaut. Active "Afficher les fichiers cachés" avant l'upload, sinon aucune règle de sécurité, cache ou 404 ne s'applique.
2. **Tous les fichiers texte doivent être en fins de ligne LF (Unix), jamais CRLF (Windows).** Un `.gitattributes` force ça dans ce repo, mais reste vigilant après tout export manuel (FTP, copier-coller, éditeur Windows). Une archive antérieure de ce projet était intégralement en CRLF sans que personne ne s'en aperçoive — cause probable de plusieurs bugs "fantômes" observés.
3. **Vérifie l'orthographe exacte du domaine avant de tester quoi que ce soit** : `pe-monreal.com` (avec un tiret). `pe.monreal.com` (point, sans tiret) est un domaine tiers totalement différent.
4. **Régénérer les hash SRI si `style.css` ou `script.js` ont changé** (voir Sécurité). Un hash désynchronisé bloque silencieusement le chargement du fichier.
5. **Ne jamais déployer fichier par fichier** — toujours l'intégralité du repo, pour éviter tout état intermédiaire incohérent.

---

## 📁 Structure du projet

```
/
├── index.html          # Point d'entrée unique
├── style.css           # Tous les styles
├── script.js           # Comportements JS (defer) + swap CSS non-bloquant
├── sw.js                # Service Worker — cache offline
├── manifest.json         # PWA manifest
├── robots.txt              # Crawl ouvert + lien sitemap
├── sitemap.xml               # URL unique — lastmod à jour à chaque déploiement
├── 404.html                    # Page d'erreur personnalisée (zéro style inline)
├── .htaccess                     # Sécurité Apache + cache + compression + 404 — DOTFILE CACHÉ
├── .gitattributes                  # Force LF sur tous les fichiers texte du repo
├── .well-known/
│   └── security.txt                  # Contact sécurité (RFC 9116)
├── tests.html                          # Smoke tests — fetch + parse les fichiers sources
├── fonts/
│   └── manrope-v20-latin-{300,regular,600}.woff2
├── images/
│   ├── photo-profil.webp
│   ├── favicon-{16x16,32x32}.png
│   ├── apple-touch-icon.png (180×180)
│   ├── icon-{192x192,512x512}.png (PWA)
│   └── logos/
└── signature/           # Signature email HTML autonome — HORS PÉRIMÈTRE du site,
                          # styles inline volontaires (requis par les clients mail),
                          # ne pas appliquer la CSP ou les corrections du site ici.
```

---

## ⚙️ Stack technique

| Techno | Rôle |
|---|---|
| HTML5 sémantique | Structure · Schema.org (`Person`, `WebSite`, `ProfilePage`) · Open Graph · Twitter Card |
| CSS3 vanilla (`style.css`) | Variables · dark mode · glassmorphism · nav sticky (masquée ≤480px) · tooltip accessible · print · responsive |
| JS vanilla (`script.js`) | Nav sticky sans reflow forcé, désactivée sur petit mobile · compteurs animés · dark mode · AJAX form · swap CSS non-bloquant · SW registration |
| Service Worker (`sw.js`) | Cache offline — network-first HTML, cache-first assets statiques |
| Manrope woff2 (auto-hébergé) | Police — 3 weights (300/400/600) — zéro Google Fonts |
| Formspree | Backend formulaire contact — ID `xjkejbdp` |
| Apache `.htaccess` | HSTS · CSP durcie · Cache-Control explicite + immutable · compression · 404 · redirection www→non-www |
| SRI (`integrity`) | Hash SHA-384 sur `style.css` et `script.js` |
| `.gitattributes` | Force LF sur tout le repo, quel que soit l'OS de la machine qui clone/commit |

---

## 🐛 Bug 404 — diagnostic complet (v1.9.0)

**Symptôme rapporté à plusieurs reprises** : URL inexistante ne redirige jamais vers `404.html`.

**Trois causes possibles identifiées, dans l'ordre de probabilité :**

1. **Fins de ligne CRLF découvertes dans l'archive réelle du site** — tous les fichiers texte (`.htaccess` inclus) étaient en CRLF (Windows), sans `.gitattributes` pour l'empêcher. Cohérent avec un `core.autocrlf=true` actif côté Git sous Windows, qui reconvertit silencieusement les fichiers à chaque `checkout`. **Corrigé** : tout renormalisé en LF, `.gitattributes` ajouté pour empêcher toute régression future.
2. **Typo de domaine** : `pe.monreal.com` (testé dans les échanges précédents) n'est pas le site — c'est un domaine tiers sans rapport. Le bon domaine est `pe-monreal.com` (avec tiret).
3. **`.htaccess` jamais réellement déployé** — fichier caché souvent oublié par les clients FTP.

La directive `ErrorDocument 404 /404.html` elle-même était et reste correcte. `404.html` ne contient aucun style inline (vérifié — la CSP stricte du site les aurait bloqués).

**Test de vérification à lancer après déploiement, sur le BON domaine :**
```bash
curl -I https://pe-monreal.com/url-qui-nexiste-pas
# Doit renvoyer : HTTP/1.1 404 Not Found
```

---

## 🎯 404.html page blanche — bug trouvé et corrigé (v2.0.1)

**Symptôme rapporté** : le mécanisme 404 fonctionne enfin (statut HTTP correct), mais la page s'affiche totalement blanche.

**Cause réelle** : `.card` (classe réutilisée sur toutes les sections du site, y compris `404.html`) démarre à `opacity: 0` par défaut. Sur `index.html`, `script.js` bascule cette opacité à 1 via la classe `.is-visible`, ajoutée dynamiquement par un `IntersectionObserver` au scroll. **`404.html` ne charge volontairement aucun script** (pour garantir qu'elle s'affiche même si du JS casse ailleurs sur le site) — la classe `.is-visible` n'est donc jamais ajoutée, et le contenu de la card reste invisible pour toujours.

**Corrigé** : ajout statique de la classe `is-visible` directement dans le HTML de `404.html` (`class="card content-section error-page is-visible"`) — aucune dépendance à du JS, la card s'affiche immédiatement.

**Vérifié** : le CSS fourni par l'utilisateur pour diagnostic a été comparé ligne à ligne avec `style.css` — aucune dérive trouvée, confirmant que le problème n'était pas une désynchronisation CSS mais bien cette classe manquante.

Un test placebo qui ne testait rien (`() => true`) a été retiré de la suite "Page 404" dans `tests.js`, remplacé par un vrai test qui vérifie la présence de `.is-visible` sur `.card` — protège contre toute régression future de ce bug précis.

## 🚨 `tests.html` bloqué en prod — bug CSP critique trouvé (v2.0.0)

**Symptôme rapporté** : `tests.html` reste bloqué indéfiniment sur "⏳ Chargement..." sur le vrai domaine, alors qu'il fonctionnait dans mes tests locaux.

**Cause réelle** : `tests.html` contenait son code JS et son CSS directement en **inline** (`<script>...</script>` et `<style>...</style>` dans le fichier). Or la CSP du site (`script-src 'self'`, `style-src 'self'`, appliquée à **toutes** les pages via `.htaccess`) interdit tout script/style inline sans `unsafe-inline`, nonce ou hash. Sur le vrai domaine, le navigateur bloque silencieusement ce code — aucune erreur visible sauf dans la console développeur — et la page reste figée sur son état HTML statique initial.

**Pourquoi mes tests précédents ne l'ont pas détecté** : je testais via un serveur Python local basique qui n'envoie aucun header CSP, donc le script inline s'exécutait sans problème dans cet environnement — faux positif. Erreur de méthode de ma part.

**Corrigé** :
- Code JS extrait dans `tests.js`, chargé via `<script src="/tests.js">`
- CSS extrait dans `tests.css`, chargé via `<link rel="stylesheet" href="/tests.css">`
- SRI ajoutée sur les deux, cohérent avec le reste du site
- Nouveaux tests ajoutés qui vérifient qu'aucun script/style inline ne revient jamais dans `tests.html`
- Audit exhaustif du reste du site : le seul autre `<script>` sans `src=` est le bloc JSON-LD (`application/ld+json`) dans `index.html`, qui n'est pas exécutable et est explicitement exempté de `script-src` par tous les navigateurs — aucune action requise

## 🧪 `tests.html` — bug de rendu trouvé et corrigé (v1.9.0)

**Doute exprimé** : "pas sûr qu'il fonctionne".

**Vérification réelle effectuée** cette session (exécution du fichier dans un environnement DOM réel via jsdom + serveur local, pas une simple relecture de code) : un vrai bug a été trouvé. Certains libellés de test contiennent des chevrons HTML littéraux (`<html lang="fr">`, `pas de <style> inline dans head`, `tous les <img> ont un alt`…). Insérés sans échappement via `innerHTML`, le navigateur les interprète comme du vrai HTML — une balise `<style>` ouverte non refermée avalait silencieusement tout le contenu suivant, cachant visuellement 25 tests sur 27 dans la suite "Structure HTML" (ils s'exécutaient et réussissaient réellement, mais ne s'affichaient jamais).

**Corrigé** : fonction `escapeHtml()` ajoutée, appliquée systématiquement avant toute insertion dans le DOM. Ré-exécuté et vérifié : **131/131 tests désormais affichés correctement, cohérence totale entre le résumé et le rendu.**

---

## 📱 Nav sticky supprimée sur petit mobile (v1.9.0)

Sur un écran de téléphone étroit (≤480px), la nav sticky empiétait en permanence sur le contenu. Supprimée définitivement :
- CSS : `.site-nav { display: none; }` sous 480px, `--nav-h: 0` pour ne pas laisser de vide sur les ancres de section
- JS : `updateNav()` ne calcule plus rien sur ces écrans (`matchMedia('(max-width: 480px)')`), économie de calcul à chaque frame de scroll

---

## 🐌 Rappel : scroll lourd sur Firefox/macOS (perf réappliquée)

L'archive réelle fournie cette session ne contenait pas les optimisations de scroll d'une session précédente (blur réduit, `contain: paint`, listener scroll fusionné) — elles n'avaient jamais été committées. Réappliquées intégralement :
- `background-shapes` : blur 100px → 60px
- `.card` : backdrop-filter 15px → 10px + `contain: layout style paint`
- `.site-nav` : backdrop-filter 16px → 10px + `translateZ(0)`
- Un seul listener `scroll` pour la nav et le bouton retour en haut

---

## 🔐 Sécurité (`.htaccess` + SRI)

| Mesure | Détail |
|---|---|
| HSTS | `max-age=31536000; includeSubDomains; preload` |
| CSP durcie | `default-src 'self'`, zéro `unsafe-inline` |
| Cache-Control | Explicite + `immutable` sur assets statiques |
| SRI | `integrity` sha384 + `crossorigin="anonymous"` — `style.css` (2 occurrences : preload + stylesheet) et `script.js` (1 occurrence) |
| `.gitattributes` | LF forcé sur tout fichier texte |

**Régénérer les hash SRI à chaque modification CSS/JS** :
```bash
openssl dgst -sha384 -binary style.css  | openssl base64 -A
openssl dgst -sha384 -binary script.js | openssl base64 -A
```

---

## 🧪 Tests de non-régression

`tests.html` fetch et parse `index.html`, `style.css`, `script.js` et `404.html`. Nécessite un serveur local :
```bash
npx serve .
# puis ouvrir http://localhost:.../tests.html
```

12 suites, 131 assertions, toutes vertes et vérifiées par exécution réelle (pas de simple lecture de code) cette session.

---

## 🔍 Dépannage

| Symptôme | Solution |
|---|---|
| 404 ne s'affiche jamais | Vérifier le domaine testé (tiret !), les fins de ligne LF, et que `.htaccess` est bien déployé |
| Fins de ligne CRLF réapparues | Vérifier `git config core.autocrlf` sur la machine de commit — `.gitattributes` doit forcer LF |
| Site ne charge plus (CSS/JS blancs) | Hash SRI désynchronisé — régénérer |
| Nav sticky visible sur petit téléphone | Vérifier `@media (max-width: 480px) { .site-nav { display: none; } }` dans `style.css` |
| `tests.html` : compte affiché ≠ compte réel | Vérifier que tous les libellés passent par `escapeHtml()` avant insertion DOM |
| Tooltip illisible en dark mode | Couleurs fixes `#1a202c`/`#f7fafc`, jamais `var(--accent)` |

---

## 🗑️ Démantèlement

1. Supprimer les fichiers via FTP/OVH Manager (penser aux dotfiles)
2. Résilier le domaine `pe-monreal.com` dans OVH
3. Supprimer le form Formspree `xjkejbdp`
4. Archiver le repo GitHub

---

*v2.0.1 · Septembre 2026*
