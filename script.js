document.addEventListener('DOMContentLoaded', () => {
    
    // Animation d'apparition des cartes au défilement
    const cards = document.querySelectorAll('.card');
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

    // Gestion de la copie de l'e-mail dans le presse-papiers
    const copyBtn = document.getElementById('copy-email-btn');
    if (copyBtn) {
        const emailToCopy = 'contact@pe-monreal.com';
        const copyText = copyBtn.querySelector('.copy-text');
        const originalText = copyText.textContent;

        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(emailToCopy).then(() => {
                copyBtn.classList.add('copied');
                copyText.textContent = 'Copié !';

                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyText.textContent = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Erreur lors de la copie : ', err);
                copyText.textContent = 'Erreur';
            });
        });
    }
});