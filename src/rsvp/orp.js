// Port of lib/core/speed_reader_engine.dart (getORPIndex, splitAtORP).
// Keep in sync with the app: the index is computed on letters/digits only,
// but applied to the raw word (so "(merhaba" pivots on "m").

const NON_ALNUM = /[^\p{L}\p{N}]/gu;

export function getORPIndex(word) {
  const clean = word.replace(NON_ALNUM, '');
  const len = clean.length === 0 ? word.length : clean.length;
  if (len <= 1) return 0;
  if (len <= 4) return 1;
  if (len <= 8) return 1;
  if (len <= 12) return 2;
  return 3;
}

export function splitAtORP(word) {
  if (word.length === 0) return { before: '', pivot: ' ', after: '' };
  // Dart indexes UTF-16 code units; JS strings do too, so slicing matches.
  const i = Math.min(Math.max(getORPIndex(word), 0), word.length - 1);
  return { before: word.slice(0, i), pivot: word[i], after: word.slice(i + 1) };
}
