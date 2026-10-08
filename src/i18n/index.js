import tr from './tr.json';
import en from './en.json';

const dicts = { tr, en };
const subs = new Set();

function initial() {
  try {
    const saved = localStorage.getItem('orpigo-web:lang');
    if (saved && dicts[saved]) return saved;
  } catch { /* ignore */ }
  if (typeof navigator === 'undefined') return 'tr';
  const nav = (navigator.languages || [navigator.language || 'tr']).map((l) => l.toLowerCase());
  return nav.find((l) => l.startsWith('tr')) ? 'tr' : nav.find((l) => l.startsWith('en')) ? 'en' : 'tr';
}

let lang = typeof window === 'undefined' ? 'tr' : initial();

export const getLang = () => lang;

/** Translator bound to a language, without touching global state (used at build time). */
export function translator(l) {
  return (key, vars) => {
    const v = key.split('.').reduce((o, k) => (o == null ? o : o[k]), dicts[l]);
    if (typeof v !== 'string') return v ?? key;
    return vars ? v.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '') : v;
  };
}

export function t(key, vars) {
  const v = key.split('.').reduce((o, k) => (o == null ? o : o[k]), dicts[lang]);
  if (typeof v !== 'string') return v ?? key;
  return vars ? v.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '') : v;
}

export function apply(root = document) {
  document.documentElement.lang = lang;
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    for (const pair of el.dataset.i18nAttr.split(';')) {
      const [attr, key] = pair.split(':');
      el.setAttribute(attr.trim(), t(key.trim()));
    }
  });
}

export function setLang(l) {
  if (!dicts[l] || l === lang) return;
  lang = l;
  try { localStorage.setItem('orpigo-web:lang', l); } catch { /* ignore */ }
  for (const fn of subs) fn(l);
}

export function onLang(fn) { subs.add(fn); return () => subs.delete(fn); }
