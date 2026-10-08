// 3 · ORP. A word first sits centred as a whole (the focus point drifts from
// word to word), its letters pull apart, the ORP letter turns red and slides
// onto the focus line, then the letters close up around it. Scrubbed by scroll.
// Below: type any word and see which letter the app would pick.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getORPIndex } from '../rsvp/index.js';
import { createView } from '../rsvp/view.js';
import { t, onLang } from '../i18n/index.js';
import { reducedMotion } from '../state.js';
import { $, $$, esc } from './util.js';

gsap.registerPlugin(ScrollTrigger);

export function initOrp() {
  const sec = $('#orp');
  if (!sec) return;
  const wordEl = $('.orp-demo__word', sec);
  const caps = { a: $('[data-cap=a]', sec), b: $('[data-cap=b]', sec) };
  let tl;

  function build() {
    tl?.scrollTrigger?.kill();
    tl?.kill();
    const word = t('orp.word');
    const p = getORPIndex(word);
    wordEl.innerHTML = [...word].map((ch, i) => `<span class="${i === p ? 'is-pivot' : ''}">${esc(ch)}</span>`).join('');
    const spans = $$('span', wordEl);
    // Mono font: all advances are equal, but measure anyway in case of fallback.
    const widths = spans.map((s) => s.getBoundingClientRect().width);
    const total = widths.reduce((a, b) => a + b, 0);
    const lefts = widths.map((_, i) => widths.slice(0, i).reduce((a, b) => a + b, 0));
    const pivotC = lefts[p] + widths[p] / 2;
    const gap = Math.max(6, widths[0] * 0.35);
    const A = (i) => lefts[i] - total / 2;               // whole word centred
    const B = (i) => lefts[i] - pivotC;                   // pivot centred
    spans.forEach((s, i) => gsap.set(s, { x: A(i) }));

    if (reducedMotion()) {
      spans.forEach((s, i) => gsap.set(s, { x: B(i) }));
      wordEl.classList.add('is-aligned');
      caps.a.classList.add('is-on'); caps.b.classList.add('is-on');
      return;
    }
    tl = gsap.timeline({
      scrollTrigger: { trigger: $('.orp-demo', sec), start: 'top 75%', end: 'bottom 35%', scrub: 0.5 },
      defaults: { ease: 'power2.inOut' },
    });
    tl.to(spans, { x: (i) => A(i) + (i - (spans.length - 1) / 2) * gap, duration: 1 })
      .to(spans, { x: (i) => B(i) + (i - p) * gap, duration: 1.2 })
      .to(spans, { x: (i) => B(i), duration: 1 })
      .eventCallback('onUpdate', () => {
        const k = tl.progress();
        wordEl.classList.toggle('is-aligned', k > 0.38);
        caps.a.classList.toggle('is-on', k <= 0.38);
        caps.b.classList.toggle('is-on', k > 0.38);
      });
    caps.a.classList.add('is-on');
  }

  // Live "type a word"
  const input = $('#orp-input', sec);
  const view = createView($('.orp-try__view', sec));
  const live = $('.orp-try__live', sec);
  function update() {
    const w = input.value.trim().split(/\s+/)[0] || t('orp.tryPlaceholder').replace(/^.*?\s/, '');
    view.show(w, { fade: false });
    const n = w.replace(/[^\p{L}\p{N}]/gu, '').length || w.length;
    const k = getORPIndex(w);
    live.textContent = t('orp.live', { n, k: k + 1 });
    const row = n <= 1 ? 0 : n <= 8 ? 1 : n <= 12 ? 2 : 3;
    $$('tr[data-rule]', sec).forEach((tr) => tr.classList.toggle('is-active', +tr.dataset.rule === row));
  }
  input.addEventListener('input', update);

  requestAnimationFrame(() => { build(); update(); });
  document.fonts?.ready.then(() => { build(); view.relayout(); });
  onLang(() => { build(); update(); });
}
