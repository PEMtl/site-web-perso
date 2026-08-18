# 🌐 pe-monreal.com — Site Web Personnel

Site vitrine one-page de Pierre-Etienne Monreal, Consultant Product Owner Senior basé à Montpellier.

**Live** : [https://pe-monreal.com](https://pe-monreal.com)  
**Version** : 1.5.0  
**Stack** : HTML5 · CSS3 · JS vanilla · Formspree · Service Worker · OVH

---

## 📁 Structure du projet

```
/
├── index.html          # Point d'entrée unique
├── style.css           # Tous les styles
├── script.js           # Comportements JS (defer)
├── sw.js                # Service Worker — cache offline
├── manifest.json        # PWA manifest
├── robots.txt            # Crawl ouvert + lien sitemap
├── sitemap.xml            # URL unique — lastmod à jour à chaque déploiement
├── 404.html                # Page d'erreur personnalisée
├── .htaccess                 # Sécurité Apache + cache + compression
├── .well-known/
│   └── security.txt              # Contact sécurité (RFC 9116)
├── tests.html                      # Smoke tests — ouvrir après chaque déploiement
├── fonts/
│   ├── manrope-v20-latin-300.woff2
│   ├── manrope-v20-latin-regular.woff2
│   └── manrope-v20-latin-600.woff2
└── images/
    ├── photo-profil.webp
    ├── favicon-16x16.png / favicon-32x32.png
    ├── apple-touch-icon.png   # 180×180
    ├── icon-192x192.png       # PWA — placeholder, à remplacer
    ├── icon-512x512.png       # PWA — placeholder, à remplacer
    └── logos/
```

⚠️ **`icon-192x192.png`, `icon-512x512.png` et `apple-touch-icon.png` sont des placeholders générés** (initiales "PE" sur fond `--accent`). À remplacer par ta vraie photo/logo avant mise en prod si tu veux un rendu pro sur l'écran d'accueil mobile.

---

## ⚙️ Stack technique

| Techno | Rôle |
|---|---|
| HTML5 sémantique | Structure · Schema.org (`Person`, `WebSite`, `ProfilePage`) · Open Graph · Twitter Card |
| CSS3 vanilla (`style.css`) | Variables · dark mode · glassmorphism · nav sticky · tooltip · print · responsive |
| JS vanilla (`script.js`) | Nav sticky · compteurs animés · dark mode · AJAX form · clipboard · SW registration |
| Service Worker (`sw.js`) | Cache offline — network-first HTML, cache-first assets statiques |
| Manrope woff2 (auto-hébergé) | Police — 3 weights (300/400/600) — zéro Google Fonts |
| Formspree | Backend formulaire contact — ID `xjkejbdp` |
| Apache `.htaccess` | HSTS · CSP durcie · headers sécurité · cache · compression · 404 · redirection www→non-www |
| SRI (`integrity`) | Hash SHA-384 sur `style.css` et `script.js` — protection contre l'altération serveur |

---

## 🔐 Sécurité (`.htaccess`)

| Header | Valeur |
|---|---|
| HSTS | `max-age=31536000; includeSubDomains; preload` |
| CSP | `default-src 'self'; connect-src 'self' formspree.io; base-uri 'self'; form-action 'self' formspree.io; frame-ancestors 'none'` — **zéro `unsafe-inline`** |
| X-Content-Type-Options | `nosniff` |
| X-Frame-Options | `DENY` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | `geolocation=(), camera=(), microphone=()` |
| SRI | `integrity` + `crossorigin="anonymous"` sur `style.css` et `script.js` |

**⚠️ SRI — à régénérer à CHAQUE modification de `style.css` ou `script.js`** :

```bash
openssl dgst -sha384 -binary style.css  | openssl base64 -A
openssl dgst -sha384 -binary script.js | openssl base64 -A
# Remplacer les 3 occurrences (preload + stylesheet pour CSS, script pour JS) dans index.html
```

Un hash désynchronisé bloque totalement le chargement du fichier (le navigateur refuse silencieusement). **Toujours vérifier via `tests.html` après un déploiement.**

---

## 🚀 Déploiement

```bash
# Fichiers à pousser à chaque déploiement
index.html · style.css · script.js · sw.js · manifest.json
.htaccess · robots.txt · sitemap.xml · 404.html · .well-known/security.txt

# ⚠️ Régénérer les hash SRI si style.css ou script.js ont changé
# ⚠️ Mettre à jour <lastmod> dans sitemap.xml
# ⚠️ Ouvrir tests.html après déploiement (nécessite un serveur — pas de file://)

curl -I https://pe-monreal.com/     # vérifier les headers sécurité
```

---

## 🧪 Tests de non-régression

`tests.html` **fetch et parse** `index.html`, `style.css` et `script.js` via `DOMParser` — il ne teste plus son propre DOM (bug corrigé en v1.5.0). Nécessite un serveur local :

```bash
npx serve .
# ou Live Server (VSCode) sur le dossier du projet
# puis ouvrir http://localhost:.../tests.html
```

10 suites, ~95 assertions : Structure HTML · Hero · Timeline · Sécurité & SEO · Tooltips · Formulaire · Accessibilité · Performance & SEO · PWA & Offline · Liens & navigation.

Résultat attendu : `✅ TOUT EST OK`

---

## ✨ Fonctionnalités JS

| Feature | Détail |
|---|---|
| Nav sticky | Apparaît après scroll hero · section active · scroll horizontal snap sous 480px (44px touch targets) |
| Dark mode | `prefers-color-scheme` · override `localStorage` (`pe-theme`) |
| Compteurs animés | `IntersectionObserver` + `requestAnimationFrame` + easing ease-out |
| Copier email | `navigator.clipboard` + fallback `execCommand` |
| Formulaire AJAX | Fetch POST Formspree · mock local sur `localhost`/`127.0.0.1` (pas de vraie requête en dev) |
| Service Worker | Enregistré au `load`, feature-detected (`'serviceWorker' in navigator`) |
| Back to top | Throttle `requestAnimationFrame` |

---

## 🔧 Maintenance

### Régénérer les hash SRI
Voir section Sécurité ci-dessus — obligatoire après toute modif de `style.css`/`script.js`.

### Remplacer les icônes PWA placeholder
Générer depuis la vraie photo/logo : 180×180 (`apple-touch-icon.png`), 192×192 et 512×512 (`icon-*.png`) dans `images/`.

### Mettre à jour le badge disponibilité / témoignages
Dans `index.html` — hero pour le badge, `#a-propos` (actuellement vide, réactiver `.social-proof` avec de vrais noms/entreprises).

### Tester le formulaire Formspree
Dashboard : [formspree.io/forms](https://formspree.io/forms) · ID : `xjkejbdp`. reCAPTCHA doit être désactivé pour l'AJAX (honeypot `_gotcha` suffit).

---

## 🔍 Dépannage

| Symptôme | Solution |
|---|---|
| Site ne charge plus (CSS/JS absents) | Hash SRI désynchronisé — régénérer (voir Sécurité) |
| Tooltip illisible | Corrigé en v1.5.0 — couleurs fixes (`#1a202c`/`#f7fafc`), plus liées à `--accent` |
| Formulaire 403 Formspree | reCAPTCHA actif dans le dashboard Formspree → désactiver |
| Email de test jamais reçu | Vérifier l'adresse du compte Formspree dans Email Notifications |
| `tests.html` : tout FAIL | Ouvert en `file://` — servir via `npx serve .` |
| SW ne s'active pas | HTTPS requis en prod (fonctionne sur `localhost` en dev) |

---

## 🗑️ Démantèlement

1. Supprimer les fichiers via FTP/OVH Manager
2. Résilier le domaine `pe-monreal.com` dans OVH
3. Supprimer le form Formspree `xjkejbdp`
4. Archiver le repo GitHub

---

*v1.5.0 · Août 2026*
