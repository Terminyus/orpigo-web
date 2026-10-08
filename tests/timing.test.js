import { describe, it, expect } from 'vitest';
import { getDelayMs, clampWpm, totalDurationMs } from '../src/rsvp/timing.js';
import { tokenize } from '../src/rsvp/tokenize.js';

describe('getDelayMs (port of SpeedReaderEngine.getDelayMs)', () => {
  it('base delay is 60000 / wpm rounded', () => {
    expect(getDelayMs('kitap', 250)).toBe(240);
    expect(getDelayMs('kitap', 300)).toBe(200);
    expect(getDelayMs('kitap', 700)).toBe(86);
  });
  it('sentence end ×2.0', () => {
    for (const w of ['bitti.', 'ne!', 'mi?', 'sonra…']) expect(getDelayMs(w, 250)).toBe(480);
  });
  it('clause pause ×1.5', () => {
    for (const w of ['ama,', 'şöyle:', 'bir;', 've—']) expect(getDelayMs(w, 250)).toBe(360);
  });
  it('long word (> 9 raw chars) ×1.3', () => {
    expect(getDelayMs('okumaları', 250)).toBe(240); // 9 chars: not long
    expect(getDelayMs('uygulaması', 250)).toBe(312); // 10 chars
  });
  it('multipliers do not stack; punctuation wins', () => {
    expect(getDelayMs('uygulamasına.', 250)).toBe(480);
  });
  it('smart pauses off → always base', () => {
    expect(getDelayMs('bitti.', 250, false)).toBe(240);
    expect(getDelayMs('uygulamasına', 250, false)).toBe(240);
  });
});

describe('helpers', () => {
  it('clamps WPM to 100–1000', () => {
    expect(clampWpm(20)).toBe(100);
    expect(clampWpm(5000)).toBe(1000);
    expect(clampWpm(333.4)).toBe(333);
  });
  it('tokenizes on any whitespace', () => {
    expect(tokenize('  Bir\niki\t üç  ')).toEqual(['Bir', 'iki', 'üç']);
  });
  it('sums durations', () => {
    expect(totalDurationMs(['a', 'b.'], 250)).toBe(720);
  });
});
