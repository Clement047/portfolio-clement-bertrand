// FR/EN switch for the whole site. French stays the source text in every page and
// component; in English, displayed text (and alt / aria-label / title / placeholder)
// is replaced from src/data/i18n-en.json, including text added later by scripts.
// The originals are kept, so switching back to French needs no reload. Text drawn
// inside the 3D scenes (À PROPOS, PROJETS, CONTACT titles) is untouched.
import dictionary from '../data/i18n-en.json';

const STORAGE_KEY = 'portfolio-lang';
// The choice lasts for the visit only: every new visit starts in French.
try { localStorage.removeItem(STORAGE_KEY); } catch {}
const ATTRIBUTES = ['alt', 'aria-label', 'title', 'placeholder'];
const normalize = text => text.replace(/\s+/g, ' ').trim();
const entries = new Map(Object.entries(dictionary).map(([fr, en]) => [normalize(fr), en]));
const patterns = [
  [/^Préparation des matériaux (\d+)\/(\d+)…$/, (_, a, b) => `Preparing materials ${a}/${b}…`],
  [/^La préparation reste bloquée à l’étape : (.*)$/, (_, step) => `Preparation is stuck at this step: ${translate(step) ?? step}`],
  [/^(APPROCHE|PROJETS|CONTACT|ARRIVÉE) · (.*)$/, (_, phase, rest) => `${translate(phase) ?? phase} · ${rest}`],
];

export function getLang() {
  try { return sessionStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'fr'; } catch { return 'fr'; }
}

function translate(text) {
  const key = normalize(text);
  if (!key) return null;
  if (entries.has(key)) return entries.get(key);
  for (const [pattern, build] of patterns) { const match = key.match(pattern); if (match) return build(...match); }
  return null;
}

// For text built in scripts (dialogues, loading lines, 3D interface): returns the
// English version when English is active, the original otherwise.
export function t(text) {
  if (getLang() !== 'en' || typeof text !== 'string') return text;
  return translate(text) ?? text;
}

const textOriginals = new Map(), attrOriginals = new Map();
const skip = node => !node || node.closest?.('script,style,noscript,[data-no-translate]');

function translateText(node) {
  if (skip(node.parentElement)) return;
  const record = textOriginals.get(node);
  if (record && node.data === record.applied) return;
  const english = translate(node.data);
  if (english === null) { textOriginals.delete(node); return; }
  const [, lead, , trail] = node.data.match(/^(\s*)([\s\S]*?)(\s*)$/);
  const applied = lead + english + trail;
  textOriginals.set(node, { source: node.data, applied });
  if (node.data !== applied) node.data = applied;
}

function translateAttributes(element) {
  if (skip(element)) return;
  for (const name of ATTRIBUTES) {
    const value = element.getAttribute?.(name);
    if (!value) continue;
    const records = attrOriginals.get(element) ?? {};
    if (records[name] && value === records[name].applied) continue;
    const english = translate(value);
    if (english === null) continue;
    records[name] = { source: value, applied: english };
    attrOriginals.set(element, records);
    if (value !== english) element.setAttribute(name, english);
  }
}

function translateTree(root) {
  if (root.nodeType === 3) { translateText(root); return; }
  if (root.nodeType !== 1 && root.nodeType !== 9) return;
  const start = root.nodeType === 9 ? root.documentElement : root;
  translateAttributes(start);
  const walker = document.createTreeWalker(start, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === 3) translateText(node); else translateAttributes(node);
  }
}

function restoreFrench() {
  for (const [node, record] of textOriginals) if (node.isConnected && node.data === record.applied) node.data = record.source;
  for (const [element, records] of attrOriginals) for (const [name, record] of Object.entries(records)) if (element.isConnected && element.getAttribute(name) === record.applied) element.setAttribute(name, record.source);
  textOriginals.clear(); attrOriginals.clear();
}

let observer;
function watch() {
  if (observer || typeof MutationObserver !== 'function') return;
  observer = new MutationObserver(mutations => {
    if (getLang() !== 'en') return;
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') translateText(mutation.target);
      else if (mutation.type === 'attributes') translateAttributes(mutation.target);
      else for (const node of mutation.addedNodes) translateTree(node);
    }
  });
  // The whole document: Astro's client router replaces <body> between pages.
  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRIBUTES });
}

export function applyLanguage() {
  const lang = getLang();
  document.documentElement.lang = lang;
  if (lang === 'en') translateTree(document); else restoreFrench();
  watch();
  document.dispatchEvent(new CustomEvent('portfolio:lang', { detail: { lang } }));
}

export function setLang(lang) {
  try { sessionStorage.setItem(STORAGE_KEY, lang === 'en' ? 'en' : 'fr'); } catch {}
  applyLanguage();
}
