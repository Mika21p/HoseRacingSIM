"""Add the September 2026 Japanese bloodline choices from verified JBIS identities.

This is a one-time, repeatable curation step. Game ratings are assigned separately
by prepare-chairman-pedigrees.js and build-bloodline-catalog.js.
"""
import json
import runpy
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'js/data/chairman-pedigrees.json'
sys.argv.append('--offline')
collector = runpy.run_path(str(ROOT / 'scripts/collect-chairman-pedigrees.py'))
collector['cached_relationships']()
profile = collector['profile']

# Wind in Her Hair and Manhattan Cafe already have ancestor records; Vodka is
# already a selectable mare. The remaining five identities are new to the graph.
TARGETS = {
    '0000430846': ('Wind in Her Hair', '牝马', 1991),
    '0001104811': ('Gold Ship', '牡马', 2009),
    '0000286632': ('Mejiro Dober', '牝马', 1994),
    '0000324971': ('Manhattan Cafe', '牡马', 1998),
    '0001044299': ('Curren Chan', '牝马', 2007),
    '0000302080': ('T.M. Opera O', '牡马', 1996),
    '0000196381': ('Daiichi Ruby', '牝马', 1987),
}

data = json.loads(SOURCE.read_text(encoding='utf-8'))
by_id = {record['id']: record for record in data['records']}
added = []
unresolved = []

def ensure(identifier):
    if identifier in by_id:
        return by_id[identifier]
    try:
        record = profile(identifier.removeprefix('jbis-'))
    except RuntimeError:
        unresolved.append(identifier)
        return None
    if record['id'] != identifier:
        raise ValueError(f'JBIS identity mismatch: {identifier}')
    by_id[identifier] = record
    added.append(identifier)
    return record

frontier = set()
for jbis_id, (name, gender, year) in TARGETS.items():
    record = ensure('jbis-' + jbis_id)
    if (record['originalName'], record['gender'], record['birthYear']) != (name, gender, year):
        raise ValueError(f'Unexpected JBIS identity: {jbis_id} {record["name"]}')
    if not record.get('fatherId') or not record.get('motherId'):
        raise ValueError(f'Incomplete parents: {record["name"]}')
    record.update(core=True, region='日本')
    frontier.add(record['id'])

# Match the existing core library's three-generation collection depth.
for _ in range(3):
    parents = {by_id[identifier][side]
               for identifier in frontier
               for side in ('fatherId', 'motherId')
               if by_id[identifier].get(side)}
    for identifier in sorted(parents):
        ensure(identifier)
    frontier = parents & by_id.keys()

# Mejiro Dober's paternal great-grandsire is Northern Taste. The cached Dober
# summary stops at Amber Shadai; JBIS's Amber Shadai profile verifies both
# parents (https://www.jbis.or.jp/horse/0000098122/).
amber = by_id.get('jbis-0000098122')
if amber and not amber.get('fatherId') and not amber.get('motherId'):
    amber.update(fatherId='jbis-0000333544', motherId='jbis-0000380822',
                 verifiedParents=True,
                 sourceUrl='https://www.jbis.or.jp/horse/0000098122/')
    if 'jbis-0000380822' not in by_id:
        by_id['jbis-0000380822'] = {
            'id': 'jbis-0000380822', 'jbisId': '0000380822',
            'name': 'Clear Amber(USA)', 'originalName': 'Clear Amber',
            'gender': '牝马', 'birthYear': 1967, 'fatherId': '', 'motherId': '',
            'aliases': ['クリアアンバー(USA)', 'Clear Amber(USA)', 'Clear Amber'],
            'sourceUrl': 'https://www.jbis.or.jp/horse/0000380822/',
            'verifiedAt': date.today().isoformat(), 'verifiedParents': False,
            'core': False
        }
        added.append('jbis-0000380822')

# JBIS can identify parents beyond the depth retained by this library. Keep
# those verified IDs as unexpanded references rather than dangling links.
for identifier in added:
    record = by_id[identifier]
    for side in ('fatherId', 'motherId'):
        parent = record.get(side)
        if parent and parent not in by_id:
            record.setdefault('unexpandedParents', {})[side] = parent
            record[side] = ''

data['records'] = sorted(by_id.values(), key=lambda record: record['id'])
data['verifiedAt'] = date.today().isoformat()
SOURCE.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'promoted_or_added': len(TARGETS), 'new_records': len(added),
                  'total_records': len(data['records']), 'unexpanded': sorted(set(unresolved))},
                 ensure_ascii=False))
