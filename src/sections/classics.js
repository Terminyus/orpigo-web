// 7 · Classics. Typographic book cards; the chosen extract plays in the reader.
import { createReader } from '../rsvp/index.js';
import { t, onLang } from '../i18n/index.js';
import { reducedMotion } from '../state.js';
import { $, $$ } from './util.js';

export function initClassics() {
  const sec = $('#classics');
  if (!sec) return;
  let idx = 0;
  const item = () => t('classics.items')[idx];
  const label = () => `${item().author}, ${item().work}`;
  const reader = createReader($('#classics-reader'), { text: item().text, wpm: 260, label: label() });

  function mark() {
    $$('[data-book]', sec).forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.book === idx)));
  }
  sec.addEventListener('click', (e) => {
    const b = e.target.closest('[data-book]');
    if (!b) return;
    idx = +b.dataset.book;
    reader.load(item().text, { autoplay: !reducedMotion(), label: label() });
    mark();
  });
  onLang(() => { idx = 0; reader.load(item().text, { label: label() }); mark(); });
  mark();
}
