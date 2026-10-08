// 4 · Measure your speed. (a) normal reading with a stopwatch, (b) RSVP a bit
// above that speed. Both results are the visitor's own measurements; the
// Orpigo number is the effective speed over real playing time, pauses included.
import { createReader, tokenize } from '../rsvp/index.js';
import { t, onLang } from '../i18n/index.js';
import * as store from '../state.js';
import { $, $$, esc, countTo } from './util.js';

export function initTest() {
  const box = $('#test .test');
  if (!box) return;
  const panels = Object.fromEntries($$('[data-panel]', box).map((p) => [p.dataset.panel, p]));
  let state = {};
  let reader = null;

  function show(name) {
    for (const [k, el] of Object.entries(panels)) el.hidden = k !== name;
    box.dataset.state = name;
    const focusable = panels[name].querySelector('button, [tabindex]');
    if (name !== 'intro') panels[name].querySelector('.test__step')?.setAttribute('tabindex', '-1');
    (panels[name].querySelector('.test__step') || focusable)?.focus({ preventScroll: true });
  }

  function quiz(which, next) {
    const q = t(`test.${which}`);
    const fs = $('.quiz', panels.qa);
    fs.querySelector('legend').textContent = q.q;
    const opts = fs.querySelector('.quiz__opts');
    opts.innerHTML = q.options.map((o, i) => `<button type="button" class="quiz__opt" data-i="${i}">${esc(o)}</button>`).join('');
    opts.onclick = (e) => {
      const b = e.target.closest('[data-i]');
      if (!b) return;
      state.answers.push(+b.dataset.i === q.answer);
      next();
    };
    $('[data-act=skip]', panels.qa).onclick = () => { state.answers.push(null); next(); };
    show('qa');
  }

  function startRsvp() {
    const start = Math.round(Math.min(1000, Math.max(150, state.normal * 1.2)) / 10) * 10;
    const words = tokenize(t('test.b.text'));
    let playMs = 0;
    let since = 0;
    reader?.destroy();
    reader = createReader($('#test-reader'), {
      words,
      wpm: start,
      onState: (s) => {
        const now = performance.now();
        if (s === 'playing') since = now;
        else if (since) { playMs += now - since; since = 0; }
        if (s === 'completed') {
          state.orp = Math.round(words.length / (playMs / 60000));
          quiz('b', result);
        }
      },
    });
    show('rsvp');
    reader.root.querySelector('.reader__stage .rsvp').focus();
  }

  function result() {
    show('result');
    store.set({ normalWpm: state.normal });
    countTo($('[data-out=normal]', box), state.normal);
    countTo($('[data-out=orp]', box), state.orp);
    const answered = state.answers.filter((a) => a !== null);
    const comp = $('[data-out=comp]', box);
    comp.textContent = answered.length ? t('test.comprehension', { c: answered.filter(Boolean).length, t: answered.length }) : '';
    $('[data-out=warn]', box).hidden = state.normal < 900;
  }

  $('[data-act=start]', box).addEventListener('click', () => {
    state = { answers: [] };
    show('read');
    state.t0 = performance.now();
  });
  $('[data-act=done]', box).addEventListener('click', () => {
    const minutes = (performance.now() - state.t0) / 60000;
    const n = tokenize(t('test.a.text')).length;
    state.normal = Math.max(50, Math.round(n / minutes));
    quiz('a', startRsvp);
  });
  $('[data-act=again]', box).addEventListener('click', () => { reader?.destroy(); reader = null; show('intro'); });

  onLang(() => { if (box.dataset.state !== 'intro' && box.dataset.state !== 'result') { reader?.destroy(); reader = null; show('intro'); } });
}
