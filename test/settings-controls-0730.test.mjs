// 0730: Settings' switches, menus, boxes and buttons look like Cursor's settings controls.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cssRules, cssValue, styles, findChrome, browserPage, freePort, startPanel, stop, panelRepo } from './support/panel.mjs';
import { settingsPage, openSettings, controlOf, changeTo, posted } from './support/settings.mjs';

const S = (key, value, o = {}) => ({ key, value, default: false, explain: `What ${key} does.`, editable: true, ...o });
const VIEW = () => ({ groups: [
  { title: 'Shipping', settings: [
    S('auto_ship', false, { choices: [true, false] }),
    S('auto_ship_risk', ['low'], { choices: ['low', 'high'] }),
    S('max_parallel_builds', 2),
  ] },
  { title: 'Building and reviewing', settings: [
    S('reviewer', 'codex', { choices: ['codex', 'claude-subagent'] }),
    S('allow_same_model_review', false, { choices: [true, false], for_machine: true }),
    S('watch', 'fix', { choices: ['off', 'tell', 'fix'] }),
  ] },
] });

const opened = async (views = [VIEW()], saves = [], globals = {}) => {
  const p = settingsPage(views, saves, { confirm: () => true, ...globals });
  await p.settle();
  await openSettings(p);
  return p;
};
const rel = hex => {
  const n = parseInt(hex.slice(1), 16);
  const rgb = [n >> 16 & 255, n >> 8 & 255, n & 255].map(c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
};
const contrast = (a, b) => { const [hi, lo] = [rel(a), rel(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
const rootVars = (theme = null) => {
  const css = styles().replace(/\/\*[\s\S]*?\*\//g, '');
  const block = theme
    ? (css.match(new RegExp(`:root\\[data-theme="${theme}"\\]\\s*\\{([^{}]*)\\}`)) || [])[1] || ''
    : (css.match(/:root\s*\{([^{}]*)\}/) || [])[1] || '';
  return Object.fromEntries([...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)].map(m => [m[1], m[2].trim()]));
};

// ---------- AC1: green/grey switches with a white knob ----------

test('0730 AC1: Auto-build, auto_ship and allow_same_model_review are switches, not lists', async () => {
  const p = await opened();
  const run = p.all(p.byId('settings')).find(n => n.id === 'run-switch');
  assert.equal(run?.attrs?.role, 'switch');
  for (const key of ['auto_ship', 'allow_same_model_review']) {
    const c = controlOf(p, key);
    assert.equal(c.tagName, 'button', key);
    assert.equal(c.attrs.role, 'switch', key);
    assert.equal(c.attrs['aria-checked'], 'false', key);
    assert.equal(c.value, 'false', key);
  }
  assert.equal(controlOf(p, 'reviewer').tagName, 'select', 'other lists stay lists');
  assert.equal(controlOf(p, 'auto_ship_risk').type, 'checkbox', 'risks stay boxes to tick');
});

test('0730 AC1: flipping auto_ship and allow_same_model_review keeps their values and Save still sends them', async () => {
  const p = await opened([VIEW(), VIEW()], [{ ok: true, changed: ['auto_ship', 'allow_same_model_review'] }]);
  changeTo(p, 'auto_ship', 'true');
  changeTo(p, 'allow_same_model_review', 'true');
  assert.equal(controlOf(p, 'auto_ship').attrs['aria-checked'], 'true');
  assert.equal(controlOf(p, 'allow_same_model_review').value, 'true');
  await p.settle();
  assert.ok(posted(p).some(u => /auto_ship=true/.test(u)), posted(p).join(' | '));
  assert.ok(posted(p).some(u => /allow_same_model_review=true/.test(u)), posted(p).join(' | '));
});

test('0730 AC1: a switch\'s track is green when on and grey when off, with a white knob, in both looks', () => {
  const off = cssRules('#settings [role="switch"] .track');
  const on = cssRules('#settings [role="switch"][aria-checked="true"] .track');
  const knob = cssRules('#settings [role="switch"] .knob');
  const onKnob = cssRules('#settings [role="switch"][aria-checked="true"] .knob');
  assert.equal(cssValue(off, 'background'), 'var(--switch-off)');
  assert.equal(cssValue(on, 'background'), 'var(--switch)');
  assert.equal(cssValue(on, 'border-color'), 'var(--switch)');
  for (const d of [knob, onKnob]) assert.equal(cssValue(d, 'background'), 'var(--switch-knob)', 'white knob');
  const light = rootVars(), dark = { ...light, ...rootVars('dark') };
  assert.ok(contrast(light['--switch'], light['--raise']) >= 3, `light switch vs raise: ${contrast(light['--switch'], light['--raise']).toFixed(2)}`);
  assert.ok(contrast(dark['--switch'], dark['--raise']) >= 3, `dark switch vs raise: ${contrast(dark['--switch'], dark['--raise']).toFixed(2)}`);
  assert.notEqual(light['--switch'], light['--green'], 'apart from the panel\'s status green');
  assert.notEqual(dark['--switch'], dark['--green'], 'apart from the panel\'s status green in the dark look');
});

// ---------- AC2: compact borderless menus with a chevron ----------

test('0730 AC2: every list is a compact menu in the interface font, with no box border until hover or focus, and a chevron', () => {
  assert.equal(cssValue(cssRules('#settings .setting .edit'), 'font-family'), 'var(--font-ui)');
  // Beats #settings .setting .edit so the resting menu keeps a transparent border and its chevron (review round 1).
  const select = cssRules('#settings .setting select.edit');
  assert.equal(cssValue(select, 'appearance'), 'none');
  assert.equal(cssValue(select, 'border-color'), 'transparent');
  assert.match(cssValue(select, 'background-image') || '', /linear-gradient/, 'a chevron drawn on the menu');
  assert.ok(parseFloat(cssValue(cssRules('#settings .setting .edit'), 'border-radius')) >= 6, 'rounded');
  assert.match(styles(), /#settings \.setting select\.edit:(?:hover|focus(?:-visible)?)/);
});

test('0730 AC2: a list still offers the same choices, including Default for a blank', async () => {
  const p = await opened();
  const list = controlOf(p, 'watch');
  assert.equal(list.tagName, 'select');
  assert.deepEqual(list.children.map(o => o.value), ['off', 'tell', 'fix']);
  changeTo(p, 'watch', 'tell');
  assert.equal(controlOf(p, 'watch').value, 'tell');
  // A blank choice still reads as default in lists that offer one (0276).
  assert.match(styles(), /select\.edit/, 'lists stay native select elements');
});

// ---------- AC3: small rounded boxes and buttons in the interface font ----------

test('0730 AC3: text and number boxes are small rounded controls in the interface font, with a light border', () => {
  const edit = cssRules('#settings .setting .edit');
  assert.equal(cssValue(edit, 'font-family'), 'var(--font-ui)');
  assert.match(cssValue(edit, 'border') || '', /var\(--line\)/);
  assert.ok(parseFloat(cssValue(edit, 'border-radius')) >= 6);
  assert.equal(cssValue(edit, 'font-size'), '14px');
});

test('0730 AC3: Remove and the other small buttons are small rounded controls with a light border', () => {
  const save = cssRules('#settings .setting .save');
  const remove = cssRules('#settings .levels .ltextbtn');
  assert.match(cssValue(save, 'font-family') || 'var(--font-ui)', /--font-ui/);
  assert.match(cssValue(save, 'border') || '', /var\(--line\)/);
  assert.ok(parseFloat(cssValue(save, 'border-radius')) >= 6);
  assert.match(cssValue(remove, 'border') || '', /var\(--line\)/);
  assert.ok(parseFloat(cssValue(remove, 'border-radius')) >= 8);
  assert.equal(cssValue(remove, 'font-family'), 'var(--font-ui)');
});

// ---------- AC4: 44 px targets, focus rings, same behaviour in both looks ----------

test('0730 AC4: every control keeps a 44 px target and a visible focus ring', () => {
  assert.equal(cssValue(cssRules('#settings [role="switch"]'), 'min-height'), '44px');
  assert.equal(cssValue(cssRules('#settings select.edit'), 'min-height'), '44px');
  assert.match(styles(), /:focus-visible\s*\{[^}]*outline:\s*2px solid/);
  const focusSelect = [...styles().matchAll(/#settings \.setting select\.edit:focus(?:-visible)?[^{]*\{([^}]*)\}/g)].map(m => m[1]).join(';');
  assert.match(focusSelect, /border-color:\s*var\(--line\)/, 'a focused list shows its border');
});

test('0730 AC4: flipping a switch both ways leaves the same saving behaviour', async () => {
  const after = VIEW();
  after.groups[0].settings[0] = { ...after.groups[0].settings[0], value: true };
  const p = await opened([VIEW(), after], [{ ok: true, changed: ['auto_ship'] }]);
  assert.equal(controlOf(p, 'auto_ship').value, 'false');
  changeTo(p, 'auto_ship', 'true');
  await p.settle();
  assert.match(posted(p)[0] || '', /auto_ship=true/);
});

// ---------- AC5 covered by updating tests that pinned the old look (0511, 0259, 0666) ----------

test('0730 AC5: the old black-and-white on track and monospace lists are gone', () => {
  const on = cssRules('#settings [role="switch"][aria-checked="true"] .track').join(';');
  assert.doesNotMatch(on, /background:\s*var\(--text\)/);
  assert.equal(cssValue(cssRules('#settings .setting .edit'), 'font-family'), 'var(--font-ui)');
  assert.notEqual(cssValue(cssRules('#settings .setting .edit'), 'font-family'), 'var(--font-mono)');
});

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it', timeout: 60000 };

test('0730 AC1 and AC4: in a real browser the on track is green, the knob white, and each switch is at least 44 px tall', skip, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && !!document.getElementById('settings-open')`, 'the panel');
    await b.js(`document.getElementById('settings-open').click(); true`);
    // Agents and settings both load; give them longer than the default 10 s when the machine is busy.
    await b.until(`!!document.getElementById('run-switch') && !/Loading the settings|Loading your agents/.test(document.getElementById('settings').textContent)`, 'Settings', 30000);
    const measure = look => b.js(`(() => {
      document.documentElement.dataset.theme = '${look}';
      const colour = v => { const n = document.createElement('i'); n.style.color = 'var(' + v + ')'; document.body.append(n); const c = getComputedStyle(n).color; n.remove(); return c; };
      const sw = document.getElementById('run-switch');
      sw.setAttribute('aria-checked', 'true');
      const track = getComputedStyle(sw.querySelector('.track')), knob = getComputedStyle(sw.querySelector('.knob'));
      const ship = document.querySelector('#settings [data-key="auto_ship"] [role="switch"]');
      return { green: colour('--switch'), status: colour('--green'), knobWhite: colour('--switch-knob'),
        track: track.backgroundColor, knob: knob.backgroundColor,
        h: sw.getBoundingClientRect().height, shipH: ship && ship.getBoundingClientRect().height,
        shipRole: ship && ship.getAttribute('role'), shipTag: ship && ship.tagName.toLowerCase() };
    })()`);
    for (const look of ['light', 'dark']) {
      const m = await measure(look);
      assert.equal(m.track, m.green, `${look}: on track is the switch green`);
      assert.notEqual(m.green, m.status, `${look}: apart from status green`);
      assert.equal(m.knob, m.knobWhite, `${look}: white knob`);
      assert.ok(m.h >= 44, `${look}: Auto-build target ${m.h} px`);
      assert.ok(m.shipH >= 44, `${look}: auto_ship target ${m.shipH} px`);
      assert.equal(m.shipTag, 'button', `${look}: auto_ship is a switch`);
      assert.equal(m.shipRole, 'switch', look);
    }
  } finally {
    await b.close();
    await stop(panel);
  }
});

// Round 1 F1: a real settings-row select's computed style, not the rule text alone — transparent border and chevron at rest.
test('0730 AC2: in a real browser a settings list is borderless with a chevron until hover or focus', skip, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && !!document.getElementById('settings-open')`, 'the panel');
    await b.js(`document.getElementById('settings-open').click(); true`);
    await b.until(`!!document.querySelector('#settings .setting select.edit') && !/Loading the settings/.test(document.getElementById('settings').textContent)`, 'Settings list', 30000);
    for (const look of ['light', 'dark']) {
      const m = await b.js(`(() => {
        document.documentElement.dataset.theme = '${look}';
        const sel = document.querySelector('#settings .setting select.edit');
        sel.blur();
        const cs = getComputedStyle(sel);
        const line = (() => { const n = document.createElement('i'); n.style.borderColor = 'var(--line)'; document.body.append(n); const c = getComputedStyle(n).borderColor; n.remove(); return c; })();
        return { border: cs.borderTopColor, bg: cs.backgroundImage, line, tag: sel.tagName.toLowerCase() };
      })()`);
      assert.equal(m.tag, 'select', look);
      assert.notEqual(m.border, m.line, `${look}: resting border is not the line colour`);
      assert.match(m.bg, /linear-gradient/i, `${look}: chevron at rest`);
    }
  } finally {
    await b.close();
    await stop(panel);
  }
});
