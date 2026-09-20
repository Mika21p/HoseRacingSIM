"""Curate small factual JBIS pedigree records; never run during gameplay.

Only names, identities, sex, birth year and parent links are retained. HTML is
cached under .cache for reproducibility; ambiguous identities fail closed.
"""
import concurrent.futures as cf
import datetime
import hashlib
import html
import json
from pathlib import Path
import re
import time
import sys
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.cache' / 'chairman-pedigrees'
CACHE.mkdir(parents=True, exist_ok=True)
TODAY = datetime.date.today().isoformat()
OFFLINE = '--offline' in sys.argv
REFERENCED = {}
def fetch(url):
    path = CACHE / (hashlib.sha256(url.encode()).hexdigest() + '.html')
    if path.exists(): return path.read_text(encoding='utf-8')
    if OFFLINE: raise RuntimeError('尚无本地核实页面')
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Keiba-PedigreeResearch/1.0'})
            with urllib.request.urlopen(req, timeout=25) as response:
                body = response.read().decode('utf-8')
            path.write_text(body, encoding='utf-8'); time.sleep(.8); return body
        except Exception:
            if attempt == 2: raise
            time.sleep(1 + attempt)
def plain(value): return re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]+>', ' ', value))).strip()
def links(body):
    return [(i, plain(n)) for i,n in re.findall(r'<a[^>]+href="/horse/(\d+)/"[^>]*>(.*?)</a>', body, re.S)]
def profile(i):
    url = f'https://www.jbis.or.jp/horse/{i}/'
    try: body = fetch(url)
    except Exception:
        if i in REFERENCED: return dict(REFERENCED[i])
        raise
    local_name = plain(re.search(r'<h1[^>]*>(.*?)</h1>', body, re.S).group(1))
    en = re.search(r'<span class="hdg1-search__sub">(.*?)</span>', body, re.S)
    name = plain(en.group(1)) if en else local_name
    values = {plain(k): plain(v) for k,v in re.findall(r'<dt[^>]*>(.*?)</dt>\s*<dd[^>]*>(.*?)</dd>', body, re.S)}
    year = re.search(r'(?:18|19|20)\d{2}', values.get('生年月日', ''))
    section = body.split('<h2>血統情報</h2>')[-1].split('<h2>プロフィール</h2>')[0]
    # Summary layout has one independently identifiable paternal/maternal column.
    groups = section.split('<div class="data-3__items">')[1:]
    parents = [links(g)[0][0] if links(g) else '' for g in groups[:2]]
    if len(parents) != 2: parents = ['', '']
    sex = values.get('性別', '')
    return dict(id='jbis-'+i, jbisId=i, name=name, originalName=re.sub(r'\([^)]*\)$','',name),
        gender='牝马' if sex == '牝' else '骟马' if sex in ('セ','せん') else '牡马',
        birthYear=int(year.group()) if year else None,
        fatherId='jbis-'+parents[0] if parents[0] else '', motherId='jbis-'+parents[1] if parents[1] else '',
        aliases=[local_name, name], sourceUrl=url, verifiedAt=TODAY, verifiedParents=all(parents), core=False)

def cached_relationships():
    # A child's published pedigree also verifies its parents' parentage.
    # Retain the exact evidence page; do not invent missing older ancestors.
    for path in CACHE.glob('*.html'):
        body = path.read_text(encoding='utf-8')
        identity = re.search(r'https://www.jbis.jp/horse/(\d+)/" class="header__top-nav-lang"', body)
        if not identity: continue
        evidence = 'https://www.jbis.or.jp/horse/'+identity.group(1)+'/'
        section = body.split('<h2>血統情報</h2>')[-1].split('<h2>プロフィール</h2>')[0]
        for group_index, group in enumerate(section.split('<div class="data-3__items">')[1:3]):
            matches = list(re.finditer(r'<a[^>]+href="/horse/(\d+)/"[^>]*>(.*?)</a>', group, re.S))
            if len(matches) < 3: continue
            for index, match in enumerate(matches[:3]):
                i, local_name = match.group(1), plain(match.group(2))
                trailing = group[match.end():matches[index+1].start() if index+1<len(matches) else len(group)]
                birth = re.search(r'(?:18|19|20)\d{2}', trailing)
                if not birth: continue
                parent = index == 0
                record = dict(id='jbis-'+i, jbisId=i, name=local_name, originalName=re.sub(r'\([^)]*\)$','',local_name), aliases=[local_name],
                    gender=('牡马' if group_index==0 else '牝马') if parent else ('牡马' if index==1 else '牝马'), birthYear=int(birth.group()),
                    fatherId='jbis-'+matches[1].group(1) if parent else '', motherId='jbis-'+matches[2].group(1) if parent else '',
                    sourceUrl=evidence, profileUrl=f'https://www.jbis.or.jp/horse/{i}/', verifiedAt=TODAY, verifiedParents=parent, core=False)
                if i not in REFERENCED or parent and not REFERENCED[i]['verifiedParents']: REFERENCED[i]=record
def normal(n): return re.sub(r'[^a-z0-9]', '', re.sub(r'\([^)]*\)$','',n).lower())
def search(item):
    name, year, region, sex = item
    body=fetch('https://www.jbis.or.jp/horse/result/?'+urllib.parse.urlencode({'sid':'horse','keyword':name}))
    blocks = body.split('<div class="jc-between fw-wrap">')[1:]
    ids = list(dict.fromkeys(links(b)[0][0] for b in blocks if links(b) and re.search(r'<div class="jc-center">'+str(year)+r'</div>', b)))
    found=[]
    for i in ids:
        p=profile(i)
        if normal(p['originalName'])==normal(name) and p['birthYear']==year and p['gender']==sex and p['verifiedParents']: found.append(p)
    if len(found)!=1: return None, f'{name} {year}: {len(found)} exact matches'
    p=found[0]; p.update(core=True, region=region); return p, None

SIRES = {
'日本': "Hindostan:1946|Partholon:1960|Tesco Boy:1963|Northern Taste:1971|Maruzensky:1974|Tosho Boy:1973|Sunday Silence:1986|Tony Bin:1983|Brian's Time:1985|Real Shadai:1979|Mejiro McQueen:1987|Tokai Teio:1988|Fuji Kiseki:1992|Stay Gold:1994|Special Week:1995|King Halo:1995|Deep Impact:2002|King Kamehameha:2001|Heart's Cry:2001|Daiwa Major:2001|Orfevre:2008|Lord Kanaloa:2008|Harbinger:2006|Rulership:2007|Kizuna:2010|Epiphaneia:2010|Kitasan Black:2012|Duramente:2012|Contrail:2017|Equinox:2019",
'欧洲': "Hyperion:1930|Nearco:1935|Ribot:1952|Nasrullah:1940|Mill Reef:1968|Blushing Groom:1974|Sadler's Wells:1981|Danehill:1986|Green Desert:1983|Rainbow Quest:1981|Machiavellian:1987|Pivotal:1993|Montjeu:1996|Galileo:1998|Dubai Millennium:1996|Invincible Spirit:1997|Frankel:2008|Dubawi:2002|Sea The Stars:2006|Oasis Dream:2000|Shamardal:2002|Lope de Vega:2007|Dark Angel:2005|Teofilo:2004|Kingman:2011|Golden Horn:2012|Night of Thunder:2011|Too Darn Hot:2016|Churchill:2014|Almanzor:2013",
'美国': "Native Dancer:1950|Bold Ruler:1954|Northern Dancer:1961|Secretariat:1970|Mr. Prospector:1970|Seattle Slew:1974|A.P. Indy:1989|Storm Cat:1983|Danzig:1977|Unbridled:1987|Deputy Minister:1979|Smart Strike:1992|Distorted Humor:1993|Elusive Quality:1993|Giant's Causeway:1997|Medaglia d'Oro:1999|Tapit:2001|Into Mischief:2005|Quality Road:2006|Curlin:2004|Uncle Mo:2008|Scat Daddy:2004|Speightstown:1998|Street Sense:2004|American Pharoah:2012|Justify:2015|Gun Runner:2013|Constitution:2011|Nyquist:2013|Not This Time:2014"}
MARES = {
'日本': "Almond Eye:2015|Chrono Genesis:2016|Loves Only You:2016|Lucky Lilac:2015|Gran Alegria:2016|Daring Tact:2017|Sodashi:2018|Liberty Island:2020|Deirdre:2014|Lys Gracieux:2014|Gentildonna:2009|Buena Vista:2006|Vodka:2004|Daiwa Scarlet:2004|Cesario:2002|Air Messiah:2002|Kawakami Princess:2003|Sweep Tosho:2001|Apapane:2007|Marcellina:2008|Fusaichi Pandora:2003|Heavenly Romance:2000|Dia de la Novia:2002|Red Desire:2006|Air Groove:1993|Biwa Heidi:1993|Dance Partner:1992|Hishi Amazon:1991|North Flight:1990|Dyna Carle:1980|Kyoei March:1994|Phalaenopsis:1995|To the Victory:1996|Dancing Key:1983|Scarlet Bouquet:1988|Vega:1990",
'欧洲': "Enable:2014|Found:2012|Minding:2013|Winter:2014|Love:2017|Snowfall:2018|Alpinista:2017|Inspiral:2019|Alpha Centauri:2015|Magical:2015|Treve:2010|Zarkava:2005|Goldikova:2005|Ouija Board:2001|Midday:2006|The Fugue:2009|Snow Fairy:2007|Dar Re Mi:2005|Lillie Langtry:2007|Immortal Verse:2008|Taghrooda:2011|Urban Sea:1989|Hasili:1991|Kind:2001|Zomaradah:1995|Rafha:1987|Miesque:1984|Dahlia:1970|Allez France:1970|Pawneese:1973|Salsabil:1987|Pebbles:1981|User Friendly:1989|All Along:1979|Detroit:1977|Dunfermline:1974",
'美国': "Rachel Alexandra:2006|Zenyatta:2004|Beholder:2010|Songbird:2013|Monomoy Girl:2015|Midnight Bisou:2015|Swiss Skydiver:2017|Malathaat:2018|Nest:2019|Secret Oath:2019|Goodnight Olive:2018|Untapable:2011|Royal Delta:2008|Rags to Riches:2004|Serena's Song:1992|Silverbulletday:1996|Azeri:1998|Personal Ensign:1984|Winning Colors:1985|Lady's Secret:1982|Genuine Risk:1977|Ruffian:1972|Chris Evert:1971|Shuvee:1966|Ta Wee:1966|Affectionately:1960|Gamely:1964|Gold Beauty:1979|Weekend Surprise:1980|Terlingua:1976|La Troienne:1926|Somethingroyal:1952|Fall Aspen:1976|Toussaud:1989|Leslie's Lady:1996|Quiet Giant:2007"}

def main():
    cached_relationships()
    nodes={}; errors=[]; regions={r:set() for r in SIRES}
    jobs=[(name,int(year),region,sex) for lists,sex in [(SIRES,'牡马'),(MARES,'牝马')] for region,values in lists.items() for name,year in (s.rsplit(':',1) for s in values.split('|'))]
    with cf.ThreadPoolExecutor(max_workers=1) as pool:
        def lookup(item):
            try: return search(item)
            except Exception as e: return None, f'{item[0]}: {e}'
        for n,(record,error) in enumerate(pool.map(lookup,jobs)):
            if error: errors.append(error); print(error,flush=True)
            else: nodes[record['id']]=record; regions[record['region']].add(record['id'])
            if n%20==0:
                print('core',n,len(jobs),flush=True)
                (CACHE/'progress.json').write_text(json.dumps(list(nodes.values()),ensure_ascii=False),encoding='utf-8')
        # Fetch parents through three generations; each profile is independently verified.
        frontier=set(nodes)
        for depth in range(3):
            ids=sorted({nodes[i][k] for i in frontier for k in ('fatherId','motherId') if nodes[i].get(k)}-set(nodes))
            def get(i):
                try: return profile(i[5:])
                except Exception as e: errors.append(f'{i}: {e}'); return None
            for p in pool.map(get,ids):
                if p: nodes[p['id']]=p
            frontier=set(ids)&set(nodes); print('ancestors',depth,len(nodes),flush=True)
        # Additional foundation mares are known maternal ancestors of the regional seeds.
        used={i for i,p in nodes.items() if p['core']}
        for region in SIRES:
            seen=set(); frontier=set(regions[region])
            while frontier:
                seen |= frontier
                frontier={nodes[i].get(k) for i in frontier if i in nodes for k in ('fatherId','motherId')}-{None,''}-seen
            candidates=[nodes[i] for i in seen if i in nodes and i not in used and nodes[i]['gender']=='牝马' and nodes[i]['birthYear'] and nodes[i]['verifiedParents']]
            targets=[10,16,14,10]
            def era(p): return 0 if p['birthYear']<1980 else 1 if p['birthYear']<2000 else 2 if p['birthYear']<2010 else 3
            core=[p for p in nodes.values() if p['core'] and p.get('region')==region and p['gender']=='牝马']
            while len(core)<50 and candidates:
                counts=[sum(era(p)==i for p in core) for i in range(4)]
                candidates.sort(key=lambda p:(-(targets[era(p)]-counts[era(p)]),-p['birthYear'],p['id']))
                p=candidates.pop(0); p.update(core=True,region=region); used.add(p['id']); core.append(p)
        # Complete ancestry for the newly chosen mares as well.
        frontier={i for i,p in nodes.items() if p['core']}
        for depth in range(3):
            parents={nodes[i].get(k) for i in frontier if i in nodes for k in ('fatherId','motherId')}-{None,''}
            for p in pool.map(get,sorted(parents-set(nodes))):
                if p: nodes[p['id']]=p
            frontier=parents&set(nodes)
    for p in nodes.values():
        for k in ('fatherId','motherId'):
            if p.get(k) and p[k] not in nodes:
                p.setdefault('unexpandedParents',{})[k]=p[k]; p[k]=''
    out={'version':1,'verifiedAt':TODAY,'records':sorted(nodes.values(),key=lambda p:p['id']),'errors':errors}
    (ROOT/'js/data/chairman-pedigrees.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('DONE',len(nodes),{r:{s:sum(p['core'] and p.get('region')==r and p['gender']==s for p in nodes.values()) for s in ['牡马','牝马']} for r in SIRES},flush=True)
if __name__=='__main__': main()
