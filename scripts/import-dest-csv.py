"""Importe un tableur « <Destination>_Google_Maps.csv » dans dest-lieux.js.
Usage : python3 scripts/import-dest-csv.py <dest> <fichier.csv>
Les lieux « Non trouvé » sur Google Maps sont ignorés ; les lieux fermés définitivement aussi."""
import csv, json, re, sys
CAT = {'Discothèque': 'Clubs', 'Discothèques': 'Clubs', 'Beach club': 'Beach clubs', 'Beach clubs': 'Beach clubs', 'Beach club / pool party': 'Beach clubs',
       'Pool parties (lieux)': 'Pool clubs', 'Lieu de pool parties': 'Pool clubs', 'Pool club': 'Pool clubs', 'Pool clubs': 'Pool clubs', 'Bars de plage': 'Bars de plage', 'Bar de plage': 'Bars de plage',
       'Sunset bar': 'Sunset bars', 'Sunset bars': 'Sunset bars', 'Rooftop': 'Rooftops', 'Rooftops': 'Rooftops',
       'Bar musical': 'Bars & restos festifs', 'Bars musicaux': 'Bars & restos festifs', 'Restaurants festifs': 'Bars & restos festifs', 'Restaurant festif': 'Bars & restos festifs', 'Bar festif': 'Bars & restos festifs',
       'Restaurant festif à vérifier': 'Bars & restos festifs', 'Lieu de soirées': 'Beach clubs',
       'Discothèques et clubs': 'Clubs', 'Lieux de pool parties': 'Pool clubs'}
ZONES = {
  'phuket': {'Patong': ['Patong', 'Paradise Beach'], 'Côte ouest (Bang Tao, Kamala)': ['Bang Tao', 'Kamala'], 'Sud (Kata, Karon, Rawai)': ['Kata', 'Kata Noi', 'Kata Noi / Karon', 'Rawai'], 'Phuket Town': ['Phuket Town']},
  'mykonos': {'Plages du sud': ['Paradise Beach', 'Super Paradise', 'Paraga', 'Psarou'], 'Nord': ['Ftelia', 'Panormos'], 'Chora (ville)': ['Mykonos Town']},
  'miami': {'Miami Beach': ['South Beach', 'Mid-Beach'], 'Downtown & Brickell': ['Downtown', 'Brickell', 'Watson Island'],
            'Wynwood & nord': ['Wynwood', 'Allapattah', 'Hialeah', 'Little River', 'MiMo', 'Upper East Side'], 'Little Havana & Grove': ['Little Havana', 'Coconut Grove']},
}
# Zone déduite de l'adresse Google quand le tableur ne donne pas de secteur précis (premier mot-clé trouvé, dans l'ordre)
ZONES_ADRESSE = {
  'tulum': [('Tulum centre & Aldea Zama', ['Tulum Centro', 'Aldea Zama', 'Orion Sur', 'Beta Sur']),
            ('Route 307 & environs', ['México 307', 'Federal 307', 'Chemuyil']),
            ('Zone hôtelière (plage)', ['Boca Paila', 'Tulum Beach', 'Zona Hotelera', 'Zona Costera', 'Beach Road', 'QROO 15', 'Punta Piedra'])],
  'dubai': [('Palm Jumeirah', ['Palm', 'Nakhlat Jumeira']),
            ('Marina, JBR & Bluewaters', ['Marsa Dubai', 'Jumeirah Beach Residence', 'Bluewaters', 'Dubai Harbour', 'Al Sufouh', 'Al Safouh', 'Media City', 'Jumeirah Lakes', 'Barsha Heights', 'Al Thanyah']),
            ('Meydan & quartiers', ['Meydan', 'Nad Al Sheba', 'Jumeirah Village', 'Mirdif']),
            ('Jumeirah', ['Jumeira', 'Umm Suqeim']),
            ('Downtown, DIFC & Business Bay', ['Downtown', 'DIFC', 'Business Bay', 'Burj Khalifa', 'Sheikh Mohammed bin Rashid', 'Trade Center', 'Trade Centre', 'Sheikh Zayed', "Zaa'beel", 'Jaddaf']),
            ('Vieux Dubaï', ['Burjuman', 'Al Raffa', 'Rolla', 'Al Mina', 'Oud Metha', 'Garhoud'])],
}
def zone_adresse(dest, adresse):
    for zone, mots in ZONES_ADRESSE.get(dest, []):
        if any(m.lower() in adresse.lower() for m in mots): return zone
    return ''
dest, fichier = sys.argv[1], sys.argv[2]
zone_de = {s: z for z, ss in ZONES.get(dest, {}).items() for s in ss}
def ini(n):
    w = [x for x in re.split(r"[\s\-—&'’.]+", n) if x and x[0].isalnum()]
    return ''.join(x[0] for x in w[:2]).upper()
out, ignores = [], []
for r in csv.DictReader(open(fichier, encoding='utf-8-sig'), delimiter=';'):
    if not r['Nom'].strip(): continue
    statut = (r.get('Statut Google') or '').strip()
    if r['Nom sur Google Maps'] == 'Non trouvé' or 'définitivement' in statut.lower(): ignores.append(r['Nom']); continue
    if r['Catégorie'] not in CAT: sys.exit('Catégorie inconnue : ' + r['Catégorie'])
    e = {'n': r['Nom'], 's': (zone_adresse(dest, r.get('Adresse', '')) or r['Secteur']) if r['Secteur'].lower() in ('dubai', dest) else r['Secteur'], 'z': zone_de.get(r['Secteur']) or zone_adresse(dest, r.get('Adresse', '')) or r['Secteur'], 'c': CAT[r['Catégorie']], 'logo': '', 'm': '', 'ini': ini(r['Nom'])}
    if statut and statut != 'Ouvert': e['f'] = statut
    if r['Lien Google Maps'].startswith('https://'): e['g'] = r['Lien Google Maps']
    if r['Site officiel'].startswith('http'): e['w'] = r['Site officiel']
    if r['Latitude']: e['lat'], e['lng'] = float(r['Latitude']), float(r['Longitude'])
    if r.get('Fichier logo'): e['logoArchive'] = r['Fichier logo']
    out.append(e)
p = 'dest-lieux.js'; t = open(p, encoding='utf-8').read()
bloc = '\n  ' + json.dumps(dest) + ': ' + json.dumps(out, ensure_ascii=False) + ','
t, n = re.subn(r'\n  ' + re.escape(json.dumps(dest)) + r': \[.*?\],(?=\n)', lambda m: bloc, t, flags=re.S)
if not n: t = t.replace('window.DEST_LIEUX = {', 'window.DEST_LIEUX = {' + bloc, 1)
open(p, 'w', encoding='utf-8').write(t)
print(dest, len(out), 'lieux ;', sum('f' in e for e in out), 'non ouverts ; ignorés :', ', '.join(ignores) or 'aucun')
