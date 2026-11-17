// Shared rendering quality for every WebGL scene (city, space, studio, 2D).
// Level 0 is the full look. A level is only lowered when a computer cannot keep
// a fluid frame rate, so a capable PC never loses any quality. The level learned
// on one page is reused on the others during the visit (session storage only:
// a slow moment never follows the visitor to the next visit).
const KEY = 'portfolio-quality';
try { localStorage.removeItem(KEY); } catch {}

// floor: lowest render resolution allowed; maxRatio: highest pixel ratio.
export const LEVELS = [
  { maxRatio: 1.25, floor: .72, smaa: true,  bloom: true,  shadowRefresh: .2, shadowSize: 2048 },
  { maxRatio: 1.1,  floor: .66, smaa: false, bloom: true,  shadowRefresh: .5, shadowSize: 2048 },
  { maxRatio: 1,    floor: .6,  smaa: false, bloom: true,  shadowRefresh: Infinity, shadowSize: 1024 },
  { maxRatio: .9,   floor: .56, smaa: false, bloom: true,  shadowRefresh: Infinity, shadowSize: 1024 },
];
export const MAX_LEVEL = LEVELS.length - 1;

const listeners = new Set();
let level = null;

// Software rendering (no graphics card in use) or a very small machine start low.
function detectLevel() {
  let start = 0;
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    const info = gl && gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(gl && info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : '');
    if (/swiftshader|llvmpipe|software|basic render/i.test(name)) start = MAX_LEVEL;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {}
  const cores = navigator.hardwareConcurrency || 8, memory = navigator.deviceMemory || 8;
  if (cores <= 2 || memory <= 2) start = Math.max(start, 2);
  else if (cores <= 4 || memory <= 4) start = Math.max(start, 1);
  return start;
}

export function getLevel() {
  if (level !== null) return level;
  let stored = null;
  try { const value = sessionStorage.getItem(KEY); if (value !== null) stored = Number(value); } catch {}
  level = Number.isInteger(stored) && stored >= 0 && stored <= MAX_LEVEL ? stored : detectLevel();
  return level;
}

export function getQuality() { return LEVELS[getLevel()]; }

export function setLevel(next) {
  next = Math.max(0, Math.min(MAX_LEVEL, next));
  if (next === getLevel()) return;
  level = next;
  try { sessionStorage.setItem(KEY, String(next)); } catch {}
  listeners.forEach(listener => listener(LEVELS[next], next));
}

export function onQualityChange(listener) { listeners.add(listener); return () => listeners.delete(listener); }

// Pixel ratio for scenes that only cap it (2D hero, orbit, portrait, studio).
export function cappedPixelRatio(preferred) { return Math.min(preferred, devicePixelRatio || 1, getQuality().maxRatio * 1.4); }
