// Shared site state (theme, reader font size, smart pauses, measured speed).
// Persisted to localStorage only as a per-visitor convenience.

const KEY = 'orpigo-web:v1';
const defaults = { theme: null, fontSize: 42, uiFont: 'Inter', smartPauses: true, normalWpm: null };

function load() {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...defaults }; }
}

const state = load();
const subs = new Set();

export function get(k) { return state[k]; }

export function set(patch) {
  Object.assign(state, patch);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
  for (const fn of subs) fn(state, patch);
}

export function subscribe(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

export const reducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
