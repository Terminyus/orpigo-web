// Page chrome shared by every page: language + theme toggles, header state, smooth scroll.
import Lenis from 'lenis';
import { setLang, getLang, onLang } from './i18n/index.js';
import * as store from './state.js';

export function initChrome() {
  const root = document.documentElement;

  const paintLang = () => document.querySelectorAll('[data-lang]').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.lang === getLang()));
  });
  document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  onLang(paintLang);
  paintLang();

  const setTheme = (theme) => {
    root.dataset.theme = theme;
    store.set({ theme });
  };
  document.querySelectorAll('[data-theme-toggle]').forEach((b) =>
    b.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark')));
  store.subscribe((s, patch) => { if (patch.theme) root.dataset.theme = patch.theme; });

  root.dataset.uiFont = store.get('uiFont');
  root.style.setProperty('--rsvp-size', `${store.get('fontSize')}px`);
  store.subscribe((s, patch) => {
    if (patch.uiFont) root.dataset.uiFont = patch.uiFont;
    if (patch.fontSize) root.style.setProperty('--rsvp-size', `${patch.fontSize}px`);
  });

  const header = document.querySelector('.site-header');
  const onScroll = () => header?.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!store.reducedMotion()) {
    const lenis = new Lenis({ lerp: 0.12, anchors: { offset: -72 } });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    window.__lenis = lenis;
  }
}
