export function tokenize(text) {
  return String(text).split(/\s+/u).filter(Boolean);
}
