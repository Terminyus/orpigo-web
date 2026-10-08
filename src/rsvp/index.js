// createReader(): the single entry point every demo on the site uses.
import { createPlayer } from './player.js';
import { createView } from './view.js';
import { tokenize } from './tokenize.js';
import { MIN_WPM, MAX_WPM, DEFAULT_WPM } from './timing.js';
import * as store from '../state.js';
import { t, onLang } from '../i18n/index.js';

export { getORPIndex, splitAtORP } from './orp.js';
export { getDelayMs, totalDurationMs, estimatedMinutes, MIN_WPM, MAX_WPM, DEFAULT_WPM } from './timing.js';
export { tokenize };

const icon = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 7 6 12l5 5M18 7l-5 5 5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  fwd: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13 7 5 5-5 5M6 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

/**
 * @param {HTMLElement} root
 * @param {{text?:string, words?:string[], wpm?:number, controls?:boolean|'compact',
 *          autoplay?:boolean, loop?:boolean, label?:string, linked?:boolean,
 *          onWord?:Function, onState?:Function}} o
 */
export function createReader(root, o = {}) {
  const words = o.words ?? tokenize(o.text ?? '');
  root.classList.add('reader');
  root.innerHTML = `
    <div class="reader__stage"></div>
    <p class="sr-only reader__text"></p>
    ${o.controls === false ? '' : `
    <div class="reader__progress" aria-hidden="true"><i></i></div>
    <div class="reader__controls">
      <button type="button" class="btn-icon" data-act="back"></button>
      <button type="button" class="btn-play" data-act="toggle"></button>
      <button type="button" class="btn-icon" data-act="fwd"></button>
      ${o.controls === 'compact' ? '' : `
      <label class="wpm">
        <span class="wpm__value"><output></output> <small>WPM</small></span>
        <input type="range" min="${MIN_WPM}" max="${MAX_WPM}" step="10">
      </label>`}
    </div>`}`;

  const stage = root.querySelector('.reader__stage');
  const srText = root.querySelector('.reader__text');
  const btnPlay = root.querySelector('[data-act=toggle]');
  const btnBack = root.querySelector('[data-act=back]');
  const btnFwd = root.querySelector('[data-act=fwd]');
  const range = root.querySelector('input[type=range]');
  const out = root.querySelector('output');
  const bar = root.querySelector('.reader__progress i');

  const view = createView(stage);
  stage.tabIndex = 0;
  stage.setAttribute('role', 'group');

  const player = createPlayer({
    words,
    wpm: o.wpm ?? DEFAULT_WPM,
    smartPauses: o.linked === false ? true : store.get('smartPauses'),
    onWord: (w, i, n) => {
      view.show(w);
      if (bar) bar.style.transform = `scaleX(${n > 1 ? i / (n - 1) : 0})`;
      o.onWord?.(w, i, n);
    },
    onState: (s) => {
      paint();
      if (s === 'completed' && o.loop && !userPaused) setTimeout(() => !userPaused && player.play(), 1200);
      o.onState?.(s);
    },
  });

  let userPaused = false;

  function labels() {
    stage.setAttribute('aria-label', o.label ?? t('reader.label'));
    srText.textContent = player.words.join(' ');
    btnBack?.setAttribute('aria-label', t('reader.back'));
    btnFwd?.setAttribute('aria-label', t('reader.fwd'));
    if (range) range.setAttribute('aria-label', t('reader.speed'));
    paint();
  }

  function paint() {
    if (!btnPlay) return;
    const playing = player.playing;
    btnPlay.innerHTML = playing ? icon.pause : icon.play;
    btnPlay.setAttribute('aria-label', playing ? t('reader.pause') : t('reader.play'));
    btnPlay.setAttribute('aria-pressed', String(playing));
    root.classList.toggle('is-playing', playing);
  }

  function syncWpm() {
    if (range) {
      range.value = player.wpm;
      range.style.setProperty('--p', `${((player.wpm - MIN_WPM) / (MAX_WPM - MIN_WPM)) * 100}%`);
    }
    if (out) out.textContent = player.wpm;
  }

  if (btnBack) btnBack.innerHTML = icon.back;
  if (btnFwd) btnFwd.innerHTML = icon.fwd;
  btnPlay?.addEventListener('click', () => toggle());
  btnBack?.addEventListener('click', () => player.prevSentence());
  btnFwd?.addEventListener('click', () => player.nextSentence());
  range?.addEventListener('input', () => { player.setWpm(+range.value); syncWpm(); o.onWpm?.(player.wpm); });

  function toggle() {
    userPaused = player.playing;
    player.toggle();
  }

  stage.addEventListener('click', toggle);
  root.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;
    const k = e.key;
    if (k === ' ' || k === 'k') { if (e.target.closest('button')) return; e.preventDefault(); toggle(); }
    else if (k === 'ArrowLeft') { e.preventDefault(); player.seek(e.shiftKey ? -10 : -1); }
    else if (k === 'ArrowRight') { e.preventDefault(); player.seek(e.shiftKey ? 10 : 1); }
    else if (k === 'ArrowUp' && e.target === stage) { e.preventDefault(); setWpm(player.wpm + 25); }
    else if (k === 'ArrowDown' && e.target === stage) { e.preventDefault(); setWpm(player.wpm - 25); }
  });

  function setWpm(w) { player.setWpm(w); syncWpm(); o.onWpm?.(player.wpm); }

  // Pause when hidden or scrolled away; resume only if we were auto-playing.
  let wasAuto = false;
  const onVis = () => {
    if (document.hidden && player.playing) { wasAuto = !userPaused; player.pause(); }
    else if (!document.hidden && wasAuto && inView) { wasAuto = false; player.play(); }
  };
  document.addEventListener('visibilitychange', onVis);
  let inView = true;
  const io = new IntersectionObserver(([en]) => {
    inView = en.isIntersecting;
    if (!inView && player.playing) { wasAuto = !userPaused; player.pause(); }
    else if (inView && wasAuto && !document.hidden) { wasAuto = false; player.play(); }
  }, { threshold: 0.15 });
  io.observe(root);

  const offStore = o.linked === false ? null : store.subscribe((s, patch) => {
    if ('smartPauses' in patch) player.setSmartPauses(s.smartPauses);
    if ('fontSize' in patch || 'uiFont' in patch) requestAnimationFrame(() => view.relayout());
  });
  const offLang = onLang(labels);

  labels();
  syncWpm();
  view.show(words[0] ?? '', { fade: false });
  if (o.autoplay && !store.reducedMotion()) { wasAuto = true; player.play(); }

  return {
    player,
    view,
    root,
    play() { userPaused = false; player.play(); },
    pause() { userPaused = true; player.pause(); },
    toggle,
    setWpm,
    load(textOrWords, { autoplay = false, label } = {}) {
      const w = Array.isArray(textOrWords) ? textOrWords : tokenize(textOrWords);
      if (label) o.label = label;
      userPaused = false;
      player.setWords(w, { autoplay });
      labels();
    },
    destroy() {
      player.destroy(); view.destroy(); io.disconnect(); offStore?.(); offLang();
      document.removeEventListener('visibilitychange', onVis);
    },
  };
}
