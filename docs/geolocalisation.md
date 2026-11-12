# Découverte locale et voyage — 12 novembre 2026

La banque de données garde les annonces de chaque pays indépendamment de la position du visiteur. La découverte locale les filtre par distance, sans frontière : 100 km par défaut et au maximum, avec la possibilité de réduire à 10 km. L’agenda utilise 10, 50 et 100 km ; le Check-in des pas de 10 km. La carte utilise désormais la zone visible, sans limite de rayon. Les anciennes préférences de 200, 500 ou 1 000 km sont ramenées à 100 km.

Le GPS réel est le centre par défaut. Une ville choisie pour préparer un voyage devient prioritaire pour l’agenda, la carte et le Check-in. Le GPS conservé reste celui de la personne, pour la confirmation de présence sur place. Le bouton GPS revient à la position réelle. Une réponse GPS asynchrone ne doit pas effacer une ville choisie entre-temps. Sans GPS, la zone de repli est signalée comme approximative.

Le filtre facultatif de département s’applique à l’intérieur du rayon ; les suggestions de festivals lointains ont été retirées de l’agenda local. La carte et le Check-in restent limités aux soirées du jour et aux signalements actifs, avec ou sans DJ.

La recherche conserve le catalogue local de villes et propose un bouton explicite de recherche mondiale. Photon/Komoot fournit les coordonnées depuis OpenStreetMap, sans clé payante et sans transmission du GPS. Les résultats précisent pays et région pour distinguer les homonymes. Ils sont mis en cache pendant la session ; aucune requête par frappe. Le serveur public est prévu pour un usage modéré et ne garantit pas la disponibilité : https://github.com/komoot/photon . Pour une audience importante, prévoir un service Photon dédié ou équivalent. Données © OpenStreetMap contributors, ODbL : https://www.openstreetmap.org/copyright .

Une ville trouvée ne signifie pas que toutes ses soirées sont déjà collectées : la couverture événementielle reste partielle selon les pays.

## Carte libre

La carte ne comporte plus de curseur ni de cercle de rayon. Elle démarre sur le GPS ou la ville de voyage choisie, puis chaque zoom ou déplacement recharge les repères et le bandeau des soirées du jour dans les limites visibles. Une soirée à plus de 100 km apparaît si elle entre dans la vue. Les événements futurs restent dans l’agenda. Le filtre de l’agenda et le rayon du Check-in ne limitent pas la carte.
