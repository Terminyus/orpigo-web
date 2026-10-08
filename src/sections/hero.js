// 1 · HERO — the reader is the first thing you see. The focus axis draws in
// first, then the first word lands on it: "your eye stays here".
import { gsap } from 'gsap';
import { createReader } from '../rsvp/index.js';
import { t, onLang } from '../i18n/index.js';
import { reducedMotion } from '../state.js';

export function initHero() {
  const el = document.getElementById('hero-reader');
  if (!el) return;
  const reduce = reducedMotion();
  const reader = createReader(el, { text: t('hero.text'), wpm: 250, loop: true });
  onLang(() => reader.load(t('hero.text'), { autoplay: !reduce && reader.player.status !== 'paused' }));

  if (reduce) return;
  const tl = gsap.timeline({ delay: 0.15 });
  tl.from('.hero__axis', { scaleY: 0, duration: 0.9, ease: 'power3.inOut' })
    .from('#hero-reader .rsvp__rail', { opacity: 0, scaleX: 0, duration: 0.4, stagger: 0.08 }, '-=0.3')
    .from('#hero-reader .rsvp__word', { opacity: 0, duration: 0.35, clearProps: 'opacity' }, '-=0.1')
    // Copy and phone stay visible from the first paint (LCP); only a small settle.
    .from('.hero__phone .phone', { y: 24, duration: 0.9, ease: 'power3.out' }, 0.2)
    .add(() => reader.play(), '+=0.25');
}
