import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';
import { settingsPage, openSettings, rowOf } from './support/settings.mjs';

// ---------- 0273: lay out the Settings view like the rest of the panel ----------

const S = (key, more = {}) => ({ key, value: 2, default: false, explain: `What ${key} does.`, ...more });
const VIEW = { groups: [
  { title: 'Building and reviewing', settings: [S('builder', { value: 'claude' }), S('reviewer', { value: 'codex', editable: true, choices: ['codex', 'claude-subagent'] })] },
  { title: 'How much runs at once', settings: [
    S('max_parallel_builds', { editable: true, for_machine: true, from: 'machine', repo_value: 1 }),
    S('max_parallel_tests', { editable: true, for_machine: true, from: 'repo', repo_value: 2, default: true })] },
] };
const cls = (n, c) => new RegExp(`\\b${c}\\b`).test(n.className || '');
const textOf = (p, key, c) => p.all(rowOf(p, key)).filter(n => cls(n, c)).map(n => n.textContent);

test('0273 AC3: a setting for this machine only, or one changed only in the file, still shows which it is', async () => {
  const p = settingsPage([VIEW]);
  await p.settle();
  await openSettings(p);
  // This machine's own value, and the repo's, each say so, with the repo's value and a way to clear this machine's.
  assert.deepEqual(textOf(p, 'max_parallel_builds', 'default'), ['this machine']);
  assert.ok(p.all(rowOf(p, 'max_parallel_builds')).some(n => n.textContent === 'The repo\'s value: 1'), 'the repo\'s value under it');
  assert.ok(p.all(rowOf(p, 'max_parallel_builds')).some(n => n.tagName === 'button' && n.textContent === 'Clear this machine\'s value'));
  assert.deepEqual(textOf(p, 'max_parallel_tests', 'default'), ['repo', 'default']);
  // One changed only in the file shows its value, with nothing to change it with.
  assert.deepEqual(textOf(p, 'builder', 'value'), ['claude']);
  assert.ok(!p.all(rowOf(p, 'builder')).some(n => ['input', 'select'].includes(n.tagName) || (n.tagName === 'button' && cls(n, 'save'))), 'builder has no control');
  assert.ok(p.all(rowOf(p, 'reviewer')).some(n => n.tagName === 'select'), 'reviewer has its control');
  // Each tag is on the setting's own row, beside its value.
  for (const key of ['max_parallel_builds', 'max_parallel_tests']) {
    const tag = p.all(rowOf(p, key)).find(n => cls(n, 'default'));
    assert.ok(cls(tag.parentNode, 'control'), `${key}'s tag is with its control`);
  }
});

test('0273 AC3: a dotted name still reads as the setting, whole', async () => {
  const p = settingsPage([{ groups: [{ title: 'Ticket size limits', settings: [S('limits.max_review_rounds')] }] }]);
  await p.settle();
  await openSettings(p);
  assert.ok(rowOf(p, 'limits.max_review_rounds'), 'its name is the whole key');
});

// ---------- in a real browser: only a real one lays the view out ----------

const skip = findChrome() ? false : 'needs Chrome or Chromium';
test('0273 AC4, AC5: at the narrowest width each row fits, and in both looks the view keeps to the panel\'s colours, type and sizes', { skip }, async () => {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 640, deviceScaleFactor: 1, mobile: true });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete'`, 'the panel');
    await b.js(`document.getElementById('settings-open').click()`);
    await b.until(`document.querySelectorAll('#settings .setting').length >= 10`, 'the settings');

    const fit = await b.js(`(() => {
      const pane = document.getElementById('settings'), box = pane.getBoundingClientRect();
      return { scrolls: pane.scrollWidth > pane.clientWidth, rows: [...pane.querySelectorAll('.setting .row')].map(row => {
        const parts = [...row.querySelectorAll('*')].map(n => n.getBoundingClientRect()).filter(x => x.width > 0);
        const label = row.querySelector('.label').getBoundingClientRect(), control = row.querySelector('.control').getBoundingClientRect();
        return { name: row.querySelector('.name').textContent, inside: parts.every(x => x.left >= box.left - 0.5 && x.right <= box.right + 0.5),
          sideBySide: label.right <= control.left + 0.5 };
      }) };
    })()`);
    assert.equal(fit.scrolls, false, 'the view doesn\'t scroll sideways');
    assert.ok(fit.rows.length >= 10, 'every setting has its row');
    for (const o of fit.rows) {
      assert.ok(o.inside, `${o.name}: its name and control are inside the view`);
      assert.ok(o.sideBySide, `${o.name}: its name is on the left and its control on the right`);
    }

    for (const look of ['light', 'dark']) {
      const out = await b.js(`(() => {
        document.documentElement.setAttribute('data-theme', '${look}');
        const probe = document.createElement('i');
        document.body.appendChild(probe);
        const tokens = new Set(['--bg', '--panel', '--raise', '--line', '--line-soft', '--text', '--muted', '--faint', '--bad', '--warn', '--ok', '--accent'].map(t => {
          probe.style.color = 'var(' + t + ')';
          return getComputedStyle(probe).color;
        }));
        probe.remove();
        const fonts = ['IBM Plex Mono', 'Zen Kaku Gothic New', 'Shippori Mincho'];
        const bad = [];
        for (const n of document.querySelectorAll('#settings, #settings *')) {
          if (['WBR', 'OPTION'].includes(n.tagName) || !n.getClientRects().length) continue;
          const s = getComputedStyle(n), what = n.tagName + '.' + n.className + ' ' + (n.textContent || '').slice(0, 30);
          const own = [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()) || n.matches('input, select, button');
          if (own) {
            if (parseFloat(s.fontSize) < 12) bad.push(what + ': ' + s.fontSize);
            if (Number(s.fontWeight) < 400) bad.push(what + ': weight ' + s.fontWeight);
            if (!fonts.some(f => s.fontFamily.includes(f))) bad.push(what + ': font ' + s.fontFamily);
            if (!tokens.has(s.color)) bad.push(what + ': colour ' + s.color);
          }
          if (s.backgroundColor !== 'rgba(0, 0, 0, 0)' && !tokens.has(s.backgroundColor)) bad.push(what + ': background ' + s.backgroundColor);
          for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
            if (parseFloat(s['border' + side + 'Width']) > 0 && s['border' + side + 'Style'] !== 'none' && !tokens.has(s['border' + side + 'Color'])) bad.push(what + ': border ' + s['border' + side + 'Color']);
          }
        }
        return bad;
      })()`);
      assert.deepEqual(out, [], `${look}: everything in the view uses the panel's own colours, type and sizes`);
    }
  } finally { await b.close(); await stop(panel); }
});

test('0273 AC4 self-check: a name breaks only after a dot or an underscore, and still reads whole', async () => {
  const keys = ['limits.max_acceptance_criteria', 'auto_ship', 'builder', '_odd..key_'];
  const p = settingsPage([{ groups: [{ title: 'Some', settings: keys.map(k => S(k)) }] }]);
  await p.settle();
  await openSettings(p);
  for (const key of keys) {
    const name = p.all(rowOf(p, key)).find(n => cls(n, 'name'));
    const parts = name.children.filter(n => n.tagName === 'span').map(n => n.textContent);
    assert.equal(parts.join(''), key);
    for (const part of parts.slice(0, -1)) assert.match(part, /[._]$/, `${key}: "${part}" ends at a dot or underscore`);
    assert.equal(name.children.filter(n => n.tagName === 'wbr').length, parts.length - 1);
  }
});
