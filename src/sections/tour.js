// 10 · App tour. A sticky phone; the real screen changes as each step scrolls
// into the middle of the viewport.
import { onLang } from '../i18n/index.js';
import { $, $$ } from './util.js';

export function initTour() {
  const sec = $('#tour');
  if (!sec) return;
  let io;
  function bind() {
    io?.disconnect();
    const steps = $$('.tour__step', sec);
    const set = (i) => {
      steps.forEach((s) => s.classList.toggle('is-active', +s.dataset.step === i));
      $$('.tour__shot', sec).forEach((p) => {
        const on = +p.dataset.shot === i;
        p.classList.toggle('is-active', on);
        p.classList.toggle('is-past', +p.dataset.shot < i);
        if (on) p.querySelector('img').loading = 'eager';
      });
    };
    io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) set(+e.target.dataset.step);
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => io.observe(s));
    set(0);
  }
  bind();
  onLang(bind);
}
