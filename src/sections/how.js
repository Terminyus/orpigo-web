// 2 · "Your eyes actually jump". A red fixation dot hops across a paragraph
// (forward saccades, line sweeps, occasional regressions) while a counter
// tallies them. On scroll the stage splits: on the right the eye stays still
// and words come to it, and its counters stay at zero.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createReader } from '../rsvp/index.js';
import { t, onLang } from '../i18n/index.js';
import { reducedMotion } from '../state.js';
import { $, $$, esc } from './util.js';

gsap.registerPlugin(ScrollTrigger);

const FIXATION_MS = 240;
const SACCADE_MS = 45;

// Deterministic pseudo-random so the walk looks natural but repeats the same way.
function rng(seed = 7) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

/** Build a fixation path over the words of a laid-out paragraph. */
function plan(paper, para) {
  const box = paper.getBoundingClientRect();
  const words = $$('span', para).map((s) => {
    const r = s.getBoundingClientRect();
    return { x: r.left - box.left + r.width * 0.4, y: r.top - box.top + r.height * 0.55, top: Math.round(r.top), len: s.textContent.length };
  });
  const rand = rng();
  const path = [];
  let prevTop = null;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (w.len <= 3 && rand() < 0.5 && i > 0) continue; // short words are often skipped
    const kind = prevTop === null ? 'start' : w.top !== prevTop ? 'sweep' : 'jump';
    path.push({ ...w, kind });
    prevTop = w.top;
    if (kind === 'jump' && rand() < 0.14 && path.length > 2) {
      const back = path[path.length - 2];
      path.push({ ...back, kind: 'back' });
      path.push({ ...w, kind: 'jump' });
    }
  }
  return path;
}

export function initHow() {
  const sec = $('#how');
  if (!sec) return;
  const paper = $('.how__paper', sec);
  const para = $('.how__para', sec);
  const dot = $('.how__dot', sec);
  const marks = $('.how__marks', sec);
  const out = { jumps: $('[data-stat=jumps]', sec), back: $('[data-stat=back]', sec) };
  const reduce = reducedMotion();

  const reader = createReader($('#how-reader'), { text: t('how.paragraph'), wpm: 220, controls: 'compact', loop: true, autoplay: !reduce && innerWidth < 900 });

  let path = [];
  let timer = null;
  let running = false;

  function wrapWords() {
    para.innerHTML = para.textContent.trim().split(/\s+/).map((w) => `<span>${esc(w)}</span>`).join(' ');
  }

  function layout() {
    path = plan(paper, para);
    if (reduce) {
      marks.innerHTML = path.map((p) => `<i class="${p.kind === 'back' ? 'is-back' : ''}" style="transform:translate(${p.x}px,${p.y}px)"></i>`).join('');
    }
  }

  function run() {
    if (running || reduce) return;
    running = true;
    let i = 0;
    let jumps = 0;
    let back = 0;
    const step = () => {
      if (!running) return;
      if (i >= path.length) { i = 0; jumps = 0; back = 0; }
      const p = path[i];
      if (p.kind === 'back') back++;
      else if (p.kind !== 'start') jumps++;
      dot.classList.toggle('is-back', p.kind === 'back');
      dot.style.transitionDuration = `${p.kind === 'sweep' ? SACCADE_MS * 2 : SACCADE_MS}ms`;
      dot.style.transform = `translate(${p.x}px, ${p.y}px)`;
      out.jumps.textContent = jumps;
      out.back.textContent = back;
      i++;
      timer = setTimeout(step, FIXATION_MS + (i >= path.length ? 1200 : 0));
    };
    step();
  }

  function stop() { running = false; clearTimeout(timer); }

  wrapWords();
  requestAnimationFrame(layout);
  document.fonts?.ready.then(layout);
  new ResizeObserver(() => layout()).observe(paper);
  new IntersectionObserver(([e]) => (e.isIntersecting ? run() : stop()), { threshold: 0.2 }).observe(paper);

  onLang(() => {
    stop();
    para.textContent = t('how.paragraph');
    wrapWords();
    layout();
    reader.load(t('how.paragraph'));
    run();
  });

  // Scroll scene: the single column splits into "classic | Orpigo".
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
    sec.classList.add('is-scene');
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: $('.how__pin', sec),
        start: 'top top',
        end: '+=110%',
        pin: true,
        scrub: 0.6,
        onUpdate: (st) => { if (st.progress > 0.55 && !reader.player.playing && reader.player.status === 'ready') reader.play(); },
      },
    });
    tl.fromTo('.how__col--classic', { flexBasis: '100%' }, { flexBasis: '50%', ease: 'none', onUpdate: () => layout() })
      .fromTo('.how__col--orp', { flexBasis: '0%', opacity: 0 }, { flexBasis: '50%', opacity: 1, ease: 'none' }, 0)
      .fromTo('.how__after', { opacity: 0, y: 20 }, { opacity: 1, y: 0 }, 0.6);
    return () => sec.classList.remove('is-scene');
  });
}
