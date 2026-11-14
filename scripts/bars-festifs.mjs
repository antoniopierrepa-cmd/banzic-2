// « Bars festifs » : karaokés, blind tests, quiz musicaux, apéros concert ou DJ, afterworks.
// Pas les thés dansants, repas dansants, dégustations ni les soirées en salle des fêtes.
const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const FEST = /karaok|blind ?test|quiz musical|apero ?(concert|mix|dj|live|musical)|afterwork|after work/;
const NON = /the dansant|apres-midi|repas|beaujolais|vins nouveaux|degustation|vernissage|senior|ccas|fnaca|enfant|famille|theatre|conference|exposition|loto|salle des fetes|salle polyvalente|eglise|mairie|mediatheque|bibliotheque|ehpad|cinema|atelier/;
export function genreFestif(e) {
  const t = norm([e.nom, e.genres].join(' ')), l = norm(e.lieu);
  if (NON.test(t + ' ' + l) || !FEST.test(t)) return '';
  return /karaok/.test(t) ? 'Karaoké' : /blind ?test|quiz/.test(t) ? 'Blind test' : /afterwork|after work/.test(t) ? 'Afterwork' : 'Apéro musical';
}
