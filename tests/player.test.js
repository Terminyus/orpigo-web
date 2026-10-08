import { describe, it, expect, beforeEach } from 'vitest';
import { createPlayer } from '../src/rsvp/player.js';
import { getDelayMs, totalDurationMs } from '../src/rsvp/timing.js';

function fakeClock() {
  let t = 0;
  let cbs = new Map();
  let id = 0;
  return {
    now: () => t,
    raf: (cb) => { cbs.set(++id, cb); return id; },
    caf: (i) => cbs.delete(i),
    // advance in frames of `frame` ms, with optional jitter pattern
    run(ms, frame = 16.7, jitter = [0]) {
      const end = t + ms;
      let k = 0;
      while (t < end) {
        t = Math.min(end, t + frame + jitter[k++ % jitter.length]);
        const pending = cbs; cbs = new Map();
        for (const cb of pending.values()) cb();
      }
    },
    get t() { return t; },
  };
}

const text = 'Göz sabit kalır, kelimeler gelir. Orpigo okumayı kolaylaştırır! Deneyin.'.split(' ');

describe('player', () => {
  let c, shown, states, p;
  beforeEach(() => {
    c = fakeClock();
    shown = []; states = [];
    p = createPlayer({
      words: text, wpm: 300, now: c.now, raf: c.raf, caf: c.caf,
      onWord: (w, i) => shown.push([c.t, i]), onState: (s) => states.push(s),
    });
  });

  it('shows each word for its own delay and completes', () => {
    p.play();
    c.run(10000);
    expect(shown.map(([, i]) => i)).toEqual(text.map((_, i) => i));
    expect(p.status).toBe('completed');
    expect(states).toEqual(['playing', 'completed']);
  });

  it('does not drift: word k appears within one frame of its scheduled time', () => {
    const words = Array.from({ length: 1000 }, (_, i) => (i % 7 === 6 ? 'son.' : i % 5 === 4 ? 'uzunkelimeler' : 'kelime'));
    const shownAt = [];
    const q = createPlayer({ words, wpm: 600, now: c.now, raf: c.raf, caf: c.caf, onWord: (_, i) => shownAt[i] = c.t });
    q.play();
    c.run(totalDurationMs(words, 600) + 1000, 16.7, [0, 3, -2, 5, -4]);
    let expected = 0;
    for (let i = 0; i < words.length; i++) {
      expect(shownAt[i] - expected).toBeGreaterThanOrEqual(0);
      expect(shownAt[i] - expected).toBeLessThan(22);
      expected += getDelayMs(words[i], 600);
    }
  });

  it('pause keeps position and remaining dwell', () => {
    p.play();
    c.run(250); // first word 200ms at 300wpm → now on index 1
    expect(p.index).toBe(1);
    p.pause();
    c.run(5000);
    expect(p.index).toBe(1);
    p.play();
    c.run(200);
    expect(p.index).toBe(2);
  });

  it('play after completion restarts from the beginning', () => {
    p.play(); c.run(10000);
    p.play();
    expect(p.index).toBe(0);
    expect(p.status).toBe('playing');
  });

  it('seek clamps to bounds', () => {
    p.seek(-5); expect(p.index).toBe(0);
    p.seek(999); expect(p.index).toBe(text.length - 1);
  });

  it('sentence navigation matches the app', () => {
    p.nextSentence(); // "gelir." is index 4 → jump to 5
    expect(p.index).toBe(5);
    p.nextSentence(); // "kolaylaştırır!" index 7 → 8
    expect(p.index).toBe(8);
    p.prevSentence(); // scans from index 6 down → "gelir." at 4 → 5
    expect(p.index).toBe(5);
    p.prevSentence();
    expect(p.index).toBe(0);
  });

  it('setWpm while playing reschedules the current word', () => {
    p.play();
    c.run(50);
    p.setWpm(100); // current word now lasts 600ms from when it was shown
    c.run(500);
    expect(p.index).toBe(0);
    c.run(100);
    expect(p.index).toBe(1);
  });

  it('resyncs instead of bursting after the tab was throttled', () => {
    p.play();
    c.run(10, 10);
    c.run(3000, 3000); // one huge frame
    expect(p.index).toBe(1); // advanced once, not through the whole backlog
    c.run(17);
    expect(p.index).toBe(1);
  });
});
