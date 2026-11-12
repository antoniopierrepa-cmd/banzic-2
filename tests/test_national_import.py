import importlib.util, unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('importer',Path(__file__).resolve().parents[1]/'scripts/import-datatourisme.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class NationalImport(unittest.TestCase):
 def test_nightlife_selection(self):
  for title in ['Soirée karaoké','Blind test au bar','Bal dansant','Afterwork','Soirée années 80']:
   self.assertTrue(m.eligible(title,''),title)
  for title in ['Théâtre : Le bal des escargots','Soirée pyjama à la bibliothèque','Réveillon les livres','Soirée conférence','Soirée annulée']:
   self.assertFalse(m.eligible(title,''),title)
 def test_no_invented_daily_events(self):
  m.DEPS={'83'}
  row=dict(Nom_du_POI='Soirée dansante',Description='',Code_postal_et_commune='83000#Toulon',Adresse_postale='Salle des fêtes',Latitude='43.12',Longitude='5.93',Contacts_du_POI='',URI_ID_du_POI='https://example.org/event',Createur_de_la_donnee='Office',Date_de_mise_a_jour='2026-11-10',Periodes_regroupees='2026-11-13<->2026-12-31')
  self.assertEqual(m.convert(row,'2026-11-12','2026-11-12T00:00:00Z'),[])
  row['Periodes_regroupees']='2026-11-13<->2026-11-13|2026-11-14<->2026-11-14'
  events=m.convert(row,'2026-11-12','2026-11-12T00:00:00Z');self.assertEqual(len(events),2);self.assertEqual(events[0]['heure'],'');self.assertEqual(events[0]['flyerUrl'],'')
if __name__=='__main__':unittest.main()
