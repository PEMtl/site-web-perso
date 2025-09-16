document.addEventListener('DOMContentLoaded', () => {
    
    // Animation d'apparition des cartes au défilement
    const cards = document.querySelectorAll('.card:not(.hero)');
    if (cards.length > 0) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        cards.forEach(card => { 
            observer.observe(card); 
        });
    }

    // Mise à jour automatique de l'année du copyright
    const copyrightYear = document.getElementById('copyright-year');
    if (copyrightYear) {
        copyrightYear.textContent = new Date().getFullYear();
    }

    // Gestion de la copie de l'e-mail dans le presse-papiers
    const copyBtn = document.getElementById('copy-email-btn');
    if (copyBtn) {
        const emailToCopy = 'contact@pe-monreal.com';
        const copyTextSpan = copyBtn.querySelector('.copy-text');
        
        if (copyTextSpan) {
            const originalText = copyTextSpan.textContent;

            copyBtn.addEventListener('click', () => {
                // Vérifie si l'API est disponible (contexte sécurisé http/https)
                if (navigator.clipboard && window.isSecureContext) {
                    navigator.clipboard.writeText(emailToCopy).then(() => {
                        copyBtn.classList.add('copied');
                        copyTextSpan.textContent = 'Copié !';

                        setTimeout(() => {
                            copyBtn.classList.remove('copied');
                            copyTextSpan.textContent = originalText;
                        }, 2000);

                    }).catch(err => {
                        console.error('Erreur lors de la copie : ', err);
                        copyTextSpan.textContent = 'Erreur';
                    });
                } else {
                    // Fallback pour les contextes non sécurisés (ou anciens navigateurs)
                    console.log('API Clipboard non disponible.');
                }
            });
        }
    }

    // Gestion du Dark Mode
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Appliquer le thème sauvegardé au chargement de la page
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.classList.add(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // (Bonus) Appliquer le thème sombre si c'est la préférence système de l'utilisateur
        body.classList.add('dark-mode');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            
            // Sauvegarder le choix de l'utilisateur
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('theme', 'dark-mode');
            } else {
                localStorage.removeItem('theme');
            }
        });
    }
});