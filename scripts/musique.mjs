// Tri « musique » du radar : on garde l'électro, la techno, la house, les soirées DJ, les discothèques et les clubs.
// On retire le théâtre, les lotos, blind tests, karaokés, thés dansants, bals, concerts classiques, fêtes de salle des fêtes
// et tout ce qui n'annonce aucune musique de club. Les concerts rock / jazz / pop et les bars sans DJ sont aussi retirés.
const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const ELECTRO = /techno|\bhouse\b|tech.?house|deep.?house|electro|edm|trance|drum ?(&|and|n) ?bass|dnb|jungle|hardtek|tekno|hardcore|hard ?style|hardstyle|acid|minimal|garage|dubstep|bass music|disco|afro ?house|amapiano|melodic|progressive|rave|free ?party|teknival|clubbing|club night|\bparty\b|\bdj\b|dj set|djs|b2b|deejay|\bmix\b|dj mix|after ?party|warehouse|underground|open air|boiler|closing|opening party|dance ?floor|dancefloor|dance music|gabber|frenchcore|uptempo|hard groove|hard bounce|hard dance|ebm|all night long/;
const NON_MUSIQUE = /bach|mozart|vivaldi|tchaikovsky|beethoven|chopin|candlelight|ravel|debussy|theatre|piece de|comedie|humour|stand.?up|one man|conference|exposition|expo |vernissage|atelier|stage |loto|quiz|blind test|karaoke|lecture|conte|cinema|projection|film|messe|marche |vide.?grenier|brocante|randonnee|balade|visite|salon |forum|assemblee|reunion|seminaire|cours |initiation|yoga|sport|match|tournoi|jeux|jeu de|escape|magie|cirque|marionnette|enfant|famille|bebe|danse classique|ballet|opera|choral|chorale|orchestre|symphon|philharmon|recital|classique|baroque|musique de chambre|piano solo|lyrique|gospel|chant |patrimoine|debat|repas|degustation|diner spectacle|apero|anniversaire|bal |the dansant|bal occitan|bal folk|guinguette|musette|accordeon|country|line dance|tango|culture et handicap|solidaire|benevole|association|caritatif|kermesse|fete de village|feria/;
const NON_MUSIQUE_FORT = /famille|bach|mozart|vivaldi|tchaikovsky|candlelight|theatre|conference|exposition|loto|enfant|karaoke|blind.?test|cinema|film/;
const SALLE_VILLAGE = /salle des fetes|salle polyvalente|foyer|mairie|maison de quartier|centre social|ehpad/;
export function estMusiqueClub(e) {
  const tn = norm([e.nom, e.genres, e.scheduleNote].join(' ')), dj = norm(Array.isArray(e.lineup) ? e.lineup.join(' ') : e.djs), lieu = norm(e.lieu);
  if (/libertin|echangis/.test(tn + ' ' + lieu)) return true; // clubs libertins : gardés, avec le logo -18 dans l'appli
  if (SALLE_VILLAGE.test(lieu) && !/techno|\bhouse\b|electro|\bdj\b|dj set/.test(tn + ' ' + dj)) return false;
  if ((e.djSet === true || ELECTRO.test(tn + ' ' + dj)) && !NON_MUSIQUE_FORT.test(tn)) return true;
  const club = e.type === 'club' || /club|disco|boite|discotheque|nightclub|warehouse|\bumi\b|\bc12\b|\bb21\b|fabriek|\bbbp\b|\bfuse\b|pheonix|phoenix/.test(lieu);
  return club && !NON_MUSIQUE.test(tn);
}
