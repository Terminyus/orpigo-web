// 14 · Final CTA. The page ends the way it began: the focus line returns and
// the slogan reads itself, word by word.
import { createReader } from '../rsvp/index.js';
import { t, onLang } from '../i18n/index.js';
import { reducedMotion } from '../state.js';
import { $ } from './util.js';

export function initFinal() {
  const el = $('#final-reader');
  if (!el) return;
  const reader = createReader(el, { text: t('final.text'), wpm: 200, controls: 'compact', loop: true, autoplay: !reducedMotion() });
  onLang(() => reader.load(t('final.text'), { autoplay: !reducedMotion() }));
}
