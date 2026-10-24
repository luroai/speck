// 0472: the panel's styles as rules, and as they were before and after they were split into a file for each area.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, STYLE_FILES } from './panel.mjs';

// Each rule in `css`, comments taken out, as one string for each of its selectors: the @media or @supports it's in,
// the selector and its declarations, with runs of white space made one space. @font-face and @keyframes are one each.
export function cssAtoms(css) {
  const out = [];
  const flat = s => s.replace(/\s+/g, ' ').trim();
  const walk = (s, ctx) => {
    for (let i = 0; ;) {
      const open = s.indexOf('{', i);
      if (open < 0) return;
      const head = flat(s.slice(i, open));
      let depth = 1, j = open + 1;
      for (; depth && j < s.length; j++) { if (s[j] === '{') depth++; else if (s[j] === '}') depth--; }
      const body = s.slice(open + 1, j - 1);
      if (/^@(media|supports)\b/.test(head)) walk(body, [...ctx, head]);
      else if (head.startsWith('@')) out.push([...ctx, head, flat(body)].join(' | '));
      else {
        const sels = [];
        let d = 0, cur = '';
        for (const ch of head) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && !d) { sels.push(cur); cur = ''; } else cur += ch; }
        sels.push(cur);
        for (const sel of sels) out.push([...ctx, flat(sel), flat(body).replace(/;$/, '')].join(' | '));
      }
      i = j;
    }
  };
  walk(css.replace(/\/\*[\s\S]*?\*\//g, ''), []);
  return out;
}

// templates/panel.css as it was just before the commit that took it out, and the five files as that commit left them,
// or, before that commit is made, panel.css as HEAD has it and the five files as they are now. null without git or the history.
export function splitStyles() {
  const git = (...a) => spawnSync('git', a, { cwd: ROOT, encoding: 'utf8' });
  const gone = git('log', '--diff-filter=D', '--format=%H', '-n1', '--', 'templates/panel.css');
  if (gone.status !== 0) return null;
  const at = gone.stdout.trim();
  const old = git('show', `${at ? `${at}^` : 'HEAD'}:templates/panel.css`);
  if (old.status !== 0) return null;
  const after = STYLE_FILES.map(f => at ? git('show', `${at}:templates/${f}`) : { status: 0, stdout: fs.readFileSync(path.join(ROOT, 'templates', f), 'utf8') });
  if (after.some(r => r.status !== 0)) return null;
  return { css: old.stdout, after: after.map(r => r.stdout) };
}
