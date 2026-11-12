# Première collecte belge — 12 novembre 2026

64 annonces futures avec 64 liens de visuels officiels : 62 fiches publiques Shotgun à partir de toutes les pages disponibles de Bruxelles et Liège, et 2 soirées du restaurant Ciao Bella à Charleroi (Live Music le 13 novembre et Karaoké / Blind test le 11 décembre). Les horaires sont conservés en heure locale Europe/Brussels. Une fiche sans coordonnées est isolée dans `unresolved`.

La collecte est partielle. Elle ne représente ni tous les établissements de Belgique ni toutes les publications des réseaux sociaux. Le fichier `data/radar-venues-belgium.json` contient 37 lieux avec programmation future et des sources complémentaires : Fuse, Kompass, Ampere, Le Maquis. Les comptes Facebook, Instagram et TikTok proviennent des sites officiels ; leur référencement ne signifie pas que toutes leurs publications ont été collectées. Les pages privées ne sont pas utilisées.

## Géographie

Les annonces belges ont `country: BE`. Elles ne sont pas des départements français. Le calcul porte sur les coordonnées GPS et le rayon de 10 à 100 km, sans frontière ni filtre implicite sur le pays du profil. L’agenda conserve son filtre français facultatif, appliqué à l’intérieur du rayon GPS ; la distance décide toujours. La carte et le Check-in ne montrent que les soirées du jour et les signalements actifs, y compris sans DJ. Les filtres de prochaines sorties restent indépendants de la carte.

Les deux adresses Ciao Bella sont placées approximativement au niveau de la route de Philippeville à Charleroi, car le numéro 221 n’a pas été résolu. Elles portent `positionApproximate: true`, affiché dans l’agenda. Géocodage © OpenStreetMap contributors, ODbL : https://www.openstreetmap.org/copyright . Les autres positions proviennent des fiches de l’organisateur ; vérifier le lieu exact sur la source avant de se déplacer.

## Données

Le générateur lit `data/radar-events.json` et `data/radar-belgium.json`, conserve les crédits, les liens et les images, puis déduplique les annonces. `coverage` compte toujours les 101 départements français ; `countryCoverage` compte séparément France et Belgique. Aucun abonnement de collecte n’est ajouté, aucune tâche hebdomadaire supplémentaire n’est activée.

Le script `scripts/import-belgium.py` accepte un fichier JSON contenant les événements JSON-LD publics des fiches Shotgun. Les compléments éditoriaux, notamment Ciao Bella, doivent être conservés ou réappliqués lors d’un nouvel import. Ne jamais transformer des horaires d’ouverture en soirées datées.
