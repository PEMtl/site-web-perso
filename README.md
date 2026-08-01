# 🌐 pe-monreal.com — Site Web Personnel

Site vitrine one-page de Pierre-Etienne Monreal, Consultant Product Owner Senior basé à Montpellier.

**Live** : [https://www.pe-monreal.com](https://www.pe-monreal.com)  
**Version** : 1.2.0  
**Stack** : HTML5 · CSS3 · JS vanilla · Formspree · OVH

---

## 📁 Structure du projet

```
/
├── index.html          # Point d'entrée unique
├── style.css           # Tous les styles (séparé du HTML)
├── script.js           # Comportements JS (chargé en defer)
├── manifest.json       # PWA manifest (installabilité)
├── robots.txt          # Crawl ouvert + lien sitemap
├── sitemap.xml         # URL unique — à mettre à jour à chaque déploiement
├── .htaccess           # Sécurité Apache + cache + compression
├── tests.html          # Smoke tests — ouvrir après chaque déploiement
├── fonts/
│   ├── manrope-v20-latin-300.woff2
│   ├── manrope-v20-latin-regular.woff2
│   └── manrope-v20-latin-600.woff2
└── images/
    ├── photo-profil.webp
    ├── favicon-16x16.png
    ├── favicon-32x32.png
    └── logos/
        └── exalt.png   # + logos SVG inline dans index.html
```

---

## ⚙️ Stack technique

| Techno | Rôle |
|---|---|
| HTML5 sémantique | Structure · Schema.org · Open Graph · Twitter Card |
| CSS3 vanilla (`style.css`) | Variables · dark mode · glassmorphism · responsive |
| JS vanilla (`script.js`) | Nav sticky · dark mode · AJAX form · clipboard · RAF |
| Manrope woff2 (auto-hébergé) | Police — 3 weights (300/400/600) — zéro Google Fonts |
| Formspree | Backend formulaire contact — ID `xjkejbdp` |
| Apache `.htaccess` | HSTS · CSP · headers sécurité · cache · compression |
| OVH mutualisé | Hébergement + domaine `pe-monreal.com` |

---

## 🔐 Sécurité (`.htaccess`)

| Header | Valeur |
|---|---|
| HSTS | `max-age=31536000; includeSubDomains; preload` |
| CSP | `default-src 'self'` · `connect-src formspree.io` |
| X-Content-Type-Options | `nosniff` |
| X-Frame-Options | `DENY` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | `geolocation=(), camera=(), microphone=()` |

---

## 🚀 Déploiement

```bash
# Fichiers à pousser à chaque déploiement
index.html · style.css · script.js · .htaccess · robots.txt · sitemap.xml · manifest.json

# ⚠️ Toujours mettre à jour <lastmod> dans sitemap.xml
# ⚠️ Toujours ouvrir tests.html après déploiement pour valider

# Vérifier les headers sécurité
curl -I https://www.pe-monreal.com/
```

---

## 🧪 Tests de non-régression

Ouvrir `tests.html` après chaque déploiement — 5 suites, ~55 assertions :

- **Structure HTML** — sections, meta, JSON-LD, favicons, manifest
- **Formulaire contact** — champs, honeypot, aria
- **Accessibilité** — skip-link, alt, aria-labels, roles
- **CSS & Performance** — CSS externe, preloads, fetchpriority, lazy loading
- **Liens & navigation** — nav sticky, rel, mailto, back-to-top

Résultat attendu : `✅ TOUT EST OK`

---

## ✨ Fonctionnalités JS

| Feature | Détail |
|---|---|
| Nav sticky | Apparaît après le scroll du hero · section active mise en évidence |
| Dark mode | Respecte `prefers-color-scheme` · override `localStorage` (`pe-theme`) |
| Copier email | `navigator.clipboard` + fallback `execCommand` |
| Formulaire AJAX | Fetch POST Formspree · états disabled/loading/success/error |
| Back to top | Throttle `requestAnimationFrame` + `{ passive: true }` |
| Scroll animation | `IntersectionObserver` · fallback si absent |

---

## 📈 Performances

- `preload` photo profil (webp) + fonts critiques (400, 600)
- CSS séparé → mise en cache 1 an navigateur
- Cache 1 an assets statiques, 1h HTML
- Compression Gzip Apache
- `font-display: swap` · `width`/`height` sur photo (CLS = 0)
- `prefers-reduced-motion` media query

---

## 🔧 Maintenance

### Mettre à jour le CV
Dans `index.html` — chercher `drive.google.com` → remplacer les 2 URLs.

### Mettre à jour le sitemap
Modifier `<lastmod>` dans `sitemap.xml` avec la date du jour (YYYY-MM-DD).

### Tester le formulaire
Dashboard Formspree : [formspree.io/forms](https://formspree.io/forms) · ID : `xjkejbdp`

### Ajouter un logo SVG officiel
Remplacer les blocs `.entity-logo-svg` dans `index.html` par un `<img>` pointant vers le fichier dans `images/logos/`.

---

## 🔢 Versioning

Format commits : `type(scope): description`

```bash
# Option A — commit unique
git add . && git commit -m "feat: nav sticky, CSS externe, champ nom, manifest PWA, tests.html, README"

# Option B — atomique (recommandé)
git add index.html style.css  && git commit -m "feat: CSS externe, nav sticky, champ nom formulaire"
git add script.js              && git commit -m "feat: nav sticky JS, section active, version exposée"
git add manifest.json sitemap.xml && git commit -m "feat: manifest PWA, sitemap lastmod 2026-07-31"
git add tests.html             && git commit -m "test: smoke tests 5 suites ~55 assertions"
git add README.md              && git commit -m "docs: README complet v1.3.0"
```

---

## 🗑️ Démantèlement

1. Supprimer les fichiers via FTP/OVH Manager
2. Résilier le domaine `pe-monreal.com` dans OVH → Domaines
3. Supprimer le form Formspree `xjkejbdp` → [formspree.io/forms](https://formspree.io/forms)
4. Archiver le repo GitHub

---

*v1.3.0 · Août 2026*
