// DOM view for one RSVP word. The pivot letter's centre is placed exactly on
// the focus line: we measure the rendered text with the real font (canvas
// measureText against the computed font) and translate the word so that
// width(before) + width(pivot) / 2 lands on the stage centre.
// The app draws the word in JetBrains Mono (see docs/brand.md §2).

import { splitAtORP } from './orp.js';

let ctx;
const cache = new Map();

function measure(text, font) {
  if (!text) return 0;
  const key = font + '\u0000' + text;
  let w = cache.get(key);
  if (w === undefined) {
    ctx ??= document.createElement('canvas').getContext('2d');
    ctx.font = font;
    w = ctx.measureText(text).width;
    cache.set(key, w);
  }
  return w;
}

function fontOf(el) {
  const cs = getComputedStyle(el);
  return `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
}

if (typeof document !== 'undefined' && document.fonts) {
  document.fonts.addEventListener?.('loadingdone', () => cache.clear());
}

export function createView(stage) {
  stage.classList.add('rsvp');
  stage.insertAdjacentHTML(
    'beforeend',
    `<div class="rsvp__guide" aria-hidden="true"><i class="rsvp__rail rsvp__rail--top"></i><i class="rsvp__line"></i><i class="rsvp__rail rsvp__rail--bottom"></i></div>
     <div class="rsvp__word" aria-hidden="true"><span class="rsvp__before"></span><span class="rsvp__pivot"></span><span class="rsvp__after"></span></div>`,
  );
  const wordEl = stage.querySelector('.rsvp__word');
  const [beforeEl, pivotEl, afterEl] = wordEl.children;
  let current = '';

  function layout() {
    const fBody = fontOf(beforeEl);
    const fPivot = fontOf(pivotEl);
    const b = measure(beforeEl.textContent, fBody);
    const p = measure(pivotEl.textContent, fPivot);
    const a = measure(afterEl.textContent, fBody);
    const anchor = b + p / 2;
    // Like the app's FittedBox(scaleDown): shrink words that would overflow,
    // scaling around the pivot so it never leaves the focus line.
    const half = stage.clientWidth / 2 - 12;
    const reach = Math.max(anchor, b + p + a - anchor);
    const scale = half > 0 && reach > half ? half / reach : 1;
    wordEl.style.transformOrigin = `${anchor}px 50%`;
    wordEl.style.transform = `translate3d(${-anchor}px,-50%,0) scale(${scale})`;
  }

  function show(word, { fade = true } = {}) {
    current = word;
    const { before, pivot, after } = splitAtORP(word);
    beforeEl.textContent = before;
    pivotEl.textContent = word ? pivot : '';
    afterEl.textContent = after;
    layout();
    if (fade) {
      wordEl.classList.remove('is-swap');
      void wordEl.offsetWidth; // restart the 60 ms swap fade
      wordEl.classList.add('is-swap');
    }
  }

  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => layout()) : null;
  ro?.observe(stage);
  document.fonts?.ready.then(() => { cache.clear(); layout(); });

  return {
    show,
    relayout() { cache.clear(); layout(); },
    get word() { return current; },
    destroy() { ro?.disconnect(); },
  };
}
