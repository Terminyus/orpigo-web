import { t, getLang } from '../i18n/index.js';
import * as store from '../state.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Published average for adult silent reading (Brysbaert, 2019). Labelled "default" in the UI. */
export const DEFAULT_NORMAL_WPM = 238;

export function normalWpm() {
  const m = store.get('normalWpm');
  return m ? { wpm: m, measured: true } : { wpm: DEFAULT_NORMAL_WPM, measured: false };
}

/** "1 sa 12 dk", "14 dk", "40 sn" */
export function formatDuration(minutes) {
  const s = Math.max(0, Math.round(minutes * 60));
  if (s < 60) return `${s} ${t('common.sec')}`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} ${t('common.min')}`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} ${t('common.hour')} ${r} ${t('common.min')}` : `${h} ${t('common.hour')}`;
}

export const fmtNum = (n) => new Intl.NumberFormat(getLang() === 'tr' ? 'tr-TR' : 'en-GB').format(n);

/** Adds .is-in once an element scrolls into view (CSS handles the transition). */
export function reveal(root = document) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -10% 0px' });
  $$('[data-reveal]', root).forEach((el) => io.observe(el));
}

/** Animated number. Respects reduced motion. */
export function countTo(el, to, { dur = 900, format = (v) => fmtNum(Math.round(v)) } = {}) {
  const from = +(el.dataset.v || 0);
  el.dataset.v = to;
  if (store.reducedMotion() || from === to) { el.textContent = format(to); return; }
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = format(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Estimated Orpigo minutes for `words` at `wpm`, scaled by the smart-pause overhead of a sample text. */
export function orpigoMinutes(words, wpm, sampleWords, smartPauses = store.get('smartPauses')) {
  return (words / wpm) * pauseFactor(sampleWords, wpm, smartPauses);
}

import { getDelayMs } from '../rsvp/index.js';
export function pauseFactor(sample, wpm, smart = true) {
  if (!sample?.length) return 1;
  let total = 0;
  for (const w of sample) total += getDelayMs(w, wpm, smart);
  return total / (sample.length * Math.round(60000 / wpm));
}
