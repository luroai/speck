import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT } from './support/speck.mjs';

// ---------- 0491: the README's links and anchors resolve ----------
// One of the few things in the README that are tested rather than checked by review: a broken link breaks the page.

// GitHub's anchor for a heading: lower case, punctuation other than hyphens and underscores dropped, each space a
// hyphen, and -1, -2 and so on added to a repeated one.
function anchors(markdown) {
  const seen = new Map(), out = new Set();
  let fenced = false;
  for (const line of markdown.split('\n')) {
    if (line.startsWith('```')) fenced = !fenced;
    const m = !fenced && line.match(/^#{1,6}\s+(.*?)\s*#*\s*$/);
    if (!m) continue;
    const slug = m[1].toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/ /g, '-');
    const n = seen.get(slug) || 0;
    seen.set(slug, n + 1);
    out.add(n ? `${slug}-${n}` : slug);
  }
  return out;
}

// The problems with the links in `markdown`, a file at `file` in `root`: each relative link, image and HTML src,
// srcset or href whose file isn't there, and each #anchor, in it or in another Markdown file, that no heading gives.
// Links with a scheme, such as https:, aren't checked.
function linkProblems(markdown, file, root) {
  const prose = markdown.replace(/^```[\s\S]*?^```/gm, '');
  const targets = [...prose.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g), ...prose.matchAll(/\b(?:src|srcset|href)="([^"]+)"/g)].map(m => m[1]);
  const problems = [];
  for (const target of targets) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    const [rel, anchor] = target.split('#');
    const to = rel && path.join(path.dirname(path.join(root, file)), decodeURI(rel));
    if (to && !fs.existsSync(to)) { problems.push(`${target}: no such file`); continue; }
    const text = !to ? markdown : to.endsWith('.md') ? fs.readFileSync(to, 'utf8') : null;
    if (anchor !== undefined && text !== null && !anchors(text).has(anchor)) problems.push(`${target}: no such heading`);
  }
  return problems;
}

test('0491 AC2: every relative link, picture and anchor in the README resolves', () => {
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  assert.ok(/\]\((?![a-z]+:)[^)]+\)/.test(readme), 'the README has relative links to check');
  assert.deepEqual(linkProblems(readme, 'README.md', ROOT), []);
});

test('0491 AC2: the link check catches a missing file, a missing picture and a missing heading', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0491-'));
  try {
    fs.writeFileSync(path.join(root, 'LICENSE'), 'MIT\n');
    fs.mkdirSync(path.join(root, 'docs'));
    fs.writeFileSync(path.join(root, 'docs', 'brief.md'), '# Brief\n\n## The review loop\n');
    const doc = ['# Title', '## The `panel` view', '## Once', '## Once',
      '[ok](LICENSE) [ok](docs/brief.md#the-review-loop) [ok](#the-panel-view) [ok](#once-1) [web](https://example.com/x)',
      '[bad](LICENCE) [bad](docs/brief.md#no-such) [bad](#nowhere)', '<img src="docs/missing.png">',
      '```', '[in code](not-checked)', '```'].join('\n\n');
    assert.deepEqual(linkProblems(doc, 'README.md', root), [
      'LICENCE: no such file', 'docs/brief.md#no-such: no such heading', '#nowhere: no such heading', 'docs/missing.png: no such file',
    ]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
