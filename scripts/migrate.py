"""Move the legal pages and blog from the live orpigo.com into this site.

Text is kept verbatim. Only wrappers change: page chrome is replaced by our
partials, internal links become relative, the support FAQ becomes
<details>, emoji icons become inline SVG, and the old blog RSVP widget is
replaced by our reader (src/page.js).

Usage: python3 -I scripts/migrate.py <dir with downloaded pages>
Files expected (as fetched with curl): x<path with / → _>.html
"""
import html as H, pathlib, re, sys, json

SRC = pathlib.Path(sys.argv[1])
ROOT = pathlib.Path(__file__).resolve().parent.parent

def element(doc, start):
    """Return the balanced element (by tag name) starting at index `start`."""
    tag = re.match(r'<(\w+)', doc[start:]).group(1)
    depth, i = 0, start
    pat = re.compile(rf'<(/?){tag}\b[^>]*>')
    for m in pat.finditer(doc, start):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return doc[start:m.end()]
    raise ValueError('unbalanced ' + tag)

def find(doc, opener):
    i = doc.find(opener)
    if i < 0: raise ValueError('missing ' + opener)
    return element(doc, i)

def inner(el):
    return el[el.index('>') + 1: el.rindex('<')]

def head_meta(doc):
    title = H.unescape(re.search(r'<title>(.*?)</title>', doc, re.S).group(1).strip())
    m = re.search(r'<meta name="description" content="([^"]*)"', doc)
    desc = H.unescape(m.group(1)) if m else ''
    ld = re.findall(r'<script type="application/ld\+json">(.*?)</script>', doc, re.S)
    return title, desc, ld

INTERNAL = r'(?:privacy|terms|support|delete-account|blog(?:/[\w-]+)?)/?'
def relink(s):
    s = re.sub(rf'href="(?:https?://(?:www\.)?orpigo\.com)?/({INTERNAL})"', lambda m: f'href="{{{{root}}}}{m.group(1).rstrip("/")}/"', s)
    s = re.sub(r'href="(?:https?://(?:www\.)?orpigo\.com)?/"', 'href="{{root}}"', s)
    s = re.sub(r'href="(?:https?://(?:www\.)?orpigo\.com)?/#([\w-]+)"', r'href="{{root}}#\1"', s)
    return s

ICON = {
  '✉️': 'M3 6h18v12H3zM3 7l9 6 9-6',
  '🗑️': 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  '🔒': 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3',
  '⚠️': 'M12 3 2 20h20L12 3zM12 10v4M12 17v.5',
}
def icons(s):
    for e, d in ICON.items():
        s = s.replace(e, f'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="{d}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>')
    return s

def support_faq(s):
    def rep(m):
        q = re.sub(r'\s*▼\s*', '', inner(m.group(1))).strip()
        q = re.sub(r'<span class="faq-icon"[^>]*>\s*</span>', '', q)
        a = inner(m.group(2)).strip()
        return f'<details class="faq__item"><summary><span>{q}</span><i aria-hidden="true"></i></summary><p>{a}</p></details>'
    return re.sub(r'<div class="faq-item"[^>]*>\s*(<div class="faq-question"[^>]*>.*?</div>)\s*(<div class="faq-answer"[^>]*>.*?</div>)\s*</div>', rep, s, flags=re.S)

def page(path, title, desc, body, kind, ld=()):
    depth = path.count('/') + 1
    ld_html = ''.join(f'\n  <script type="application/ld+json">{x}</script>' for x in ld)
    return f'''<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{H.escape(title)}</title>
  <meta name="description" content="{H.escape(desc)}">
  <!-- PREVIEW: remove before going live (see README) -->
  <meta name="robots" content="noindex, nofollow">
  <link rel="canonical" href="https://orpigo.com/{path}/">
<!--@head-->{ld_html}
  <script type="module" src="/src/page.js"></script>
</head>
<body class="page page--{kind}">
  <a class="skip" href="#main" data-i18n="skip">İçeriğe geç</a>
<!--@header-->
  <main id="main" class="doc">
    <p class="doc__lang-note" data-i18n="legal.trOnly" hidden></p>
{body}
  </main>
<!--@footer-->
</body>
</html>
'''

def write(path, text):
    p = ROOT / path / 'index.html'
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text)
    print('wrote', p.relative_to(ROOT))

# ── Legal / support pages ───────────────────────────────────────────────
for path in ['privacy', 'terms', 'support', 'delete-account']:
    f = SRC / f'x{path}_.html'
    if path == 'delete-account' and not f.exists(): f = SRC / 'xdel.html'
    doc = f.read_text()
    title, desc, ld = head_meta(doc)
    hero = inner(find(doc, '<div class="hero"'))
    content = inner(find(doc, '<div class="content"'))
    if path == 'support': content = support_faq(content)
    body = f'''    <header class="doc__hero"><div class="wrap wrap--doc">{hero}</div></header>
    <div class="wrap wrap--doc doc__body legal">{content}</div>'''
    write(path, page(path, title, desc or title, icons(relink(body)), 'legal', ld))

# ── Blog ────────────────────────────────────────────────────────────────
doc = (SRC / 'xblog_.html').read_text()
title, desc, ld = head_meta(doc)
hero = inner(find(doc, '<section class="blog-hero"'))
grid = find(doc, '<div class="blog-grid"')
body = f'''    <header class="doc__hero"><div class="wrap wrap--doc">{inner(find(hero, '<div class="container'))}</div></header>
    <div class="wrap wrap--doc doc__body">{grid}</div>'''
write('blog', page('blog', title, desc, relink(body), 'blog', ld))

for slug in ['hizli-okuma-nedir', 'orp-teknigi-nasil-calisir', 'daha-fazla-kitap-okuma']:
    doc = (SRC / f'xblog_{slug}_.html').read_text()
    title, desc, ld = head_meta(doc)
    hero_box = find(doc, '<section class="post-hero"')
    meta = find(hero_box, '<div class="post-hero__meta"')
    h1 = find(hero_box, '<h1')
    lead = find(hero_box, '<p class="post-hero__lead"')
    article = find(doc, '<article class="post-body"')
    cta = find(doc, '<div class="rsvp-cta"').replace('data-rsvp-toggle', 'data-post-toggle aria-expanded="false"')
    body = f'''    <header class="doc__hero"><div class="wrap wrap--doc">
      <a class="doc__back" href="{{{{root}}}}blog/">← Blog</a>
      {meta}
      {h1}
      {lead}
    </div></header>
    <div class="wrap wrap--doc">
      {cta}
      <div class="post-reader card" data-post-reader hidden></div>
    </div>
    <div class="wrap wrap--doc doc__body">{article}</div>'''
    write(f'blog/{slug}', page(f'blog/{slug}', title, desc, relink(body), 'post', ld))
