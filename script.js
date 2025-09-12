document.addEventListener('DOMContentLoaded', () => {
    
    // Animation d'apparition des cartes au défilement
    const cards = document.querySelectorAll('.card');
    if (cards.length > 0) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // Optionnel : arrêter d'observer une fois l'élément visible pour de meilleures performances
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
});