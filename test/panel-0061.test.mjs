import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fm, panelRepo, freePort, startPanel, stop, fakePage, full, click, items, top, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0061: the full ticket pane shows each section's Markdown formatted ----------

const pane = p => p.byId('full-ticket');
const itemOf = (p, id) => items(p).find(n => n.textContent.startsWith(id));
const fullButton = (p, item) => p.all(item).find(n => n.tagName === 'button' && n.textContent === 'Full ticket');
const refresh = async p => { p.timers.shift()(); await p.settle(); };
const clone = s => JSON.parse(JSON.stringify(s));
const tags = (p, n, tag) => p.all(n).filter(x => x.tagName === tag);
const kids = n => (n.children || []).filter(c => c.tagName !== '#text' || c.textContent !== '');

// Opens the full ticket pane for one ticket and returns the page.
async function showPane(t, more = []) {
  const s = { tickets: [t], ideas: [] };
  const p = fakePage([s, clone(s), clone(s), ...more]);
  await p.settle();
  click(top(itemOf(p, t.id)));
  click(fullButton(p, itemOf(p, t.id)));
  return p;
}
// The node a section's heading is followed by: what that section shows.
const section = (p, heading) => {
  const body = pane(p).children[1];
  const i = body.children.findIndex(n => n.tagName === 'h4' && n.textContent === heading);
  assert.ok(i >= 0, `the pane has a ${heading} section`);
  return body.children[i + 1];
};

const SAMPLE = [
  'Some **bold**, *star* and _under_ text with `a code span`.',
  '',
  'A second paragraph.',
  '',
  '```',
  'line one',
  '  indented  two',
  '```',
  '',
  '- one',
  '  - nested',
  '- two',
  '',
  '1. first',
  '2. second',
  '',
  '# Big',
  '## Middle',
  '### Small',
].join('\n');

function checkSample(p, n, where) {
  const strong = tags(p, n, 'strong'), em = tags(p, n, 'em'), code = tags(p, n, 'code');
  assert.deepEqual(strong.map(x => x.textContent), ['bold'], `${where}: bold`);
  assert.deepEqual(em.map(x => x.textContent), ['star', 'under'], `${where}: italic, both ways`);
  assert.ok(code.some(x => x.textContent === 'a code span' && /\bmd-code\b/.test(x.className)), `${where}: a code span, styled`);
  const pre = tags(p, n, 'pre');
  assert.equal(pre.length, 1, `${where}: one code block`);
  assert.equal(pre[0].textContent, 'line one\n  indented  two', `${where}: the block keeps its line breaks and spaces`);
  const paras = tags(p, n, 'p').map(x => x.textContent);
  assert.ok(paras.includes('A second paragraph.'), `${where}: blank lines split paragraphs`);
  const ul = tags(p, n, 'ul');
  assert.equal(ul.length, 2, `${where}: a bulleted list with one nested in it`);
  const outer = ul.find(u => !tags(p, n, 'li').some(li => li !== n && p.all(li).includes(u)));
  assert.deepEqual(kids(outer).map(li => li.tagName), ['li', 'li'], `${where}: two items`);
  assert.ok(p.all(kids(outer)[0]).some(x => x.tagName === 'ul' && x.textContent === 'nested'), `${where}: the nested item is inside the first`);
  const ol = tags(p, n, 'ol');
  assert.equal(ol.length, 1, `${where}: a numbered list`);
  assert.deepEqual(kids(ol[0]).map(li => li.textContent), ['first', 'second']);
  assert.deepEqual(tags(p, n, 'h5').map(x => [x.textContent, x.className]), [['Big', 'md-h1']], `${where}: # heading`);
  assert.deepEqual(tags(p, n, 'h6').map(x => [x.textContent, x.className]), [['Middle', 'md-h2'], ['Small', 'md-h3']], `${where}: ## and ### headings`);
}

test('0061 AC1: problem, outcome, out of scope and notes show their Markdown formatted', async () => {
  const p = await showPane(full('0001', { problem: SAMPLE, outcome: SAMPLE, out_of_scope: SAMPLE, notes: SAMPLE }));
  for (const h of ['Problem', 'Outcome', 'Out of scope', 'Notes']) checkSample(p, section(p, h), h);
  // The headings inside a section rank below the section's own heading (h4).
  assert.deepEqual(p.all(pane(p)).filter(n => /^h[1-4]$/.test(n.tagName)).map(n => n.textContent), ['Readiness', 'Problem', 'Outcome', 'Acceptance criteria', 'Out of scope', 'Notes']); // Readiness: 0062
});

test('0061 AC1: each acceptance criterion shows its Markdown formatted, and the criteria stay numbered', async () => {
  const p = await showPane(full('0001', { acceptance_criteria: ['Plain first.', SAMPLE] }));
  const criteria = section(p, 'Acceptance criteria');
  assert.equal(criteria.tagName, 'ol');
  assert.equal(kids(criteria).length, 2, 'one item per criterion');
  assert.equal(kids(criteria)[0].textContent, 'Plain first.');
  checkSample(p, kids(criteria)[1], 'criterion 2');
});

test('0061 AC1: nesting follows indentation, a list can follow a paragraph line, and a numbered list keeps its first number', async () => {
  const text = 'Steps:\n- a\n    - b\n        - c\n    - d\n- e\n\n3. three\n4. four\n   * star item';
  const p = await showPane(full('0001', { notes: text }));
  const n = section(p, 'Notes');
  assert.deepEqual(kids(n).map(x => x.tagName), ['p', 'ul', 'ol']);
  assert.equal(kids(n)[0].textContent, 'Steps:');
  const outer = kids(n)[1];
  assert.deepEqual(kids(outer).map(li => kids(li)[0].textContent), ['a', 'e']);
  const inner = kids(kids(outer)[0]).find(x => x.tagName === 'ul');
  assert.deepEqual(kids(inner).map(li => kids(li)[0].textContent), ['b', 'd']);
  assert.ok(kids(kids(inner)[0]).some(x => x.tagName === 'ul' && x.textContent === 'c'), 'three levels');
  const ol = kids(n)[2];
  assert.equal(Number(ol.start), 3, 'numbered from 3');
  assert.ok(kids(kids(ol)[1]).some(x => x.tagName === 'ul' && x.textContent === 'star item'), '* starts a nested bulleted list');
});

test('0061 AC2: an http or https link opens in a new tab; any other link is its text only', async () => {
  const notes = [
    'See [the docs](https://example.com/a_b?x=1) and [plain](http://example.com).',
    'Not [script](javascript:alert(1)) nor [rel](/local/path) nor [mail](mailto:a@b.c) nor [data](data:text/html,x).',
    'Upper [case](HTTPS://example.com) too.',
  ].join('\n\n');
  const p = await showPane(full('0001', { notes }));
  const n = section(p, 'Notes');
  const links = tags(p, n, 'a');
  assert.deepEqual(links.map(a => [a.textContent, a.href, a.target, a.rel]), [
    ['the docs', 'https://example.com/a_b?x=1', '_blank', 'noopener noreferrer'],
    ['plain', 'http://example.com', '_blank', 'noopener noreferrer'],
    ['case', 'HTTPS://example.com', '_blank', 'noopener noreferrer'],
  ]);
  assert.equal(kids(n)[1].textContent, 'Not script nor rel nor mail nor data.', 'other links show their text only');
  assert.ok(!p.all(n).some(x => /javascript|mailto|data:|\/local/.test(x.href || '')), 'nothing to click for them');
});

test('0061 AC3: raw HTML and unlisted Markdown show as literal text, exactly as written', async () => {
  const notes = [
    '<script>alert(1)</script> and <img src=x onerror=alert(1)> and <b>b</b>',
    '',
    '> a quote',
    '',
    '| a | b |',
    '|---|---|',
    '',
    '![alt](https://example.com/x.png)',
    '',
    '#### four',
    '',
    '#nospace and snake_case_name and 2 * 3 * 4 and ** loose ** and an [unclosed](link',
  ].join('\n');
  const p = await showPane(full('0001', { notes, problem: '<img src=x onerror=alert(1)>' }));
  const n = section(p, 'Notes');
  assert.deepEqual(kids(n).map(x => x.tagName), ['p', 'p', 'p', 'p', 'p', 'p']);
  assert.deepEqual(kids(n).map(x => x.textContent), [
    '<script>alert(1)</script> and <img src=x onerror=alert(1)> and <b>b</b>',
    '> a quote',
    '| a | b |\n|---|---|',
    '![alt](https://example.com/x.png)',
    '#### four',
    '#nospace and snake_case_name and 2 * 3 * 4 and ** loose ** and an [unclosed](link',
  ]);
  assert.ok(!p.all(pane(p)).some(x => ['script', 'img', 'b', 'a', 'blockquote', 'table', 'h1', 'h2', 'h3'].includes(x.tagName)), 'no HTML was made from it');
  assert.equal(section(p, 'Problem').textContent, '<img src=x onerror=alert(1)>');
});

test('0061 AC3: Markdown inside code spans and code blocks shows as written', async () => {
  const notes = 'Use `**not bold** _x_ [a](https://x.y)` here, and ``a `tick` b``.\n\n```js\n# not a heading\n- not a list\n**not bold** <b>x</b>\n```';
  const p = await showPane(full('0001', { notes }));
  const n = section(p, 'Notes');
  const code = tags(p, n, 'code').filter(c => /\bmd-code\b/.test(c.className)).map(c => c.textContent);
  assert.deepEqual(code, ['**not bold** _x_ [a](https://x.y)', 'a `tick` b']);
  assert.equal(tags(p, n, 'pre')[0].textContent, '# not a heading\n- not a list\n**not bold** <b>x</b>');
  assert.ok(!p.all(n).some(x => ['strong', 'em', 'a', 'ul', 'h5', 'h6', 'b'].includes(x.tagName)), 'nothing in them is formatted');
});

test('0061 AC3: an unclosed code block runs to the end of the section, as written', async () => {
  const p = await showPane(full('0001', { notes: 'Before.\n```\n**a**\n\n- b' }));
  const n = section(p, 'Notes');
  assert.deepEqual(kids(n).map(x => x.tagName), ['p', 'pre']);
  assert.equal(kids(n)[1].textContent, '**a**\n\n- b');
});

test('0061 AC4: the pane keeps its formatted nodes through a refresh while that ticket is unchanged, and rebuilds when it changes', async () => {
  const t = full('0001', { notes: 'A **bold** note with `code`.\n\n- item', acceptance_criteria: ['Has **bold**.'] });
  const changed = clone({ tickets: [t], ideas: [] });
  changed.tickets[0].notes = 'A **new** note.';
  const p = await showPane(t, [changed]);
  const strong = tags(p, pane(p), 'strong');
  assert.equal(strong.length, 2);
  await refresh(p);
  await refresh(p);
  assert.ok(strong.every(n => !n.detached && p.all(pane(p)).includes(n)), 'the same nodes, never taken out');
  await refresh(p);
  assert.deepEqual(tags(p, section(p, 'Notes'), 'strong').map(n => n.textContent), ['new'], 'a change shows');
});

test('0061 out of scope: the short view in the Tickets list stays plain text', async () => {
  const s = { tickets: [full('0001', { problem: 'A **bold** problem.' })], ideas: [] };
  const p = fakePage([s]);
  await p.settle();
  click(top(itemOf(p, '0001')));
  assert.ok(itemOf(p, '0001').textContent.includes('A **bold** problem.'));
  assert.ok(!tags(p, itemOf(p, '0001'), 'strong').length);
});

test('0061 AC2-AC4: in a real browser, the pane formats Markdown, runs no HTML and keeps a selection through refreshes', { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' }, async () => {
  const r = panelRepo();
  r.write('0002-md.md', fm({ id: '"0002"', title: 'Markdown', status: 'draft' }),
    '## Problem\nA **bold problem** with <img src=x onerror="window.ran=1"> and <script>window.ran=2</script>.\n'
    + '## Outcome\nSee [docs](https://example.com) or [bad](javascript:window.ran=3).\n'
    + '## Acceptance criteria\n1. Some `code` here.\n2. Two.\n## Out of scope\n- PDF export\n'
    + '## Notes\n```\n  kept   spaces\n```\n');
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const { port } = panel;
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  try {
    await b.until(`[...document.querySelectorAll('#shaping .item')].some(n => n.textContent.startsWith('0002'))`, 'the ticket');
    await b.js(`[...document.querySelectorAll('#shaping .item')].find(n => n.textContent.startsWith('0002')).querySelector('.head').click()`);
    await b.js(`[...document.querySelectorAll('#shaping .item.open button')].find(x => x.textContent === 'Full ticket').click()`);
    await b.until(`!!document.querySelector('#full-ticket strong')`, 'the formatted pane');
    assert.equal(await b.js(`document.querySelector('#full-ticket strong').textContent`), 'bold problem');
    assert.equal(await b.js(`window.ran === undefined`), true, 'AC3: no HTML ran');
    assert.equal(await b.js(`document.querySelectorAll('#full-ticket img, #full-ticket script').length`), 0);
    assert.deepEqual(await b.js(`[...document.querySelectorAll('#full-ticket a')].map(a => [a.textContent, a.getAttribute('href'), a.target])`), [['docs', 'https://example.com', '_blank']], 'AC2');
    assert.equal(await b.js(`document.querySelector('#full-ticket pre').textContent`), '  kept   spaces');
    assert.equal(await b.js(`getComputedStyle(document.querySelector('#full-ticket pre')).whiteSpace`), 'pre');
    assert.match(await b.js(`getComputedStyle(document.querySelector('#full-ticket code.md-code')).fontFamily`), /mono/i);
    assert.notEqual(await b.js(`getComputedStyle(document.querySelector('#full-ticket code.md-code')).backgroundColor`), 'rgba(0, 0, 0, 0)', 'a code span has a background');
    assert.ok(await b.js(`(h => parseFloat(getComputedStyle(document.querySelector('#full-ticket strong')).fontWeight) >= 600)()`), 'bold is bold');

    // AC4: select text across formatted nodes, then let two refreshes pass.
    await b.js(`(() => { const s = document.querySelector('#full-ticket strong'); const r = document.createRange(); r.setStart(s.firstChild, 0); r.setEnd(s.parentNode.lastChild, 3); getSelection().removeAllRanges(); getSelection().addRange(r); })()`);
    const picked = await b.js('getSelection().toString()');
    assert.ok(picked.startsWith('bold problem'), picked);
    const refreshed = async what => { await b.js(`window.seen = document.getElementById('pills').firstChild`); await b.until(`document.getElementById('pills').firstChild !== window.seen`, what); };
    await refreshed('a refresh'); await refreshed('a second refresh');
    assert.equal(await b.js('getSelection().toString()'), picked, 'the selection is kept');
  } finally {
    await b.close();
    await stop(panel);
  }
});

test('0061 self-check: odd input shows as written or plainly formatted, quickly, and never breaks the pane', async () => {
  const deep = Array.from({ length: 2000 }, (_, i) => `${' '.repeat(i)}- level ${i}`).join('\n');
  const heavy = ['<a>'.repeat(10000), '<div>\n'.repeat(5000), '!['.repeat(10000), '<!--'.repeat(10000), '<a '.repeat(10000), '['.repeat(20000), '*a '.repeat(10000), '**a '.repeat(10000), '_a '.repeat(10000), '`a``'.repeat(5000), `${'*a '.repeat(3000)}x${' a*'.repeat(3000)}`].join('\n\n');
  const started = Date.now();
  const p = await showPane(full('0001', { problem: '0. zero\n1. one', outcome: '[](https://x.y) and [x]() and __proto__ and constructor', out_of_scope: deep, notes: heavy }));
  assert.ok(Date.now() - started < 2000, 'quick on long, odd text');
  const ol = section(p, 'Problem');
  assert.equal(Number(kids(ol)[0].start), 0, 'a list can start at 0');
  assert.equal(section(p, 'Outcome').textContent, '[](https://x.y) and [x]() and __proto__ and constructor', 'empty links show as written');
  const depth = n => Math.max(0, ...kids(n).map(depth)) + (n.tagName === 'ul' ? 1 : 0);
  assert.equal(depth(section(p, 'Out of scope')), 16, 'lists nest at most 16 deep');
  assert.ok(section(p, 'Out of scope').textContent.includes('level 1999'), 'deeper items still show');
  assert.ok(section(p, 'Notes').textContent.length > 100000, 'the long notes show');
});

test('0061 AC3 (review F1): Markdown inside raw HTML, images, blockquotes, tables, rules and escapes stays as written', async () => {
  const notes = [
    'Tag <img alt="**bold** _i_ `c` [l](https://x.y)" src=x> and <!-- **hidden** --> end.',
    '',
    '![**alt** _i_](https://example.com/a_b)',
    '',
    '> **quoted** and [link](https://x.y)',
    '> _more_',
    '',
    'a | **b**',
    '--|--',
    '**c** | `d`',
    '',
    '- - -',
    '',
    '\\*not italic\\* and \\_not\\_ either',
  ].join('\n');
  const p = await showPane(full('0001', { notes }));
  const n = section(p, 'Notes');
  assert.deepEqual(kids(n).map(x => x.textContent), [
    'Tag <img alt="**bold** _i_ `c` [l](https://x.y)" src=x> and <!-- **hidden** --> end.',
    '![**alt** _i_](https://example.com/a_b)',
    '> **quoted** and [link](https://x.y)\n> _more_',
    'a | **b**\n--|--\n**c** | `d`',
    '- - -',
    '\\*not italic\\* and \\_not\\_ either',
  ]);
  assert.ok(!p.all(n).some(x => ['strong', 'em', 'code', 'a', 'ul', 'img'].includes(x.tagName)), 'none of it is formatted');
});

test('0061 AC1 (review F2): a blank line between list items keeps the list and its nesting', async () => {
  const p = await showPane(full('0001', { notes: '- first\n\n  - child\n\n- second\n\n1. one\n\n2. two\n\nAfter.' }));
  const n = section(p, 'Notes');
  assert.deepEqual(kids(n).map(x => x.tagName), ['ul', 'ol', 'p']);
  const ul = kids(n)[0];
  assert.deepEqual(kids(ul).map(li => kids(li)[0].textContent), ['first', 'second']);
  assert.ok(kids(kids(ul)[0]).some(x => x.tagName === 'ul' && x.textContent === 'child'), 'child is nested in first');
  assert.deepEqual(kids(kids(n)[1]).map(li => li.textContent), ['one', 'two'], 'one numbered list');
});

test('0061 AC3 (review round 2 F1): an HTML element stays as written with everything inside it, over lines and blank lines too', async () => {
  const notes = [
    '<script>**bold** `code` [link](https://x.y)</script> then *after*.',
    '',
    'Mid <b>a <b>**inner**</b> _c_</b> and <span title="x">',
    '**two** lines</span> end.',
    '',
    '<div>',
    '**x** and [l](https://x.y)',
    '',
    '- not a list',
    '</div>',
    '',
    '<p>open **never** `closes`',
    'still _inside_',
    '',
    'Back to **bold**.',
  ].join('\n');
  const p = await showPane(full('0001', { notes }));
  const n = section(p, 'Notes');
  assert.deepEqual(kids(n).map(x => x.textContent), [
    '<script>**bold** `code` [link](https://x.y)</script> then after.',
    'Mid <b>a <b>**inner**</b> _c_</b> and <span title="x">\n**two** lines</span> end.',
    '<div>\n**x** and [l](https://x.y)\n\n- not a list\n</div>',
    '<p>open **never** `closes`\nstill _inside_',
    'Back to bold.',
  ]);
  assert.deepEqual(tags(p, n, 'em').map(x => x.textContent), ['after'], 'only the text outside the HTML is formatted');
  assert.deepEqual(tags(p, n, 'strong').map(x => x.textContent), ['bold']);
  assert.ok(kids(n).every(k => k.tagName === 'p' && p.all(k).slice(1).every(x => ['#text', 'em', 'strong'].includes(x.tagName))), 'paragraphs, with nothing else made from the HTML');
});

test('0061 AC1 (review round 3 F3): text after an HTML element closing on a later line is formatted', async () => {
  const p = await showPane(full('0001', { notes: '<div>\n**in**\n\n</div> **outside** `code` [link](https://x.y)\n\nNext.' }));
  const n = section(p, 'Notes');
  assert.deepEqual(kids(n).map(x => x.textContent), ['<div>\n**in**\n\n</div> outside code link', 'Next.']);
  assert.deepEqual(tags(p, n, 'strong').map(x => x.textContent), ['outside']);
  assert.deepEqual(tags(p, n, 'code').map(x => x.textContent), ['code']);
  assert.deepEqual(tags(p, n, 'a').map(x => [x.textContent, x.href]), [['link', 'https://x.y']]);
});
