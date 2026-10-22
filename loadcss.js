// Bascule du CSS non bloquant : <link media="print" id="main-css"> -> media="all".
// Script volontairement isolé de script.js : si ce dernier est bloqué (SRI, réseau, erreur),
// la page reste stylée. Aucun attribut inline : compatible avec la CSP stricte.
const mainCss = document.getElementById('main-css');
if (mainCss) mainCss.media = 'all';
