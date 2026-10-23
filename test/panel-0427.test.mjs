import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, panelRepo, freePort, startPanel, stop, findChrome, browserPage, T, openLane, styles, pageScript } from './support/panel.mjs';

// ---------- 0427: use Cursor's fonts in the panel ----------

const UI = '-apple-system, BlinkMacSystemFont, "Segoe WPC", "Segoe UI", system-ui, "Ubuntu", "Droid Sans", sans-serif';
const MONO = '"SF Mono", Monaco, Menlo, Consolas, "Ubuntu Mono", "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace';
const DOTO = '"Doto", ui-monospace, monospace';

const css = () => styles();
// The stylesheet as rules: each one's selector and declarations, outside @keyframes.
function rules(text = css()) {
  const out = [], stack = [];
  let buf = '';
  for (const ch of text.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (ch === '{') { stack.push(buf.trim()); buf = ''; } else if (ch === '}') {
      const sel = stack.pop();
      if (buf.trim()) out.push({ sel, at: stack.filter(s => s.startsWith('@')), decls: buf.split(';').map(d => d.trim()).filter(Boolean).map(d => { const i = d.indexOf(':'); return [d.slice(0, i).trim(), d.slice(i + 1).trim()]; }) });
      buf = '';
    } else buf += ch;
  }
  return out.filter(r => !r.at.some(a => a.startsWith('@keyframes')));
}
const get = (r, prop) => r.decls.filter(([k]) => k === prop).map(([, v]) => v).pop();
// The rule whose selector list is exactly `sel`, outside any at-rule.
const rule = sel => { const r = rules().find(x => x.sel === sel && !x.at.length); assert.ok(r, `a rule for ${sel}`); return r; };
// The font list a rule names, from font-family or the end of font, or undefined.
const family = r => get(r, 'font-family') ?? (get(r, 'font')?.match(/^(?:\d{3}\s+)?[\d.]+px(?:\/[\d.]+)?\s+(.+)$/) || [])[1];

test('0427 AC1: body text is 14 px in Cursor\'s interface font', () => {
  assert.equal(get(rules().find(r => r.sel === 'body' && get(r, 'font')), 'font'), `400 14px/1.5 ${UI}`);
});

test('0427 AC1 and AC2: every font list in the stylesheet is the interface font, the monospace or, for the title, Doto', () => {
  const named = rules().filter(r => family(r) && family(r) !== 'inherit');
  assert.ok(named.length > 40, `font lists found (${named.length})`);
  for (const r of named) {
    const f = family(r);
    if (r.sel === '.bezel .name') { assert.equal(f, DOTO, 'speck\'s title stays Doto'); continue; }
    if (r.sel === '@font-face') continue;
    assert.ok(f === UI || f === MONO, `${r.sel}: ${f}`);
  }
});

test('0427 AC1: no text is set at 13 px any more', () => {
  for (const r of rules()) {
    for (const [k, v] of r.decls) {
      if (k === 'font-size') assert.notEqual(v, '13px', `${r.sel}: font-size 13px`);
      if (k === 'font') assert.doesNotMatch(v, /(?:^|\s)13px\b/, `${r.sel}: font ${v}`);
    }
  }
  for (const sel of ['.foreman', '.stat .label', '.shaping .md table']) assert.equal(get(rule(sel), 'font-size'), '14px', sel);
});

test('0427 AC2: ids, the build log, code and figures use Cursor\'s monospace', () => {
  assert.equal(get(rule('code, .mono, .id'), 'font-family'), MONO, 'code and ids');
  assert.equal(get(rule('#full-ticket .top .id'), 'font-family'), MONO, 'the id at the top of the full ticket');
  assert.equal(get(rule('.q .log'), 'font'), `12px/1.5 ${MONO}`, 'the build log');
  for (const sel of ['td.num', '#shipped .fig .v', '.stat .count', '.foreman ol.run-log', '.tag']) assert.equal(family(rule(sel)), MONO, sel);
});

test('0427 AC3: headings, tab names and ticket titles are the interface font at 600, and the old fonts are gone', () => {
  for (const sel of ['.tab .tab-name', '.sh h2', '.title', '#shipped .line .title-link', '.foreman h3', '#settings .top h3', '#settings .sgroup h4', '#settings-unsaved h3',
    '#full-ticket h4, #full-ticket > .md .md-h1, #full-ticket > .md .md-h2, #full-ticket > .md .md-h3']) {
    const r = rule(sel);
    assert.equal(family(r), UI, `${sel}: the interface font`);
    assert.equal(get(r, 'font-weight'), '600', `${sel}: weight 600`);
  }
  for (const name of ['Zen Kaku Gothic New', 'Shippori Mincho', 'IBM Plex Mono', 'Noto Serif JP', 'Noto Sans JP']) assert.ok(!(page() + styles()).includes(name), `the page names ${name}`);
});

test('0427 AC4: no label is in spaced capitals: buttons and labels are sentence case in the interface font', () => {
  for (const r of rules()) {
    assert.notEqual(get(r, 'text-transform'), 'uppercase', `${r.sel} is in capitals`);
    const ls = get(r, 'letter-spacing');
    if (ls !== undefined) assert.ok(parseFloat(ls) <= 0, `${r.sel}: letter-spacing ${ls}`);
  }
  for (const sel of ['.full-open', '.toggle', '.set-ready', '.q .stop-build', '.q .back-to-plan', '.resume .copy', '.group', '.detail h4', '#shipped .fig .k',
    '#full-ticket .close, #doc-view .close, #foreman .close, #settings .close', '#full-ticket .ship, #doc-view .ship', '#settings .save-all']) {
    assert.equal(family(rule(sel)), UI, `${sel}: the interface font`);
  }
  // The words themselves are already sentence case: the capitals were only the stylesheet's.
  const script = pageScript();
  for (const words of ["'full-open', 'Full ticket'", "'full-open', 'Review pack'", '`${label} · ${n}`', "'Ask for changes'", "'Set ready'"]) assert.ok(script.includes(words), words);
  assert.match(script, /'More stats'/);
});

test('0427 AC5: no text is smaller than 12 px, and no text or label is lighter than 400', () => {
  for (const r of rules()) {
    for (const [k, v] of r.decls) {
      if (k === 'font-size' && /px$/.test(v)) assert.ok(parseFloat(v) >= 12, `${r.sel}: font-size ${v}`);
      if (k === 'font') {
        const m = v.match(/^(?:(\d{3})\s+)?([\d.]+)px/);
        if (m) { assert.ok(Number(m[2]) >= 12, `${r.sel}: ${v}`); if (m[1]) assert.ok(Number(m[1]) >= 400, `${r.sel}: ${v}`); }
      }
      if (k === 'font-weight' && /^\d+$/.test(v) && r.sel !== '@font-face') assert.ok(Number(v) >= 400, `${r.sel}: font-weight ${v}`);
    }
  }
});

test('0427 AC1 self-check: words that were in the monospace only to look like labels are in the interface font', () => {
  for (const sel of ['.lane-n', '.question-fact', '.act', '.foreman .reload', '#settings [role="switch"]', '#settings .looks [role="radio"]', '#settings .agent .state',
    '#settings .switch-row .name, #settings .arow .name']) assert.equal(family(rule(sel)), UI, sel);
  // a setting's key and value are code, so they stay in the monospace
  assert.equal(family(rule('#settings .setting .value')), MONO);
});

// ---------- in a real browser ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const STATE = { run: { on: true }, ideas: [], tickets: [
  T('0801', 'building', { title: 'At work', started: new Date(Date.now() - 60000).toISOString(), build_running: true }),
  T('0802', 'blocked', { title: 'Stuck', started: new Date(Date.now() - 60000).toISOString(), blocked_question: 'Which way?' }),
] };
const stub = `(() => {
  const STATE = ${JSON.stringify(STATE)};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : /\\/log$/.test(String(url)) ? json({ text: '' }) : real(url, opts);
})();`;

test('0427 AC1: in a real browser, a ticket\'s stage sentence and a question are 14 px, in the interface font', skip, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.querySelectorAll('#queue .q').length === 2`, 'the panel');
    await b.js(openLane('build'));
    await b.js(`[...document.querySelectorAll('#queue .q')].find(q => q.querySelector('.id').textContent === '0802').querySelector('.top').click(), true`);
    await b.until(`!!document.querySelector('#queue .q.open .question')`, 'the question');
    const seen = await b.js(`[...document.querySelectorAll('#queue .q .top .say'), document.querySelector('#queue .q.open .question')].map(n => ({ text: n.textContent, size: getComputedStyle(n).fontSize, font: getComputedStyle(n).fontFamily }))`);
    assert.equal(seen.length, 2, JSON.stringify(seen)); // 0434: 0801's builder is at work, so a grid of lights stands in for its sentence
    assert.ok(await b.js(`!!document.querySelector('#queue .q .top .lights')`), '0801: its grid');
    for (const s of seen) {
      assert.equal(s.size, '14px', `${s.text}: ${s.size}`);
      assert.match(s.font, /BlinkMacSystemFont/, `${s.text}: ${s.font}`);
    }
  } finally { await b.close(); await stop(panel); }
});
