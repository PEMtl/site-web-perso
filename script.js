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

    // Gestion de la copie de l'e-mail dans le presse-papiers
    const copyBtn = document.getElementById('copy-email-btn');
    if (copyBtn) {
        const emailToCopy = 'contact@pe-monreal.com';
        const copyTextSpan = copyBtn.querySelector('.copy-text');
        
        if (copyTextSpan) {
            const originalText = copyTextSpan.textContent;

            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(emailToCopy).then(() => {
                    // Succès de la copie
                    copyBtn.classList.add('copied');
                    copyTextSpan.textContent = 'Copié !';

                    // Revenir à l'état initial après 2 secondes
                    setTimeout(() => {
                        copyBtn.classList.remove('copied');
                        copyTextSpan.textContent = originalText;
                    }, 2000);

                }).catch(err => {
                    // Gérer les erreurs (optionnel, mais une bonne pratique)
                    console.error('Erreur lors de la copie : ', err);
                    copyTextSpan.textContent = 'Erreur';
                });
            });
        }
    }
});