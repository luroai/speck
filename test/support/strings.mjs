// Every string literal in a script's source, for checks on what speck says (0486): { text, line } for each quoted or
// template string, outside comments and regular expressions. A template's ${…} parts are left out of its text, and any
// strings inside them are given on their own.

const REGEX_BEFORE = new Set(['', '(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^']);
const REGEX_WORDS = new Set(['return', 'typeof', 'case', 'in', 'of', 'new', 'delete', 'void', 'throw', 'else', 'do']);

export function stringsIn(src) {
  const out = [];
  let i = 0, line = 1, prev = ''; // prev: the last significant token before i, to tell a regex from a division
  const lineAt = () => line;
  const step = () => { if (src[i] === '\n') line++; i++; };

  // Reads a quoted string starting at i (on its quote), returning its text.
  const quoted = q => {
    step();
    let text = '';
    while (i < src.length && src[i] !== q) {
      if (src[i] === '\\') { text += src[i + 1] ?? ''; step(); step(); continue; }
      text += src[i]; step();
    }
    step();
    return text;
  };
  // Reads a template starting at i (on its backtick), pushing strings inside its ${…} parts, returning its text.
  const template = () => {
    step();
    let text = '';
    while (i < src.length && src[i] !== '`') {
      if (src[i] === '\\') { text += src[i + 1] ?? ''; step(); step(); continue; }
      if (src[i] === '$' && src[i + 1] === '{') { step(); step(); code(true); continue; }
      text += src[i]; step();
    }
    step();
    return text;
  };
  const regex = () => {
    step();
    let inClass = false;
    while (i < src.length && src[i] !== '\n') {
      if (src[i] === '\\') { step(); step(); continue; }
      if (src[i] === '[') inClass = true;
      else if (src[i] === ']') inClass = false;
      else if (src[i] === '/' && !inClass) break;
      step();
    }
    step();
    while (/[a-z]/i.test(src[i] || '')) step();
  };
  // Reads code until the end, or, `inner`, until the } closing a template's ${.
  function code(inner = false) {
    let depth = 0;
    while (i < src.length) {
      const c = src[i], d = src[i + 1];
      if (c === '/' && d === '/') { while (i < src.length && src[i] !== '\n') step(); continue; }
      if (c === '/' && d === '*') { step(); step(); while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) step(); step(); step(); continue; }
      if (c === "'" || c === '"') { const at = lineAt(); out.push({ text: quoted(c), line: at }); prev = 'str'; continue; }
      if (c === '`') { const at = lineAt(), slot = out.length; out.splice(slot, 0, { text: '', line: at }); out[slot].text = template(); prev = 'str'; continue; }
      if (c === '/' && (REGEX_BEFORE.has(prev) || REGEX_WORDS.has(prev))) { regex(); prev = 're'; continue; }
      if (inner && c === '{') depth++;
      if (inner && c === '}') { if (depth === 0) { step(); return; } depth--; }
      if (/\s/.test(c)) { step(); continue; }
      if (/[\w$]/.test(c)) { let w = ''; while (/[\w$]/.test(src[i] || '')) { w += src[i]; step(); } prev = w; continue; }
      prev = c === ')' || c === ']' ? 'x' : c;
      step();
    }
  }
  code();
  return out;
}
