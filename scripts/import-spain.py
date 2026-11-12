"""Import espagnol gratuit depuis des fiches publiques conservées en JSON/HTML.
Usage: python scripts/import-spain.py /chemin/spain-research
Les dates publiées ne sont jamais remplacées par les horaires d'ouverture.
"""
import json,re,sys,hashlib,html
from pathlib import Path
from datetime import datetime,timezone
from zoneinfo import ZoneInfo
ROOT=Path(__file__).resolve().parents[1]
def text(s):return html.unescape(re.sub('<[^>]+>',' ',str(s or ''))).strip()
def walk(x):
 if isinstance(x,list):
  for a in x:yield from walk(a)
 elif isinstance(x,dict):
  if x.get('@type') in ['Event','MusicEvent']:yield x
  for k in ['@graph','itemListElement']:yield from walk(x.get(k,[]))
def event(e,src,checked,today,geo=None,venue=None,locality=None,countryRequired=False):
 name=text(e.get('name'));loc=e.get('location') or {};addr=loc.get('address') or {};coords=geo or loc.get('geo') or {}
 if re.search(r'cancel|annul',name,re.I) or ('eventStatus' in e and not e['eventStatus'].endswith('EventScheduled')):return None
 if countryRequired and addr.get('addressCountry') not in ['ES','Spain','España']:return None
 raw=e.get('startDate','');m=re.search(r'(\d{4}-\d{2}-\d{2}).*?(\d{2}:\d{2})',raw)
 if not m:return None
 if src=='shotgun':
  try:
   dt=datetime.fromisoformat(raw.replace('Z','+00:00'));tz='Atlantic/Canary' if float(coords.get('longitude',0)) < -13 else 'Europe/Madrid';dt=dt.astimezone(ZoneInfo(tz));date=dt.date().isoformat();hour=dt.strftime('%H:%M')
  except (ValueError,TypeError):return None
 else:date,hour=m.groups()
 if date<today:return None
 try:lat,lng=float(coords['latitude']),float(coords['longitude'])
 except (KeyError,ValueError,TypeError):return None
 if not (27<lat<44 and -19<lng<5):return None
 url=e.get('url','');url=url[0] if isinstance(url,list) else url
 if not url.startswith('https://'):return None
 description=text(e.get('description',''));electronic=bool(re.search(r'\bdj\b|techno|house|rave|Nitsa|Astin',name+' '+description,re.I));lineup=[]
 for p in e.get('performer',[]) if isinstance(e.get('performer'),list) else []:
  if isinstance(p,dict) and p.get('name'):lineup.append(text(p['name']))
 typ='bar' if re.search('bar|pub|caf[eé]',venue or loc.get('name',''),re.I) else 'club' if electronic else 'concert' if re.search('concierto|concert|rock|jazz|middea',name+' '+description,re.I) else 'soiree'
 if src=='apolo':
  typ='club';electronic=bool(re.search(r'Nitsa|Astin|\bDJ',name,re.I))
  if electronic and ':' in name:
   artists=name.split(':',1)[1].split('|')[-1];lineup=[re.sub(r'\s+all night long','',a,flags=re.I).strip() for a in artists.split(' + ')]
 offers=e.get('offers',[]);offers=offers if isinstance(offers,list) else [offers]
 prices=[]
 for o in offers:
  try:
   if isinstance(o,dict) and o.get('priceCurrency')=='EUR' and 'InStock' in o.get('availability',''):prices.append(float(o['price']))
  except (ValueError,TypeError):pass
 image=e.get('image','');image=image[0] if isinstance(image,list) and image else image;image=image.get('url','') if isinstance(image,dict) else image
 organizer=e.get('organizer') or {};organizer=organizer[0] if isinstance(organizer,list) and organizer else organizer
 return dict(id=hashlib.sha256((url+'|'+date).encode()).hexdigest()[:24],src=src,country='ES',dep='ES',nom=name,date=date,heure=hour,lieu=venue or text(loc.get('name')),ville=locality or text(addr.get('addressLocality')),lat=lat,lng=lng,type=typ,lineup=lineup,djSet=electronic,genres='',prix=('Gratuit' if min(prices)==0 else 'Dès '+format(min(prices),'.2f').replace('.',',')+' €') if prices else '',url=url,ticketUrl=url if src=='shotgun' else '',flyerUrl=image if isinstance(image,str) and image.startswith('https://') else '',verifiedAt=checked,evidence='Date et lieu publiés sur la fiche officielle. Horaire local, sans extrapolation à partir de la fréquence habituelle.',sourceName='Shotgun / '+text(organizer.get('name')) if src=='shotgun' else {'apolo':'Sala Apolo','razzmatazz':'Sala Razzmatazz','clubhouse':'The Comedy Clubhouse','ovella':'Ovella Negra Marina'}[src]+' · géocodage © OpenStreetMap contributors',sourceRecordUrl=url)
if __name__=='__main__':
 folder=Path(sys.argv[1]);now=datetime.now(timezone.utc);checked=now.isoformat();today=now.astimezone(ZoneInfo('Europe/Madrid')).date().isoformat();events=[];unresolved=[];socials=[]
 for e in json.loads((folder/'shotgun-events.json').read_text()):
  row=event(e,'shotgun',checked,today,countryRequired=True)
  if row:events.append(row)
  else:unresolved.append(dict(nom=text(e.get('name')),url=e.get('url'),reason='Date, annulation ou coordonnées à vérifier.'))
 coords=json.loads((folder/'coordinates.json').read_text())
 def geofor(k):
  matches=coords.get(k,[]);place=next((m for m in matches if m.get('type') in ['nightclub','pub','bar']),matches[0] if matches else None)
  return dict(latitude=place['lat'],longitude=place['lon']) if place else {}
 for o in json.loads((folder/'official-events.json').read_text()):
  socials.append(dict(sourceUrl=o['url'],urls=o.get('socialUrls',[])))
  if o['kind']=='apolo':
   for e in walk(o.get('jsonld',[])):
    e['url']=o['url'];raw=(folder/'details'/('official-'+hashlib.sha256(o['url'].encode()).hexdigest()[:16]+'.html')).read_text();artwork=re.search(r'<img[^>]+src="([^"]*/uploads/media/artwork/[^"]+)"',raw)
    if artwork:e['image']='https://www.sala-apolo.com'+artwork[1] if artwork[1].startswith('/') else artwork[1]
    row=event(e,'apolo',checked,today,geofor('apolo'),'Sala Apolo — '+text((e.get('location',{}).get('containsPlace') or {}).get('name','Salle')),'Barcelona')
    if row:events.append(row)
  else:
   raw=(folder/'details'/('official-'+hashlib.sha256(o['url'].encode()).hexdigest()[:16]+'.html')).read_text();m=re.search(r'/(\d{2})-(\d{2})-(\d{4})-',o['url'])
   if not m or not o.get('title'):continue
   date=f'{m[3]}-{m[2]}-{m[1]}'
   if date<today or re.search('cancel',o['title'],re.I):continue
   img=re.search(r'property="og:image" content="([^"]+)"',raw);e=dict(name=o['title'],startDate=date+' 23:59',url=o['url'],image=html.unescape(img[1]) if img else '')
   row=event(e,'razzmatazz',checked,today,geofor('razz'),'Sala Razzmatazz','Barcelona')
   if row:
    row['heure']='';row['type']='club';row['djSet']=bool(re.search(r'\bdj\b',o['title'],re.I));h=re.search(r'Obertura de portes</span><span[^>]*>(\d{1,2}:\d{2}) H',raw)
    if h:row['scheduleNote']='Ouverture '+h[1].replace(':','h')+' · nuit suivant le '+m[1]+'/'+m[2]
    events.append(row)
 initial=json.loads((folder/'initial.json').read_text())
 for page in initial:
  if page['i']!=7:continue
  for e in walk(page.get('jsonld',[])):
   if 'Fringe' in e.get('name',''):continue
   row=event(e,'clubhouse',checked,today,geofor('clubhouse'),'The Comedy Clubhouse — Laietana','Barcelona')
   if row:row['type']='bar';row['djSet']=False;events.append(row)
 for e in json.loads((folder/'bar-events.json').read_text()):
  if 'karaoke' not in e.get('name','').lower():continue
  row=event(e,'ovella',checked,today,geofor('ovella'),'Ovella Negra Marina','Barcelona')
  if row:row['type']='bar';row['djSet']=False;events.append(row)
 sources=[dict(id=k,homepage=u) for k,u in [('shotgun','https://shotgun.live'),('apolo','https://www.sala-apolo.com'),('razzmatazz','https://www.salarazzmatazz.com'),('clubhouse','https://thecomedyclubhouse.es'),('ovella','https://ovellanegramarina.com')]]
 unique={e['id']:e for e in events};events=list(unique.values());data=dict(updatedAt=checked,country='ES',exhaustive=False,note='Première collecte espagnole. Sources publiques vérifiées ; les comptes sociaux identifiés ne signifient pas que leurs publications ont toutes été collectées.',sources=sources,events=events,unresolved=unresolved,socialSources=socials)
 (ROOT/'data/radar-spain.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');print(len(events),'annonces ;',sum(bool(e['flyerUrl']) for e in events),'visuels officiels ;',len(unresolved),'fiches écartées')
