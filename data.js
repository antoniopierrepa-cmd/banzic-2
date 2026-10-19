// Données de démonstration — calquées sur les futures tables Supabase :
// lieux, soirees, passages.
// Line-ups : réels, jeudi 1er octobre 2026 (source : Ibiza Spotlight).
// Horaires de passage : SIMULÉS pour la démonstration (les lieux ne les publient pas).
// Les heures sont écrites "HH:MM" ; une heure après minuit appartient à la même nuit.

window.DEMO = {
  date: 'Jeudi 1er octobre',

  // photo : chemin d'image sur le CDN d'Ibiza Spotlight (démo uniquement — droits à obtenir pour l'appli publique).
  photoBase: 'https://dv7zfk0hwmxgu.cloudfront.net/sites/default/files/styles/',
  lieux: [
    { id: 'unvrs', nom: '[UNVRS]', type: 'club', zone: 'Sant Rafel', note: '4,2', lat: 38.9598, lng: 1.4012, capacite: 10000, experience: 'show', photo: 'venue-images/142375/slideshow-1777575619.jpg' },
    { id: 'amnesia', nom: 'Amnesia', type: 'club', zone: 'Sant Rafel', note: '4,1', lat: 38.9549, lng: 1.4086, capacite: 5000, experience: 'danse', photo: 'venue-images/69816/slideshow-1699903365.jpg' },
    { id: 'pacha', nom: 'Pacha', type: 'club', zone: 'Eivissa', note: '4,4', lat: 38.9175, lng: 1.4411, capacite: 3000, experience: 'danse', photo: 'venue-images/69820/slideshow-1714672222.jpg' },
    { id: 'akasha', nom: 'Akasha · Las Dalias', type: 'club', zone: 'Sant Carles', note: '4,5', lat: 39.0103, lng: 1.5629, capacite: 1200, experience: 'danse', photo: 'venue-images/137377/slideshow-1739471402.jpg' },
    { id: '528', nom: '528 Ibiza', type: 'club', zone: 'Sant Rafel', note: '4,4', lat: 38.9570, lng: 1.4048, capacite: 2500, experience: 'danse', photo: 'venue-images/137194/slideshow-1693055905.jpg' },
    { id: 'chinois', nom: 'Chinois Ibiza', type: 'club', zone: 'Eivissa', note: '4,1', lat: 38.9163, lng: 1.4463, capacite: 1200, experience: 'danse', photo: 'venue-images/138058/slideshow-1710190074.png' },
    { id: 'lio', nom: 'Lío Ibiza', type: 'club', zone: 'Marina Botafoch', note: '4,3', lat: 38.9170, lng: 1.4452, capacite: 600, experience: 'show', photo: 'venue-images/69869/slideshow-1710882697.jpg' },
    { id: 'espardis', nom: 'Es Paradis', type: 'club', zone: 'Sant Antoni', note: '3,7', lat: 38.9817, lng: 1.3043, capacite: 3500, experience: 'danse', photo: 'venue-images/69819/slideshow-1677767632.jpg' },
    { id: 'borabora', nom: 'Playa Soleil · Bora Bora', type: 'plage', zone: "Platja d'en Bossa", note: '3,7', lat: 38.8840, lng: 1.4098, capacite: 1500, experience: 'danse', photo: 'venue-images/140795/slideshow-1768064770.jpg' },
    { id: 'destino', nom: 'Destino Five', type: 'plage', zone: 'Talamanca', note: '4,7', lat: 38.9214, lng: 1.4560, capacite: 1500, experience: 'danse', photo: 'venue-images/91009/slideshow-1784750503.jpg' },
    { id: 'obeach', nom: 'O Beach', type: 'plage', zone: 'Sant Antoni', note: '4,3', lat: 38.9764, lng: 1.3086, capacite: 2000, experience: 'danse', photo: 'venue-images/69856/slideshow-1789155745.jpg' },
    { id: 'mambo', nom: 'Café Mambo', type: 'plage', zone: 'Sant Antoni', note: '4,2', lat: 38.9832, lng: 1.2966, capacite: 600, experience: 'danse', photo: 'restaurant-images/119847/slideshow-1643824639_17.jpg' },
    { id: 'cafedelmar', nom: 'Café del Mar', type: 'plage', zone: 'Sant Antoni', note: '4,1', lat: 38.9823, lng: 1.2961, capacite: 600, experience: 'danse', photo: 'venue-images/69861/slideshow-1581435909.jpg' },
    { id: 'bluemarlin', nom: 'Blue Marlin', type: 'plage', zone: 'Cala Jondal', note: '4,2', lat: 38.8670, lng: 1.3185, capacite: 800, experience: 'danse', photo: 'venue-images/69841/slideshow-1417110019_4.jpg' },
    { id: 'hi', nom: 'Hï Ibiza', type: 'club', zone: "Platja d'en Bossa", note: '3,7', lat: 38.8839, lng: 1.4052, capacite: 5000, experience: 'danse', photo: 'venue-images/126862/slideshow-1783933362.jpg' },
    { id: 'ushuaia', nom: 'Ushuaïa', type: 'club', zone: "Platja d'en Bossa", note: '4,3', lat: 38.8819, lng: 1.4035, capacite: 7000, experience: 'show', photo: 'venue-images/69835/slideshow-1768423210_0.jpg' },
    { id: 'dc10', nom: 'DC10', type: 'club', zone: 'Sant Jordi', note: '3,6', lat: 38.8771, lng: 1.3897, capacite: 1500, experience: 'danse', photo: 'venue-images/69824/slideshow-1365615314.jpg' },
    { id: 'covasanta', nom: 'Cova Santa', type: 'club', zone: 'Sant Josep', note: '4,3', lat: 38.8856, lng: 1.3727, capacite: 1500, experience: 'danse', photo: 'venue-images/91298/slideshow-1715523085.jpg' },
    { id: 'eden', nom: 'Eden', type: 'club', zone: 'Sant Antoni', note: '3,5', lat: 38.9808, lng: 1.3039, capacite: 4000, experience: 'danse', photo: 'venue-images/69817/slideshow-1707917902.jpg' },
    { id: 'pikes', nom: 'Pikes Ibiza', type: 'club', zone: 'Sant Antoni', note: '4,5', lat: 38.9899, lng: 1.3151, capacite: 500, experience: 'danse', photo: 'venue-images/120973/slideshow-1645121788.jpg' },
    { id: 'rocks', nom: 'Ibiza Rocks Pool Club', type: 'plage', zone: 'Sant Antoni', note: '4,1', lat: 38.9834, lng: 1.3051, capacite: 2000, experience: 'danse', photo: 'venue-images/69830/slideshow-1686560837.jpg' }
  ],

  // Une soirée par lieu ouvert ce soir. Lieux absents = fermé ce soir.
  soirees: [
    { lieu: 'unvrs', titre: 'Black Coffee', debut: '23:30', fin: '06:00', prix: 'Entrée dès 85 €' },
    { lieu: 'amnesia', titre: 'Josh Baker pres. You&Me — Closing', debut: '16:00', fin: '06:00', prix: 'Entrée dès 80 €' },
    { lieu: 'pacha', titre: 'Pure Pacha — Purple Disco Machine Closing', debut: '23:00', fin: '06:00', prix: 'Entrée dès 30 €' },
    { lieu: 'akasha', titre: 'Sven Väth pres. T.R.A.N.C.E', debut: '17:00', fin: '06:00', prix: '' },
    { lieu: '528', titre: 'Global Underground', debut: '17:00', fin: '04:00', prix: '' },
    { lieu: 'chinois', titre: 'Defected', debut: '23:30', fin: '06:30', prix: 'Entrée dès 60 €' },
    { lieu: 'lio', titre: 'Tiempo — Closing', debut: '23:45', fin: '05:00', prix: 'Entrée dès 40 €' },
    { lieu: 'espardis', titre: 'Bubbles', debut: '23:59', fin: '06:00', prix: 'Entrée dès 30 €' },
    { lieu: 'borabora', titre: 'Afrodise & Moots — Closing', debut: '18:00', fin: '03:00', prix: '' },
    { lieu: 'destino', titre: 'Pacha ICONS — Music On Daytime', debut: '17:00', fin: '23:00', prix: '' },
    { lieu: 'obeach', titre: 'O Beach Music — Closing', debut: '13:00', fin: '22:00', prix: '' },
    { lieu: 'mambo', titre: 'Sunset session', debut: '19:00', fin: '01:00', prix: '' },
    { lieu: 'cafedelmar', titre: 'Sunset', debut: '19:00', fin: '21:30', prix: '' },
    { lieu: 'bluemarlin', titre: 'Journée à la plage', debut: '12:00', fin: '00:00', prix: '' }
  ],

  // Passages : qui joue, où, quand. "constate" = heure réelle signalée par la communauté.
  // "confirmations" = nombre de personnes sur place qui ont confirmé.
  // "avis" = avis du public sur le set (à ne pas rater / sympa / bof) — simulés pour la démo.
  passages: [
    { lieu: 'unvrs', salle: 'Main Room', dj: 'Meera', debut: '23:30', fin: '01:00', avis: { top: 8, bien: 3, bof: 1 } },
    { lieu: 'unvrs', salle: 'Main Room', dj: 'Dixon', debut: '01:00', fin: '03:00', constate: '01:10', confirmations: 6, avis: { top: 6, bien: 5, bof: 1 } },
    { lieu: 'unvrs', salle: 'Main Room', dj: 'Black Coffee', debut: '03:00', fin: '06:00', tete: true },

    { lieu: 'amnesia', salle: 'Terraza', dj: 'Josh Baker', note: 'sunset set', debut: '19:00', fin: '21:00', tete: true, constate: '19:20', confirmations: 9 },
    { lieu: 'amnesia', salle: 'Terraza', dj: 'Enzo Siragusa b2b Silva Bumpa', debut: '21:00', fin: '23:00' },
    { lieu: 'amnesia', salle: 'Terraza', dj: 'Alexandria', debut: '23:00', fin: '00:30', avis: { top: 7, bien: 2, bof: 0 } },
    { lieu: 'amnesia', salle: 'Terraza', dj: 'Laidlaw', debut: '00:30', fin: '02:00', constate: '00:40', confirmations: 4, avis: { top: 3, bien: 4, bof: 2 } },
    { lieu: 'amnesia', salle: 'Terraza', dj: 'Max Dean', debut: '02:00', fin: '03:30' },
    { lieu: 'amnesia', salle: 'Terraza', dj: 'Josh Baker', note: 'sunrise set', debut: '03:30', fin: '06:00', tete: true },
    { lieu: 'amnesia', salle: 'Main Room', dj: 'Alisha', debut: '23:00', fin: '01:00' },
    { lieu: 'amnesia', salle: 'Main Room', dj: 'Jamie Fielding', debut: '01:00', fin: '03:00', confirmations: 2 },
    { lieu: 'amnesia', salle: 'Main Room', dj: 'Secret guest b2b secret guest', debut: '03:00', fin: '06:00' },

    { lieu: 'pacha', salle: 'Main Room', dj: 'David Bay', debut: '23:00', fin: '00:30', constate: '23:00', confirmations: 5, avis: { top: 9, bien: 2, bof: 1 } },
    { lieu: 'pacha', salle: 'Main Room', dj: 'Busy P', debut: '00:30', fin: '01:30', constate: '00:35', confirmations: 4, avis: { top: 2, bien: 3, bof: 5 } },
    { lieu: 'pacha', salle: 'Main Room', dj: 'Breakbot & Irfane', debut: '01:30', fin: '02:30', constate: '01:40', confirmations: 3, avis: { top: 5, bien: 4, bof: 1 } },
    { lieu: 'pacha', salle: 'Main Room', dj: 'Purple Disco Machine', debut: '02:30', fin: '04:30', tete: true },
    { lieu: 'pacha', salle: 'Main Room', dj: 'Gerd Janson', debut: '04:30', fin: '06:00' },

    { lieu: 'akasha', salle: 'Jardin de Las Dalias', dj: 'Maurizio Schmitz', note: 'warm-up', debut: '17:00', fin: '19:30' },
    { lieu: 'akasha', salle: 'Jardin de Las Dalias', dj: 'Sven Väth', note: 'garden set', debut: '19:30', fin: '23:00', tete: true, constate: '19:45', confirmations: 7 },
    { lieu: 'akasha', salle: 'Akasha', dj: 'Sven Väth', note: 'club set', debut: '23:00', fin: '06:00', tete: true, constate: '23:15', confirmations: 8 },

    { lieu: '528', salle: 'Garden Stage', dj: 'Dave Seaman', debut: '17:00', fin: '19:30' },
    { lieu: '528', salle: 'Garden Stage', dj: 'Patrice Bäumel', debut: '19:30', fin: '23:00' },
    { lieu: '528', salle: 'Club', dj: 'James Zabiela', debut: '23:00', fin: '00:30', avis: { top: 5, bien: 2, bof: 1 } },
    { lieu: '528', salle: 'Club', dj: 'Guy J', debut: '00:30', fin: '02:00', constate: '00:45', confirmations: 3 },
    { lieu: '528', salle: 'Club', dj: 'Deep Dish', debut: '02:00', fin: '04:00', tete: true },

    { lieu: 'chinois', salle: 'Club', dj: 'Andrea Lane', debut: '23:30', fin: '00:30', avis: { top: 1, bien: 2, bof: 4 } },
    { lieu: 'chinois', salle: 'Club', dj: 'Monki', debut: '00:30', fin: '01:30', avis: { top: 6, bien: 2, bof: 1 } },
    { lieu: 'chinois', salle: 'Club', dj: 'Low Steppa', debut: '01:30', fin: '02:30', confirmations: 1, avis: { top: 7, bien: 2, bof: 1 } },
    { lieu: 'chinois', salle: 'Club', dj: 'Hannah Wants', debut: '02:30', fin: '04:00' },
    { lieu: 'chinois', salle: 'Club', dj: 'Sam Divine', debut: '04:00', fin: '06:30', tete: true },

    { lieu: 'lio', salle: 'Club', dj: 'Nomis', debut: '23:45', fin: '05:00', tete: true, confirmations: 2 },

    { lieu: 'espardis', salle: 'Club', dj: 'DJ non annoncé', debut: '23:59', fin: '06:00', inconnu: true },

    { lieu: 'borabora', salle: 'Plage', dj: 'Javi Torres', debut: '18:00', fin: '21:00' },
    { lieu: 'borabora', salle: 'Plage', dj: 'Claudia León', debut: '21:00', fin: '00:00' },
    { lieu: 'borabora', salle: 'Plage', dj: 'Aaron Sevilla feat. Alba Dreid', debut: '00:00', fin: '03:00', tete: true, constate: '00:20', confirmations: 3 },

    { lieu: 'destino', salle: 'Piscine', dj: 'Mason Collective', debut: '17:00', fin: '18:30' },
    { lieu: 'destino', salle: 'Piscine', dj: 'Ilario Alicante', debut: '18:30', fin: '20:00' },
    { lieu: 'destino', salle: 'Piscine', dj: 'Franky Rizardo', debut: '20:00', fin: '21:30' },
    { lieu: 'destino', salle: 'Piscine', dj: 'Marco Carola', debut: '21:30', fin: '23:00', tete: true, constate: '21:40', confirmations: 6, avis: { top: 11, bien: 2, bof: 0 } },

    { lieu: 'obeach', salle: 'Piscine', dj: 'Majestic', debut: '13:00', fin: '15:00' },
    { lieu: 'obeach', salle: 'Piscine', dj: 'Cameo', debut: '15:00', fin: '16:30' },
    { lieu: 'obeach', salle: 'Piscine', dj: 'Lucy Jane', debut: '16:30', fin: '18:00', avis: { top: 2, bien: 5, bof: 1 } },
    { lieu: 'obeach', salle: 'Piscine', dj: 'Bo Conquest', debut: '18:00', fin: '20:00' },
    { lieu: 'obeach', salle: 'Piscine', dj: 'Beyond Chicago', debut: '20:00', fin: '22:00' },

    { lieu: 'mambo', salle: 'Terrasse', dj: 'DJ non annoncé', debut: '19:00', fin: '01:00', inconnu: true },
    { lieu: 'cafedelmar', salle: 'Terrasse', dj: 'DJ non annoncé', debut: '19:00', fin: '21:30', inconnu: true },
    { lieu: 'bluemarlin', salle: 'Plage', dj: 'Programme non publié', debut: '12:00', fin: '00:00', inconnu: true }
  ]
};
