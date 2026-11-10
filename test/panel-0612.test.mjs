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

// The words of a class an el() call gives as a string or template, without what's worked out at run time.
const words = (a, b) => (a ?? b).replace(/\$\{[^}]*\}/g, ' ').split(/\s+/).filter(w => /^[\w-]+$/.test(w));
// The classes of every <button> the panel draws, and of what's drawn inside one, from its page and scripts, and the
// classes the scripts pass in from a variable.
function buttonClasses() {
  const out = new Set(['secondary', 'save-all', 'bridge-card', 'bridge-row', 'run-switch', 'run-on', 'run-off']);
  const scripts = [pageScript(), popupsScript(), settingsScript(), headerScript()].join('\n');
  for (const m of scripts.matchAll(/el\('button',\s*(?:'([^']*)'|`([^`]*)`)/g)) for (const w of words(m[1], m[2])) out.add(w);
  // what's inside: every el() in the button's call, or in a call of bridgeButton, which makes one from its arguments
  for (const m of scripts.matchAll(/el\('button',|bridgeButton\(/g)) {
    let depth = 1, i = m.index + m[0].length;
    while (i < scripts.length && depth) { if (scripts[i] === '(') depth++; else if (scripts[i] === ')') depth--; i++; }
    for (const k of scripts.slice(m.index + m[0].length, i).matchAll(/el\('\w+',\s*(?:'([^']*)'|`([^`]*)`)/g)) for (const w of words(k[1], k[2])) out.add(w);
  }
  for (const m of page().matchAll(/<button[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/button>/g))
    for (const c of [m[1], ...[...m[2].matchAll(/class="([^"]*)"/g)].map(k => k[1])]) for (const w of c.split(/\s+/)) out.add(w);
  return out;
}
// Classes on buttons that other things share, which a rule names for those other things: the Shipped step on a
// track, a card's open state and a ticket's back link.
const NOT_BUTTONS = [/\.track \.step\.done\.ship\b/, /\.step\.ship\b/, /\.top > \.back\b/];
const touchesButton = (sel, classes) => !NOT_BUTTONS.some(re => re.test(sel)) && sel.split(/\s*[\s>+~]\s*/).some(part =>
  /^button\b|[^\w-]button\b/.test(part) || /\[role="(switch|radio)"\]/.test(part) ||
  [...part.matchAll(/\.([\w-]+)/g)].some(m => classes.has(m[1])));
const small = ([k, v]) => ((k === 'font-size' || k === 'font') && /(^|\s)12px\b/.test(v)) || (k === 'border-radius' && /(^|\s)8px\b/.test(v));

test('0612 AC3: no style gives a button, or anything drawn inside one, 8 px corners or 12 px text', () => {
  const classes = buttonClasses();
  for (const c of ['save', 'save-all', 'pack-document', 'pack-folder', 'ask-changes', 'ship', 'info', 'log-filter', 'set-ready', 'dep-chip', 'chip', 'tab',
    'tab-n', 'dep-pill', 'bridge-where', 'bridge-line'])
    assert.ok(classes.has(c), `${c} is found as a button's class`);
  const left = [];
  for (const r of rules())
    for (const sel of selectors(r).filter(s => touchesButton(s, classes)))
      for (const d of r.decls.filter(small)) left.push(`${sel} { ${d[0]}: ${d[1]} }`);
  assert.deepEqual(left, []);
  assert.notEqual(cascaded(['button'])['border-radius'], '8px', 'the rule for every button');
});
