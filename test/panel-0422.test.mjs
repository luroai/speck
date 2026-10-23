// 0422: a build's log reads like a log: times in a column of their own, each kind of entry in its own colour, and wrapped
// lines indented under their entry.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { T, page, fakePage, queueRows, panelRepo, freePort, startPanel, stop, findChrome, browserPage, styles } from './support/panel.mjs';

const TRUNCATED = "Earlier lines aren't shown: this is the last 200 lines of the log.";
const LOG = [
  '12:00:01 Starting the build.',
  'It has two lines.',
  '',
  '12:00:02 → Bash: npm test',
  '  ✗ exit code 1',
  '12:00:03   ✗ Error: not found',
  '12:00:04 Build ended: error_max_turns',
  'stray text',
].join('\n');

// A fake page with ticket 0001 building and its log open, answering the log with `text`.
async function openLog(text, truncated = false) {
  const p = fakePage([{ tickets: [T('0001', 'building')] }, { text, truncated, build: 1, at: 0 }], { getSelection: () => ({ isCollapsed: true, rangeCount: 0 }) });
  await p.settle();
  p.press(queueRows(p)[0].children.find(n => n.className === 'top'));
  await p.settle();
  const box = p.all(queueRows(p)[0]).find(n => n.className === 'log');
  return { p, box };
}
const rows = box => box.children.map(r => ({ kind: r.className.replace(' timed', ''), at: (r.children.find(c => c.className === 'at') || {}).textContent || '', text: r.textContent }));

test('0422 AC1: each entry\'s time is in a span of its own, with its text after it', async () => {
  const { box } = await openLog(LOG);
  const r = rows(box);
  assert.equal(r[0].at, '12:00:01 ');
  assert.equal(r[0].text, '12:00:01 Starting the build.\n');
  assert.equal(r[3].at, '12:00:02 ');
  assert.equal(r[1].at, '', 'a line with no time has no time span');
  const css = styles();
  assert.match(css, /\.q \.log \.at \{[^}]*color: var\(--muted\)/, 'the time is muted');
});

test('0422 AC2: tool calls, messages, failures and the cut-short note each have a kind of their own', async () => {
  const { box } = await openLog(LOG, true);
  assert.deepEqual(rows(box).map(r => r.kind), ['ln note', 'ln msg', 'ln msg', 'ln gap', 'ln tool', 'ln fail', 'ln fail', 'ln fail', 'ln msg']);
});

// Colours as in panel-0138: the vars each look gives, and WCAG contrast.
const css = () => styles();
const vars = block => new Map([...block.matchAll(/(--[\w-]+)\s*:\s*([^;}]+)/g)].map(m => [m[1], m[2].trim()]));
const light = () => vars((css().match(/:root \{([\s\S]*?)\}/) || [])[1] || '');
const dark = () => vars([...css().matchAll(/:root\[data-theme="dark"\] \{([^}]*)\}/g)].map(m => m[1]).join(' '));
const luminance = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const colourOf = selector => (css().match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{[^}]*?color: var\\((--[\\w-]+)\\)`)) || [])[1];

test('0422 AC2: each kind has a colour of its own, with at least 4.5:1 contrast on the log\'s background in both looks', () => {
  const kinds = ['.q .log .tool', '.q .log .msg', '.q .log .fail', '.q .log .note'].map(colourOf);
  assert.ok(kinds.every(Boolean), `every kind has a colour: ${kinds}`);
  assert.equal(new Set(kinds).size, 4, 'each colour is different');
  assert.match(css(), /\.q \.log \{[^}]*background: var\(--bg\)/, 'the log sits on the page background');
  for (const [look, v] of [['light', light()], ['dark', dark()]]) {
    for (const k of [...kinds, colourOf('.q .log .at')]) assert.ok(contrast(v.get(k), v.get('--bg')) >= 4.5, `${k} on --bg in the ${look} look: ${contrast(v.get(k), v.get('--bg')).toFixed(2)}`);
  }
});

test('0422 AC4: the log\'s text is still its plain text, with the times', async () => {
  const { box } = await openLog(LOG);
  assert.equal(box.textContent, LOG);
  const cut = await openLog(LOG, true);
  assert.equal(cut.box.textContent, `${TRUNCATED}\n${LOG}`);
  const none = await openLog('');
  assert.equal(none.box.textContent, 'No log yet.');
  assert.deepEqual(rows(none.box).map(r => r.kind), ['ln plain']);
});

// ---------- in a real browser ----------

const chrome = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const row = id => `[...document.querySelectorAll('#queue .q')].find(q => q.querySelector('.id').textContent === '${id}')`;
const box = `${row('0001')}.querySelector('.log')`;
const writeLog = (dir, text) => {
  const runs = path.join(dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, '0001.log'), text);
};
const said = (text, at) => `${JSON.stringify({ type: 'assistant', timestamp: at, message: { content: [{ type: 'text', text }] } })}\n`;
const ran = (command, at) => `${JSON.stringify({ type: 'assistant', timestamp: at, message: { content: [{ type: 'tool_use', name: 'Bash', input: { command } }] } })}\n`;

test('0422 AC1, AC3, AC4: in a real browser, text starts past the times, wrapped and later lines line up under it, and selecting, copying and scrolling work as before (with review round 1, F1)', chrome, async () => {
  const r = panelRepo();
  const long = 'word '.repeat(80).trim();
  writeLog(r.dir, said(`First message.\nIts second line, ${long}`, '2026-10-23T09:00:01Z') + said(`Second message, ${long}`, '2026-10-23T09:00:02Z')
    + Array.from({ length: 60 }, (_, i) => ran(`echo ${i}`, '2026-10-23T09:00:03Z')).join(''));
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage(`http://127.0.0.1:${panel.port}/`);
  try {
    await b.until(`${row('0001')}`, 'the queue');
    await b.js(`${row('0001')}.querySelector('.top').click()`);
    await b.until(`(${box} || {}).textContent?.includes('echo 59')`, 'the log');
    // Where each line of the box's text starts on screen, from the left of the box's content: the leftmost piece of
    // text on each line, as a range gives a piece for the space a wrapped line ends with as well.
    const geo = await b.js(`(() => {
      const box = ${box}, left = box.getBoundingClientRect().left + box.clientLeft + parseFloat(getComputedStyle(box).paddingLeft);
      const rowsOf = n => [...n.getClientRects()];
      const textStart = row => { const t = [...row.childNodes].find(c => c.nodeType === 3 && c.data.trim()); const r = document.createRange(); r.selectNodeContents(t); const lines = new Map(); for (const x of rowsOf(r)) lines.set(Math.round(x.top), Math.min(lines.get(Math.round(x.top)) ?? Infinity, x.left - left)); return [...lines.values()]; };
      const rows = [...box.children];
      const first = rows.find(n => n.textContent.includes('First message'));
      const second = rows.find(n => n.textContent.startsWith('Its second line'));
      const gap = rows[rows.indexOf(second) + 1];
      const next = rows.find(n => n.textContent.includes('Second message'));
      return { at: first.querySelector('.at').getBoundingClientRect().left - left, first: textStart(first), second: textStart(second), wrapped: textStart(next),
        gapH: gap.getBoundingClientRect().height, lineH: parseFloat(getComputedStyle(box).lineHeight), gapText: gap.textContent,
        nextTop: next.getBoundingClientRect().top - second.getBoundingClientRect().bottom };
    })()`);
    assert.ok(Math.abs(geo.at) < 1, `AC1: the time starts the line (${geo.at})`);
    assert.ok(geo.first[0] > 60, `AC1: the text starts past the time column (${geo.first[0]})`);
    assert.ok(geo.second.length > 1, 'the long line wraps');
    for (const x of geo.second) assert.ok(Math.abs(x - geo.first[0]) < 1, `AC3: every line of a later line of the message starts with the entry's text (${x} vs ${geo.first[0]})`);
    assert.ok(geo.wrapped.length > 1, 'the long message wraps');
    for (const x of geo.wrapped) assert.ok(Math.abs(x - geo.first[0]) < 1, `AC3: every line of a wrapped entry starts with its text (${x} vs ${geo.first[0]})`);
    assert.equal(geo.gapText, '\n');
    assert.ok(Math.abs(geo.gapH - geo.lineH) < 1, `AC3: a blank line between two messages is one gap (${geo.gapH} vs ${geo.lineH})`);

    // AC4: selecting the whole log gives its plain text, with the times.
    const text = await b.js(`(() => { const r = document.createRange(); r.selectNodeContents(${box}); getSelection().removeAllRanges(); getSelection().addRange(r); return getSelection().toString(); })()`);
    assert.match(text, /^\d\d:\d\d:\d\d First message\.\nIts second line, [^\n]+\n\n\d\d:\d\d:\d\d Second message, [^\n]+\n\n\d\d:\d\d:\d\d → Bash: echo 0\n/);
    assert.equal(text, await b.js(`${box}.textContent`));

    // AC4: scrolled up with a selection, new lines keep the scroll place and the selection.
    await b.js(`${box}.scrollTop = 20`);
    await b.js(`(() => { const row = [...${box}.children].find(n => n.textContent.includes('echo 30\\n')), t = [...row.childNodes].find(c => c.nodeType === 3 && c.data.includes('echo 30')), at = t.data.indexOf('echo 30'), r = document.createRange();
      r.setStart(t, at); r.setEnd(t, at + 'echo 30'.length); getSelection().removeAllRanges(); getSelection().addRange(r); })()`);
    assert.equal(await b.js('getSelection().toString()'), 'echo 30');
    fs.appendFileSync(path.join(r.dir, 'speck', '.cache', 'runs', '0001.log'), ran('echo more', '2026-10-23T09:00:04Z'));
    await b.until(`${box}.textContent.includes('echo more')`, 'the new line');
    assert.equal(await b.js(`${box}.scrollTop`), 20, 'the scroll place stays');
    assert.equal(await b.js('getSelection().toString()'), 'echo 30', 'the selection stays');
    assert.match(await b.js(`${box}.textContent`), /echo 59\n\d\d:\d\d:\d\d → Bash: echo more$/, 'the new line is on a line of its own');

    // Review round 1, F1: a selection in the last line stays when that line grows, as the page's setLogText puts a
    // newer log in the box.
    await b.js(`(() => { const row = ${box}.lastElementChild, t = [...row.childNodes].find(c => c.nodeType === 3 && c.data.includes('echo more')), at = t.data.indexOf('echo more'), r = document.createRange();
      r.setStart(t, at); r.setEnd(t, at + 'echo more'.length); getSelection().removeAllRanges(); getSelection().addRange(r); })()`);
    await b.js(`setLogText(${box}, ${box}.textContent + ' and on')`);
    assert.match(await b.js(`${box}.textContent`), /→ Bash: echo more and on$/);
    assert.equal(await b.js('getSelection().toString()'), 'echo more', 'the selection in the grown line stays');
    await b.js(`setLogText(${box}, ${box}.textContent + '\\n12:00:09 next')`);
    assert.equal(await b.js('getSelection().toString()'), 'echo more', 'and stays when a line is added after it');
    assert.match(await b.js(`${box}.textContent`), /echo more and on\n12:00:09 next$/);
  } finally {
    await b.close();
    await stop(panel);
  }
});
