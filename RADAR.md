# Radar IA gratuit — BANZIC-2

Le site reste statique sur Vercel. Aucun appel à Apify, aucune API payante ni clé n’est nécessaire. La recherche est exécutée par une tâche ChatGPT séparée, soumise aux limites du compte ; ce dépôt ne contient pas de moteur IA autonome.

## Alimentation

Le radar recherche les annonces publiques, vérifie les pages officielles et ne conserve que des faits : titre, date, heure annoncée, lieu, artistes et lien vers la source/billetterie. Ne pas recopier les descriptions ni les affiches sans autorisation. Aucun DJ, prix ou horaire ne doit être inventé.

Les résultats vérifiés sont conservés dans `data/radar-events.json` :

```json
{"sources":[{"id":"organisateur","homepage":"https://organisateur.example"}],"events":[{"id":"soiree-1","src":"organisateur","nom":"Soirée house","date":"2027-01-10","heure":"22:00","lieu":"Nom du lieu","ville":"Hyères","dep":"83","lat":43.12,"lng":6.13,"lineup":["DJ annoncé"],"type":"club","genres":"House","url":"https://organisateur.example/soiree","ticketUrl":"","prix":"Sur place","verifiedAt":"2026-11-12T08:00:00Z","evidence":"Date, lieu et programmation confirmés sur la page officielle."}]}
```

Ces exemples sont fictifs et ne sont pas publiés. Une URL HTTPS, une date de vérification et une note de provenance sont obligatoires. Les coordonnées doivent correspondre au lieu exact ; sans coordonnées fiables, ne pas importer. Après toute mise à jour : `node scripts/radar.mjs`, puis `node --test tests/radar.test.mjs` et `node --check app.js`. Publier le JSON et `agenda-radar.js` dans le même commit. Le fichier navigateur ne contient aucun secret.

L’automatisation doit lire le dernier état du dépôt avant chaque écriture et utiliser un contrôle du SHA. Ne pas écraser un changement concurrent. Vérifier les annulations ; retirer les événements passés. En l’absence de nouveauté, conserver les données et la date de dernière collecte.

## Couverture

Les 101 départements sont sélectionnables, y compris la Corse et les cinq départements d’outre-mer. Une sélection de département ignore la limite de distance. Une couverture technique de 101 départements ne garantit pas des annonces partout ni l’exhaustivité. La tâche explore les départements par rotation pour une couverture hebdomadaire, avec priorité au Var.

La carte locale affiche jusqu’à 300 événements à venir dans le rayon de 10 à 1000 km. Un repère ouvre l’agenda du département. Les line-ups absents sont indiqués comme non communiqués. « Billets » ouvre le lien de billetterie ; « Infos » ouvre la page officielle pour les événements sans billetterie. Aucune affiliation n’est configurée.

## Vérification et mise en ligne

Les tests couvrent les 101 codes départementaux, le filtrage des dates/annulations, les coordonnées et liens invalides, les doublons et les line-ups absents. Vérifications navigateur effectuées avec des événements fictifs exclusivement dans la copie locale de prévisualisation : Toulon, La Réunion, boutons Billets/Infos, repère carte, navigation vers l’agenda et rayon 1000 km. Ces données ont été retirées après le test.

Le workflow GitHub effectue uniquement des contrôles en lecture ; il ne lance aucune collecte payante. La mise à jour réelle dépend de l’accès GitHub de la tâche ChatGPT et de sa capacité à terminer les recherches dans les limites disponibles. Une protection de branche peut nécessiter une proposition de modification plutôt qu’un commit direct. Le déploiement dépend de la liaison existante entre Vercel et `main`.
