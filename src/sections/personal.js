// 11 · Personalise. Theme, UI font, reader size and smart pauses — the same
// options as the app. They go through the shared store, so the hero reader
// (and every other reader on the page) changes instantly too.
import { createReader } from '../rsvp/index.js';
import { t, onLang } from '../i18n/index.js';
import * as store from '../state.js';
import { $, $$ } from './util.js';

const fontLoaders = {
  Lora: () => import('@fontsource-variable/lora/wght.css'),
  Nunito: () => import('@fontsource-variable/nunito/wght.css'),
  Inter: () => Promise.resolve(),
};

export function loadUiFont(name) {
  return (fontLoaders[name] || fontLoaders.Inter)();
}

export function initPersonal() {
  const sec = $('#personal');
  if (!sec) return;
  const reader = createReader($('#personal-reader'), { text: t('personal.demo'), wpm: 250 });

  function paint() {
    const root = document.documentElement;
    $$('[data-set-theme]', sec).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setTheme === root.dataset.theme)));
    $$('[data-set-font]', sec).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.setFont === store.get('uiFont'))));
    $$('[data-set-size]', sec).forEach((b, i) => {
      b.textContent = t('personal.sizes')[i];
      b.setAttribute('aria-pressed', String(+b.dataset.setSize === store.get('fontSize')));
    });
    $('#pauses-toggle').checked = store.get('smartPauses');
  }

  sec.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.setTheme) store.set({ theme: b.dataset.setTheme });
    if (b.dataset.setFont) loadUiFont(b.dataset.setFont).then(() => store.set({ uiFont: b.dataset.setFont }));
    if (b.dataset.setSize) store.set({ fontSize: +b.dataset.setSize });
  });
  $('#pauses-toggle').addEventListener('change', (e) => store.set({ smartPauses: e.target.checked }));
  store.subscribe(paint);
  onLang(() => { reader.load(t('personal.demo')); paint(); });
  paint();
}
