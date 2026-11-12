"""Import gratuit du CSV officiel DATAtourisme, sans clé ni dates inventées.
Usage: python scripts/import-datatourisme.py /chemin/datatourisme-fma.csv
Le fichier national est disponible sur la page du jeu de données data.gouv.fr.
"""
import csv, json, re, sys, unicodedata, hashlib
from datetime import date, datetime, timezone
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
DATASET = 'https://www.data.gouv.fr/datasets/datatourisme-la-plateforme-nationale-des-donnees-touristiques'
LICENSE = 'https://www.etalab.gouv.fr/licence-ouverte-open-licence/'
def plain(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c) != 'Mn')
def eligible(title, description):
    t, d = plain(title), plain(description)
    if re.search(r'annul|reporte|theatre|bibliotheque|mediatheque|lecture|projection|cinema|conference|conte\b|livres?\b|spectacle jeune|sapin|atelier|pyjama|debat|loto|belote|tarot|jeux de societe|mantras|yoga|astronomie', t): return False
    direct = r'\bdj\b|discotheque|clubbing|dancefloor|dansant|karaoke|blind.?test|after.?work|\bbal\b|reveillon|saint.?sylvestre|roller disco'
    if re.search(direct, t): return True
    if not re.search(r'soiree|apero', t): return False
    if re.search(r'conference|mediatheque|bibliotheque|lecture|cinema|projection|theatre|pyjama|mantras|astronomie|debat|yoga|loto|belote|tarot|jeux de societe', t): return False
    return bool(re.search(r'dans|\bdj\b|musiqu|concert|festiv|karaoke|blind.?test|cabaret|bistrot|restaurant|auberge|beaujolais|annees (80|90)|disco|techno|house|rock|\bbar\b', t+' '+d))
def dep(postal):
    if not re.fullmatch(r'\d{5}', postal): return ''
    if postal.startswith('20'): return '2B' if postal.startswith(('202','206')) else '2A'
    return postal[:3] if postal.startswith('97') else postal[:2]
def convert(row, today, checked):
    if not eligible(row['Nom_du_POI'], row['Description']): return []
    postcode, _, city = row['Code_postal_et_commune'].partition('#')
    department = dep(postcode)
    if department not in DEPS or not row['Adresse_postale'].strip(): return []
    try: lat, lng = float(row['Latitude']), float(row['Longitude'])
    except (ValueError, TypeError): return []
    if not -90 <= lat <=90 or not -180<=lng<=180 or (lat==0 and lng==0): return []
    contacts = row['Contacts_du_POI'].split('|')
    urls = re.findall(r'https://[^\s|#<>]+', row['Contacts_du_POI'])
    url = urls[0] if urls else row['URI_ID_du_POI']
    title = row['Nom_du_POI'].strip()
    # CSV simplifié : pas d'horaire précis ni d'affiche. Aucun horaire déduit du texte.
    event_type = 'concert' if re.search(r'concert',plain(title)) else 'festival' if re.search(r'festival',plain(title)) else 'restaurant' if re.search(r'restaurant|auberge|diner dansant',plain(title)) else 'soiree'
    result=[]
    for begin,end in re.findall(r'(\d{4}-\d{2}-\d{2})<->(\d{4}-\d{2}-\d{2})',row['Periodes_regroupees']):
        # Une plage de dates n'est pas une liste de soirées quotidiennes.
        if begin!=end or begin<today: continue
        try: date.fromisoformat(begin)
        except ValueError: continue
        identity=hashlib.sha256((row['URI_ID_du_POI']+'|'+begin).encode()).hexdigest()[:24]
        result.append(dict(id=identity,src='datatourisme',nom=title,date=begin,heure='',lieu=row['Adresse_postale'].strip(),ville=city,dep=department,lat=lat,lng=lng,type=event_type,lineup=[],djSet=bool(re.search(r'\bdj\b',plain(title+' '+row['Description']))),genres='',prix='',url=url,ticketUrl='',flyerUrl='',verifiedAt=checked,evidence='Annonce du CSV officiel DATAtourisme ; date ponctuelle explicite ; horaire et affiche non fournis.',sourceName=row['Createur_de_la_donnee'],sourceUpdatedAt=row['Date_de_mise_a_jour'],sourceLicense=LICENSE,sourceRecordUrl=row['URI_ID_du_POI']))
    return result
if __name__=='__main__':
    data=json.loads((ROOT/'data/radar-events.json').read_text())
    # Le référentiel comporte exactement les 101 départements, y compris ceux sans résultat.
    DEPS=set(re.findall(r'(?:^|\|)([0-9AB]{2,3}):', (ROOT/'scripts/radar.mjs').read_text().split('`')[1]))
    today=date.today().isoformat(); checked=datetime.now(timezone.utc).isoformat()
    counts={d:0 for d in DEPS}; examined={d:0 for d in DEPS}; events=[]
    with open(sys.argv[1],encoding='utf-8-sig',newline='') as f:
        for row in csv.DictReader(f):
            d=dep(row['Code_postal_et_commune'].split('#')[0])
            if d in examined: examined[d]+=1
            events.extend(convert(row,today,checked))
    data['sources']=[s for s in data['sources'] if s['id']!='datatourisme']+[dict(id='datatourisme',homepage=DATASET)]
    data['events']=[e for e in data['events'] if e['src']!='datatourisme']+events
    (ROOT/'data/radar-events.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    for e in events: counts[e['dep']]+=1
    report=dict(updatedAt=checked,scope='101 départements français',source=DATASET,license=LICENSE,exhaustive=False,note='Première collecte nationale. Les réseaux sociaux et tous les établissements ne sont pas encore répertoriés. Les périodes continues et horaires d’ouverture ne créent aucune soirée.',departments={d:dict(sourceRecordsExamined=examined[d],importedEvents=counts[d],status='annonces trouvées' if counts[d] else 'à compléter') for d in sorted(DEPS)})
    (ROOT/'data/radar-coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(len(events),'dates importées dans',sum(v>0 for v in counts.values()),'départements ;',sum(examined.values()),'annonces examinées')
