import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, round, fakePage, queueRows, click, stoppedClock, panelRepo, freePort, startPanel, stop, findChrome, browserPage, openLane } from './support/panel.mjs';

// ---------- 0443: a closed Build ticket's long status in short words, so its stage and time fit on a phone ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const NOW = Date.now(); // the real browser's clock too
const ago = s => new Date(NOW - s * 1000).toISOString();
const approved = o => ({ started: ago(1212), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)], ...o });

// Every long status, with speck run on (`on`) or off, and the short words and full sentence each shows.
const CASES = [
  { id: '0801', on: true, short: 'Ready to ship', sentence: 'Approved · waiting for you to ship it',
    t: T('0801', 'approved', approved({ type: 'bug', auto_ship: false })) },
  { id: '0802', on: true, short: 'Shipping next', sentence: 'Approved · waiting to ship',
    t: T('0802', 'approved', approved({ type: 'fix', auto_ship: true, build_exit: { at: ago(30), code: 0 } })) },
  { id: '0803', on: true, short: 'Has a question', sentence: 'Blocked · it has a question for you',
    t: T('0803', 'blocked', { started: ago(5999), self_check: 'no changes', rounds: [round(1, 10), round(2, 10)], blocked_question: 'A or B?', foreman_will: false }) },
  { id: '0804', on: true, short: 'Foreman will answer', sentence: 'Blocked · the Foreman will take its recommendation',
    t: T('0804', 'blocked', { type: 'bug', started: ago(45296), self_check: 'no changes', rounds: [round(1, 10), round(2, 10)], blocked_question: 'A or B?', blocked_recommendation: 'A', foreman_will: true }) },
  { id: '0805', on: true, short: 'Build stopped', sentence: 'The build stopped',
    t: T('0805', 'reviewing', { type: 'bug', started: ago(5999), self_check: 'no changes', rounds: [round(1, 10)], build_exit: { at: ago(30), code: 1 } }) },
  { id: '0806', on: false, short: 'Turn on Auto-build', sentence: 'Approved · turn on Auto-build to ship it',
    t: T('0806', 'approved', approved({ type: 'fix', auto_ship: true, build_exit: { at: ago(30), code: 0 } })) },
  { id: '0807', on: true, short: 'Read the document', sentence: 'Finished · read the document',
    t: T('0807', 'approved', approved({ task: 'document', type: 'bug', auto_ship: false, build_exit: { at: ago(30), code: 0, message: 'Done.' } })) },
];
// The ones that stay as they are.
const SAME = [
  { id: '0811', on: true, words: 'Paused', t: T('0811', 'building', { started: ago(300), build_running: true, paused: true }) },
  { id: '0812', on: true, words: 'Shipping', t: T('0812', 'approved', approved({ auto_ship: true, build_exit: { at: ago(30), code: 0 }, ship: { running: true, auto: true, started: ago(8) } })) },
  { id: '0813', on: true, words: 'Queued · waiting on 0801', t: T('0813', 'ready', { after: ['0801'], waiting_on: ['0801'] }) },
];
const boardOf = on => ({ run: on ? { on: true } : null, ideas: [], tickets: [...CASES, ...SAME].filter(c => c.on === on).map(c => c.t) });
const page = on => fakePage([boardOf(on)], { Date: stoppedClock(NOW) });
const idOf = (p, n) => p.all(n).find(x => x.className === 'id')?._text;
const card = (p, id) => queueRows(p).find(n => idOf(p, n) === id);
const statusOf = n => n.children[0].children[1];
const sayOf = (p, n) => p.all(statusOf(n)).find(x => /\bsay\b/.test(x.className || ''));

test('0443 AC1: on a closed Build ticket, each long status shows in short words', async () => {
  for (const on of [true, false]) {
    const p = page(on);
    await p.settle();
    for (const c of CASES.filter(x => x.on === on)) {
      const say = sayOf(p, card(p, c.id));
      assert.ok(say, `${c.id}: its words`);
      assert.equal(say.textContent, c.short, `${c.id}: short words`);
      assert.ok(!statusOf(card(p, c.id)).textContent.includes(c.sentence), `${c.id}: not the sentence`);
    }
  }
});

test('0443 AC1: Paused, Shipping and Queued · waiting on <ids> stay as they are', async () => {
  const p = page(true);
  await p.settle();
  for (const c of SAME) assert.ok(statusOf(card(p, c.id)).textContent.startsWith(c.words), `${c.id}: ${statusOf(card(p, c.id)).textContent}`);
  for (const id of ['0811', '0812']) {
    const say = sayOf(p, card(p, id));
    assert.equal(say.title || '', '', `${id}: no tooltip, as its words are the sentence`);
    assert.equal(say.attrs?.['aria-label'], undefined, `${id}: its words are its name`);
  }
});

test('0443 AC2: the full sentence is the short words\' tooltip and accessible name', async () => {
  for (const on of [true, false]) {
    const p = page(on);
    await p.settle();
    for (const c of CASES.filter(x => x.on === on)) {
      const say = sayOf(p, card(p, c.id));
      assert.equal(say.title, c.sentence, `${c.id}: its tooltip`);
      assert.equal(say.attrs.role, 'img', `${c.id}: named by its label`);
      assert.equal(say.attrs['aria-label'], c.sentence, `${c.id}: its accessible name`);
    }
  }
});

test('0443 AC2: an open ticket shows the full sentence', async () => {
  for (const on of [true, false]) {
    const p = page(on);
    await p.settle();
    for (const c of CASES.filter(x => x.on === on)) {
      click(card(p, c.id).children[0]);
      await p.settle();
      assert.match(card(p, c.id).className, /\bopen\b/);
      const say = sayOf(p, card(p, c.id));
      assert.equal(say.textContent, c.sentence, `${c.id}: open, the sentence`);
      assert.equal(say.attrs?.['aria-label'], undefined, `${c.id}: named by its own words`);
      // and closed again, the short words
      click(card(p, c.id).children[0]);
      await p.settle();
      assert.equal(sayOf(p, card(p, c.id)).textContent, c.short, `${c.id}: closed again`);
    }
  }
});

// ---------- in a real browser: a 375 px phone ----------

const stub = `(() => {
  const STATE = ${JSON.stringify({ on: boardOf(true), off: boardOf(false) })}[location.search.slice(1)];
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => String(url) === '/api/state' ? json(STATE) : /\\/log$/.test(String(url)) ? json({ text: '' }) : opts.method === 'POST' ? json({}) : real(url, opts);
})();`;
// Each closed Build card's status line: its words, stage and time, whether any is cut off or reaches past the line, and
// how many lines it takes.
const LINES = `(async () => {
  await document.fonts.ready;
  return [...document.querySelectorAll('#queue .q:not(.open)')].map(c => {
    const status = c.firstElementChild.children[1], box = status.getBoundingClientRect();
    const parts = [...status.children].filter(n => !n.classList.contains('sep')).map(n => ({ text: n.textContent, cls: n.className,
      inside: n.getBoundingClientRect().right <= box.right + 0.5 && n.getBoundingClientRect().left >= box.left - 0.5, cut: n.scrollWidth > n.clientWidth + 0.5 }));
    return { id: c.querySelector('.id').textContent, text: status.textContent, overflows: status.scrollWidth > status.clientWidth + 0.5, widths: [status.scrollWidth, status.clientWidth],
      height: box.height, lineHeight: parseFloat(getComputedStyle(status).lineHeight), parts };
  });
})()`;

for (const touch of [true, false]) {
  test(`0443 AC3: at 375 px ${touch ? 'on a touch screen' : 'with a mouse'}, every closed Build ticket's status line shows its words, stage and time whole`, skip, async () => {
    const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
    const b = await browserPage('about:blank');
    try {
      await b.send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
      await b.send('Emulation.setTouchEmulationEnabled', touch ? { enabled: true, maxTouchPoints: 1 } : { enabled: false });
      await b.send('Page.enable');
      await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
      for (const on of [true, false]) {
        const n = boardOf(on).tickets.length, which = on ? 'on' : 'off';
        await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/?${which}` });
        await b.until(`location.search === '?${which}' && document.querySelectorAll('#queue .q').length === ${n}`, 'the panel');
        await b.js(openLane('build'));
        const lines = await b.js(LINES);
        assert.equal(lines.length, n, `${which}: ${lines.length} closed cards`);
        for (const l of lines) {
          const c = [...CASES, ...SAME].find(x => x.id === l.id);
          if (!l.parts.some(x => /\btag\b/.test(x.cls))) assert.ok(!l.overflows, `${l.id}: nothing reaches past its status line: ${l.text} (${l.widths.join(' > ')} px)`);
          assert.ok(l.height <= l.lineHeight + 0.5, `${l.id}: one line (${l.height} px)`);
          for (const part of l.parts.filter(x => !/\btag\b/.test(x.cls))) { // a tag after the time may be cut off
            assert.ok(part.inside, `${l.id}: "${part.text}" shows whole`);
            assert.ok(!part.cut, `${l.id}: "${part.text}" isn't cut off`);
          }
          if (c.short) assert.equal(l.parts[0].text, c.short, `${l.id}: its short words`);
          if (c.id !== '0813') assert.ok(l.parts.some(x => /\d:\d{2}$/.test(x.text)), `${l.id}: its time: ${l.text}`);
          if (c.short) assert.ok(l.parts.some(x => /\bstage\b/.test(x.cls)), `${l.id}: its stage: ${l.text}`);
        }
      }
    } finally { await b.close(); await stop(panel); }
  });
}
