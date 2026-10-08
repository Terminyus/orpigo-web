// 6 · Everyday reading. A slow marquee of document types; tap one and a short
// sample plays in the reader with "normally ~N min / with Orpigo ~M min" for a
// full document of that kind. Times update live with the reader's speed.
import { createReader, tokenize } from '../rsvp/index.js';
import { t, onLang } from '../i18n/index.js';
import * as store from '../state.js';
import { $, $$, normalWpm, orpigoMinutes, formatDuration, fmtNum } from './util.js';

export function initLife() {
  const sec = $('#life');
  if (!sec) return;
  const list = $('.marquee__list', sec);
  const marquee = $('.marquee', sec);
  const panel = $('.life-player', sec);
  let reader = null;
  let current = null;

  function loopify() {
    // Duplicate the cards once so the CSS loop is seamless; the copy is hidden from AT.
    $$('li[data-clone]', list).forEach((li) => li.remove());
    $$('li', list).forEach((li) => {
      const c = li.cloneNode(true);
      c.dataset.clone = '';
      c.setAttribute('aria-hidden', 'true');
      c.querySelector('button').tabIndex = -1;
      list.appendChild(c);
    });
    markActive();
  }

  function markActive() {
    $$('[data-card]', list).forEach((b) => b.classList.toggle('is-active', b.dataset.card === current));
  }

  function times() {
    if (!current) return;
    const card = t('life.cards').find((c) => c.id === current);
    const n = normalWpm();
    const wpm = reader.player.wpm;
    $('[data-life=normal]', panel).textContent = `~${formatDuration(card.words / n.wpm)}`;
    $('[data-life=orp]', panel).textContent = `~${formatDuration(orpigoMinutes(card.words, wpm, tokenize(card.text)))}`;
    $('[data-life=assume]', panel).textContent = t('life.assume', {
      w: fmtNum(card.words), n: n.wpm, src: n.measured ? t('common.measured') : t('common.default'),
    });
  }

  function open(id, { autoplay = true } = {}) {
    current = id;
    const card = t('life.cards').find((c) => c.id === id);
    panel.hidden = false;
    $('[data-life=title]', panel).textContent = `${card.title} · ${card.kind}`;
    if (!reader) reader = createReader($('#life-reader', panel), { text: card.text, wpm: 400, onWpm: times, label: card.title });
    else reader.load(card.text, { autoplay: false, label: card.title });
    if (autoplay && !store.reducedMotion()) reader.play();
    marquee.classList.add('is-held');
    markActive();
    times();
  }

  list.addEventListener('click', (e) => {
    const b = e.target.closest('[data-card]');
    if (!b) return;
    open(b.dataset.card);
    panel.scrollIntoView({ block: 'nearest', behavior: store.reducedMotion() ? 'auto' : 'smooth' });
  });

  store.subscribe((s, patch) => { if ('normalWpm' in patch || 'smartPauses' in patch) times(); });
  onLang(() => { loopify(); if (current) open(current, { autoplay: false }); });
  loopify();
}
