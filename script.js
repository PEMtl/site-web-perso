// ── CSS non bloquant : bascule media="print" → "all" dès l'exécution de ce script
//    (defer = juste après le parsing HTML, avant DOMContentLoaded). Évite que style.css
//    bloque le premier rendu tout en gardant zéro attribut inline (compatible CSP stricte). ──
const mainCss = document.getElementById('main-css');
if (mainCss) mainCss.media = 'all';

document.addEventListener('DOMContentLoaded', () => {

  const VERSION = '2.3.0';

  // ── Scroll animation cards ──
  const cards = document.querySelectorAll('.card:not(.hero)');
  if (cards.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    cards.forEach(card => observer.observe(card));
  } else {
    cards.forEach(card => card.classList.add('is-visible'));
  }

  // ── Copyright year ──
  const yearEl = document.getElementById('copyright-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ── Compteurs animés ──
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  if (statNumbers.length > 0 && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 1200;
        const start = performance.now();
        function tick(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target) + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        counterObserver.unobserve(el);
      });
    }, { threshold: 0.5 });
    statNumbers.forEach(el => counterObserver.observe(el));
  }

  // ── Nav sticky + section active ──
  const nav = document.querySelector('.site-nav');
  const heroSection = document.getElementById('accueil');
  const sectionsList = [...document.querySelectorAll('main section[id]')];
  const navLinks = document.querySelectorAll('.nav-links a[data-section]');
  const backToTop = document.querySelector('.back-to-top');
  // La nav sticky est supprimée en CSS (display:none) sous 480px — inutile de calculer
  // sa visibilité/section active à chaque scroll sur ces écrans (coût de calcul évité).
  const navHiddenQuery = window.matchMedia('(max-width: 480px)');

  function updateNav() {
    if (!nav || !heroSection || navHiddenQuery.matches) return;
    // Toutes les LECTURES de layout d'abord (évite le reflow forcé lecture/écriture entrelacées)
    const heroBottom = heroSection.getBoundingClientRect().bottom;
    const sectionTops = sectionsList.map((sec) => sec.getBoundingClientRect().top);
    // Puis toutes les ÉCRITURES DOM
    nav.classList.toggle('visible', heroBottom < 0);
    let current = '';
    sectionTops.forEach((top, i) => { if (top <= 80) current = sectionsList[i].id; });
    navLinks.forEach(a => a.classList.toggle('active', a.dataset.section === current));
  }

  // Un seul listener de scroll pour la nav ET le bouton back-to-top (un seul rAF
  // par frame au lieu de deux listeners concurrents — moins de travail pour le
  // navigateur pendant le scroll, particulièrement sensible sur Firefox/macOS).
  let scrollTicking = false;
  function onScroll() {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        updateNav();
        if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 400);
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  updateNav();

  // ── Copie e-mail ──
  const copyBtn = document.getElementById('copy-email-btn');
  if (copyBtn) {
    const emailToCopy = 'contact@pe-monreal.com';
    const copyTextSpan = copyBtn.querySelector('.copy-text');
    const originalText = copyTextSpan ? copyTextSpan.textContent : 'Copier';

    copyBtn.addEventListener('click', async () => {
      if (!navigator.clipboard || !window.isSecureContext) {
        const ta = document.createElement('textarea');
        ta.value = emailToCopy;
        ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        try { document.execCommand('copy'); } catch {}
        document.body.removeChild(ta);
        showCopied();
        return;
      }
      try {
        await navigator.clipboard.writeText(emailToCopy);
        showCopied();
      } catch (err) {
        console.error('Clipboard error:', err);
        if (copyTextSpan) copyTextSpan.textContent = 'Erreur';
        setTimeout(() => { if (copyTextSpan) copyTextSpan.textContent = originalText; }, 2000);
      }
    });

    function showCopied() {
      copyBtn.classList.add('copied');
      if (copyTextSpan) copyTextSpan.textContent = 'Copié !';
      copyBtn.setAttribute('aria-label', 'E-mail copié !');
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        if (copyTextSpan) copyTextSpan.textContent = originalText;
        copyBtn.setAttribute('aria-label', "Copier l'e-mail");
      }, 2000);
    }
  }

  // ── Dark Mode ──
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;
  const STORAGE_KEY = 'pe-theme';

  function applyTheme(isDark) {
    body.classList.toggle('dark-mode', isDark);
    if (themeToggle) themeToggle.setAttribute('aria-label', isDark ? 'Passer en mode clair' : 'Passer en mode sombre');
  }

  const savedTheme = localStorage.getItem(STORAGE_KEY);
  applyTheme(savedTheme !== null ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = body.classList.toggle('dark-mode');
      localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
      themeToggle.setAttribute('aria-label', isDark ? 'Passer en mode clair' : 'Passer en mode sombre');
    });
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem(STORAGE_KEY) === null) applyTheme(e.matches);
  });

  // ── Formulaire AJAX Formspree ──
  const form = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  if (form && formStatus) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Envoi en cours…'; }
      formStatus.className = '';
      formStatus.style.display = 'none';

      // ── Mock local : court-circuite Formspree sur localhost/127.0.0.1 ──
      const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
      if (isLocal) {
        await new Promise(r => setTimeout(r, 800));
        formStatus.textContent = '✅ [TEST LOCAL] Formulaire OK — Formspree non sollicité.';
        formStatus.classList.add('success');
        formStatus.style.display = 'block';
        form.reset();
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '🚀 Envoyer'; }
        return;
      }

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
          formStatus.textContent = '✅ Message envoyé ! Je vous répondrai dans les plus brefs délais.';
          formStatus.classList.add('success');
          formStatus.style.display = 'block';
          form.reset();
        } else {
          const json = await response.json().catch(() => ({}));
          throw new Error(json?.errors?.map(e => e.message).join(', ') || 'Erreur serveur');
        }
      } catch (err) {
        formStatus.textContent = `❌ Erreur : ${err.message}. Contactez-moi directement par e-mail.`;
        formStatus.classList.add('error');
        formStatus.style.display = 'block';
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '🚀 Envoyer'; }
      }
    });
  }

  // ── Service Worker (cache offline) ──
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('SW registration failed:', err);
      });
    });
  }

  window.__SITE_VERSION__ = VERSION;

});
