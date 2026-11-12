# Première collecte espagnole — 12 novembre 2026

114 annonces futures, avec 111 liens de visuels officiels. La collecte se compose de 24 fiches Shotgun, 43 soirées de la catégorie Clubs de Sala Apolo (16 pages d’agenda consultées), 33 fiches Club de l’agenda publié de Razzmatazz, 11 dates concrètes de Clubhouse Karaoke et 3 dates de karaoké d’Ovella Negra Marina. Les artistes annoncés sont repris depuis les fiches structurées ou les titres explicites ; aucune présence effective de DJ n’est déduite d’une simple ouverture d’établissement.

La couverture est partielle : principalement Barcelone, puis Madrid, Valence, Alicante, Ferrol, Vigo et Saint-Jacques-de-Compostelle. Elle ne constitue pas un inventaire exhaustif de l’Espagne ou des réseaux sociaux. Les profils Facebook, Instagram, X/Twitter et TikTok trouvés dans les pages officielles sont conservés, lorsqu’ils existent, dans `data/radar-venues-spain.json` et dans la provenance des fiches. Leur référencement ne signifie pas que toutes leurs publications ou stories ont été récupérées. Les recherches Web de publications sociales n’ont pas fourni de résultats datés suffisants à intégrer séparément.

## Vérifications

- Les événements explicitement annulés, passés ou sans coordonnées exploitables sont exclus. Une fiche « The Wood » annulée est conservée dans la liste à vérifier, pas dans les soirées.
- Les images sont des affiches, artworks ou visuels publiés sur les fiches officielles. Pour Apolo, l’artwork de l’événement est préféré à la photographie d’artiste lorsqu’il est fourni. Trois soirées Ovella ne fournissent pas d’image ; aucun flyer inventé ne les remplace dans les données.
- Les coordonnées des établissements barcelonais ont été vérifiées par nom et adresse via Nominatim : Sala Apolo, Razzmatazz, L’Ovella Negra Marina et The Comedy Clubhouse au 6 Via Laietana. Géocodage © OpenStreetMap contributors, ODbL : https://www.openstreetmap.org/copyright . Les autres positions sont celles des fiches de l’organisateur.
- Les horaires Shotgun sont convertis dans le fuseau du lieu (Europe/Madrid ; Atlantic/Canary si nécessaire). Les nuits Razzmatazz gardent la date de soirée publiée dans l’URL et affichent l’ouverture après minuit dans une note distincte. Un horaire de début artificiel n’est pas utilisé pour ces nuits.

## Intégration

`data/radar-spain.json` est chargé par `scripts/radar.mjs`, aux côtés des données françaises et belges. Le pays `ES` est conservé sur le lieu, séparément du référentiel des 101 départements français. `countryCoverage.ES` donne le nombre de dates espagnoles publiées.

Les résultats reposent sur les coordonnées et le rayon de 10 à 1 000 km, sans filtre implicite sur le pays du profil. La carte et le Check-in gardent leur comportement « soirées du jour », avec ou sans DJ. L’agenda conserve les prochaines dates. Le filtre facultatif de départements français n’est pas nécessaire pour découvrir l’Espagne.

## Refaire l’import

Le script `scripts/import-spain.py` accepte le dossier des extractions publiques JSON/HTML : `shotgun-events.json`, `official-events.json` et leurs pages HTML, `coordinates.json`, `initial.json`, `bar-events.json`. Il n’utilise aucune clé API ou prestation payante. Les données publiées sont conservées dans le dépôt ; les captures de recherche intermédiaires ne sont pas nécessaires à l’exécution du site. Exécuter ensuite `node scripts/radar.mjs`, `node --test tests/radar.test.mjs` et `node --check app.js`.
