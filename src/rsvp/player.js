// requestAnimationFrame-driven RSVP player.
// Behaviour mirrors lib/providers/reader_provider.dart: the visible word stays
// for getDelayMs(word) and then the next one appears; at the end the player
// stops as "completed" and the next play() restarts from the first word.
//
// Timing is drift-free: each deadline is the previous deadline plus the next
// delay, so frame jitter never accumulates. If the page was throttled (hidden
// tab, debugger) we resync instead of bursting through the backlog.

import { getDelayMs, clampWpm, isSentenceEnd, DEFAULT_WPM } from './timing.js';

const MAX_LAG_MS = 250;

export function createPlayer({
  words = [],
  wpm = DEFAULT_WPM,
  smartPauses = true,
  now = () => performance.now(),
  raf = (cb) => requestAnimationFrame(cb),
  caf = (id) => cancelAnimationFrame(id),
  onWord = () => {},
  onState = () => {},
} = {}) {
  const s = { words, wpm: clampWpm(wpm), smartPauses, index: 0, status: 'ready' };
  let shownAt = 0; // when the current word became visible
  let nextAt = 0; // when the next word is due
  let pausedLeft = null; // remaining dwell when paused mid-word
  let frame = null;

  const delayOf = (i) => getDelayMs(s.words[i] ?? '', s.wpm, s.smartPauses);
  const emitWord = () => onWord(s.words[s.index] ?? '', s.index, s.words.length);
  const setStatus = (st) => {
    if (s.status === st) return;
    s.status = st;
    onState(st);
  };

  function loop() {
    frame = null;
    if (s.status !== 'playing') return;
    const t = now();
    if (t - nextAt > MAX_LAG_MS) nextAt = t; // resync after throttling
    let advanced = false;
    while (s.status === 'playing' && t >= nextAt) {
      if (s.index >= s.words.length - 1) {
        setStatus('completed');
        break;
      }
      s.index += 1;
      shownAt = nextAt;
      nextAt += delayOf(s.index);
      advanced = true;
    }
    if (advanced) emitWord();
    if (s.status === 'playing') frame = raf(loop);
  }

  function cancel() {
    if (frame !== null) caf(frame);
    frame = null;
  }

  function play() {
    if (!s.words.length || s.status === 'playing') return;
    if (s.status === 'completed') {
      s.index = 0;
      pausedLeft = null;
    }
    const t = now();
    shownAt = t;
    nextAt = t + (pausedLeft ?? delayOf(s.index));
    pausedLeft = null;
    setStatus('playing');
    emitWord();
    frame = raf(loop);
  }

  function pause() {
    if (s.status !== 'playing') return;
    cancel();
    pausedLeft = Math.max(0, nextAt - now());
    setStatus('paused');
  }

  function toggle() {
    s.status === 'playing' ? pause() : play();
  }

  function seekTo(i) {
    const last = Math.max(0, s.words.length - 1);
    s.index = Math.min(last, Math.max(0, i));
    pausedLeft = null;
    if (s.status === 'completed') setStatus('paused');
    if (s.status === 'playing') {
      shownAt = now();
      nextAt = shownAt + delayOf(s.index);
    }
    emitWord();
  }

  const seek = (delta) => seekTo(s.index + delta);

  // Same boundaries as ReaderNotifier.nextSentence / prevSentence.
  function nextSentence() {
    for (let i = s.index + 1; i < s.words.length; i++) {
      if (isSentenceEnd(s.words[i])) return seekTo(i + 1);
    }
    seekTo(s.words.length - 1);
  }

  function prevSentence() {
    for (let i = s.index - 2; i > 0; i--) {
      if (isSentenceEnd(s.words[i])) return seekTo(i + 1);
    }
    seekTo(0);
  }

  function setWpm(wpm) {
    s.wpm = clampWpm(wpm);
    if (s.status === 'playing') nextAt = shownAt + delayOf(s.index);
    else pausedLeft = null;
  }

  function setSmartPauses(on) {
    s.smartPauses = !!on;
  }

  function setWords(words, { autoplay = false } = {}) {
    cancel();
    s.words = words;
    s.index = 0;
    pausedLeft = null;
    s.status = 'ready';
    onState('ready');
    emitWord();
    if (autoplay) play();
  }

  function destroy() {
    cancel();
  }

  return {
    play, pause, toggle, seek, seekTo, nextSentence, prevSentence,
    setWpm, setSmartPauses, setWords, destroy,
    get index() { return s.index; },
    get word() { return s.words[s.index] ?? ''; },
    get words() { return s.words; },
    get wpm() { return s.wpm; },
    get smartPauses() { return s.smartPauses; },
    get status() { return s.status; },
    get playing() { return s.status === 'playing'; },
  };
}
