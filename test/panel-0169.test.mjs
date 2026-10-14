import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T, fakePage, queueRows, exitOf, round, page, panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';
import { loadBadge, frame, glyphs, eye, body, reviewerEyes, rings, ticks } from './support/badge.mjs';

// ---------- 0169: the builder badge's self-check and review loops ----------

const ago = s => new Date(Date.now() - s * 1000).toISOString();
const TICKETS = [
  T('0401', 'building', { title: 'Writing its code', started: ago(65), build_running: true, reviewer: 'codex' }),
  T('0402', 'building', { title: 'Checking itself', started: ago(65), build_running: true, self_check: 'no changes', reviewer: 'codex' }),
  T('0403', 'reviewing', { title: 'Under review', started: ago(65), build_running: true, self_check: 'no changes', reviewer: 'codex',
    rounds: [{ ...round(2, 10), verdict: 'request_changes' }] }),
  T('0404', 'reviewing', { title: 'Paused in review', started: ago(65), build_running: true, paused: true, self_check: 'no changes', reviewer: 'codex' }),
  T('0405', 'approved', { title: 'Being shipped', started: ago(900), approved: ago(60), self_check: 'no changes', rounds: [round(1, 10)],
    ship: { running: true, started: ago(5) } }),
  T('0406', 'building', { title: 'A build that stopped', started: ago(200), ...exitOf('It ended.') }),
];
function fake(tickets = TICKETS) {
  return fakePage([], {
    fetch: async url => ({ ok: true, status: 200, json: async () => (/\/log$/.test(url) ? { text: '', truncated: false } : JSON.parse(JSON.stringify({ tickets, ideas: [] }))) }),
  });
}
const rowOf = (p, id) => queueRows(p).find(r => p.all(r).some(n => n.className === 'id' && n._text === id));
const badgeIn = (p, id) => rowOf(p, id).children.find(n => n.className === 'top').children.find(n => n.className === 'badgerow').children[0];
const script = () => page().match(/<script>([\s\S]*?)<\/script>/)[1];
const loopOf = pose => script().match(new RegExp(` {4}${pose}\\(g, t\\) \\{([\\s\\S]*?)\\n {4}\\},`))[1];

// The tile's point that is (x, y) in the pose's own units: (0, 0) between the builder's feet, drawn at 0.64.
const tileAt = (x, y) => ({ x: 28 + x * .64, y: 52 + y * .64 });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const cos = (a, b) => (a.x * b.x + a.y * b.y) / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y));
const toward = (from, to) => ({ x: to.x - from.x, y: to.y - from.y });
// Where the builder's eye looks: from where it rests in the middle of its body to where it is.
const gaze = m => { const b = body(m), e = eye(m); return { from: { x: b.x, y: b.y - 2 * .64 }, dir: toward({ x: b.x, y: b.y - 2 * .64 }, e) }; };
const green = m => glyphs(m).filter(k => k.colour === 'ok');
const G = 640;
// The builder's two ears, left then right.
const ears = m => m.filter(k => k.op === 'fill' && k.colour === 'paper' && k.path[0]?.kind === 'arc' && Math.abs(k.path[0].r - 5.5 * .64) < .2).map(k => k.path[0]);

test('0169 AC1 and AC2: self-check and review have their own badge poses, with the same names; building and shipping keep the laptop', async () => {
  const p = fake();
  await p.settle();
  const shows = id => [badgeIn(p, id).className, badgeIn(p, id).attrs['aria-label']];
  assert.deepEqual(shows('0401'), ['badge type', 'The builder is writing code']);
  assert.deepEqual(shows('0402'), ['badge check', 'The builder is checking its own work']);
  assert.deepEqual(shows('0403'), ['badge review', 'The builder is with the reviewer']);
  assert.deepEqual(shows('0404'), ['badge still', 'The builder is paused'], 'a paused review stands still');
  assert.deepEqual(shows('0405'), ['badge type', 'The builder is shipping']);
  assert.deepEqual(shows('0406'), ['badge bad', 'The builder needs you']);
});

test('0169 AC1: during self-check, nine faint characters hang in a loose ring around the builder, drifting slightly', () => {
  const B = loadBadge(), centre = tileAt(0, -28);
  let lefts = 0, rights = 0;
  for (let t = 0; t < 9000; t += 37) {
    const m = frame(B, 'check', t), gs = glyphs(m);
    assert.equal(gs.length, 9, `${t}: nine characters`);
    for (const k of gs) {
      const r = dist(k, centre) / .64;
      assert.ok(r > 28 && r < 46, `${t}: ${k.text} is ${r} from the builder's middle`);
      assert.ok(k.y < centre.y + 1, `${t}: ${k.text} is around and above it`);
      if (k.colour === 'code') assert.ok(k.alpha < .5, `${t}: faint unless it's just been looked at`);
      if (k.x < centre.x - 15) lefts++;
      if (k.x > centre.x + 15) rights++;
    }
  }
  assert.ok(lefts > 0 && rights > 0, 'on both sides of it');
  const a = glyphs(frame(B, 'check', 5000)), b = glyphs(frame(B, 'check', 5700));
  for (let i = 0; i < 9; i++) {
    const d = dist(a[i], b[i]);
    assert.ok(d > .05 && d < 3, `character ${i} drifts slightly: ${d}`);
  }
});

test('0169 AC1: its eye moves to one at random every 0.64 seconds and that character turns green for a moment, then fades back', () => {
  const B = loadBadge(), targets = new Set();
  for (let n = 0; n < 40; n++) {
    if (n % 7 === 6) continue; // it hops, looking up
    const m = frame(B, 'check', n * G + .5 * G), gs = glyphs(m), lit = gs.reduce((a, k) => (k.alpha > a.alpha ? k : a));
    assert.equal(lit.colour, 'ok', `${n}: the one it's just looked at is green`);
    assert.ok(lit.size > .64 * 1.2, `${n}: and larger`);
    const { from, dir } = gaze(m);
    assert.ok(cos(dir, toward(from, lit)) > .8, `${n}: its eye looks towards the green one (${cos(dir, toward(from, lit))})`);
    targets.add(gs.indexOf(lit));
    // Before its eye gets there, it isn't lit yet by this glance; 1.5 seconds later it has faded unless looked at again.
    assert.ok(green(m).length <= 3, `${n}: only the last few are green`);
  }
  assert.ok(targets.size >= 6, `at random, around the ring: ${[...targets]}`);
  let faded = 0;
  for (let n = 0; n < 40; n++) {
    const i = glyphs(frame(B, 'check', n * G + .5 * G)).reduce((a, k, j, all) => (k.alpha > all[a].alpha ? j : a), 0);
    const later = glyphs(frame(B, 'check', n * G + .3 * G + 1600))[i];
    if (later.colour === 'code') { faded++; assert.equal(later.alpha, .45, `${n}: faint again`); }
  }
  assert.ok(faded > 20, `most fade back once it's looked away: ${faded}`);
});

test('0169 AC1: its body turns a beat after its eye, and an ear twitches now and then', () => {
  const B = loadBadge();
  let turned = 0, twitched = 0, glances = 0;
  for (let n = 1; n < 60; n++) {
    if (n % 7 === 6 || n % 7 === 0) continue; // the hop, and the glance after it, starting from looking up
    glances++;
    const early = frame(B, 'check', n * G + .3 * G), late = frame(B, 'check', n * G + .6 * G);
    // Where its eye is on its body, turned back by however far the body is turned (from its ears, level here).
    const off = m => {
      const [l, r] = ears(m), a = -Math.atan2(r.y - l.y, r.x - l.x), v = toward(body(m), eye(m));
      return { x: v.x * Math.cos(a) - v.y * Math.sin(a), y: v.x * Math.sin(a) + v.y * Math.cos(a) };
    };
    assert.ok(dist(off(early), off(late)) < .3, `${n}: its eye is already there at 0.3 of the glance`);
    if (Math.abs(body(early).x - body(late).x) > .2) turned++;
    const [left, right] = ears(frame(B, 'check', n * G + .45 * G)).map(e => dist(e, body(frame(B, 'check', n * G + .45 * G))));
    if (right - left > .5) twitched++;
  }
  assert.ok(turned > glances / 2, `the body is still turning after the eye arrives: ${turned} of ${glances}`);
  assert.ok(twitched > 0 && twitched < glances / 2, `an ear twitches now and then: ${twitched} of ${glances}`);
});

test('0169 AC1: every seventh glance it gives a small hop and a green tick appears', () => {
  const B = loadBadge(), rest = body(frame(B, 'check', 2 * G + .5 * G)).y;
  for (let n = 0; n < 28; n++) {
    const m = frame(B, 'check', n * G + .5 * G), hops = n % 7 === 6;
    assert.equal(ticks(m).length, hops ? 1 : 0, `${n}: ${hops ? 'a tick' : 'no tick'}`);
    if (hops) assert.ok(body(m).y < rest - 2, `${n}: a hop`);
    else assert.ok(Math.abs(body(m).y - rest) < 1, `${n}: on the ground`);
  }
});

test('0169 AC2: the reviewer is taller and squarer than the builder, with two small eyes and a mouth', () => {
  const B = loadBadge(), m = frame(B, 'review', 1700);
  const outline = m.find(k => k.op === 'fill' && k.colour === 'paper' && k.path.length > 4 && k.path.every(q => q.kind === 'point')).path;
  const ys = outline.map(q => q.y), xs = outline.map(q => q.x);
  const b = body(m), builderTop = b.y - 21.5 * .64; // the tops of its ears
  assert.ok(Math.min(...ys) < builderTop - 2, 'taller');
  assert.ok(Math.max(...ys) - Math.min(...ys) > Math.max(...xs) - Math.min(...xs), 'a tall block, with straight sides and no round body');
  assert.ok(reviewerEyes(m), 'two small eyes');
  assert.match(loopOf('review'), /reviewer\(g, R\)/);
  assert.match(script(), /function reviewer\(g, R\) \{[\s\S]*?ellipse\(dx, -30[\s\S]*?quadraticCurveTo\(dx, -26[\s\S]*?ln\(g, -6 \+ dx, -30, 6 \+ dx, -30\)/, 'a mouth: open, smiling or flat');
});

test('0169 AC2: in a loop of 6.2 seconds the reviewer slides in from the right and out again, under seven faint characters', () => {
  const B = loadBadge(), CY = 6200;
  const rx = t => reviewerEyes(frame(B, 'review', t)).x;
  assert.ok(rx(0) > 55, 'it starts outside the tile, on the right');
  assert.ok(rx(.03 * CY) < rx(0) && rx(.03 * CY) > rx(.1 * CY), 'and slides in');
  for (const p of [.1, .3, .5, .7, .9]) assert.ok(Math.abs(rx(p * CY) - rx(.1 * CY)) < 1.5, `${p}: it stays`);
  assert.ok(rx(.99 * CY) > rx(.9 * CY) + 8, 'then slides out');
  assert.ok(Math.abs(rx(.08 * CY) - rx(CY + .08 * CY)) < .01 && rx(CY) > 55, 'every 6.2 seconds');
  for (let t = 0; t < 2 * CY; t += 41) {
    const m = frame(B, 'review', t), gs = glyphs(m), b = body(m), top = b.y - 20 * .64;
    assert.equal(gs.length, 7, `${t}: seven characters`);
    for (const k of gs) {
      assert.ok(k.y < top, `${t}: ${k.text} above the builder`);
      if (k.colour === 'code' && !rings(m).some(r => dist(r, { x: k.x, y: k.y - 3 * k.size }) < .5)) assert.equal(k.alpha, .45, `${t}: faint`);
    }
  }
});

test('0169 AC2: three exchanges a loop: the reviewer talks about a ringed character, then the builder answers and it turns green', () => {
  const B = loadBadge(), CY = 6200;
  const exchanges = [[.09, .22, .24, .36], [.38, .47, .49, .61], [.63, .71, .73, .79]];
  for (let cycle = 0; cycle < 6; cycle++) {
    for (const [ra, rb, ba, bb] of exchanges) {
      const at = p => frame(B, 'review', cycle * CY + p * CY);
      // The reviewer talks: its mouth opens and it leans in, and a ring goes round one character.
      const talk = at((ra + rb) / 2), ring = rings(talk);
      assert.equal(ring.length, 1, `${cycle} ${ra}: one ring`);
      const i = glyphs(talk).findIndex(k => dist(ring[0], { x: k.x, y: k.y - 3 * k.size }) < .5);
      assert.ok(i >= 0, `${cycle} ${ra}: round a character`);
      assert.ok(talk.some(k => k.op === 'stroke' && k.colour === 'ink' && k.path[0]?.kind === 'ellipse'), `${cycle} ${ra}: its mouth moves`);
      const e = reviewerEyes(talk), still = reviewerEyes(at(.08));
      assert.ok(e.x < still.x - .5, `${cycle} ${ra}: it leans and looks in towards the character`);
      // The builder looks at the same one and answers with a bounce and an ear flick.
      let flicked = false, bounced = false;
      for (let p = ba; p < bb; p += .005) {
        const m = at(p), { from, dir } = gaze(m), k = glyphs(m)[i];
        if (p > ba + .02 && p < bb - .02) assert.ok(cos(dir, toward(from, k)) > .8, `${cycle} ${p}: the builder looks at it`);
        assert.equal(rings(m).length, 1, `${cycle} ${p}: still ringed while the builder answers`);
        const [l, r] = ears(m).map(e => dist(e, body(m)));
        if (r - l > .5) flicked = true;
        if (Math.abs(body(m).y - body(at(.08)).y) > .3) bounced = true;
      }
      assert.ok(flicked && bounced, `${cycle} ${ba}: a bounce and an ear flick`);
      const after = at(bb + .005);
      assert.equal(glyphs(after)[i].colour, 'ok', `${cycle} ${bb}: then it turns green`);
      assert.equal(rings(after).length, 0, `${cycle} ${bb}: and the ring goes`);
    }
  }
});

test('0169 AC2: the loop ends with the reviewer smiling and nodding and the builder hopping', () => {
  const B = loadBadge(), CY = 6200, js = loopOf('review');
  assert.match(js, /if \(p > \.81 && p < \.93\) \{[^\n]*R\.mouth = 1; R\.rot = [^\n]*Math\.sin\(k \* Math\.PI \* 2\)[^\n]*hop\(/, 'a smile, a nod and a hop');
  const ground = body(frame(B, 'review', .5 * CY)).y;
  assert.ok(body(frame(B, 'review', .87 * CY)).y < ground - 2, 'the builder hops');
  assert.equal(rings(frame(B, 'review', .87 * CY)).length, 0, 'every character talked about is settled');
  const nod = [.82, .845, .87].map(p => frame(B, 'review', p * CY).find(k => k.op === 'fill' && k.colour === 'paper' && k.path.length > 4).path[2].x);
  assert.ok(Math.max(...nod) - Math.min(...nod) > .5, 'the reviewer nods');
});

test('0169 AC3: the characters are the laptop loop\'s, in the panel\'s monospace font and faint ink, green once checked', () => {
  const B = loadBadge(), set = '{}<>;/=()[]*';
  for (const pose of ['check', 'review']) {
    const seen = new Set();
    for (let t = 0; t < 30000; t += 97) for (const k of glyphs(frame(B, pose, t))) {
      assert.ok(set.includes(k.text) && k.text.length === 1, `${pose}: ${k.text}`);
      assert.match(k.font, /"IBM Plex Mono", ui-monospace, monospace/, pose);
      seen.add(k.text);
    }
    assert.ok(seen.size >= 6, `${pose}: several of them: ${[...seen].join('')}`);
  }
  assert.match(script(), /code: v\('text'\)/, 'the characters are the panel\'s ink');
  assert.match(script(), /ok: v\('ok'\)/, 'and its green');
});

test('0169 AC4: with reduced motion, each stage has a still frame: self-check looks at one green character, review at one ringed one', () => {
  const B = loadBadge();
  assert.equal(B.STILL_AT.check, 300);
  assert.equal(B.STILL_AT.review, 1700);
  const c = frame(B, 'check', B.STILL_AT.check), lit = green(c);
  assert.equal(lit.length, 1, 'one green character');
  const { from, dir } = gaze(c);
  assert.ok(cos(dir, toward(from, lit[0])) > .8, 'the builder looks at it');
  const r = frame(B, 'review', B.STILL_AT.review), ring = rings(r);
  assert.equal(ring.length, 1, 'one ringed character');
  const g = gaze(r);
  assert.ok(cos(g.dir, toward(g.from, ring[0])) > .8, 'the builder looks at it');
  assert.ok(reviewerEyes(r).x < reviewerEyes(frame(B, 'review', .08 * 6200)).x - .5, 'the reviewer looks at it too');
  for (const pose of ['check', 'review']) assert.notEqual(B.STILL_AT[pose] % 3700 < 120, true, `${pose}: not mid-blink`);
});

// ---------- in a real browser ----------

const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const stub = `(() => {
  const STATE = ${JSON.stringify({ run: { on: true }, tickets: TICKETS, ideas: [] })};
  const real = window.fetch.bind(window);
  const json = b => new Response(JSON.stringify(b), { status: 200, headers: { 'content-type': 'application/json' } });
  window.fetch = async (url, opts = {}) => {
    const u = String(url);
    if (u === '/api/state') return json(STATE);
    if (/\\/log$/.test(u)) return json({ text: '' });
    return real(url, opts);
  };
})();`;
async function withPanel(fn, { motion = 'no-preference' } = {}) {
  const r = panelRepo();
  const panel = await startPanel(r.dir, ['--port', String(await freePort())]);
  const b = await browserPage('about:blank');
  try {
    await b.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: motion }] });
    await b.send('Page.enable');
    await b.send('Page.addScriptToEvaluateOnNewDocument', { source: stub });
    await b.send('Page.navigate', { url: `http://127.0.0.1:${panel.port}/` });
    await b.until(`location.port === '${panel.port}' && document.readyState === 'complete' && document.querySelectorAll('#queue .q').length === ${TICKETS.length}`, 'the panel');
    await fn(b);
  } finally { await b.close(); await stop(panel); }
}
const FRAME = id => `[...document.querySelectorAll('#queue .q')].find(n => n.querySelector('.id').textContent === ${JSON.stringify(id)}).querySelector('canvas.badge').toDataURL()`;
// How many pixels each pose draws outside the tile's rounded edge over two of its loops; for the review, with only its
// characters and their rings drawn (everything else transparent), as the reviewer slides in and out past the edge.
const OUTSIDE = `(() => {
  badgeColours();
  const c = document.createElement('canvas'); c.width = c.height = 224; const g = c.getContext('2d'), out = {};
  const edge = new Path2D(); edge.roundRect(56 - 1.4, 56 - 1.4, 112 + 2.8, 112 + 2.8, 25.4); // the tile's edge and its line, at twice the size
  const all = { ...BADGE.C };
  for (const [pose, only] of [['check', false], ['review', true]]) {
    if (only) for (const k of Object.keys(BADGE.C)) if (k !== 'code' && k !== 'ok') BADGE.C[k] = 'rgba(0, 0, 0, 0)';
    out[pose] = 0;
    for (let t = 0; t < 12400; t += 23) {
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 224, 224); g.setTransform(2, 0, 0, 2, 56, 56);
      BADGE.draw(g, pose, t, false);
      g.setTransform(1, 0, 0, 1, 0, 0);
      const d = g.getImageData(0, 0, 224, 224).data;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 24) { const x = (i / 4) % 224 + .5, y = Math.floor(i / 4 / 224) + .5; if (!g.isPointInPath(edge, x, y)) out[pose]++; }
    }
    Object.assign(BADGE.C, all);
  }
  return out;
})()`;

test('0169 AC3: in a real browser, neither the characters nor the ring is clipped by the tile\'s edge', skip, async () => {
  await withPanel(async b => {
    assert.deepEqual(await b.js(OUTSIDE, 60000), { check: 0, review: 0 });
  });
});

test('0169 AC1, AC2 and AC4: in a real browser, the self-check and review badges move, and with reduced motion nothing moves', skip, async () => {
  const ids = ['0402', '0403'];
  const frames = async b => Promise.all(ids.map(id => b.js(FRAME(id))));
  await withPanel(async b => {
    const first = await frames(b);
    await new Promise(r => setTimeout(r, 450));
    const then = await frames(b);
    ids.forEach((id, i) => assert.notEqual(then[i], first[i], `${id}: moves`));
  });
  await withPanel(async b => {
    const first = await frames(b);
    await new Promise(r => setTimeout(r, 450));
    assert.deepEqual(await frames(b), first, 'nothing moves');
  }, { motion: 'reduce' });
});
