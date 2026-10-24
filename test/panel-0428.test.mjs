import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { css, rules, selectors, tokens, rule } from './support/css.mjs';

// ---------- 0428: round the panel's corners as Cursor does ----------

const RS = rules();
// What the plain rules (in no at-rule) naming any of `sels` set, applied in the order they come: the cascade for an
// element those selectors match, as each later rule in the stylesheet is at least as specific as the one before.
function resolve(sels, rs = RS) {
  const out = {};
  for (const r of rs) if (!r.at.length && selectors(r).some(s => sels.includes(s))) for (const [k, v] of r.decls) out[k] = v;
  return out;
}
// The width and colour of each side's border, from the shorthands and the longhands, in the order they were set.
function sides(sels, rs = RS) {
  const side = { top: {}, right: {}, bottom: {}, left: {} };
  const parse = v => {
    const width = (v.match(/(?:^|\s)(0|[\d.]+px)(?=\s|$)/) || [])[1];
    return { width: v === '0' || v === 'none' ? '0' : width, colour: tokens(v)[0] };
  };
  for (const r of rs) {
    if (r.at.length || !selectors(r).some(s => sels.includes(s))) continue;
    for (const [k, v] of r.decls) {
      const m = k.match(/^border(?:-(top|right|bottom|left))?(?:-(width|color))?$/);
      if (!m) continue;
      const to = m[1] ? [m[1]] : Object.keys(side);
      for (const d of to) {
        if (m[2] === 'width') side[d].width = v.split(/\s+/)[0];
        else if (m[2] === 'color') side[d].colour = tokens(v)[0];
        else Object.assign(side[d], Object.fromEntries(Object.entries(parse(v)).filter(([, x]) => x !== undefined)));
      }
    }
  }
  return side;
}

// Every button with a box of its own: its selectors, the generic `button` first. Left out: speck's screen (0438), the
// switches, whose track is the control, and the linked ids, which are words.
const BUTTONS = {
  'Full ticket / Review pack on an open card': ['button', '.full-open', '.q .full-open'],
  'Stop build': ['button', '.q .stop-build'],
  'Back to Plan': ['button', '.q .back-to-plan'],
  'Go with the recommendation': ['button', '.q .go-with'],
  'Plan\'s toggles': ['button', '.toggle'],
  'Set ready': ['button', '.set-ready'],
  'Full ticket elsewhere': ['button', '.full-open'],
  'More stats / Details': ['button', '.full-open', '.full-open.more-stats', '#shipped .details', 'td .full-open'],
  'Copy': ['button', '.resume .copy'],
  'Answer / Dismiss': ['button', '.foreman-ask .ask-reply'],
  'Reload page': ['button', '.foreman .reload'],
  'Settings\' Save beside a setting': ['button', '#settings .setting .save', '#settings .arow .save'],
  'Settings\' Save': ['button', '#settings .save-all'],
  'Settings\' info buttons': ['button', '#settings .switch-row .info', '#settings .setting .info'],
  'Settings\' question\'s buttons': ['button', '#settings-unsaved button'],
  'Close': ['button', '#full-ticket .close', '#doc-view .close', '#foreman .close', '#settings .close'],
  'Ship': ['button', '#full-ticket .ship', '#doc-view .ship'],
  'Ask for changes': ['button', '#full-ticket .ask-changes', '#doc-view .ask-changes'],
  'A document\'s button': ['button', '#full-ticket .pack-document'],
  'Settings in the frame': ['button', '.bezel .settings-open'],
  'Appearance\'s choices': ['button', '#settings .looks [role="radio"]'],
  'the priority menu\'s numbers': ['button', '.prio-menu button'],
  // 0477: the lanes' names in the strip under speck's screen are no longer boxed tabs
};

test('0428 AC1: buttons, inputs, selects, tags, toggles and the priority menu have an 8 px corner radius', () => {
  for (const [what, sels] of Object.entries(BUTTONS)) assert.equal(resolve(sels)['border-radius'], '8px', what);
  for (const sel of ['select', 'textarea', '.tag', '.prio-menu', '.toggle'])
    assert.equal(resolve(['button', sel])['border-radius'], '8px', sel);
  for (const sel of ['input:not([type="checkbox"]):not([type="radio"])', 'textarea', 'select'])
    assert.ok(RS.some(r => !r.at.length && selectors(r).includes(sel) && r.decls.some(([k, v]) => k === 'border-radius' && v === '8px')), `${sel} is rounded`);
  assert.equal(resolve(['#settings .setting .edit', 'input:not([type="checkbox"]):not([type="radio"])'])['border-radius'], '8px', 'Settings\' text boxes');
  assert.equal(resolve(['textarea', '.foreman-ask .ask-answer'])['border-radius'], '8px', 'the Answer box');
  assert.equal(resolve(['textarea', '#full-ticket .changes-note'])['border-radius'], '8px', 'the note for changes');
});

// 0477: the tabs, and their corners, are gone: the lanes are a strip of their names.

test('0428 AC2: cards, the build log, the stats, Settings\' groups and the pop-ups have a 12 px corner radius', () => {
  const BOXES = {
    'a Plan card': ['.item'], 'a Build card': ['.q'], 'a shipped card': ['#shipped tr'], 'the build log': ['.q .log'],
    'the stats': ['.stats'], 'Settings\' groups': ['#settings .sgroup'], 'Settings\' switches': ['#settings .switches'],
    'Settings\' question': ['#settings-unsaved .box'],
  };
  for (const [what, sels] of Object.entries(BOXES)) assert.equal(resolve(sels)['border-radius'], '12px', what);
  assert.equal(resolve(['.stats'])['overflow'], 'hidden', 'the stats\' tiles keep inside its corners');
});

test('0428 AC3: every button has a border on all four sides, in a colour 0161 checks for a control\'s edge', () => {
  for (const [what, sels] of Object.entries(BUTTONS)) {
    const got = sides(sels);
    for (const [d, s] of Object.entries(got)) {
      assert.ok(s.width && parseFloat(s.width) > 0, `${what}: its ${d} border is ${s.width}`);
      assert.ok(['--line', '--text', '--bad', '--bezel-muted'].includes(s.colour), `${what}: its ${d} border is in ${s.colour}`);
    }
  }
});

test('0428 AC3: the small buttons on an open card are boxed, and nothing pulls Plan\'s first toggle past its row', () => {
  for (const sel of ['.q .full-open', '.q .stop-build']) {
    const r = rule(sel);
    assert.ok(!r.decls.some(([k, v]) => k === 'border' && v === '0'), `${sel} doesn't take its border away`);
    assert.ok(!r.decls.some(([k]) => k === 'border-bottom'), `${sel} has no border on its bottom alone`);
  }
  const t = resolve(['button', '.toggle']);
  assert.ok(!t['margin-left'] || !/^-/.test(t['margin-left']), `.toggle has margin-left ${t['margin-left']}`);
  assert.ok(!t.margin || !/-/.test(t.margin), `.toggle has margin ${t.margin}`);
  assert.ok(parseFloat(resolve(['.toggles']).gap) > 0, 'the toggles have a gap between them, so each shows its own edges');
});

test('0428 AC3: the focus ring is an outline, which follows each control\'s rounded corners', () => {
  const ring = rule(':focus-visible');
  assert.match(ring.decls.find(([k]) => k === 'outline')[1], /^2px solid var\(--blue\)$/);
  for (const r of RS) assert.ok(!r.decls.some(([k, v]) => k === 'box-shadow' && /:focus/.test(r.sel) && v !== 'none'), `${r.sel} draws no ring as a shadow`);
});

test('0428 AC2: the pop-ups that fill the window keep square corners, as the window\'s own edges (the user chose this, 0160)', () => {
  for (const sel of ['#full-ticket', '#doc-view', '#foreman']) assert.equal(resolve([sel])['border-radius'] ?? '0', '0', sel);
});

// 0438 rounds speck's screen and its frame (panel-0438.test.mjs); the header round them stays square.
test('0428 AC4: the header round speck\'s screen keeps its square corners', () => {
  assert.equal(resolve(['header'])['border-radius'] ?? '0', '0', 'the header round the frame');
});

test('0428 AC5: nothing forces square corners on the whole page, and the switches stay round', () => {
  assert.doesNotMatch(css(), /border-radius\s*:[^;}]*!important/, 'no corner radius is forced');
  for (const r of RS) if (selectors(r).includes('*')) assert.ok(!r.decls.some(([k]) => k === 'border-radius'), '* sets no corner radius');
  assert.equal(resolve(['#settings [role="switch"] .track'])['border-radius'], '9px', 'the track');
  assert.equal(resolve(['#settings [role="switch"] .knob'])['border-radius'], '50%', 'the knob');
});
