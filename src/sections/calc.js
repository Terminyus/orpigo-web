// 5 · Reading-time calculator. Bars fill in proportion to time; numbers count.
import { tokenize } from '../rsvp/index.js';
import { t, onLang } from '../i18n/index.js';
import * as store from '../state.js';
import { $, $$, formatDuration, normalWpm, orpigoMinutes, countTo } from './util.js';

const WORDS_PER_PAGE = 250;

export function initCalc() {
  const sec = $('#calc');
  if (!sec) return;
  const q = (k) => $(`[data-calc=${k}]`, sec);
  const amount = $('#calc-amount');
  const normal = $('#calc-normal');
  const orp = $('#calc-orp');
  let unit = 'pages';
  let userSetNormal = false;

  const sample = () => tokenize(t('hero.text') + ' ' + t('test.a.text'));
  const setP = (r) => r.style.setProperty('--p', `${((r.value - r.min) / (r.max - r.min)) * 100}%`);

  function syncNormal() {
    if (userSetNormal) return;
    normal.value = normalWpm().wpm;
  }

  function update() {
    const n = Math.max(0, Math.min(2e6, +amount.value || 0));
    const words = unit === 'pages' ? n * WORDS_PER_PAGE : n;
    const nw = +normal.value;
    const ow = +orp.value;
    const measured = store.get('normalWpm') && !userSetNormal && +normal.value === store.get('normalWpm');
    q('normal').textContent = nw;
    q('orp').textContent = ow;
    q('normalTag').textContent = userSetNormal ? '' : measured ? t('common.measured') : t('common.default');
    q('normalNote').textContent = userSetNormal ? '' : measured ? t('calc.normalMeasured') : t('calc.normalDefault');
    q('perPage').hidden = unit !== 'pages';
    const tn = words / nw;
    const to = orpigoMinutes(words, ow, sample());
    const max = Math.max(tn, to) || 1;
    $('[data-bar=normal]', sec).style.transform = `scaleX(${tn / max})`;
    $('[data-bar=orp]', sec).style.transform = `scaleX(${to / max})`;
    countTo(q('tNormal'), tn, { format: formatDuration, dur: 600 });
    countTo(q('tOrp'), to, { format: formatDuration, dur: 600 });
    const d = tn - to;
    q('diff').textContent = d > 0.05 ? t('calc.diff', { t: formatDuration(d) }) : '';
    [normal, orp].forEach(setP);
  }

  $$('[data-unit]', sec).forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.unit === unit) return;
    const n = +amount.value || 0;
    unit = b.dataset.unit;
    amount.value = unit === 'pages' ? Math.max(1, Math.round(n / WORDS_PER_PAGE)) : n * WORDS_PER_PAGE;
    $$('[data-unit]', sec).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    update();
  }));
  amount.addEventListener('input', update);
  normal.addEventListener('input', () => { userSetNormal = true; update(); });
  orp.addEventListener('input', update);
  store.subscribe((s, patch) => { if ('normalWpm' in patch) { userSetNormal = false; syncNormal(); update(); } if ('smartPauses' in patch) update(); });
  onLang(update);

  syncNormal();
  // Count up the first time the section is seen.
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { update(); io.disconnect(); } }, { threshold: 0.3 });
  io.observe(sec);
  update();
}
