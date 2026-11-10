import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0612: the panel's last small buttons in the redesign's size: Settings' Saves, the review pack's file, folder and Ask
// for changes buttons, and no button left with 8 px corners or 12 px text.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page, pageScript, popupsScript, settingsScript, headerScript } from './support/panel.mjs';
import { rules, selectors } from './support/css.mjs';

// Its plain rules' declarations, later ones winning, as the cascade has rules of equal or greater weight in the order they come.
const cascaded = (sels, rs = rules()) => Object.fromEntries(rs.filter(r => !r.at.length && selectors(r).some(s => sels.includes(s))).flatMap(r => r.decls));

const SIZE = { 'border-radius': '10px', 'min-height': '44px', 'font-family': 'var(--font-ui)', 'font-size': '14px', 'font-weight': '500' };
const PRIMARY = { ...SIZE, color: 'var(--bg)', background: 'var(--blue)' };
const SECONDARY = { ...SIZE, color: 'var(--text)', border: '1px solid var(--line)' };
const check = (sels, want, what) => {
  const d = cascaded(sels);
  for (const [k, v] of Object.entries(want)) assert.equal(d[k], v, `${what}: ${k}`);
};

test("0612 AC1: the Save in Settings' unsaved-changes question is a primary button of the redesign's size, as Discard and Keep editing are secondary ones", () => {
  check(['button', '#settings-unsaved button', '#settings-unsaved button.save-all'], PRIMARY, 'Save');
  check(['button', '#settings-unsaved button', '#settings-unsaved button.secondary'], SECONDARY, 'Discard and Keep editing');
  assert.match(settingsScript(), /choice\(settingsLeaving\.saving \? 'Saving…' : 'Save', 'save-all', saveAndLeave\), choice\('Discard', 'secondary'/, 'beside Discard and Keep editing');
});

test("0612 AC2: a setting's own Save, the pack's file and folder buttons and its Ask for changes are secondary buttons of the redesign's size", () => {
  check(['button', '#settings .setting .save', '#settings .arow .save'], SECONDARY, "a setting's Save");
  check(['button', '#full-ticket .pack-document'], SECONDARY, "the pack's file button");
  check(['button', '#full-ticket .pack-document', '#full-ticket .pack-folder'], SECONDARY, "the pack's folder button");
  check(['button', '#full-ticket .ask-changes', '#doc-view .ask-changes', '#full-ticket .ship-bar .ask-changes'], SECONDARY, 'Ask for changes in the ship bar');
  check(['button', '#full-ticket .ask-changes', '#doc-view .ask-changes'], SECONDARY, "Ask for changes on a task's document");
});

// The classes of every <button> the panel draws, from its page and scripts, and from the classes the scripts pass in.
function buttonClasses() {
  const out = new Set(['secondary', 'save-all', 'bridge-card', 'bridge-row', 'run-switch', 'run-on', 'run-off']); // set from a variable
  const scripts = [pageScript(), popupsScript(), settingsScript(), headerScript()].join('\n');
  for (const m of scripts.matchAll(/el\('button',\s*(?:'([^']*)'|`([^`]*)`)/g))
    for (const w of (m[1] ?? m[2]).replace(/\$\{[^}]*\}/g, ' ').split(/\s+/)) if (/^[\w-]+$/.test(w)) out.add(w);
  for (const m of page().matchAll(/<button[^>]*class="([^"]*)"/g)) for (const w of m[1].split(/\s+/)) out.add(w);
  return out;
}
// Classes on buttons that other things share, which a rule names for those other things: the Shipped step on a
// track, a card's open state and a ticket's back link.
const NOT_BUTTONS = [/\.track \.step\.done\.ship\b/, /\.step\.ship\b/, /\.top > \.back\b/];
const touchesButton = (sel, classes) => !NOT_BUTTONS.some(re => re.test(sel)) && sel.split(/\s*[\s>+~]\s*/).some(part =>
  /^button\b|[^\w-]button\b/.test(part) || /\[role="(switch|radio)"\]/.test(part) ||
  [...part.matchAll(/\.([\w-]+)/g)].some(m => classes.has(m[1])));
const small = ([k, v]) => ((k === 'font-size' || k === 'font') && /(^|\s)12px\b/.test(v)) || (k === 'border-radius' && /(^|\s)8px\b/.test(v));

test('0612 AC3: no style gives a button, or text inside one, 8 px corners or 12 px text', () => {
  const classes = buttonClasses();
  for (const c of ['save', 'save-all', 'pack-document', 'pack-folder', 'ask-changes', 'ship', 'info', 'log-filter', 'set-ready', 'dep-chip', 'chip', 'tab'])
    assert.ok(classes.has(c), `${c} is found as a button's class`);
  const left = [];
  for (const r of rules())
    for (const sel of selectors(r).filter(s => touchesButton(s, classes)))
      for (const d of r.decls.filter(small)) left.push(`${sel} { ${d[0]}: ${d[1]} }`);
  assert.deepEqual(left, []);
  assert.notEqual(cascaded(['button'])['border-radius'], '8px', 'the rule for every button');
});

test("0612 AC3: a dependency chip's pill, the part of the button that's drawn, has no 8 px corners", () => {
  const d = cascaded(['.dep-pill']);
  assert.notEqual(d['border-radius'], '8px');
  assert.notEqual(cascaded(['.dep-chip'])['font-size'], '12px');
});
