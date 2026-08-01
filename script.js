document.addEventListener('DOMContentLoaded', () => {

  const VERSION = '1.3.0';

  // ── Scroll animation cards (alternance gauche/droite gérée CSS) ──
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

  // ── Compteurs animés (déclenchés à la visibilité du hero-stats) ──
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
          // Easing ease-out
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
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[data-section]');

  function updateNav() {
    if (!nav || !heroSection) return;
    nav.classList.toggle('visible', heroSection.getBoundingClientRect().bottom < 0);
    let current = '';
    sections.forEach(sec => { if (sec.getBoundingClientRect().top <= 80) current = sec.id; });
    navLinks.forEach(a => a.classList.toggle('active', a.dataset.section === current));
  }

  let navTicking = false;
  window.addEventListener('scroll', () => {
    if (!navTicking) {
      requestAnimationFrame(() => { updateNav(); navTicking = false; });
      navTicking = true;
    }
  }, { passive: true });
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

  // ── Back to top ──
  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => { backToTop.classList.toggle('visible', window.scrollY > 400); ticking = false; });
        ticking = true;
      }
    }, { passive: true });
  }

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

  window.__SITE_VERSION__ = VERSION;

});
