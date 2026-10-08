// Entry for sub-pages (legal, support, blog). Same chrome, tokens and reader
// as the home page; blog posts get an inline RSVP reader for the article.
import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/outfit/wght.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/reader.css';
import './styles/layout.css';
import './styles/sections.css';
import './styles/doc.css';

import { apply, onLang, getLang, t } from './i18n/index.js';
import * as store from './state.js';
import { initChrome } from './chrome.js';
import { loadUiFont } from './sections/personal.js';
import { createReader, tokenize } from './rsvp/index.js';

function paintLang() {
  apply();
  const note = document.querySelector('.doc__lang-note');
  if (note) note.hidden = getLang() === 'tr';
}
onLang(paintLang);
paintLang();
loadUiFont(store.get('uiFont'));
initChrome();

// Blog: read the article itself with Orpigo.
const host = document.querySelector('[data-post-reader]');
const article = document.querySelector('.post-body');
if (host && article) {
  const text = [...article.querySelectorAll('h2, h3, p, li')].map((el) => el.textContent.trim()).join(' ');
  let reader = null;
  const toggle = document.querySelector('[data-post-toggle]');
  const open = () => {
    host.hidden = false;
    toggle?.setAttribute('aria-expanded', 'true');
    reader ??= createReader(host, { words: tokenize(text), wpm: 300, label: document.title });
    if (!store.reducedMotion()) reader.play();
    host.querySelector('.rsvp').focus({ preventScroll: true });
  };
  if (toggle) toggle.addEventListener('click', () => (host.hidden ? open() : (reader?.pause(), host.hidden = true, toggle.setAttribute('aria-expanded', 'false'))));
  else open();
}
