# Collecte nationale BANZIC

Première collecte du 12 novembre 2026 : 1 962 dates publiées dans 84 départements, gratuite, sans clé API ni prestataire payant. La liste des 101 départements et l’état réel des résultats sont dans `data/radar-coverage.json`. La couverture reste partielle : aucun résultat ne signifie pas aucune soirée.

## Sources

- DATAtourisme / ADN Tourisme : export officiel « datatourisme-fma.csv », ressource du 10 novembre 2026 sur https://www.data.gouv.fr/datasets/datatourisme-la-plateforme-nationale-des-donnees-touristiques . Licence Ouverte 2.0. Le producteur et sa date de mise à jour sont conservés et affichés sur chaque fiche.
- OpenAgenda : sélection du jeu public https://public.opendatasoft.com/explore/dataset/evenements-publics-openagenda/ . La licence annoncée par le diffuseur est Licence Ouverte v1.0 ; agenda d’origine et date de mise à jour conservés. Les images et coordonnées privées des contributeurs ne sont pas importées.
- Les annonces du Var et leurs flyers déjà validés sont conservés.
- Complément Shotgun : pages publiques des événements de La Réunion et de Poupée à Bastia, dates futures, coordonnées publiées et liens des flyers officiels. Une contradiction horaire constatée sur « 7 Somin Lapokalips » laisse le champ horaire vide. Aucun horaire n’est déduit de la seule ouverture du lieu.

## Sélection

Soirées festives, bars/restaurants avec animation, afterworks, bals, karaokés, blind tests et événements musicaux, sans exiger de DJ. Exclusion des activités hors sujet (conférences, lectures, jeux, théâtre…) et des annonces explicitement annulées. Une annonce constitue une information de programmation, pas une vérification sur place du maintien de la soirée ou de l’ouverture permanente du lieu.

Le CSV simplifié ne fournit pas les horaires ou les flyers : ces champs restent vides. Seules les dates ponctuelles `début = fin` sont importées. Une plage de dates ne devient jamais une soirée tous les jours. OpenAgenda fournit des créneaux explicites : chacun conserve sa date et son heure locale. Aucun artiste n’est inventé ; le filtre DJ repose sur une mention explicite. Les événements de toutes les catégories restent visibles dans « Tout ».

## Refaire la collecte

Télécharger l’export CSV officiel à jour, puis exécuter depuis la racine :

```
python scripts/import-datatourisme.py /chemin/datatourisme-fma.csv
python scripts/import-openagenda.py /chemin/selection-openagenda.json
node scripts/radar.mjs
python -m unittest discover -s tests -p 'test_*.py'
node --test tests/radar.test.mjs
```

Le second fichier est une liste d’objets publics OpenAgenda (`results` du point d’accès `/api/explore/v2.1/catalog/datasets/evenements-publics-openagenda/records`). La sélection initiale porte sur les événements dont `lastdate_begin >= 2026-11-12` et dont le titre contient soirée, DJ, karaoké, blind test, afterwork, bal ou réveillon, toutes les pages incluses. Chaque import remplace uniquement les données de sa propre source. Le générateur filtre les dates expirées et déduplique les annonces. La collecte et la publication ne sont pas programmées automatiquement par ces scripts.

## Suite du répertoire manuel

Les pages Instagram/Facebook ne sont pas toutes couvertes par les jeux nationaux. Le répertoire `data/radar-venues.json` garde les établissements identifiés et les anciennes pistes à vérifier dans des listes séparées. Compléter le répertoire, notamment les départements sans résultat, puis le contrôle hebdomadaire des calendriers publics ; ne pas annoncer une couverture exhaustive ni un accès aux contenus privés.
