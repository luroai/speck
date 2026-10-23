// The panel's stylesheet as a list of rules, for tests that check which colours it uses where.
import { styles } from './panel.mjs';

export const css = () => styles(); // 0430: from their own file

// Each rule's selector, its declarations as [property, value] pairs and the at-rules it sits in, in the order they come.
export function rules(text = css()) {
  const out = [], stack = [];
  let buf = '';
  for (const ch of text.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (ch === '{') { stack.push(buf.trim()); buf = ''; } else if (ch === '}') {
      const sel = stack.pop();
      if (buf.trim()) {
        const decls = buf.split(';').map(d => d.trim()).filter(Boolean).map(d => { const i = d.indexOf(':'); return [d.slice(0, i).trim(), d.slice(i + 1).trim()]; });
        out.push({ sel, decls, at: stack.filter(s => s.startsWith('@')) });
      }
      buf = '';
    } else buf += ch;
  }
  return out;
}

// The selectors of a rule, one by one.
export const selectors = r => r.sel.split(',').map(s => s.trim());
// The colour tokens a value uses, for example ['--bad'] for "2px solid var(--bad)".
export const tokens = v => [...String(v || '').matchAll(/var\((--[\w-]+)\)/g)].map(m => m[1]);
// The last value a rule gives a property.
export const get = (r, prop) => r.decls.filter(([k]) => k === prop).map(([, v]) => v).pop();
// The plain rule (in no at-rule) with exactly this selector.
export const rule = (sel, rs = rules()) => rs.find(r => !r.at.length && r.sel === sel);
