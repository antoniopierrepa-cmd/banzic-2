# Collecte nationale BANZIC

Première collecte du 12 novembre 2026 : 1 958 dates publiées dans 84 départements, gratuite, sans clé API ni prestataire payant. La liste des 101 départements et l’état réel des résultats sont dans `data/radar-coverage.json`. La couverture reste partielle : aucun résultat ne signifie pas aucune soirée.

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

## Consolidation sur la branche de test

Le générateur reste `node scripts/radar.mjs`. Il charge les annonces nationales,
les compléments Shotgun et Xceed, les fichiers pays, le complément OpenAgenda
prioritaire et, lorsqu'il existe, le fichier des annonces validées issues des
sites officiels. Chaque source produit le même format `{ sources, events }`.
Le pays et le département sont traités séparément. La couverture de l'exécution
figure dans `agenda-radar.js` (champs `maj`, `coverage`, `countryCoverage`).
`data/radar-coverage.json` documente la collecte historique de novembre.

### Départements prioritaires

Exécuter `python scripts/radar-openagenda-priorites.py`, puis
`node scripts/radar.mjs`. Le collecteur interroge les départements sans annonce
dans le dernier radar livré et continue de suivre ceux déjà interrogés. Il
sépare la réponse réussie, même vide, de l'erreur de collecte. En cas d'erreur,
les dernières annonces de ce département sont conservées jusqu'à expiration.
Le diagnostic est conservé dans `data/radar-openagenda-priorites.json`.
Le périmètre est celui du jeu public OpenAgenda et des recherches par titre,
avec le département tel qu'indexé par le diffuseur.

### Sites officiels et revue

`node scripts/radar-local-hyeres.mjs` écrit les événements JSON-LD des prochaines
72 heures dans `data/radar-review/hyeres-candidates.json`. L'artefact GitHub
existant conserve ce chemin. Une candidature n'alimente pas l'agenda.
Après vérification humaine de la page et du créneau, préparer
`data/radar-sites-valides.json` au format `{ sources, events }`, avec une source
par site et une annonce normalisée par créneau. Chaque ligne doit porter
`reviewRequired: false`, une date de vérification `verifiedAt`, une note
`evidence`, un lien HTTPS et des coordonnées confirmées. Le générateur applique
ensuite les mêmes validations qu'aux autres sources.

### Rapprochement et intégrations

Le générateur et l'application chargent `lib/agenda-match.js`. Deux annonces
doivent être du même jour, partager un titre normalisé suffisamment identifiable
et avoir des lieux proches. Des heures de début explicites différentes empêchent
le rapprochement. Les champs disponibles complètent la fiche déjà présente,
le line-up est fusionné et les sources sont conservées dans `provenance`.
Le navigateur recalcule les compléments Supabase à chaque lecture pour éviter
de conserver une contribution distante retirée. Il garde l'identité de la fiche
locale ou radar lors d'un rapprochement.

Supabase reste une source lue par le navigateur. Le générateur et le collecteur
de sites n'y écrivent rien. La tâche ChatGPT reste externe au dépôt. Aucun
connecteur n8n ni point d'exécution d'agent IA n'a été identifié dans la branche.
