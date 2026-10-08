import { describe, it, expect } from 'vitest';
import { getORPIndex, splitAtORP } from '../src/rsvp/orp.js';

describe('getORPIndex (port of SpeedReaderEngine.getORPIndex)', () => {
  const cases = [
    ['a', 0], ['ab', 1], ['oku', 1], ['okul', 1], ['kitap', 1], ['okumalar', 1],
    ['okumaları', 2], ['uygulamasına', 2], ['okunabilirlik', 3], ['anlaşılabilirlikten', 3],
  ];
  it.each(cases)('%s → %i', (w, i) => expect(getORPIndex(w)).toBe(i));

  it('ignores punctuation when counting length', () => {
    expect(getORPIndex('geldiniz!')).toBe(1); // 8 letters
    expect(getORPIndex('"okumalar",')).toBe(1);
    expect(getORPIndex('okumaları.')).toBe(2); // 9 letters
  });

  it('counts Turkish letters and digits as letters', () => {
    expect(getORPIndex('çığ')).toBe(1);
    expect(getORPIndex('ışığında')).toBe(1);
    expect(getORPIndex('2026')).toBe(1);
  });

  it('falls back to raw length for punctuation-only tokens', () => {
    expect(getORPIndex('—')).toBe(0);
    expect(getORPIndex('...')).toBe(1);
  });
});

describe('splitAtORP', () => {
  it('splits at the pivot', () => {
    expect(splitAtORP('Orpigo')).toEqual({ before: 'O', pivot: 'r', after: 'pigo' });
    expect(splitAtORP('a')).toEqual({ before: '', pivot: 'a', after: '' });
  });
  it('applies the index to the raw word, like the app', () => {
    expect(splitAtORP('(merhaba')).toEqual({ before: '(', pivot: 'm', after: 'erhaba' });
  });
  it('handles empty input', () => {
    expect(splitAtORP('')).toEqual({ before: '', pivot: ' ', after: '' });
  });
});
