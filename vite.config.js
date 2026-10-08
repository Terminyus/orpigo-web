import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { translator } from './src/i18n/index.js';
import { renderers } from './src/render.js';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
// GitHub Pages preview lives at /orpigo-web/. For the live site set BASE=/
const BASE = process.env.BASE ?? '/orpigo-web/';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Every page = every index.html below the root (plus 404.html), excluding build/tooling dirs. */
function pages() {
  const out = {};
  const skip = new Set(['node_modules', 'dist', 'public', 'src', 'partials', 'docs', 'scripts', 'tests', 'assets-src', '.git', '.github', '.claude']);
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) { if (!skip.has(e.name)) walk(path.join(dir, e.name)); }
      else if (e.name === 'index.html' || (dir === ROOT && e.name === '404.html')) {
        const rel = path.relative(ROOT, path.join(dir, e.name));
        out[rel.replace(/\/?index\.html$/, '').replace(/\.html$/, '') || 'main'] = path.join(dir, e.name);
      }
    }
  })(ROOT);
  return out;
}

function include(html) {
  for (let i = 0; i < 3; i++) {
    html = html.replace(/<!--@([\w-]+)-->/g, (_, name) => fs.readFileSync(path.join(ROOT, 'partials', `${name}.html`), 'utf8'));
  }
  return html;
}

/** Fill data-i18n / data-i18n-html / data-i18n-attr / data-render with Turkish so the page has content without JS. */
function prerender(html, t) {
  html = html.replace(/(<([a-z0-9]+)\b[^>]*?\sdata-i18n(-html)?="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2>)/g,
    (m, open, tag, isHtml, key, inner, close) => {
      if (inner.trim() && !isHtml) return m; // keep hand-written fallbacks
      const v = t(key);
      return typeof v === 'string' ? open + (isHtml ? v : esc(v)) + close : m;
    });
  html = html.replace(/<([a-z0-9]+)\b([^>]*?)\sdata-i18n-attr="([^"]+)"([^>]*)>/g, (m, tag, a, spec, b) => {
    let attrs = `${a} data-i18n-attr="${spec}"${b}`;
    for (const pair of spec.split(';')) {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      const val = esc(t(key));
      const re = new RegExp(`\\s${attr}="[^"]*"`);
      attrs = re.test(attrs) ? attrs.replace(re, ` ${attr}="${val}"`) : `${attrs} ${attr}="${val}"`;
    }
    return `<${tag}${attrs}>`;
  });
  html = html.replace(/(<([a-z0-9]+)\b[^>]*?\sdata-render="([^"]+)"[^>]*>)(<\/\2>)/g,
    (m, open, tag, name, close) => (renderers[name] ? open + renderers[name](t, '/') + close : m));
  return html;
}

function site() {
  const t = translator('tr');
  return {
    name: 'orpigo-site',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const rel = path.relative(ROOT, ctx.filename);
        const depth = rel.split(path.sep).length - 1;
        // 404.html is served at arbitrary paths, so it needs absolute links.
        const is404 = rel === '404.html';
        const root = is404 ? BASE : depth ? '../'.repeat(depth) : './';
        html = include(html).replaceAll('{{root}}', root).replaceAll('{{home}}', depth || is404 ? root : '');
        return prerender(html, t);
      },
    },
  };
}

export default defineConfig({
  base: BASE,
  plugins: [site()],
  build: { target: 'es2020', rollupOptions: { input: pages() } },
  test: { environment: 'node', include: ['tests/**/*.test.js'] },
});
