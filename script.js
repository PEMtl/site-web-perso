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
                    console.log('API Clipboard non disponible.');
                }
            });
        }
    }

    // Gestion du Dark Mode
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Appliquer le thème sauvegardé (uniquement le choix de l'utilisateur)
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.classList.add(savedTheme);
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

    // Gestion de l'affichage du bouton "Back to Top"
    const backToTopButton = document.querySelector('.back-to-top');
    if (backToTopButton) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        });
    }
});