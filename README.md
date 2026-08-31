# 🌐 pe-monreal.com — Site Web Personnel

Site vitrine one-page de Pierre-Etienne Monreal, Consultant Product Owner Senior basé à Montpellier.

**Live** : [https://pe-monreal.com](https://pe-monreal.com)  
**Version** : 1.8.0  
**Stack** : HTML5 · CSS3 · JS vanilla · Formspree · Service Worker · OVH

---

## ⚠️ AVANT DE DÉPLOYER — lire impérativement

1. **`.htaccess` est un fichier caché (dotfile).** La plupart des clients FTP (FileZilla…) le masquent par défaut. Active "Afficher les fichiers cachés" avant l'upload, sinon **aucune** des règles de sécurité, cache ou 404 personnalisée ne s'applique — c'est la cause la plus probable si un problème "disparaît tout seul" après déploiement.
2. **Régénérer les hash SRI si `style.css` ou `script.js` ont changé** (voir section Sécurité). Un hash désynchronisé bloque silencieusement le chargement du fichier concerné.
3. **Le contenu (missions, badge) peut avoir divergé entre le repo et la prod** si des éditions manuelles ont été faites directement sur le serveur. Toujours vérifier `https://pe-monreal.com` avant de partir d'un ancien export local.

### 🔁 Pattern récurrent constaté sur ce projet : déploiements partiels

Plusieurs bugs signalés (404 qui ne marche pas, header illisible en dark mode) avaient déjà leur correctif dans le code livré, mais n'étaient pas visibles en prod. Cause probable à chaque fois : **déploiement incomplet ou fichier oublié** (souvent `.htaccess`, invisible dans les clients FTP).

**Protocole recommandé pour éviter ça** :
1. Ne jamais déployer fichier par fichier — toujours l'intégralité du zip livré
2. Avant upload : activer "Afficher les fichiers cachés" dans le client FTP et vérifier que `.htaccess` et `.well-known/` apparaissent dans la liste à uploader
3. Après upload : ouvrir `tests.html` en le servant depuis le vrai domaine (pas en local) si possible, ou au minimum lancer les vérifications `curl` listées dans ce README
4. En cas de doute sur l'état réel de la prod, comparer le contenu affiché sur `https://pe-monreal.com` avec ce repo AVANT de repartir d'un ancien export

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
├── .well-known/
│   └── security.txt                  # Contact sécurité (RFC 9116)
├── tests.html                          # Smoke tests — fetch + parse les 3 fichiers sources
├── fonts/
│   ├── manrope-v20-latin-300.woff2
│   ├── manrope-v20-latin-regular.woff2
│   └── manrope-v20-latin-600.woff2
└── images/
    ├── photo-profil.webp     # ⚠️ Non optimisée par cette session (binaire non fourni)
    ├── favicon-16x16.png / favicon-32x32.png
    ├── apple-touch-icon.png   # 180×180 — placeholder généré
    ├── icon-192x192.png       # PWA — placeholder généré, optimisé (452 o)
    ├── icon-512x512.png       # PWA — placeholder généré, optimisé (1,2 Ko)
    └── logos/
```

---

## ⚙️ Stack technique

| Techno | Rôle |
|---|---|
| HTML5 sémantique | Structure · Schema.org (`Person`, `WebSite`, `ProfilePage`) · Open Graph · Twitter Card |
| CSS3 vanilla (`style.css`) | Variables · dark mode · glassmorphism · nav sticky · tooltip accessible · print · responsive |
| JS vanilla (`script.js`) | Nav sticky (sans reflow forcé) · compteurs animés · dark mode · AJAX form · swap CSS non-bloquant · SW registration |
| Service Worker (`sw.js`) | Cache offline — network-first HTML, cache-first assets statiques |
| Manrope woff2 (auto-hébergé) | Police — 3 weights (300/400/600) — zéro Google Fonts |
| Formspree | Backend formulaire contact — ID `xjkejbdp` |
| Apache `.htaccess` | HSTS · CSP durcie · **Cache-Control explicite + immutable** · compression · 404 · redirection www→non-www |
| SRI (`integrity`) | Hash SHA-384 sur `style.css` et `script.js` |

---

## 🚀 Performance — corrections PageSpeed Insights (v1.6.0)

| Recommandation PSI | Correction appliquée |
|---|---|
| Utiliser des durées de cache efficaces (43 Kio) | `Cache-Control: public, max-age=31536000, immutable` explicite sur CSS/JS/fonts/images (`.htaccess`), pas seulement `Expires` |
| Requêtes de blocage du rendu | `style.css` chargé en `media="print"` puis basculé en `media="all"` par `script.js` dès son exécution (technique loadCSS, zéro attribut inline, compatible CSP stricte). `<noscript>` en fallback |
| Ajustement forcé de la mise en page | `updateNav()` lisait `getBoundingClientRect()` puis écrivait `classList.toggle` en boucle → reflow forcé à chaque frame de scroll. Corrigé : toutes les lectures groupées avant toutes les écritures |
| Améliorer l'affichage des images | Icônes PWA recompressées (palette adaptative, -70% de poids). **`photo-profil.webp` nécessite le fichier source réel pour être redimensionné/recompressé — non fourni dans cette session** |
| Arbre d'accessibilité mal formé | `tabindex="0"` sur des `role="listitem"` (anti-pattern ARIA — un listitem n'est pas nativement interactif) retiré. Contenu des tooltips exposé aux lecteurs d'écran via `<span class="sr-only">` plutôt que via focus + `::after` CSS |

## 🐌 Scroll "lourd" sur Firefox macOS (v1.8.0)

**Symptôme rapporté** : scroll qui semble avoir de l'adhérence sur macOS + Firefox, absent sur mobile (Brave). Pas de bug ou de faute de code — un vrai coût de rendu, particulier à Firefox/GPU plus anciens.

**Cause** : le site combine plusieurs `backdrop-filter: blur()` (nav sticky + 5 cards) avec un `filter: blur(100px)` en plein écran (`.background-shapes`, `position: fixed`). Chaque frame de scroll oblige le navigateur à recomposer ces flous en fonction de ce qu'il y a derrière — Firefox historiquement moins optimisé que Chromium sur ce point, l'écart se voit surtout sur du matériel plus ancien (cohérent avec macOS 11.7.11).

**Corrections appliquées** :
- `background-shapes` : blur 100px → 60px (coût de flou ~O(rayon²), gain significatif, effet visuel quasi identique)
- `.card` : backdrop-filter 15px → 10px, + `contain: layout style paint` pour isoler le repaint de chaque card du reste de la page pendant le scroll
- `.site-nav` : backdrop-filter 16px → 10px, + `translateZ(0)` pour forcer sa propre couche de composition GPU (élément sticky + backdrop-filter = combo le plus coûteux à recomposer)
- **Deux listeners `scroll` séparés fusionnés en un seul** (nav + back-to-top partageaient déjà le même throttle `requestAnimationFrame`, mais tournaient indépendamment — un seul listener + un seul `rAF` par frame réduit le travail du navigateur pendant le scroll)

Aucun changement visuel notable attendu — l'objectif est uniquement de réduire le coût de composition pendant le scroll.

## 🌗 Header sticky illisible en dark mode au survol (v1.7.0)

**Symptôme rapporté** : en dark mode, survoler un lien du header sticky affiche une pastille blanche vide — texte invisible.

**Cause** : `--accent` devient blanc (`#ffffff`) en dark mode. La règle de base `.nav-links a:hover { background: var(--accent); color: #fff; }` donnait donc fond blanc + texte blanc. Un correctif ciblant `color` seul existait déjà mais reposait sur la cascade CSS — renforcé en v1.7.0 pour être totalement autonome (couleurs `background`/`color` explicites, aucune dépendance à `var(--accent)`), et verrouillé par un test automatique dans `tests.html`.

Comme pour le bug 404, ce correctif existait déjà dans une version antérieure du code — la cause la plus probable de sa persistance en prod est, encore une fois, **un déploiement partiel**.

---

## 🐛 Bug 404 — cause et correction (v1.6.0)

**Symptôme rapporté** : n'importe quelle URL inexistante (`/machin`) ne redirigeait pas vers la page 404.

**Cause réelle trouvée** : `404.html` contenait des `style="..."` inline. Or la CSP du site (`style-src 'self'`, zéro `unsafe-inline`) s'applique à **toutes** les pages, y compris les pages d'erreur — le navigateur bloquait ces styles, rendant la page 404 visuellement cassée (au mieux) ou perçue comme "ne marchant pas".

La directive `ErrorDocument 404 /404.html` était déjà correcte dans `.htaccess`. Le problème le plus probable en prod : **ce fichier `.htaccess` n'a jamais été réellement déployé**, car les clients FTP masquent les dotfiles par défaut. Voir l'avertissement en tête de ce README.

**Corrections appliquées** :
- `404.html` réécrit sans aucun style inline (classes CSS dédiées `.error-page`, `.error-code`, `.error-title`)
- Pas de SRI sur `404.html` (volontaire — une page d'erreur doit toujours pouvoir s'afficher même si un hash est désynchronisé ailleurs)
- Commentaire explicite dans `.htaccess` sur la visibilité des dotfiles en FTP

**Pour vérifier après déploiement** :
```bash
curl -I https://pe-monreal.com/url-qui-nexiste-pas
# Doit renvoyer : HTTP/1.1 404 Not Found
```

---

## 🔐 Sécurité (`.htaccess` + SRI)

| Mesure | Détail |
|---|---|
| HSTS | `max-age=31536000; includeSubDomains; preload` |
| CSP durcie | `default-src 'self'`, zéro `unsafe-inline` — **tous les styles doivent être dans `style.css`, jamais en attribut `style=""`** |
| Cache-Control | Explicite + `immutable` sur assets statiques, `must-revalidate` sur HTML |
| SRI | `integrity` sha384 + `crossorigin="anonymous"` sur `style.css` (×2 occurrences : preload + stylesheet) et `script.js` |
| X-Content-Type-Options / X-Frame-Options / Referrer-Policy / Permissions-Policy | Standards, voir `.htaccess` |
| security.txt | `.well-known/security.txt` (RFC 9116) |

**⚠️ Régénérer les hash SRI à CHAQUE modification de `style.css` ou `script.js`** :

```bash
openssl dgst -sha384 -binary style.css  | openssl base64 -A
openssl dgst -sha384 -binary script.js | openssl base64 -A
# Remplacer TOUTES les occurrences dans index.html :
# - style.css apparaît 2 fois (preload + stylesheet)
# - script.js apparaît 1 fois
```

Toujours vérifier via `tests.html` après déploiement — un hash désynchronisé bloque silencieusement le fichier concerné (page blanche ou non stylée).

---

## 🧪 Tests de non-régression

`tests.html` **fetch et parse** `index.html`, `style.css`, `script.js` et `404.html` — nécessite un serveur local :

```bash
npx serve .
# puis ouvrir http://localhost:.../tests.html
```

11 suites : Structure HTML · Hero · Timeline (5 missions) · Sécurité & SEO · Tooltips (accessibles sans tabindex) · Formulaire · Accessibilité · Performance & SEO (CSS non-bloquant, reflow) · PWA & Offline · Liens & navigation · Page 404.

Résultat attendu : `✅ TOUT EST OK`

---

## 🔧 Maintenance

### Régénérer les hash SRI
Obligatoire après toute modif de `style.css`/`script.js` — voir section Sécurité.

### Optimiser `photo-profil.webp`
Le fichier actuel n'a pas été retouché cette session (binaire non fourni). Recommandé : redimensionner à ~500×500px (2× la taille d'affichage 250×250 CSS pour les écrans retina), qualité WebP 80, via Squoosh ou équivalent.

### Remplacer les icônes PWA placeholder
Générer depuis la vraie photo/logo : 180×180, 192×192, 512×512 dans `images/`.

### Vérifier les headers en prod
```bash
curl -I https://pe-monreal.com/
curl -I https://pe-monreal.com/url-inexistante   # doit renvoyer 404
```

### Tester le formulaire Formspree
Dashboard : [formspree.io/forms](https://formspree.io/forms) · ID `xjkejbdp`. reCAPTCHA doit être désactivé pour l'AJAX.

---

## 🔍 Dépannage

| Symptôme | Solution |
|---|---|
| 404 ne s'affiche jamais sur URL inexistante | `.htaccess` non déployé — vérifier visibilité dotfiles dans le client FTP |
| Page 404 s'affiche mais cassée visuellement | Vérifier zéro `style=""` inline dans `404.html` (bloqué par la CSP) |
| Site ne charge plus (CSS/JS blancs) | Hash SRI désynchronisé — régénérer (voir Sécurité) |
| Tooltip illisible | Couleurs fixes `#1a202c`/`#f7fafc` dans `.skill-tag[data-tooltip]::after` — ne doit jamais redépendre de `var(--accent)` |
| Flash de contenu non stylé (FOUC) au chargement | Normal et bref (technique CSS non-bloquant) — si trop visible, vérifier que `script.js` est bien en `defer` et charge vite |
| `tests.html` : tout FAIL | Ouvert en `file://` — servir via `npx serve .` |

---

## 🗑️ Démantèlement

1. Supprimer les fichiers via FTP/OVH Manager (penser aux dotfiles : `.htaccess`, `.well-known/`)
2. Résilier le domaine `pe-monreal.com` dans OVH
3. Supprimer le form Formspree `xjkejbdp`
4. Archiver le repo GitHub

---

*v1.8.0 · Août 2026*
