"""Broken-link scan over dist/: every internal href/src/srcset must resolve to a
file; external links are checked with a HEAD/GET request.
Usage: python3 -I scripts/check_links.py [--base /orpigo-web/] [--no-external]"""
import pathlib, re, sys, urllib.parse, urllib.request

DIST = pathlib.Path(__file__).resolve().parent.parent / 'dist'
BASE = sys.argv[sys.argv.index('--base') + 1] if '--base' in sys.argv else '/orpigo-web/'
EXTERNAL = '--no-external' not in sys.argv
bad, ext = [], {}

for page in sorted(DIST.rglob('*.html')):
    url_dir = BASE + str(page.parent.relative_to(DIST)).replace('.', '').strip('/') + '/'
    url_dir = re.sub('/+', '/', url_dir)
    html = page.read_text()
    ids = set(re.findall(r'\sid="([^"]+)"', html))
    refs = re.findall(r'\s(?:href|src)="([^"]+)"', html)
    for s in re.findall(r'\ssrcset="([^"]+)"', html):
        refs += [p.strip().split(' ')[0] for p in s.split(',')]
    for r in refs:
        if r.startswith(('mailto:', 'tel:', 'data:', 'javascript:')):
            continue
        if r.startswith('http'):
            ext.setdefault(r, set()).add(str(page.relative_to(DIST)))
            continue
        u = urllib.parse.urljoin(url_dir, r)
        path, _, frag = u.partition('#')
        path = path.split('?')[0]
        if frag and path.rstrip('/') == url_dir.rstrip('/') and page.name == 'index.html' and frag not in ids:
            bad.append((str(page.relative_to(DIST)), r, 'missing #' + frag))
            continue
        if not path.startswith(BASE):
            bad.append((str(page.relative_to(DIST)), r, 'outside base'))
            continue
        f = DIST / path[len(BASE):]
        if path.endswith('/') or f.is_dir():
            f = f / 'index.html'
        if not f.exists():
            bad.append((str(page.relative_to(DIST)), r, 'missing file'))

if EXTERNAL:
    for u, pages in sorted(ext.items()):
        if urllib.parse.urlparse(u).hostname in ('orpigo.com', 'www.orpigo.com'):
            continue  # canonical / og:image / hreflang point at the live domain; checked after go-live
        try:
            req = urllib.request.Request(u, method='GET', headers={'User-Agent': 'Mozilla/5.0 orpigo-web link check'})
            code = urllib.request.urlopen(req, timeout=20).status
        except Exception as e:
            code = getattr(e, 'code', str(e))
        ok = code == 200
        print(('OK  ' if ok else 'FAIL'), code, u)
        if not ok: bad.append((','.join(sorted(pages)), u, f'HTTP {code}'))

print(f'\n{len(bad)} broken')
for b in bad: print('  ', *b)
sys.exit(1 if bad else 0)
