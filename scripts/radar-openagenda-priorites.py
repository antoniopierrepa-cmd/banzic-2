"""Collecte OpenAgenda ciblée à partir de la couverture du dernier radar livré."""
import importlib.util
import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
spec = importlib.util.spec_from_file_location('openagenda', ROOT / 'scripts/import-openagenda.py')
openagenda = importlib.util.module_from_spec(spec)
spec.loader.exec_module(openagenda)
DATASET = 'https://public.opendatasoft.com/explore/dataset/evenements-publics-openagenda/'
API = 'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/evenements-publics-openagenda/records'
SOURCE = {'id': 'openagenda-priorites', 'homepage': DATASET}
TERMS = ('soirée', 'karaoké', 'blind test', 'afterwork', 'bal', 'réveillon', 'DJ', 'dansant', 'disco', 'concert')


def eligible(title, description):
    name = openagenda.tourism.plain(title)
    details = openagenda.tourism.plain(description)
    if re.search(r'\b(rire|comedie|humour|one.man.show|stand.up|theatre|projection|cine.concert|photograph\w*|annul\w*|report\w*)\b', name):
        return False
    if re.search(r'\b(comedie|stand.up|theatre|spectacle de marine leonardi)\b', details):
        return False
    return bool(re.search(r'\bconcerts?\b', name)) or openagenda.tourism.eligible(title, description)


def collect(department, checked, today):
    name = openagenda.DEPS[department]
    condition = (
        'location_department = ' + json.dumps(name, ensure_ascii=False)
        + ' AND lastdate_end >= now() AND ('
        + ' OR '.join('search(title_fr, ' + json.dumps(term, ensure_ascii=False) + ')' for term in TERMS)
        + ')'
    )
    events = {}
    examined = 0
    while True:
        query = urlencode({'where': condition, 'limit': 100, 'offset': examined, 'order_by': 'uid'})
        with urlopen(API + '?' + query, timeout=15) as response:
            page = json.load(response)
        rows = page['results']
        for row in rows:
            for event in openagenda.convert(row, checked, today, eligible):
                if event['dep'] == department:
                    event['src'] = SOURCE['id']
                    events[event['id']] = event
        examined += len(rows)
        if not rows or examined >= page['total_count']:
            return list(events.values()), examined


def main():
    payload = (ROOT / 'agenda-radar.js').read_text().split('=', 1)[1].strip().removesuffix(';')
    coverage = json.loads(payload)['coverage']
    path = ROOT / 'data/radar-openagenda-priorites.json'
    old = json.loads(path.read_text()) if path.exists() else {'checks': {}, 'events': []}
    targets = sorted({d for d, count in coverage.items() if not count} | set(old['checks']))
    now = datetime.now(timezone.utc)
    checked, today = now.isoformat(), now.date().isoformat()
    retained = {dep: [event for event in old['events'] if event['dep'] == dep] for dep in targets}
    checks = dict(old['checks'])
    with ThreadPoolExecutor(max_workers=4) as pool:
        jobs = {dep: pool.submit(collect, dep, checked, today) for dep in targets}
        for dep, job in jobs.items():
            try:
                events, examined = job.result()
                retained[dep] = events
                checks[dep] = {'status': 'ok', 'examined': examined, 'imported': len(events), 'checkedAt': checked}
            except (OSError, ValueError, KeyError, TypeError) as exc:
                checks[dep] = {'status': 'error', 'checkedAt': checked, 'reason': str(exc)[:160]}
    events = [event for dep in targets for event in retained[dep] if event['date'] >= today]
    temp = path.with_suffix('.json.tmp')
    temp.write_text(json.dumps({'sources': [SOURCE], 'checks': checks, 'events': events}, ensure_ascii=False, indent=2) + '\n')
    temp.replace(path)
    print(len(targets), 'départements interrogés,', sum(c['status'] == 'error' for c in checks.values()), 'échecs,', len(events), 'créneaux retenus')


if __name__ == '__main__':
    main()
