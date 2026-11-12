"""Import gratuit OpenAgenda depuis un export JSON public, sans images ni contacts privés."""
import json,sys,re,importlib.util
from datetime import datetime,date,timezone
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('tourism',ROOT/'scripts/import-datatourisme.py');tourism=importlib.util.module_from_spec(spec);spec.loader.exec_module(tourism)
DEPS=dict(s.split(':') for s in (ROOT/'scripts/radar.mjs').read_text().split('`')[1].split('|'));BY_NAME={tourism.plain(v):k for k,v in DEPS.items()}
def convert(row,checked,today):
 title=row.get('title_fr') or '';description=row.get('longdescription_fr') or row.get('description_fr') or ''
 if not tourism.eligible(title,description):return []
 if row.get('location_countrycode') and row['location_countrycode'].upper()!='FR':return []
 status=json.loads(row.get('status') or '{}').get('label',{}).get('fr','')
 if re.search('annul|reporte',tourism.plain(status)):return []
 dep=BY_NAME.get(tourism.plain(row.get('location_department') or '')) or tourism.dep(row.get('location_postalcode') or '')
 coords=row.get('location_coordinates') or {};venue=row.get('location_name');url=row.get('canonicalurl') or ''
 if dep not in DEPS or not venue or not url.startswith('https://') or 'lat' not in coords or 'lon' not in coords:return []
 result=[]
 for t in json.loads(row.get('timings') or '[]'):
  try:start=datetime.fromisoformat(t.get('begin',''))
  except ValueError:continue
  if start.date().isoformat()<today:continue
  result.append(dict(id=str(row['uid'])+'-'+start.isoformat(),src='openagenda',nom=title,date=start.date().isoformat(),heure=start.strftime('%H:%M'),lieu=venue,ville=row.get('location_city') or '',dep=dep,lat=coords['lat'],lng=coords['lon'],type='concert' if 'concert' in tourism.plain(title) else 'festival' if 'festival' in tourism.plain(title) else 'soiree',lineup=[],djSet=bool(re.search(r'\bdj\b',tourism.plain(title+' '+description))),genres='',prix=row.get('conditions_fr') or '',url=url,ticketUrl='',flyerUrl='',verifiedAt=checked,evidence='Annonce publique OpenAgenda ; créneau explicite et horaire local publié. Images aux droits non vérifiés non reprises.',sourceName='OpenAgenda / '+(row.get('originagenda_title') or 'agenda public'),sourceUpdatedAt=row.get('updatedat') or '',sourceLicense='https://www.etalab.gouv.fr/wp-content/uploads/2014/05/Licence_Ouverte.pdf',sourceRecordUrl=url))
 return result
if __name__=='__main__':
 data=json.loads((ROOT/'data/radar-events.json').read_text());checked=datetime.now(timezone.utc).isoformat();today=date.today().isoformat();events=[];rows=json.loads(Path(sys.argv[1]).read_text())
 for row in rows:events.extend(convert(row,checked,today))
 data['sources']=[s for s in data['sources'] if s['id']!='openagenda']+[dict(id='openagenda',homepage='https://public.opendatasoft.com/explore/dataset/evenements-publics-openagenda/')]
 data['events']=[e for e in data['events'] if e['src']!='openagenda']+events
 (ROOT/'data/radar-events.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 coverage=json.loads((ROOT/'data/radar-coverage.json').read_text());coverage['additionalSources']=['https://public.opendatasoft.com/explore/dataset/evenements-publics-openagenda/'];coverage['openAgendaRecordsExamined']=len(rows)
 for d in coverage['departments']:
  count=sum(e['dep']==d for e in events);coverage['departments'][d]['openAgendaImportedEvents']=count
  if count:coverage['departments'][d]['status']='annonces trouvées'
 (ROOT/'data/radar-coverage.json').write_text(json.dumps(coverage,ensure_ascii=False,indent=2)+'\n')
 print(len(events),'créneaux OpenAgenda dans',len(set(e['dep'] for e in events)),'départements')
