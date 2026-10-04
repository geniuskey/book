#!/usr/bin/env python3
"""Run selected checks or dependency updates across independent sibling repositories."""
import argparse
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REPOS = [p for p in sorted(ROOT.iterdir()) if p.is_dir() and p.name.endswith('book') and p.name != 'book' and (p / '.git').is_dir()]

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('action', choices=['list', 'status', 'build', 'test', 'install', 'update'])
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
failed = []
for repo in selected:
    package = repo / 'package.json'
    scripts = json.loads(package.read_text()).get('scripts', {}) if package.exists() else {}
    if args.action == 'list':
        print(f'{repo.name}\t{(repo / "CNAME").read_text().strip()}\t{"managed" if package.exists() else "legacy"}')
        continue
    if args.action == 'status': command = ['git', 'status', '--short', '--branch']
    elif not package.exists(): continue
    elif args.action in {'build', 'test'}:
        if args.action not in scripts: continue
        command = ['npm', 'run', args.action]
    elif args.action == 'install': command = ['npm', 'ci']
    else: command = ['npm', 'install', f'@euiyun/book@https://codeload.github.com/geniuskey/book/tar.gz/refs/tags/{args.ref}']
    print(f'[{repo.name}] {" ".join(command)}', flush=True)
    if subprocess.run(command, cwd=repo).returncode: failed.append(repo.name)
if failed:
    raise SystemExit(f'Failed: {", ".join(failed)}')
