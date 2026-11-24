// 0729: Settings laid out like Cursor's own settings: a plain name over a short muted line, the control on the right,
// rows on soft filled blocks under small section labels, and no info buttons.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { panelRepo, freePort, startPanel, stop, findChrome, browserPage, cssRules, cssValue } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf } from './support/settings.mjs';
import { panelSettings, CLAUDE_MODELS, SETTING_GROUPS } from '../scripts/settings.mjs';

// A project that calls its engineering manager Virgil, where this machine has its own reviewer_effort.
function repoWith(config, machine = '') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0729-'));
  fs.mkdirSync(path.join(dir, 'speck', '.cache', 'machine'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'speck', 'config.yml'), config);
  if (machine) fs.writeFileSync(path.join(dir, 'speck', '.cache', 'machine', 'config.yml'), machine);
  return dir;
}
const AGENT_MODELS = [
  { id: 'claude', name: 'Claude Code', efforts: true, models: CLAUDE_MODELS.map(m => ({ ...m })) },
  { id: 'codex', name: 'Codex', efforts: true, models: [{ slug: 'gpt-6.1-sol', efforts: ['low', 'high'] }] }];
const YOURS = { list: true, agents: AGENT_MODELS.map(a => ({ id: a.id, name: a.name, kind: 'agent', yours: true, ready: true, installed: true, signed_in: true, roles: [] })) };
// What speck panel answers for that project, with your agents' models as the agents list them.
const answer = () => ({ ...panelSettings(repoWith('speck_name: Virgil\nreviewer: codex\n', 'reviewer_effort: high\n')), your_agents: YOURS, agent_models: AGENT_MODELS });
const SERVED = answer().groups.flatMap(g => g.settings);
const WORDS = Object.fromEntries(SERVED.map(s => [s.key, s]));
const KEYS = SERVED.map(s => s.key).filter(k => /[_.]/.test(k)); // the keys that read as keys, not words

const pane = p => p.byId('settings');
const cls = (n, c) => new RegExp(`\\b${c}\\b`).test(n.className || '');
const opened = async (v = answer()) => { const p = settingsPage([v]); await p.settle(); await openSettings(p); return p; };
// Each setting's own row, leaving out a model or effort drawn inside its agent's row (0381, 0400).
const ownRows = p => p.all(pane(p)).filter(n => cls(n, 'setting') && !cls(n, 'model') && n.attrs?.['data-key']);
const keyOf = r => r.attrs['data-key'];
const labelOf = r => r.children[0].children[0]; // its name and short line
const buttonOf = r => labelOf(r).children[0]; // its name, the button that shows its explanation
const tipOf = (p, r) => p.all(r).find(n => n.tagName === 'p' && cls(n, 'explain'));

// ---------- AC1: a plain name over a short muted line, the control on the right, the key in the tooltip ----------

test('0729 AC1: speck panel gives every setting a plain name and a short line saying what it does, neither of them a key', () => {
  assert.equal(SERVED.length, 28, 'every setting Settings shows'); // 0707: and machine_parallel_tests
  for (const s of SERVED) {
    assert.match(s.label, /^[A-Z][a-z]*(?:[ -][a-z]+)*$/, `${s.key}: a name in plain words, ${s.label}`);
    assert.match(s.summary, /^[A-Z][^_]*\.$/, `${s.key}: one sentence, ${s.summary}`);
    assert.ok(s.summary.length <= 80, `${s.key}: a short line, ${s.summary.length} characters`);
    assert.ok(!KEYS.some(k => s.summary.includes(k)), `${s.key}: no key in its line`);
  }
  assert.deepEqual([WORDS.speck_name.label, WORDS.watch.label, WORDS.watch_bench.label], ['Name', 'Watch', 'Bench']);
  assert.match(WORDS.watch.summary, /\bVirgil\b/, 'the engineering manager is called by its name');
  assert.doesNotMatch(WORDS.watch.summary, /\bspeck\b/);
});

test('0729 AC1 self-check: a setting named for the engineering manager with no short line of its own is still read, with none', () => {
  const watch = SETTING_GROUPS.flatMap(g => g.settings).find(s => s.key === 'watch'), had = watch.summary;
  delete watch.summary;
  try {
    const row = panelSettings(repoWith('speck_name: Virgil\n')).groups.flatMap(g => g.settings).find(s => s.key === 'watch');
    assert.equal(row.summary, undefined);
    assert.equal(row.label, 'Watch');
  } finally { watch.summary = had; }
});

test('0729 AC1: each setting\'s row shows its plain name, its short line under it and its control after them, with its key only in the row\'s tooltip', async () => {
  const p = await opened();
  const rows = ownRows(p);
  assert.ok(rows.length >= 18, `every setting's own row: ${rows.length}`);
  for (const r of rows) {
    const key = keyOf(r), [label, control] = r.children[0].children, [name, line] = label.children;
    assert.ok(cls(label, 'label') && cls(control, 'control'), `${key}: its name and line, then its control`);
    assert.ok(cls(name, 'name') && cls(line, 'desc'), `${key}: a name over a line`);
    assert.equal(name.textContent, WORDS[key].label, `${key}: its plain name`);
    assert.equal(line.textContent, WORDS[key].summary, `${key}: its short line`);
    assert.ok(![...KEYS, key].includes(name.textContent), `${key}: no key as its label`);
    assert.ok(r.title.split(' and ').includes(key), `${key}: its key in the row's tooltip, ${r.title}`);
  }
  // A role's one list sets its model too, so its tooltip names both (0400).
  assert.equal(rowOf(p, 'builder').title, 'builder and builder_model');
  assert.equal(rowOf(p, 'reviewer').title, 'reviewer and reviewer_model');
  // Appearance and Auto-build are rows of the same kind.
  const switches = p.all(pane(p)).filter(n => cls(n, 'switch-row'));
  assert.deepEqual(switches.map(r => labelOf(r).children.map(n => n.className)), [['name', 'desc'], ['name', 'desc']]);
  assert.deepEqual(switches.map(r => labelOf(r).children[0].textContent), ['Appearance', 'Auto-build']);
  assert.ok(switches.every(r => labelOf(r).children[1].textContent.length > 0), 'each with its short line');
});

test('0729 AC1: a setting speck panel gives no name for is named in words made from its key, never the key itself', async () => {
  const S = (key, value) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true });
  const p = await opened({ groups: [{ title: 'Shipping', settings: [S('max_parallel_builds', 2), S('limits.max_review_rounds', 3)] }] });
  assert.deepEqual(ownRows(p).map(r => labelOf(r).children[0].textContent), ['Max parallel builds', 'Max review rounds']);
});

test('0729 AC1: a name is in the interface font, and its short line muted and smaller', () => {
  const name = cssRules('#settings .setting .name'), line = cssRules('#settings .label .desc');
  assert.equal(cssValue(name, 'font-family'), 'var(--font-ui)');
  assert.equal(cssValue(cssRules('#settings .switch-row .name'), 'font-family'), 'var(--font-ui)');
  assert.equal(cssValue(line, 'color'), 'var(--muted)');
  assert.ok(parseFloat(cssValue(line, 'font-size')) < parseFloat(cssValue(name, 'font-size')), 'smaller than the name');
});

// ---------- AC2: rows on rounded, filled blocks under small muted labels ----------

test('0729 AC2: each group is a small label over its rows on blocks, and a team member\'s block opens with its character, name and job', async () => {
  const p = await opened();
  const groups = pane(p).children.filter(n => /\b(sgroup|switches)\b/.test(n.className || ''));
  assert.ok(groups.length >= 5, `the groups: ${groups.length}`);
  for (const g of groups) {
    const [head, ...blocks] = g.children, title = p.all(head).find(n => n.tagName === 'h4')?.textContent;
    assert.ok(cls(head, 'sh') && title, `${g.className}: its label first`);
    assert.ok(blocks.length >= 1 && blocks.every(b => cls(b, 'block')), `${title}: then its blocks`);
    const rows = p.all(g).filter(n => /\b(setting|switch-row|arow)\b/.test(n.className || ''));
    assert.ok(rows.length >= 1 && rows.every(r => blocks.some(b => p.all(b).includes(r))), `${title}: every row on a block`);
  }
  assert.ok(p.all(groups.find(g => cls(g, 'switches'))).some(n => n.tagName === 'h4'), 'Appearance and Auto-build under a label too');
  const members = groups.find(g => cls(g, 'team')).children.slice(1);
  assert.deepEqual(members.map(m => m.attrs['data-member']), ['manager', 'builder', 'reviewer', 'qa']);
  for (const m of members) {
    const head = m.children[0], who = m.attrs['data-member'];
    assert.ok(cls(head, 'mhead'), `${who}: its block opens with a row of its own`);
    assert.ok(p.all(head).some(n => n.tagName === 'svg'), `${who}: its character`);
    assert.ok(p.all(head).some(n => n.tagName === 'h5' && n.textContent), `${who}: its name`);
    assert.ok(p.all(head).some(n => cls(n, 'job') && n.textContent), `${who}: its one-line job`);
  }
  assert.equal(p.all(members[0].children[0]).find(n => n.tagName === 'h5').textContent, 'Virgil');
});

test('0729 AC2: a block is filled with the raised background and rounded, with no border, and no line divides its rows or sits under a label', () => {
  for (const sel of ['#settings .block', '#settings .team .member']) {
    const d = cssRules(sel);
    assert.equal(cssValue(d, 'background'), 'var(--raise)', `${sel}: filled`);
    assert.equal(cssValue(d, 'border'), '0', `${sel}: no border`);
    assert.ok(parseFloat(cssValue(d, 'border-radius')) >= 8, `${sel}: rounded`);
  }
  const lines = d => d.split(';').map(x => x.split(':').map(y => y.trim())).filter(([k, v]) => /^border(-(top|right|bottom|left))?(-(width|style))?$/.test(k) && !['0', 'none'].includes(v));
  for (const sel of ['#settings .setting', '#settings .switch-row', '#settings .arow', '#settings .sgroup .sh', '#settings .switches .sh', '#settings .member .levels'])
    for (const d of cssRules(sel)) assert.deepEqual(lines(d), [], `${sel}: no line`);
  const label = cssRules('#settings .sgroup h4');
  assert.equal(cssValue(label, 'color'), 'var(--muted)', 'a muted label');
  assert.equal(cssValue(label, 'font-size'), '12px', 'a small label');
});

// ---------- AC3: no info buttons; the explanation one press away ----------

test('0729 AC3: no row has an info button, and one press on a setting\'s name shows its full explanation, which the next press hides', async () => {
  const p = await opened();
  const infos = p.all(pane(p)).filter(n => n.tagName === 'button' && (cls(n, 'info') || /^About\b/.test(n.attrs?.['aria-label'] || '')));
  assert.deepEqual(infos.map(n => n.attrs?.['aria-label'] || n.className), [], 'no info button');
  for (const r of ownRows(p)) {
    const key = keyOf(r), label = buttonOf(r), tip = tipOf(p, r), server = WORDS[key].explain;
    assert.equal(label.tagName, 'button', `${key}: its name is a button`);
    assert.equal(tip.hidden, true, `${key}: hidden until asked for`);
    assert.equal(label.attrs['aria-expanded'], 'false', key);
    assert.equal(label.attrs['aria-describedby'], tip.id, `${key}: the explanation describes it`);
    p.press(label); // its line is part of its target too, which only a real browser shows
    assert.equal(tip.hidden, false, `${key}: shown after one press`);
    assert.equal(label.attrs['aria-expanded'], 'true', key);
    assert.ok(tip.textContent.startsWith(server.slice(0, server.indexOf('. ') + 1)), `${key}: its own explanation, ${tip.textContent}`);
    assert.match(tip.textContent, /A change here is saved (for your machine only|for the project in speck\/config\.yml|in \S+ for every project on this machine)/, `${key}: where a change is saved`);
    if (/When it isn't set/.test(server)) assert.match(tip.textContent, /When it isn't set, \w+ uses /, `${key}: its default`);
    assert.equal(p.all(pane(p)).filter(n => cls(n, 'explain') && !n.hidden).length, 1, `${key}: one at a time`);
    p.press(label);
    assert.equal(tip.hidden, true, `${key}: hidden by the next press`);
    assert.equal(label.attrs['aria-expanded'], 'false', key);
  }
});

test('0729 AC3: a setting this machine has its own value for still says so in its explanation, with the option to clear it', async () => {
  const p = await opened();
  p.press(buttonOf(rowOf(p, 'reviewer')));
  const tip = tipOf(p, rowOf(p, 'reviewer'));
  assert.equal(tip.hidden, false, 'its explanation, after one press on its name');
  assert.match(tip.textContent, /This is your machine's own value, used over the project's: /, 'its effort is this machine\'s own');
  const clear = p.all(tip).find(n => n.tagName === 'button' && n.textContent === 'Clear this machine\'s value');
  assert.ok(clear, 'its clear option');
  p.press(clear);
  const again = tipOf(p, rowOf(p, 'reviewer'));
  assert.equal(again.hidden, false, 'the explanation stays open to show what it did');
  assert.match(again.textContent, /This machine's value, high, is cleared when you save\./);
  assert.ok(p.all(again).some(n => n.tagName === 'button' && n.textContent === 'Keep this machine\'s value'));
});

// ---------- AC2 and AC4 in a real browser: the blocks as drawn, and a 375 px wide view ----------

// In the page: each block's fill, border and corners, each group's label, any line drawn inside a block, and the names'
// size, all in the look shown.
const BLOCKS = `(() => {
  const pane = document.getElementById('settings'), colour = v => { const n = document.createElement('i'); n.style.color = 'var(' + v + ')'; pane.append(n); const c = getComputedStyle(n).color; n.remove(); return c; };
  const lines = n => ['Top', 'Right', 'Bottom', 'Left'].filter(d => { const c = getComputedStyle(n); return c['border' + d + 'Style'] !== 'none' && parseFloat(c['border' + d + 'Width']) > 0; });
  const blocks = [...pane.querySelectorAll('.block, .team .member')].filter(b => b.getClientRects().length);
  const inside = blocks.flatMap(b => [...b.querySelectorAll('*')]).filter(n => n.getClientRects().length && !n.closest('input, select, button, p.explain') && lines(n).length);
  const nameSize = parseFloat(getComputedStyle(pane.querySelector('.setting .name')).fontSize);
  return { raise: colour('--raise'), muted: colour('--muted'), nameSize,
    blocks: blocks.map(b => { const c = getComputedStyle(b); return { cls: b.className, fill: c.backgroundColor, lines: lines(b), radius: parseFloat(c.borderTopLeftRadius) }; }),
    labels: [...pane.querySelectorAll(':scope > section')].map(s => { const h = s.firstElementChild?.querySelector('h4'); return { cls: s.className, text: h?.textContent, colour: h && getComputedStyle(h).color, size: h && parseFloat(getComputedStyle(h).fontSize) }; }),
    inside: inside.map(n => n.tagName + '.' + n.className + ': ' + lines(n).join(' ')) };
})()`;
// In the page at its width: whether it scrolls sideways, each row's name and control as placed in its block, and each
// control's target: whether a 44 px square round its middle reaches it (a tick box's is its label, with its word).
const ROWS = `(() => {
  const pane = document.getElementById('settings'), shown = n => n.getClientRects().length > 0;
  const rows = [...pane.querySelectorAll('.setting:not(.model), .switch-row, .arow')].filter(shown).map(r => {
    const label = r.querySelector(':scope > .row > .label'), control = r.querySelector(':scope > .row > .control');
    if (!label || !control || !shown(control) || !control.children.length) return null;
    const block = r.closest('.block, .member'), b = block.getBoundingClientRect(), c = getComputedStyle(block);
    const l = label.getBoundingClientRect(), k = control.getBoundingClientRect();
    return { what: r.getAttribute('data-key') || label.textContent.slice(0, 40), left: b.left + parseFloat(c.paddingLeft), right: b.right - parseFloat(c.paddingRight),
      label: [l.left, l.right, l.top, l.bottom], control: [k.left, k.right, k.top, k.bottom], overflows: label.scrollWidth > label.clientWidth + 1,
      wraps: [...label.children].every(n => getComputedStyle(n).whiteSpace === 'normal') };
  }).filter(Boolean);
  // A tick box's target is its label, with its word, and a setting's name's is its name with its short line, which its
  // button reaches over.
  const targets = [...pane.querySelectorAll('button, select, input')].filter(n => shown(n) && !n.closest('p.explain')).map(n => {
    const t = n.type === 'checkbox' ? n.closest('label') : n.matches('.label > button.name') ? n.parentNode : n;
    t.scrollIntoView({ block: 'center' });
    const r = t.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const reaches = hit => hit === n || n.contains(hit) || (n.type === 'checkbox' && t.contains(hit));
    const missed = [[0, 0], [0, -21.5], [0, 21.5], [-21.5, 0], [21.5, 0]].filter(([dx, dy]) => !reaches(document.elementFromPoint(x + dx, y + dy)));
    return { what: n.tagName + '.' + n.className + ' ' + (n.getAttribute('aria-label') || n.textContent).slice(0, 40), missed, size: [Math.round(r.width), Math.round(r.height)] };
  });
  // A press on a setting's short line is a press on its name.
  const lines = [...pane.querySelectorAll('.label > .desc')].filter(shown).map(d => {
    d.scrollIntoView({ block: 'center' });
    const r = d.getBoundingClientRect(), hit = document.elementFromPoint(r.left + Math.min(r.width / 2, 40), r.top + r.height / 2);
    return { what: d.textContent.slice(0, 40), name: hit === d.parentNode.querySelector('button.name') };
  });
  return { sideways: pane.scrollWidth > pane.clientWidth, rows, targets, lines };
})()`;

const skip = findChrome() ? false : 'needs Chrome or Chromium';
test('0729 AC2, AC4: in a real browser, each block is filled and rounded with no lines, and at 375 px every row fits with its control on the right or under its name, each control a 44 px target', { skip, timeout: 180000 }, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 800, deviceScaleFactor: 1, mobile: false });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && !!document.getElementById('settings-open')`, 'the panel');
    await b.js(`document.getElementById('settings-open').click(), true`);
    // 0557: the agents' models come from the agents themselves, which is slow while the whole suite runs
    await b.until(`document.querySelectorAll('#settings .setting').length >= 10 && settingsView.catalogues !== 'loading' && !!document.querySelector('#settings .levels select')`, 'the settings and your agents\' models', 60000);
    await b.js(`[...document.querySelectorAll('#settings .agents button')].find(n => n.textContent === 'Add an agent')?.click(), true`); // its offers and the provider form, with their controls
    await b.until(`!!document.querySelector('#settings .provider-form input')`, 'the provider form');
    for (const width of [1200, 375]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile: width < 700 });
      for (const look of ['light', 'dark']) {
        await b.js(`document.getElementById('look-${look}').click(), true`);
        await b.until(`document.documentElement.dataset.theme === '${look}'`, 'the look');
        const at = `${width} px, ${look}`, d = await b.js(BLOCKS);
        assert.ok(d.blocks.length >= 8, `${at}: the blocks, ${d.blocks.length}`);
        for (const k of d.blocks) {
          assert.equal(k.fill, d.raise, `${at}: ${k.cls} is filled with the raised background`);
          assert.deepEqual(k.lines, [], `${at}: ${k.cls} has no border`);
          assert.ok(k.radius >= 8, `${at}: ${k.cls} is rounded`);
        }
        assert.deepEqual(d.inside, [], `${at}: no line inside a block`);
        for (const l of d.labels) {
          assert.ok(l.text, `${at}: ${l.cls} is under a label`);
          assert.equal(l.colour, d.muted, `${at}: ${l.text} is muted`);
          assert.ok(l.size < d.nameSize, `${at}: ${l.text} is smaller than a setting's name`);
        }
        if (width !== 375) continue;
        const v = await b.js(ROWS);
        assert.equal(v.sideways, false, `${at}: no sideways scroll`);
        assert.ok(v.rows.length >= 20, `${at}: the rows, ${v.rows.length}`);
        for (const r of v.rows) {
          const [ll, lr, lt, lb] = r.label, [cl, cr, ct] = r.control;
          assert.ok(ll >= r.left - 0.5 && lr <= r.right + 0.5, `${at}: ${r.what}'s name fits its block`);
          assert.ok(Math.abs(cr - r.right) < 0.5, `${at}: ${r.what}'s control is on the right, ending at ${cr}, not ${r.right}`);
          assert.ok(cl >= r.left - 0.5, `${at}: ${r.what}'s control fits its block`);
          assert.ok((ct < lb && cl >= lr) || ct >= lb - 0.5, `${at}: ${r.what}'s control beside its name or under it`);
          assert.ok(!r.overflows && r.wraps, `${at}: ${r.what}'s name and line wrap`);
          void lt;
        }
        assert.ok(v.lines.length >= 20 && v.lines.every(l => l.name), `${at}: a press on a short line reaches its name: ${JSON.stringify(v.lines.filter(l => !l.name))}`);
        assert.ok(v.targets.length >= 30, `${at}: the controls, ${v.targets.length}`);
        const small = v.targets.filter(t => t.missed.length).map(t => `${t.what} (${t.size.join(' x ')}): ${t.missed.map(m => m.join(',')).join(' ')}`);
        assert.deepEqual(small, [], `${at}: every control a 44 px target`);
      }
    }
  } finally { await b.close(); await stop(panel); }
});
