// 8 · Morning briefing. Four short fictional items play back to back; the list
// highlights the item being read, and the estimate follows the chosen speed.
import { createReader, tokenize, totalDurationMs } from '../rsvp/index.js';
import { t, onLang } from '../i18n/index.js';
import * as store from '../state.js';
import { $, $$, esc, formatDuration } from './util.js';

export function initBrief() {
  const sec = $('#brief');
  if (!sec) return;
  const listEl = $('.brief__items', sec);
  let bounds = [];
  let words = [];

  function build() {
    const items = t('brief.items');
    words = [];
    bounds = [];
    for (const it of items) {
      bounds.push(words.length);
      words.push(...tokenize(`${it.title}. ${it.text}`));
    }
    listEl.innerHTML = items.map((it, i) => `<li data-item="${i}">${esc(it.title)}</li>`).join('');
  }

  function estimate() {
    const wpm = reader.player.wpm;
    $('[data-brief=estimate]', sec).textContent = t('brief.estimate', {
      wpm, t: formatDuration(totalDurationMs(words, wpm, store.get('smartPauses')) / 60000),
    });
  }

  build();
  const reader = createReader($('#brief-reader'), {
    words, wpm: 250, onWpm: estimate,
    onWord: (w, i) => {
      let k = 0;
      while (k + 1 < bounds.length && i >= bounds[k + 1]) k++;
      $$('[data-item]', listEl).forEach((li) => li.classList.toggle('is-active', +li.dataset.item === k));
    },
  });
  estimate();
  store.subscribe((s, p) => { if ('smartPauses' in p) estimate(); });
  onLang(() => { build(); reader.load(words); estimate(); });
}
