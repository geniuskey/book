#!/usr/bin/env python3
"""Operate on independent sibling Book repositories from the book-series directory."""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
REPOS = [p for p in sorted(ROOT.iterdir()) if p.is_dir() and p.name.endswith('book') and p.name != 'book' and (p / '.git').is_dir()]

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('action', choices=['list', 'status', 'build', 'test', 'install', 'update', 'outdated', 'catalog', 'verify'])
parser.add_argument('--repo', action='append', help='Select a book; may be repeated')
parser.add_argument('--ref', help='Engine release tag for update, e.g. v0.2.0')
parser.add_argument('--execute', action='store_true', help='Required for install/update')
args = parser.parse_args()
selected = [p for p in REPOS if not args.repo or p.name in args.repo]
if args.repo and len(selected) != len(set(args.repo)):
    parser.error('Unknown book repository in --repo')
if args.action in {'install', 'update'} and not args.execute:
    parser.error('install/update changes files; pass --execute')
if args.action == 'update' and not args.ref:
    parser.error('update requires --ref')
if args.ref and not re.fullmatch(r'v\d+\.\d+\.\d+', args.ref):
    parser.error('--ref must be a release tag such as v0.2.0')

catalog = {}
if args.action == 'catalog':
    source = ROOT / 'books/data/books.json'
    catalog = {b['id']: b for b in json.loads(source.read_text())['books'] if b['status'] == 'published'}
    if not args.repo:
        missing = sorted(set(catalog) - {p.name for p in selected})
        if missing:
            print('Published catalog books missing locally: ' + ', '.join(missing), file=sys.stderr)
            raise SystemExit(1)

failed = []
current_version = 'v' + json.loads((ROOT / 'book/package.json').read_text())['version']
for repo in selected:
    package_path = repo / 'package.json'
    package = json.loads(package_path.read_text()) if package_path.exists() else {}
    scripts = package.get('scripts', {})
    if args.action == 'list':
        print(f'{repo.name}\t{(repo / "CNAME").read_text().strip()}\t{"managed" if package else "legacy"}')
        continue
    if args.action == 'catalog':
        meta_path = repo / 'book.json'
        if not meta_path.exists() or repo.name not in catalog:
            failed.append(repo.name)
            print(f'[{repo.name}] missing metadata or catalog entry', file=sys.stderr)
            continue
        metadata, entry = json.loads(meta_path.read_text()), catalog[repo.name]
        expected = {'id': repo.name, 'title': entry['title'], 'description': entry['description'], 'domain': (repo / 'CNAME').read_text().strip(), 'field': entry['field'], 'status': entry['status']}
        errors = [key for key, value in expected.items() if metadata.get(key) != value]
        if entry['url'].rstrip('/') != 'https://' + expected['domain']:
            errors.append('url')
        if errors: failed.append(repo.name)
        print(f'[{repo.name}] {"DRIFT: " + ", ".join(errors) if errors else "OK"}')
        continue
    if args.action == 'outdated':
        dependency = package.get('dependencies', {}).get('@euiyun/book', '')
        match = re.search(r'/refs/tags/(v\d+\.\d+\.\d+)', dependency)
        installed = match.group(1) if match else 'unknown'
        print(f'[{repo.name}] {installed} {"current" if installed == current_version else "latest: " + current_version}')
        if installed != current_version: failed.append(repo.name)
        continue
    if args.action == 'verify':
        domain = (repo / 'CNAME').read_text().strip()
        first = next(iter(sorted((repo / 'chapters').glob('*.html'))), None)
        paths = ['/'] + ([f'/chapters/{first.name}'] if first else [])
        try:
            for path in paths:
                request = Request(f'https://{domain}{path}?book-check=1', headers={'Cache-Control': 'no-cache'})
                with urlopen(request, timeout=15) as response:
                    html = response.read().decode('utf-8')
                if html.count('cloudflareinsights.com/beacon.min.js') != 1 or '<script defer src="https://static.cloudflareinsights.com/beacon.min.js"' not in html:
                    raise ValueError(f'analytics beacon mismatch at {path}')
            print(f'[{repo.name}] LIVE OK')
        except Exception as error:
            failed.append(repo.name)
            print(f'[{repo.name}] LIVE FAIL: {error}', file=sys.stderr)
        continue
    if args.action == 'status': command = ['git', 'status', '--short', '--branch']
    elif not package: continue
    elif args.action in {'build', 'test'}:
        if args.action not in scripts: continue
        command = ['npm', 'run', args.action]
    elif args.action == 'install': command = ['npm', 'ci']
    else: command = ['npm', 'install', f'@euiyun/book@https://codeload.github.com/geniuskey/book/tar.gz/refs/tags/{args.ref}']
    print(f'[{repo.name}] {" ".join(command)}', flush=True)
    if subprocess.run(command, cwd=repo).returncode: failed.append(repo.name)
if failed:
    raise SystemExit(f'Failed: {", ".join(failed)}')
