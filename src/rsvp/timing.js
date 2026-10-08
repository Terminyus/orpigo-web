// Port of SpeedReaderEngine.getDelayMs + AppConstants (lib/core/constants/app_constants.dart).

export const MIN_WPM = 100;
export const MAX_WPM = 1000;
export const DEFAULT_WPM = 250;
export const SENTENCE_END_MULTIPLIER = 2.0;
export const CLAUSE_PAUSE_MULTIPLIER = 1.5;
export const LONG_WORD_MULTIPLIER = 1.3;
export const LONG_WORD_THRESHOLD = 9;

// Dart's double.round() rounds half away from zero; Math.round rounds half up.
// All values here are positive, so they agree.
const round = Math.round;

export function getDelayMs(word, wpm, smartPauses = true) {
  const base = round(60000 / wpm);
  if (!smartPauses) return base;
  if (/[.!?…]$/u.test(word)) return round(base * SENTENCE_END_MULTIPLIER);
  if (/[,;:—]$/u.test(word)) return round(base * CLAUSE_PAUSE_MULTIPLIER);
  if (word.length > LONG_WORD_THRESHOLD) return round(base * LONG_WORD_MULTIPLIER);
  return base;
}

export function clampWpm(wpm) {
  return Math.min(MAX_WPM, Math.max(MIN_WPM, Math.round(wpm)));
}

export function estimatedMinutes(wordCount, wpm) {
  return wpm <= 0 ? 0 : wordCount / wpm;
}

/** Total playback time in ms for a word list, including smart pauses. */
export function totalDurationMs(words, wpm, smartPauses = true) {
  let t = 0;
  for (const w of words) t += getDelayMs(w, wpm, smartPauses);
  return t;
}

export function isSentenceEnd(word) {
  return /[.!?]$/.test(word);
}
