"""Import des fiches structurées publiques belges Shotgun, sans service payant.
Usage : python scripts/import-belgium.py chemin/events.json
Les coordonnées manquantes sont isolées, jamais remplacées par un point inventé.
"""
import json,re,sys,hashlib
from pathlib import Path
from datetime import datetime,timezone
from zoneinfo import ZoneInfo
ROOT=Path(__file__).resolve().parents[1]
def convert(e,checked,today):
 loc=e.get('location') or {};a=loc.get('address') or {};geo=loc.get('geo') or {}
 if a.get('addressCountry')!='BE' or not geo or not loc.get('name') or 'Scheduled' not in e.get('eventStatus',''):return None
 try:start=datetime.fromisoformat(e['startDate'].replace('Z','+00:00')).astimezone(ZoneInfo('Europe/Brussels'));lat=float(geo['latitude']);lng=float(geo['longitude'])
 except (KeyError,ValueError,TypeError):return None
 if start.date().isoformat()<today or not (49.4<lat<51.6 and 2.4<lng<6.5):return None
 title=e['name'];description=e.get('description','');venue=loc['name'];electronic=bool(re.search(r'\bdj\b|techno|house|rave|clubbing|drum.{0,5}bass',title+' '+description,re.I))
 typ='bar' if re.search(r'bar|beer|caf[eé]',venue,re.I) else 'club' if electronic else 'concert' if re.search(r'concert|live band|rock|metal',description,re.I) else 'soiree'
 prices=[float(o['price']) for o in e.get('offers',[]) if o.get('price') is not None and o.get('availability','').endswith('InStock') and o.get('priceCurrency')=='EUR']
 return dict(id=e['url'].split('/')[-1],src='shotgun',country='BE',dep='BE',nom=title,date=start.date().isoformat(),heure=start.strftime('%H:%M'),lieu=venue,ville=a.get('addressLocality',''),lat=lat,lng=lng,type=typ,lineup=[p['name'] for p in e.get('performer',[]) if p.get('name')],djSet=electronic,genres='',prix=('Dès '+format(min(prices),'.2f').replace('.',',')+' €') if prices else '',url=e['url'],ticketUrl=e['url'],flyerUrl=e.get('image',''),verifiedAt=checked,evidence='Fiche publique Shotgun ; date future et coordonnées publiées ; heure locale Europe/Brussels. La présence effective sur place reste à confirmer.',sourceName='Shotgun / '+e.get('organizer',{}).get('name','organisateur'),sourceRecordUrl=e['url'],organizerUrl=e.get('organizer',{}).get('url',''))
if __name__=='__main__':
 now=datetime.now(timezone.utc);events=[];unresolved=[]
 for e in json.loads(Path(sys.argv[1]).read_text()):
  row=convert(e,now.isoformat(),now.astimezone(ZoneInfo('Europe/Brussels')).date().isoformat())
  if row:events.append(row)
  else:unresolved.append(dict(nom=e.get('name'),url=e.get('url'),reason='Date, lieu ou coordonnées non exploitables : à vérifier avant intégration.'))
 data=dict(updatedAt=now.isoformat(),country='BE',exhaustive=False,note='Première collecte belge, sans frontière dans le calcul du rayon. Les publications privées et tous les réseaux sociaux ne sont pas couverts.',sources=[dict(id='shotgun',homepage='https://shotgun.live')],events=events,unresolved=unresolved)
 (ROOT/'data/radar-belgium.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 print(len(events),'soirées belges avec',sum(bool(e['flyerUrl']) for e in events),'flyers ;',len(unresolved),'fiches à vérifier')
