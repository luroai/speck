'use strict';
// 0474: the panel's header, which the page loads from /panel-header.js after its own script and before the pop-ups: the
// dark frame's title row, speck's screen (its poses, words and time, drawn by the design's renderer from lcd.js) and the
// strip of the Plan, Build and Shipped lanes under it (0477). It uses the page's helpers ($, el, setText, within, foremanOf and the rest), and
// the page's render() calls drawHeader and drawTabs.

// 0160: the header stays at the top of the screen. --head is its height on screen, so a ticket scrolled to sits below
// it. 0413: the header is speck's screen in its frame, and the project and base branch, cut short when the title row
// is narrow, show in full in their tooltip.
const pageHeader = document.querySelector?.('header');
if (pageHeader) {
  new ResizeObserver(() => document.documentElement.style.setProperty('--head', `${pageHeader.offsetHeight}px`)).observe(pageHeader);
  const repo = pageHeader.querySelector('.repo');
  if (repo) repo.title = repo.textContent.trim();
}
// The design's LCD renderer, for speck's screen at the top of the panel (0413). 0416: the cards have no builder badges.
const LCD = globalThis.SpeckLCD;
function reducedMotion() { return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches; }
// The renderer reads the reduced-motion setting once, as the page loads, so a change to it holds speck's screen still
// or lets it move again.
if (typeof matchMedia === 'function') matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => {
  if (screen.lcd) { screen.cast.still = screen.still = e.matches; screen.lcd.dirty = true; } // 0413: speck's screen (0414: its poses and word)
});
// A change of the screen's pixels per CSS pixel (a zoom, or another screen) gives each screen its new size, which its
// renderer doesn't see, as the screen's size on the page stays the same. Its look it follows itself.
if (typeof matchMedia === 'function') {
  (function zoomed() {
    matchMedia(`(resolution: ${devicePixelRatio || 1}dppx)`).addEventListener('change', () => {
      if (screen.lcd) screen.lcd.size(); // 0413: speck's screen
      zoomed();
    }, { once: true });
  })();
}
// 0413: speck's screen, the top of the panel, drawn by the design's LCD renderer (SpeckLCD.Screen and render, from
// lcd.js) on 160 × 72 dots. Its top row is the Foreman's word in the 5 × 7 font, in capitals, with the time at its
// right, HH:MM in the 24-hour clock, as on the design's handheld (0451). Its colon shows for the first half of each
// second, or always with reduced motion. A word too wide for the row scrolls from right to left, 16 dots a second
// after a pause, and loops round, or with reduced motion stays still, cut short. The screen is made once, when the
// renderer and a canvas are there, and kept between redraws. 0414: under a dotted line speck shows the pipeline
// (speckNow), with a caption, centred, under a second dotted line. The Screen draws every frame, even with reduced
// motion, so speck changes as soon as the pipeline does; reduced motion holds the poses and the word still.
const SCREEN = { cols: 160, rows: 72, top: 11, floor: 61, line: 63, cap: 65, speed: 16, pause: 1800, fit: 25 };
const NEEDS_YOU = /^Needs you \d+$/;
let screen = { word: '', since: null, lcd: null, cast: null, still: false, shown: null };
function drawScreen(word) {
  const up = String(word).toUpperCase();
  if (up !== screen.word) screen.since = null; // a new word starts again from the left
  screen.word = up;
  const canvas = $('screen');
  if (!screen.lcd && LCD && typeof LCD.Screen === 'function' && typeof canvas.getContext === 'function') {
    screen.still = reducedMotion();
    screen.cast = new LCD.Cast(speckPoses(), 'idle', { still: screen.still, at: { ...LCD.STATE_AT, watch: 1000, ask: 1000, flag: 1000, ship: 1100 } });
    screen.lcd = new LCD.Screen(canvas, { cols: SCREEN.cols, rows: SCREEN.rows, still: false, crisp: [SCREEN.line + 1], draw: screenFrame });
  }
  if (screen.lcd) screen.lcd.dirty = true;
}
// One frame of the screen at time `t`, onto the screen `s` (its pen() draws on its dots).
function screenFrame(s, t) {
  const p = s.pen(), { F5, INK, FAINT } = LCD, cols = SCREEN.cols, still = s.still || screen.still;
  const at = new Date(), two = n => String(n).padStart(2, '0');
  const time = `${two(at.getHours())}${still || at.getMilliseconds() < 500 ? ':' : ' '}${two(at.getMinutes())}`; // 0451
  const b = p.textBox(time, cols - 4, 2, { font: F5, align: 'right', valign: 'top' }), right = b.left - 6;
  p.textAt(time, b, INK);
  const W = screen.word.length * 6 - 1, room = right - 4;
  let x = 4;
  if (W > room && !still) {
    if (screen.since === null) screen.since = t;
    const C = W + room + 8, u = Math.floor(Math.max(0, t - screen.since - SCREEN.pause) * SCREEN.speed / 1000) % C;
    x = 4 - u;
    if (x < 4 - W) x += C;
  }
  p.clip = [0, 0, right + 1, SCREEN.top]; p.text(screen.word, x, 2, { font: F5, align: 'left', valign: 'top' }); p.clip = null;
  for (let i = 1; i < cols; i += 2) { p.put(i, SCREEN.top, FAINT); p.put(i, SCREEN.line, FAINT); }
  for (let i = 22; i < cols - 21; i += 3) p.put(i, SCREEN.floor, FAINT); // the floor speck stands on
  // 0414: what speck does now. A new event starts its pose from the start, even when it's the pose already showing.
  const now = speckNow(Date.now()), key = now.key || `${now.pose} ${now.cap}`;
  if (screen.cast && key !== screen.shown) {
    screen.shown = key;
    if (!screen.cast.set(now.pose, t) && now.key) screen.cast.cs = t;
  }
  const sp = s.pen(.75, cols / 2, SCREEN.floor - 1);
  sp.clip = [0, SCREEN.top + 1, cols, SCREEN.floor + 1];
  LCD.render(sp, screen.cast ? screen.cast.frame(t) : { B: { t }, props: [] });
  const CW = now.cap.length * 6 - 1;
  p.clip = [4, SCREEN.line + 1, cols - 4, SCREEN.rows];
  p.text(now.cap, Math.max(4, Math.round(cols / 2 - CW / 2)), SCREEN.cap, { font: capFont(), align: 'left', valign: 'top' });
  p.clip = null;
}
// 0495: the caption's font, the 5 × 7 one with … added, which the design's font doesn't have.
let CAP_FONT = null;
const capFont = () => CAP_FONT || (CAP_FONT = { ...LCD.F5, g: { ...LCD.F5.g, '…': ['.....', '.....', '.....', '.....', '.....', '.....', '#.#.#'] } });
// 0414: speck's poses: the landing page's states (its `building` is the laptop), three of the panel's, and the
// console mock's clipboard, `watch` (0502: speck watching a TV for each build).
const rim = a => ({ x: 20 * Math.cos(a), y: -24 + 20 * Math.sin(a) });
// 0502: watching the builds, as the prototype in docs/design/lcd/watching.html has it. speck stands on the right with
// its clipboard and a little retro TV for each build on its left, up to three, or one while shipping. Each TV scrolls
// a log over a progress bar, and shows a tick for a moment when the bar fills. speck plays one beat after another,
// picked at random by weight and never the same twice running, each blending in and out of its resting pose.
const watchPose = (() => {
  const clamp01 = x => Math.max(0, Math.min(1, x)), lerp = (a, b, k) => a + (b - a) * k;
  const sine = k => -(Math.cos(Math.PI * clamp01(k)) - 1) / 2, seg = (p, a, b) => clamp01((p - a) / (b - a));
  const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const BX = 14, LEG = 3.5, DONE = 1100, BLEND = 450, FOCUS = 3100; // speck's place on the floor; the TVs' legs; a tick's time
  const TVS = { 1: [{ cx: -46, w: 36, h: 25 }], 2: [{ cx: -62, w: 27, h: 20 }, { cx: -32, w: 27, h: 20 }], 3: [{ cx: -71, w: 21, h: 17 }, { cx: -48, w: 21, h: 17 }, { cx: -25, w: 21, h: 17 }] };
  // A TV for each build the word names, up to three; one while shipping.
  const tvs = () => { const m = /^Building (\d+)$/.exec(speckDo.word || ''); return TVS[m ? Math.max(1, Math.min(3, Number(m[1]))) : 1]; };
  // A TV's parts, in scene units: its box, its screen (left of the dials) and its rabbit ears' tips, waggled by `wig` (0505).
  function tvGeom(m, wig = 0) {
    const x0 = m.cx - m.w / 2, y1 = -LEG, y0 = y1 - m.h, knobs = Math.max(6, m.w * .24), top = { x: m.cx + 1, y: y0 }, ear = m.h * .55;
    return { x0, y0, y1, knobs, sx0: x0 + 2.5, sx1: x0 + m.w - knobs, sy0: y0 + 2.5, sy1: y1 - 2.5, top,
      tipL: { x: top.x - ear * Math.sin(.5 + wig), y: top.y - ear * Math.cos(.5 + wig) }, tipR: { x: top.x + ear * Math.sin(.42 - wig * .7), y: top.y - ear * Math.cos(.42 - wig * .7) } };
  }
  // 0505: Pong's ball and paddles on a TV's screen at time t.
  function pongBall(g, t) {
    const ix0 = g.sx0 + 3.5, ix1 = g.sx1 - 3.5, iy0 = g.sy0 + 2.5, iy1 = g.sy1 - 2.5, W = ix1 - ix0, H = iy1 - iy0;
    const tri = (v, L) => { const q = ((v % (2 * L)) + 2 * L) % (2 * L); return q < L ? q : 2 * L - q; };
    const x = ix0 + tri(t / 60, W), y = iy0 + tri(t / 85, H), ph = Math.max(3, H * .32);
    return { x, y, ly: y - ph / 2 + 1.5 * Math.sin(t / 200), ry: y - ph / 2 - 1.5 * Math.sin(t / 230) };
  }
  const clampY = (y, a, b, h) => Math.max(a, Math.min(b - h, y));
  // Each TV's bar fills at its own pace, 10 to 18 seconds, then a tick shows for DONE ms.
  const period = j => 10000 + rnd(j + 5) * 8000;
  function tvState(j, t) {
    const P = period(j), u = (t + rnd(j + 9) * P) % P;
    return { prog: clamp01(u / (P - DONE)), done: u >= P - DONE, since: u - (P - DONE) };
  }
  // What a TV shows (0505): `st`, its bar; `show`, its log (or tick), snow, Pong or a tiny speck (`me`); `wig`, its
  // ears waggling; `roll`, its picture rolling by that much.
  function drawTV(pen, m, j, t, sc) {
    const { INK, FAINT, OFF } = LCD, st = sc.st, g = tvGeom(m, sc.wig);
    pen.lw = 1.2; pen.line(g.top.x, g.top.y, g.tipL.x, g.tipL.y); pen.line(g.top.x, g.top.y, g.tipR.x, g.tipR.y); // rabbit ears, behind the box
    pen.disc(g.tipL.x, g.tipL.y, 1, INK); pen.disc(g.tipR.x, g.tipR.y, 1, INK); pen.disc(g.top.x, g.top.y, 2.2, INK, 1.4);
    pen.lw = 1.5; pen.line(g.x0 + 4, g.y1, g.x0 + 2.5, 0); pen.line(g.x0 + m.w - 4, g.y1, g.x0 + m.w - 2.5, 0); // two short legs
    const r = 2.5, box = [[g.x0 + r, g.y0], [g.x0 + m.w - r, g.y0], [g.x0 + m.w, g.y0 + r], [g.x0 + m.w, g.y1 - r], [g.x0 + m.w - r, g.y1], [g.x0 + r, g.y1], [g.x0, g.y1 - r], [g.x0, g.y0 + r]];
    pen.lw = 1.8; pen.fillPoly(box, OFF); pen.poly(box, INK); // the box, with rounded corners
    const kx = g.x0 + m.w - g.knobs / 2 - .5, kr = Math.max(1.4, g.knobs * .2); // two dials and a speaker grille, on its right
    pen.lw = 1.2; pen.ring(kx, g.y0 + m.h * .28, kr); pen.ring(kx, g.y0 + m.h * .55, kr);
    for (let i = 0; i < 3; i++) pen.line(kx - kr, g.y1 - 3 - i * 2, kx + kr, g.y1 - 3 - i * 2, FAINT);
    const c = 2, scr = [[g.sx0 + c, g.sy0], [g.sx1 - c, g.sy0], [g.sx1, g.sy0 + c], [g.sx1, g.sy1 - c], [g.sx1 - c, g.sy1], [g.sx0 + c, g.sy1], [g.sx0, g.sy1 - c], [g.sx0, g.sy0 + c]];
    pen.lw = 1.2; pen.poly(scr, INK); // the curved screen
    const ix0 = g.sx0 + 2.5, ix1 = g.sx1 - 2.5, iy0 = g.sy0 + 2.5, iy1 = g.sy1 - 2.5;
    if (sc.show === 'snow') {
      const f = Math.floor(t / 70);
      for (let y = iy0; y <= iy1; y += 1.4) for (let x = ix0; x <= ix1; x += 1.4) { const q = rnd(f * 7.3 + x * 3.1 + y * 17.7); if (q > .55) pen.dotAt(x, y, q > .85 ? INK : FAINT); }
      return;
    }
    if (sc.show === 'pong') { // two paddles, a dotted net and the ball
      const b = pongBall(g, t), ph = Math.max(3, (iy1 - iy0) * .32), ly = clampY(b.ly, iy0, iy1, ph), ry = clampY(b.ry, iy0, iy1, ph);
      pen.lw = 1.8; pen.line(ix0, ly, ix0, ly + ph); pen.line(ix1, ry, ix1, ry + ph);
      for (let y = iy0; y < iy1; y += 2) pen.dotAt((ix0 + ix1) / 2, y, FAINT);
      pen.disc(b.x, b.y, 1.4, INK);
      return;
    }
    if (sc.show === 'mirror') { // a tiny speck, copying speck
      const me = sc.me, cx = (ix0 + ix1) / 2 + (me.x - BX) * .25, by = iy1 + 2 + me.y * .35, r = (iy1 - iy0) * .4;
      pen.save(); pen.translate(cx, by); pen.rotate(-me.rot); pen.lw = 1.1;
      pen.ring(0, -r - 1, r); pen.disc(-r * .62, -r * 1.95, r * .26, INK); pen.disc(r * .62, -r * 1.95, r * .26, INK);
      pen.disc(-me.lookX * r * .4, -r - 1 + me.lookY * r * .3, Math.max(.8, r * .25), LCD.RED);
      pen.restore();
      return;
    }
    if (st.done) { // a tick, drawn in
      const k = clamp01(st.since / 300), cx = (ix0 + ix1) / 2, cy = (iy0 + iy1) / 2, s = Math.min(ix1 - ix0, iy1 - iy0) / 12;
      const A = [cx - 5 * s, cy], B = [cx - 1.5 * s, cy + 3.5 * s], C = [cx + 6 * s, cy - 4.5 * s];
      pen.lw = 1.8;
      if (k > 0) pen.line(A[0], A[1], lerp(A[0], B[0], Math.min(1, k * 2)), lerp(A[1], B[1], Math.min(1, k * 2)));
      if (k > .5) pen.line(B[0], B[1], lerp(B[0], C[0], (k - .5) * 2), lerp(B[1], C[1], (k - .5) * 2));
      return;
    }
    // the log scrolling up, its newest line being typed, over the progress bar
    const rows = Math.max(1, Math.floor((iy1 - iy0 - 3) / 2.6)), row = Math.floor(t / 420 + j * 13);
    const H = iy1 - iy0 - 2; // 0505: how far it rolls before it comes round again
    for (let rr = 0; rr < rows; rr++) {
      const n = row + rr, last = rr === rows - 1, full = 2 + rnd(n + j * 31) * (ix1 - ix0 - 2), len = last ? full * clamp01((t % 420) / 420 * 1.6) : full;
      const y = sc.roll === null ? iy0 + rr * 2.6 : iy0 + (rr * 2.6 + sc.roll * H) % H;
      if (len > 1) pen.line(ix0, y, ix0 + len, y, last ? INK : FAINT);
    }
    if (sc.roll !== null) { const by = iy0 + (sc.roll * H + H * .6) % H; pen.lw = 2.2; pen.line(ix0 - 1, by, ix1 + 1, by, INK); } // the black bar
    pen.lw = 1.4; pen.line(ix0, iy1, ix1, iy1, FAINT);
    if (st.prog > .02) pen.line(ix0, iy1, ix0 + (ix1 - ix0) * st.prog, iy1, INK);
  }
  // The beats: their weight and how long each lasts, in ms. `own`: it has its own reaction to a tick, or is too taken up
  // to notice one, so speck doesn't hop. 0503: eight small habits join 0502's three. 0504: and four comic moments. 0505:
  // and six tricks its nearest TV plays.
  const BEATS = { scan: { w: 3, d: [5200, 7000] }, read: { w: 2, d: [4600, 5400], own: true }, lean: { w: 2, d: [3600, 4400] },
    popcorn: { w: 2, d: [5200, 6200] }, clock: { w: 1, d: [3600, 4200] }, yoyo: { w: 1, d: [4800, 5600] }, hum: { w: 1, d: [4200, 5200] },
    mote: { w: 1, d: [5200, 6000] }, sneeze: { w: 1, d: [3800, 4400], own: true }, doze: { w: 1, d: [5000, 5800], own: true },
    hiccup: { w: 1, d: [4200, 5000], own: true },
    bubble: { w: 1, d: [4600, 5400], own: true }, spider: { w: 1, d: [5000, 5800], own: true },
    balance: { w: 1, d: [6000, 6800], own: true }, dance: { w: 1, d: [5400, 6200], own: true },
    tune: { w: 1, d: [5000, 5800], own: true }, mirror: { w: 1, d: [5600, 6400], own: true }, pong: { w: 1, d: [5600, 6600], own: true },
    vhold: { w: 1, d: [5000, 5800], own: true }, peek: { w: 1, d: [5600, 6400], own: true }, drumroll: { w: 1, d: [5000, 5800], own: true } };
  // The beats from the pose's start: the first is always keeping an eye on the builds, so the still frame is too. A pose
  // started again (its time going back) starts a fresh plan.
  let plan = { start: [0, 6000], kind: ['scan'], last: 0 };
  function beatAt(t) {
    t = Math.max(0, t);
    if (t < plan.last) plan = { start: [0, 6000], kind: ['scan'], last: 0 };
    plan.last = t;
    while (plan.start[plan.start.length - 1] <= t) {
      const i = plan.kind.length, live = Object.keys(BEATS).filter(k => BEATS[k].w > 0 && k !== plan.kind[i - 1]);
      let r = Math.random() * live.reduce((s, k) => s + BEATS[k].w, 0), kind = live[live.length - 1];
      for (const k of live) if ((r -= BEATS[k].w) < 0) { kind = k; break; }
      const [a, b] = BEATS[kind].d;
      plan.kind.push(kind); plan.start.push(plan.start[i] + a + Math.random() * (b - a));
    }
    let i = plan.kind.length - 1;
    while (plan.start[i] > t) i--;
    const s = plan.start[i], e = plan.start[i + 1];
    let reads = 0;
    for (let j = 0; j < i; j++) if (plan.kind[j] === 'read') reads++;
    return { i, kind: plan.kind[i], k: (t - s) / (e - s), d: e - s, s, reads };
  }
  // Where speck's eye goes to look at a point in the scene, and at a TV.
  const lookAt = (x, y) => ({ lookX: Math.max(-1, Math.min(1, (x - BX) / 55)), lookY: Math.max(-1, Math.min(1, (y + 26) / 40)) });
  const tvLook = m => lookAt(m.cx, -LEG - m.h / 2);
  const LEFT = rim(Math.PI - .25); // its free shoulder, on the left
  // 0504: where the clipboard lands when it slides off its head: on the floor to its right, clear of the TVs on its left
  const FLOOR = { x: BX + 30, y: -6.5, a: Math.PI / 2 };
  function pose(t) {
    const { INK, FAINT, OFF, F5 } = LCD, ms = tvs(), b = beatAt(t), k = b.k;
    const env = sine(Math.min(1, k * b.d / BLEND, (1 - k) * b.d / BLEND));
    // At rest it breathes and watches one build's TV, moving on to the next every few seconds.
    const rl = tvLook(ms[Math.floor(t / FOCUS) % ms.length]);
    const R = { x: 0, y: 0, rot: 0, sy: 1 + .015 * Math.sin(t / 640), lookX: rl.lookX, lookY: rl.lookY, raise: 0, hide: 0, lid: 1, droop: 0, ear: 0 };
    const O = {}, props = []; // this beat's own pose, mixed in by env, and what it draws
    let eye = null, hand = null, ticks = b.reads % 5; // four ticks, then a fresh page; where its free hand goes
    let balance = null; // while balancing: how far through, and the wobble
    // 0505: what each TV shows; a trick changes only the TV nearest speck, the last
    const screens = ms.map((m, j) => ({ st: tvState(j, t), show: 'log', wig: 0, roll: null, me: null })), near = ms[ms.length - 1], tv = screens[ms.length - 1];
    if (b.kind === 'scan') { // its eye goes from TV to TV, then round the room
      const spots = [...ms.map(tvLook), { lookX: .1, lookY: -.55 }, { lookX: .7, lookY: .05 }];
      const n = spots.length, q = k * n, a = Math.floor(q) % n, c = (a + 1) % n, f = sine(seg(q % 1, .75, 1));
      O.lookX = lerp(spots[a].lookX, spots[c].lookX, f); O.lookY = lerp(spots[a].lookY, spots[c].lookY, f); O.x = O.lookX * 2;
    } else if (b.kind === 'read') { // lifts the clipboard, reads, ticks a line
      O.raise = 1; O.lookX = .8; O.lookY = .55 + .05 * Math.sin(t / 300); O.rot = .03;
      if (k > .68) ticks = (b.reads + 1) % 5;
      if (k > .66 && k < .74) O.y = -1.5 * Math.sin(seg(k, .66, .74) * Math.PI);
    } else if (b.kind === 'lean') { // leans towards a TV, squints, nods
      const L = tvLook(ms[(b.i + 1) % ms.length]);
      O.x = -5; O.rot = -.09; eye = 'focus'; O.lookX = Math.max(-1, L.lookX - .15); O.lookY = L.lookY;
      O.y = -1.6 * Math.abs(Math.sin(seg(k, .5, .8) * Math.PI * 2));
    } else if (b.kind === 'popcorn') { // a bucket in its free hand; now and then a piece goes up and into the gap at its top
      hand = { x: -22, y: -16 };
      O.lookX = rl.lookX; O.lookY = rl.lookY;
      const u = ((t - b.s) % 1500) / 1500;
      if (k > .1 && k < .88 && u < .55) { // a kernel in the air
        const a = u / .55, kx = lerp(-22, -8.3, a), ky = lerp(-18, -42, a) - 16 * Math.sin(a * Math.PI);
        O.lookX = lerp(-.5, 0, a); O.lookY = lerp(.2, -1, a);
        props.push({ key: 'kernel', draw(pen) { pen.disc(B.x + kx, B.y + ky, 1.3, INK); } });
      } else if (k > .1 && k < .88 && u < .75) { eye = 'bliss'; O.y = -1; }
      props.push({ key: 'bucket', a: env, draw(pen) {
        const x = B.x + hand.x, y = B.y + hand.y + 2, q = [[x - 6, y - 5], [x + 6, y - 5], [x + 4.5, y + 7], [x - 4.5, y + 7]];
        pen.lw = 1.4; pen.fillPoly(q, OFF); pen.poly(q, INK);
        for (const sx of [-2, 2]) pen.line(x + sx, y - 5, x + sx * .8, y + 7, FAINT);
        for (let i = 0; i < 5; i++) pen.disc(x - 4.5 + i * 2.3, y - 6 - (i % 2) * 1.2, 1.3, INK);
      } });
    } else if (b.kind === 'clock') { // looks up at the time in the top right of its own screen
      const up = sine(seg(k, .1, .3)) * (1 - sine(seg(k, .7, .9)));
      O.lookX = lerp(rl.lookX, 1, up); O.lookY = lerp(rl.lookY, -1, up); O.rot = .06 * up; O.sy = 1 + .02 * up;
      if (k > .38 && k < .62) props.push({ key: 'bang', a: Math.sin(seg(k, .38, .62) * Math.PI) * 1.6, draw(pen) { pen.text('!', B.x + 24, -60, { font: F5 }); } });
    } else if (b.kind === 'yoyo') { // a yo-yo on a string from its free hand
      hand = { x: -24, y: -22 + 1.5 * Math.sin((t - b.s) / 300 * Math.PI) };
      const u = ((t - b.s) % 1200) / 1200, drop = Math.sin(u * Math.PI) ** 1.4, yy = lerp(hand.y + 3, -4, drop * Math.min(1, env * 1.5));
      const L = lookAt(BX - 24, yy); O.lookX = L.lookX; O.lookY = L.lookY;
      props.push({ key: 'yoyo', a: env, draw(pen) {
        const x = B.x + hand.x, y0 = B.y + hand.y, y = B.y + yy, a = t / 60;
        pen.lw = 1; pen.line(x, y0, x, y - 2.5, FAINT); pen.lw = 1.3;
        pen.disc(x, y, 3, OFF); pen.ring(x, y, 3);
        pen.line(x - 2.2 * Math.cos(a), y - 2.2 * Math.sin(a), x + 2.2 * Math.cos(a), y + 2.2 * Math.sin(a));
      } });
    } else if (b.kind === 'hum') { // bobs along, notes drifting up
      O.y = -1.8 * Math.abs(Math.sin(t / 280)); O.rot = .05 * Math.sin(t / 560); eye = Math.sin(t / 1400) > .2 ? 'bliss' : null; O.lookX = .2; O.lookY = -.1;
      for (let n = 0; n < 4; n++) {
        const born = Math.floor(t / 600) * 600 - n * 600, age = (t - born) / 1800;
        if (age < 0 || age > 1 || born < b.s) continue;
        const nx = BX + 16 + age * 14 + Math.sin(born) * 4, ny = -44 - age * 12;
        props.push({ key: 'note' + n, a: Math.sin(age * Math.PI) * env, draw(pen) { pen.lw = 1.3; pen.disc(nx, ny, 1.6, INK, 1.3); pen.line(nx + 1.4, ny, nx + 1.4, ny - 6); pen.line(nx + 1.4, ny - 6, nx + 4, ny - 4.5); } });
      }
    } else if (b.kind === 'mote') { // a speck of dust drifts in, lands on its ear, and off it goes
      let mx, my, a = 1;
      if (k < .62) { const u = k / .62; mx = lerp(96, BX + 13, u); my = -58 + 10 * Math.sin(u * 7) + lerp(0, 12, u); }
      else if (k < .8) { mx = BX + 13; my = -47; }
      else { const u = (k - .8) / .2; mx = BX + 13 - u * 40; my = -47 - u * 22 - 6 * Math.sin(u * 6); a = 1 - u; }
      const L = lookAt(mx, my); O.lookX = L.lookX; O.lookY = L.lookY;
      if (k >= .62 && k < .8) { eye = 'wide'; O.ear = 2.5 * Math.sin(seg(k, .66, .8) * Math.PI * 3); O.lookX = .45; O.lookY = -1; }
      props.push({ key: 'mote', a: a * Math.min(1, env * 2), draw(pen) { pen.disc(mx, my, 1.1, INK); } });
    } else if (b.kind === 'sneeze') { // a tickle, a breath in, a sneeze that shakes its ears, then a sheepish look round
      const inhale = sine(seg(k, .1, .5)), at = seg(k, .5, .62);
      if (k < .5) { O.rot = .09 * inhale; O.sy = 1 + .05 * inhale; O.lid = 1 - .5 * inhale; eye = 'focus'; O.lookY = -.4 * inhale; O.lookX = rl.lookX * (1 - inhale); O.y = -.6 * Math.sin(t / 40) * inhale; }
      else if (k < .75) { O.rot = -.13 * (1 - at * .4); O.sy = .95; eye = 'closed'; O.ear = 3 * Math.sin((t - b.s) / 50); O.lookX = -.4; O.lookY = .3; }
      else { eye = 'sheepish'; O.lookX = .6; O.lookY = .2; }
      if (k > .5 && k < .82) {
        const u = seg(k, .5, .82);
        props.push({ key: 'achoo', a: Math.sin(u * Math.PI) * 1.4, draw(pen) {
          pen.text('ACHOO', B.x - 22 - u * 4, -60, { font: F5 });
          for (let i = 0; i < 6; i++) pen.dotAt(B.x - 18 - u * (14 + rnd(i) * 20), -36 + (rnd(i + 3) - .5) * 18 * u, FAINT);
        } });
      }
    } else if (b.kind === 'doze') { // its lid slides down and its head droops, then a build finishing makes it jump
      const sleepy = sine(seg(k, .05, .62)), jolt = seg(k, .64, .72);
      O.lid = k < .64 ? lerp(1, .22, sleepy) : 1; O.droop = k < .64 ? 3 * sleepy : 0; O.sy = k < .64 ? 1 - .03 * sleepy : 1; O.lookY = .35;
      if (k >= .64 && k < .86) { eye = 'wide'; O.y = -4 * Math.sin(jolt * Math.PI); const L = tvLook(ms[0]); O.lookX = L.lookX; O.lookY = L.lookY; }
      if (k > .25 && k < .62) { const zk = (t / 900) % 1; props.push({ key: 'z', a: Math.sin(zk * Math.PI) * env, draw(pen) { pen.text('z', BX + 20 + zk * 6, -50 - zk * 7, { font: F5 }); } }); }
    } else if (b.kind === 'hiccup') { // three hiccups, each a little jump with a HIC, then a sheepish look round
      for (const h of [.18, .42, .66]) {
        if (k >= h && k < h + .06) { const u = seg(k, h, h + .06); O.y = -3.5 * Math.sin(u * Math.PI); O.sy = 1 + .07 * Math.sin(u * Math.PI); eye = 'wide'; }
        if (k >= h && k < h + .16) { const u = seg(k, h, h + .16); props.push({ key: 'hic' + h, a: Math.sin(u * Math.PI) * 1.5, draw(pen) { pen.text('HIC', B.x + 26 + u * 4, -51 - u * 5, { font: F5 }); } }); }
      }
      if (k > .8) { eye = 'sheepish'; O.lookX = .6; O.lookY = .25; }
    } else if (b.kind === 'bubble') { // a bubble grows out of the gap at its top, wobbling, then pops in its face
      const grow = seg(k, .12, .68), popped = k >= .68;
      O.lookX = -.35; O.lookY = -1; eye = grow > .6 ? 'wide' : null;
      if (popped && k < .8) { O.y = -3 * Math.sin(seg(k, .68, .76) * Math.PI); O.ear = 2.5 * Math.sin((t - b.s) / 50); eye = 'closed'; }
      if (k >= .8) { eye = 'sheepish'; O.lookX = .5; O.lookY = .1; }
      props.push({ key: 'bubble', a: env, draw(pen) {
        const bx = B.x - 9, by = B.y - 44;
        if (!popped && grow > 0) { const r = 1 + 9 * grow, w = 1 + .08 * Math.sin(t / 70); pen.lw = 1.2; pen.ring(bx - r * .4, by - r * .8, r * w, 0, Math.PI * 2, INK, r / w); pen.dotAt(bx - r * .7, by - r * 1.2, INK); }
        else if (popped && k < .8) { const u = seg(k, .68, .8); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; pen.dotAt(bx - 4 + Math.cos(a) * (6 + 10 * u), by - 8 + Math.sin(a) * (6 + 10 * u), u < .5 ? INK : FAINT); } }
      } });
    } else if (b.kind === 'spider') { // a spider lowers itself between speck and the TVs; it leans back wide-eyed, then gives it a flat look
      const down = sine(seg(k, .08, .38)), up = sine(seg(k, .72, .92)), sy = lerp(-70, -34, down * (1 - up)), sx = BX - 29 + 1.5 * Math.sin(t / 400);
      const L = lookAt(BX - 29, sy); O.lookX = L.lookX; O.lookY = L.lookY;
      if (k > .36 && k < .74) { eye = 'wide'; O.rot = .09; O.x = 4; O.ear = 2 * Math.sin((t - b.s) / 60); }
      if (k > .74) eye = 'flat';
      props.push({ key: 'spider', a: env, draw(pen) {
        pen.lw = 1; pen.line(sx, -72, sx, sy - 2, FAINT); pen.disc(sx, sy, 1.8, INK);
        for (const d of [-1, 1]) for (let i = 0; i < 3; i++) pen.line(sx + d * 1.5, sy - 1 + i * 1.2, sx + d * 4, sy - 2 + i * 2.2, INK);
      } });
    } else if (b.kind === 'balance') { // the clipboard on its head, a wobble to keep it there, then it slides off
      O.lookY = -1; O.lookX = 0; eye = 'focus';
      const wob = k < .74 ? Math.sin((t - b.s) / 330) * seg(k, .25, .7) : 0;
      O.rot = -.1 * wob; O.x = 2 * wob;
      if (k >= .74 && k < .95) { eye = 'sheepish'; O.lookX = .7; O.lookY = .8; }
      balance = { k, wob };
    } else if (b.kind === 'dance') { // a little dance while nobody's looking, until it notices you, freezes, and goes back to watching
      if (k < .68) { const ph = (t - b.s) / 300; O.x = 3 * Math.sin(ph); O.rot = .08 * Math.sin(ph); O.y = -1.6 * Math.abs(Math.cos(ph)); eye = 'bliss'; O.lookX = .2; O.lookY = -.2; }
      else if (k < .86) { eye = 'wide'; O.lookX = 0; O.lookY = 0; O.sy = 1.03; }
      else { eye = 'sheepish'; const L = tvLook(ms[ms.length - 1]); O.lookX = L.lookX; O.lookY = L.lookY; }
    } else if (b.kind === 'tune') { // the TV goes to snow; it waggles its own ear and the TV's rabbit ears waggle with it
      const L = tvLook(near); O.lookX = L.lookX; O.lookY = L.lookY;
      if (k > .08 && k < .62) tv.show = 'snow';
      if (k > .08 && k < .22) eye = 'wide';
      if (k >= .22 && k < .62) { eye = 'focus'; O.ear = 3 * Math.sin((t - b.s) / 85); tv.wig = .22 * Math.sin((t - b.s) / 85); O.rot = .03 * Math.sin((t - b.s) / 170); }
      if (k >= .62 && k < .78) { eye = 'bliss'; O.y = -2.2 * Math.sin(seg(k, .62, .7) * Math.PI); }
    } else if (b.kind === 'mirror') { // the TV shows a tiny speck, which copies everything speck does
      const L = tvLook(near); O.lookX = L.lookX; O.lookY = L.lookY;
      if (k > .1 && k < .86) tv.show = 'mirror';
      if (k > .22) { O.x = -4; O.rot = -.07; eye = 'focus'; }
      if (k > .5 && k < .6) O.rot = .07; // it leans the other way, to test it
      if (k > .64 && k < .72) { O.y = -3 * Math.sin(seg(k, .64, .72) * Math.PI); eye = 'wide'; }
    } else if (b.kind === 'pong') { // the TV flicks over to Pong, with static either side; its eye follows the ball
      if (k > .08 && k < .12 || k > .86 && k < .9) tv.show = 'snow';
      else if (k >= .12 && k <= .86) tv.show = 'pong';
      if (tv.show === 'pong') { const ball = pongBall(tvGeom(near), t), L = lookAt(ball.x, ball.y); O.lookX = L.lookX; O.lookY = L.lookY; O.x = -3; eye = k > .5 && k < .7 ? 'focus' : null; O.rot = -.04 + .03 * Math.sin(t / 300); }
    } else if (b.kind === 'vhold') { // the TV's picture rolls, a black bar sliding through; speck tilts to follow it, then wobbles upright
      const L = tvLook(near); O.lookX = L.lookX; O.lookY = L.lookY; eye = 'focus';
      if (k > .1 && k < .72) { tv.roll = (t - b.s) / 260; O.rot = -.13 * Math.sin((t - b.s) / 260 * Math.PI * .5); O.x = -2; }
      if (k >= .72 && k < .9) { eye = 'flat'; O.rot = .05 * Math.sin((t - b.s) / 70) * (1 - seg(k, .72, .9)); O.sy = .97; }
    } else if (b.kind === 'peek') { // too tense to watch the bar nearly full: it hides behind the clipboard, peeks twice, then hops at the tick
      const L = tvLook(near), done = k >= .76;
      tv.st = done ? { prog: 1, done: true, since: (k - .76) * b.d } : { prog: lerp(.82, .985, seg(k, .05, .76)), done: false, since: 0 };
      if (!done) {
        O.hide = 1; O.lookX = .9; O.lookY = .1; eye = 'flat'; O.sy = .97;
        for (const pk of [.32, .55]) if (k > pk && k < pk + .09) { O.hide = .35; O.lookX = L.lookX; O.lookY = L.lookY; eye = 'wide'; }
        O.y = k > .6 ? .5 * Math.sin(t / 45) : 0; // trembling
      } else { O.lookX = L.lookX; O.lookY = L.lookY; eye = 'bliss'; O.y = -3 * Math.sin(seg(k, .76, .86) * Math.PI); }
    } else if (b.kind === 'drumroll') { // a drumroll with its feet as the bar nears full, then TA-DA at the tick
      const L = tvLook(near), done = k >= .7;
      tv.st = done ? { prog: 1, done: true, since: (k - .7) * b.d } : { prog: lerp(.86, .995, seg(k, .08, .7)), done: false, since: 0 };
      O.lookX = L.lookX; O.lookY = L.lookY;
      if (!done && k > .08) { O.y = -1.2 * Math.abs(Math.sin(t / 40)); eye = 'focus'; props.push({ key: 'drr', a: env, draw(pen) { pen.text('DRRR', B.x + 6 + (Math.floor(t / 60) % 2), -56, { font: F5 }); } }); }
      if (done) { const u = seg(k, .7, .95); O.y = -4 * Math.sin(seg(k, .7, .8) * Math.PI); eye = 'bliss'; O.rot = .06; props.push({ key: 'tada', a: Math.sin(u * Math.PI) * 1.6, draw(pen) { pen.text('TA-DA', B.x + 4, -56 - u * 3, { font: F5 }); } }); }
    }
    const P = {};
    for (const n of Object.keys(R)) P[n] = n in O ? lerp(R[n], O[n], env) : R[n];
    P.eye = env > .5 && eye ? eye : 'open';
    // a bar filling: a little hop, a wide eye and a look at that TV, unless the beat has its own reaction
    if (!BEATS[b.kind].own) ms.forEach((m, j) => {
      const st = tvState(j, t);
      if (st.done && st.since < 500) { P.y -= 3 * Math.sin(st.since / 500 * Math.PI); P.eye = 'wide'; const L = tvLook(m); P.lookX = L.lookX; P.lookY = L.lookY; }
    });
    // the clipboard, in the hand on its right, lifted to read, or held up in front of it to hide behind (0505: a unit
    // nearer than the prototype has it, so that arm stays no longer than its usual length)
    const cx = lerp(lerp(19, 15, P.raise), 4, P.hide), cy = lerp(lerp(-21, -35, P.raise), -40, P.hide), w = 13, h = 16, tilt = lerp(lerp(.08, -.12, P.raise), 0, P.hide);
    // 0504: balancing, from its hand to its head, a wobble, a slide off onto the floor, then back in its hand
    let clip = null;
    if (balance) {
      const { k, wob } = balance, inHand = { x: BX + P.x + cx + w / 2, y: P.y + cy + h / 2, a: tilt };
      const onHead = { x: BX + P.x + wob * 3, y: P.y - 47, a: Math.PI / 2 + .25 * wob };
      const mix = (A, Z, u) => ({ x: lerp(A.x, Z.x, u), y: lerp(A.y, Z.y, u), a: lerp(A.a, Z.a, u) });
      if (k < .1) clip = inHand;
      else if (k < .22) clip = mix(inHand, onHead, sine(seg(k, .1, .22)));
      else if (k < .7) clip = onHead;
      else if (k < .8) { const u = seg(k, .7, .8); clip = mix(onHead, FLOOR, u * u); clip.y -= 8 * Math.sin(u * Math.PI); clip.a += 1.2 * Math.sin(u * Math.PI); }
      else if (k < .93) clip = FLOOR;
      else clip = mix(FLOOR, inHand, sine(seg(k, .93, 1)));
    }
    const held = !balance || balance.k < .12 || balance.k > .97; // the clipboard's arm folds away while it's on its head or the floor
    const arms = held ? [{ s: rim(.35), h: { x: cx + 1, y: cy + h * .55 } }] : [];
    if (hand && env > .02) arms.push({ s: LEFT, h: { x: lerp(LEFT.x, hand.x, Math.min(1, env * 1.4)), y: lerp(LEFT.y, hand.y, Math.min(1, env * 1.4)) } }); // the free hand, reaching out
    const B = { t, x: BX + P.x, y: P.y, rot: P.rot, sy: P.sy, lookX: P.lookX, lookY: P.lookY, eye: P.eye, lid: P.lid, droop: P.droop, ear: P.ear, arms };
    if (tv.show === 'mirror') tv.me = B;
    props.unshift(...ms.map((m, j) => ({ key: `tv${j}`, layer: 'back', draw(pen) { drawTV(pen, m, j, t, screens[j]); } })));
    props.push({ key: 'clip', draw(pen) {
      pen.save();
      if (clip) { pen.translate(clip.x, clip.y); pen.rotate(clip.a); } else { pen.translate(B.x + cx + w / 2, B.y + cy + h / 2); pen.rotate(tilt); }
      const q = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]];
      pen.lw = 1.4; pen.fillPoly(q, OFF); pen.poly(q, INK);
      pen.fillPoly([[-2.5, -h / 2 - 2.5], [2.5, -h / 2 - 2.5], [2.5, -h / 2 + 1.5], [-2.5, -h / 2 + 1.5]], INK);
      for (let i = 0; i < 4; i++) { const ly = -h / 2 + 5 + i * 3; pen.line(-1.5, ly, w / 2 - 2.5, ly, i < ticks ? INK : FAINT); if (i < ticks) pen.dotAt(-4, ly, INK); }
      pen.restore();
    } });
    return { B, props, beat: b.kind, ticks, screens };
  }
  pose.parts = { BEATS, TVS, tvState, tvGeom, beatAt, tvs, pongBall }; // for the tests
  return pose;
})();
const speckPoses = () => ({ ...LCD.STATES, watch: watchPose, ask: LCD.PANEL.bad, flag: LCD.PANEL.wait, ship: LCD.PANEL.ship });
// 0414: what speck does, from what the page has seen of the pipeline. Each board is compared with the one before it
// (noteBoard): what changed queues an event, played one after another, or starts the laptop while drafts are written.
// Between them speck follows the Foreman's word (speckRests). 0436: and passes the time during a long wait.
const SPECK = { push: 3200, event: 6000, writing: 30000, nap: 15 * 60000, watch: 2 * 60000, pastime: 60000, turn: 3 * 60000, missed: 60000 };
// 0436: the pastimes, tea, chess, messy and sweeping, with their captions while Idle and while waiting on the pipeline.
const IDLE_MOODS = [['eating', 'TEA, WHILE IT IS QUIET'], ['playing', 'NOTHING READY. CHESS?'], ['messy', 'CRUMBS IN THE WORKTREE'], ['cleaning', 'SWEEPING OLD BRANCHES']];
const PASTIMES = [['eating', 'A CUP OF TEA'], ['playing', 'A QUICK GAME OF CHESS'], ['messy', 'CRUMBS ON THE CLIPBOARD'], ['cleaning', 'A QUICK SWEEP']];
// rest: when the word's rhythm started, which of its turns has picked a pastime, and which one (0436). 0446: st and
// seenAt, the last board noted and when; hiddenAt, when the page was hidden; back, set when it's shown again until the
// next board is noted.
const speckDo = { f: null, seen: null, queue: [], playing: null, writing: null, word: null, rest: null, last: null, woke: false, n: 0,
  st: null, seenAt: null, hiddenAt: null, back: null };
// 0436: a pastime at random, never the one before.
function pickPastime(d) {
  const all = IDLE_MOODS.map((_, i) => i).filter(i => i !== d.last);
  d.last = all[Math.max(0, Math.min(all.length - 1, Math.floor(Math.random() * all.length)))];
  return d.last;
}
const byId = (a, b) => a.localeCompare(b, 'en', { numeric: true });
// A draft's text, to tell when it changes.
const draftText = t => JSON.stringify([t.title, t.problem, t.outcome, t.acceptance_criteria, t.out_of_scope, t.notes, t.priority, t.size, t.risk, t.kind, t.type, t.after]);
function noteBoard(st, f, word) {
  const d = speckDo, now = Date.now();
  d.f = f && typeof f === 'object' ? f : null; // 0495: for the captions between events
  if (word !== d.word) { d.word = word; d.woke = false; d.rest = { since: now, turn: -1, i: null }; }
  if (!st || !Array.isArray(st.tickets)) return;
  const fresh = st !== d.st;
  d.st = st;
  const tickets = new Map(st.tickets.filter(t => t && typeof t === 'object' && t.id != null).map(t => [String(t.id), t]));
  const ids = [...tickets.keys()].sort(byId), ag = f.agent && typeof f.agent === 'object' ? f.agent : {};
  const asks = (Array.isArray(ag.asks) ? ag.asks : []).filter(a => a && a.id != null).map(a => ({ id: String(a.id), key: `${a.id} ${a.at}`, at: a.at }));
  const shipping = new Set(ids.filter(id => tickets.get(id).ship && tickets.get(id).ship.running === true));
  if (f.ship && typeof f.ship.running === 'string') shipping.add(f.ship.running);
  const seen = { tickets: new Map(ids.map(id => [id, { status: tickets.get(id).status, text: draftText(tickets.get(id)) }])), asks: new Set(asks.map(a => a.key)),
    running: ag.running && ag.running.id != null ? String(ag.running.id) : null, shipping };
  const was = d.seen, wasAt = d.seenAt;
  d.seen = seen;
  if (fresh) d.seenAt = now;
  const back = fresh ? d.back : null;
  if (back) d.back = null;
  if (!was) return; // what happened before the page loaded doesn't play
  const from = d.queue.length;
  // 0446: each event notes when the page heard of it and, when the board says, when it happened.
  const play = (pose, cap, ms, when) => { const at = typeof when === 'string' ? Date.parse(when) : NaN; d.queue.push({ pose, cap, ms, key: `e${++d.n}`, noted: now, at: Number.isFinite(at) ? at : null }); };
  const became = (id, status) => was.tickets.has(id) && was.tickets.get(id).status !== status && tickets.get(id).status === status;
  const runOn = !!(st.run && st.run.on);
  const ship = id => (tickets.get(id) && tickets.get(id).ship) || {};
  for (const id of ids) if (became(id, 'done')) play('celebrating', `${id} SHIPPED`, SPECK.event, tickets.get(id).finished);
  for (const id of [...shipping].sort(byId)) if (!was.shipping.has(id)) play('ship', `SHIPPING ${id}`, SPECK.push, ship(id).started);
  for (const id of ids) if (became(id, 'blocked')) play('ask', `${id} HAS A QUESTION`, SPECK.event, tickets.get(id).blocked_at);
  for (const a of asks) if (!was.asks.has(a.key)) play('ask', `${a.id} HAS A QUESTION`, SPECK.event, a.at);
  for (const id of ids) if (became(id, 'approved') && !(tickets.get(id).auto_ship === true && runOn)) play('flag', `${id} IS READY TO SHIP`, SPECK.event, tickets.get(id).approved);
  if (seen.running && seen.running !== was.running) play('confused', `LOOKING INTO ${seen.running}`, SPECK.event, ag.running.started);
  // 0446: the first board after the page is shown again holds what changed while it had no stream. A change the board
  // dates from before the page was shown, or doesn't date at all, is from while it was hidden: one with no date came
  // after the board before, which is all that's known of when. Of those and the one kept when the page was shown, only
  // the latest plays, and only when it came less than a minute before. A change dated from after plays as any other.
  if (back) {
    const got = d.queue.splice(from), later = got.filter(e => e.at !== null && e.at >= back.at);
    const missed = got.filter(e => !later.includes(e)).map(e => ({ ...e, at: e.at ?? wasAt })).filter(e => e.at !== null);
    const one = latestMissed([...(back.kept ? [back.kept] : []), ...missed], back.at);
    if (one) d.queue.push(one);
    d.queue.push(...later);
  }
  const drafts = ids.filter(id => tickets.get(id).status === 'draft' && (!was.tickets.has(id) || (was.tickets.get(id).status === 'draft' && was.tickets.get(id).text !== seen.tickets.get(id).text)));
  if (drafts.length) d.writing = { id: drafts[drafts.length - 1], until: now + SPECK.writing };
}
// 0446: the page hidden (visible false) or shown again. Of the events from while it was hidden, only the latest plays,
// and only when it came less than a minute before the page was shown; the next board's changes count as from then too,
// so nothing missed plays until that board has come.
function speckShown(visible) {
  const d = speckDo, now = Date.now();
  if (!visible) { if (d.hiddenAt === null) d.hiddenAt = now; return; }
  if (d.hiddenAt === null) return;
  const since = d.hiddenAt, missed = [...(d.playing ? [d.playing] : []), ...d.queue].filter(e => e.noted >= since);
  d.hiddenAt = null;
  if (d.playing && d.playing.noted >= since) d.playing = null;
  d.queue = d.queue.filter(e => e.noted < since);
  const one = latestMissed(missed, now);
  let kept = null;
  if (one) { const { until, ...e } = one; kept = e; }
  d.back = { at: now, kept }; // kept waits for the next board, which may hold a later one
}
// 0446: of events missed while the page was hidden, the one that happened last, by its date or else when the page
// heard of it, when that was less than a minute before `shown`; otherwise null. Of two at once, the later in the list.
function latestMissed(events, shown) {
  let one = null;
  for (const e of events) { const at = e.at ?? e.noted; if (at !== null && (!one || at >= (one.at ?? one.noted))) one = e; }
  return one && shown - (one.at ?? one.noted) < SPECK.missed ? one : null;
}
// What speck does at `now`: { pose, cap }, with a `key` of its own for each event.
function speckNow(now) {
  const d = speckDo;
  if (d.playing && now >= d.playing.until) d.playing = null;
  if (!d.playing && d.queue.length) { const e = d.queue.shift(); d.playing = { ...e, until: now + e.ms }; }
  if (d.playing) { d.woke = true; return d.playing; }
  if (d.writing && now < d.writing.until) { d.woke = true; return { pose: 'building', cap: `WRITING ${d.writing.id}` }; }
  return speckRests(now);
}
// 0495: the caption between events says what the top row doesn't: which tickets, or why. It fits the row (0414) in
// SCREEN.fit characters, cut with … where it doesn't.
const capCut = c => (c.length > SCREEN.fit ? `${c.slice(0, SCREEN.fit - 1).trimEnd()}…` : c);
// The ids, each once, lowest first.
const capIds = ids => [...new Set(ids.filter(id => id != null && id !== '').map(String))].sort(byId);
// A caption naming `ids`: `one` around a single id, and for more `<id> AND <id>` or `<id> AND <n> MORE`, after
// one[0], then `many`. `none` when there are none.
function idsCap(ids, one, many, none = '') {
  if (!ids.length) return none;
  if (ids.length === 1) return capCut(`${one[0]}${ids[0]}${one[1]}`);
  return capCut(`${one[0]}${ids[0]} AND ${ids.length === 2 ? ids[1] : `${ids.length - 1} MORE`}${many}`);
}
// What speck does between events, by the Foreman's word. 0436: while it's Building, Shipping or Waiting, speck
// watches (or is grumpy) for 2 minutes, then passes the time for 1, and so on; while it's Idle it changes pastime every
// 3 minutes and naps after 15. An event or writing starts the rhythm again, and wakes it from a nap.
function speckRests(now) {
  const d = speckDo, w = d.word || '', r = d.rest || (d.rest = { since: now, turn: -1, i: null });
  if (d.woke) { d.woke = false; r.since = now; r.turn = w === 'Idle' && r.i !== null ? 0 : -1; }
  const el = Math.max(0, now - r.since);
  let m, own = null;
  const f = d.f || {}, list = v => (Array.isArray(v) ? v : []);
  if (w === 'Off') return { pose: 'sleeping', cap: 'TURN ON AUTO-BUILD' };
  if (NEEDS_YOU.test(w)) {
    const yours = f.fixing === 'off' ? [] : list(f.blocked).filter(b => b && !b.foreman).map(b => b.id);
    return { pose: 'ask', cap: idsCap(capIds([...yours, ...list(f.agent && f.agent.asks).map(a => a && a.id)]), ['', ' HAS A QUESTION'], ' ASK YOU') };
  }
  if (/^Building \d+$/.test(w)) own = { pose: 'watch', cap: idsCap(capIds(list(f.building)), ['WATCHING ', ''], '', 'WATCHING THE BUILDS') };
  else if (/^Shipping\b/.test(w)) own = { pose: 'watch', cap: capCut(f.base ? `ON ITS WAY TO ${f.base.toUpperCase()}` : 'ON ITS WAY') };
  else if (/^Waiting\b/.test(w)) own = { pose: 'grumpy', cap: capCut(String(f.why || '').replace(/\s+/g, ' ').trim().replace(/^waiting /i, '').toUpperCase()) };
  if (own) {
    const every = SPECK.watch + SPECK.pastime, turn = Math.floor(el / every);
    if (el - turn * every < SPECK.watch) return own;
    if (r.turn !== turn) { r.turn = turn; r.i = pickPastime(d); }
    return { pose: PASTIMES[r.i][0], cap: PASTIMES[r.i][1] };
  }
  if (w === 'Idle') {
    if (el >= SPECK.nap) return { pose: 'sleeping', cap: 'NAPPING' };
    const turn = Math.floor(el / SPECK.turn);
    if (r.turn !== turn) { r.turn = turn; r.i = pickPastime(d); }
    return { pose: IDLE_MOODS[r.i][0], cap: IDLE_MOODS[r.i][1] };
  }
  return { pose: 'idle', cap: w === 'Reload page' ? 'RELOAD THE PAGE' : '' };
}
// 0285: the Foreman, speck run's one status for the whole pipeline. Pressing it opens its detail. 0413: its word is
// the top row of speck's screen, which is the button, and the frame's edge is in the needs-you colour while the word
// is "Needs you <n>". The button stays put and only what the screen shows changes, so it keeps the focus.
function drawHeader(f, stale) {
  const run = $('run'), word = stale ? 'Reload page' : f.word;
  noteBoard(state, f, word); // 0414
  drawScreen(word);
  $('bezel').className = NEEDS_YOU.test(word) ? 'bezel needs' : 'bezel';
  $('bezel').setAttribute('data-run', f.word === 'Off' ? 'off' : 'on'); // 0513: the dot by speck's name is grey while speck run is off
  run.setAttribute('aria-label', 'speck\'s screen'); // 0485: its word is in its tooltip. 0451: Settings says whether fixing is on
  run.setAttribute('aria-expanded', String(foremanOpen));
  run.title = `speck: ${word} · ${stale ? 'The panel is running newer code than this page shows: open to reload it' : 'The pipeline: speck run\'s log'}`;
}
// 0410: Plan, Build and Shipped are tabs under the header, and only the open one's lane shows. 0477: they're a strip
// of the lanes' names, still tabs to a screen reader. Build opens with the
// page. Each lane's list keeps its own scroll position, put back when its tab opens again.
const LANES = { plan: ['tab-plan', 'shaping-section', 'shaping'], build: ['tab-build', 'build-section', 'queue'], shipped: ['tab-shipped', 'shipped-section', 'shipped-list'] };
const TAB_ORDER = ['plan', 'build', 'shipped'];
let openLane = 'build';
const laneScroll = new Map(); // a closed lane's list's scroll position, by lane
// The lane a node is in, by the list or section holding it: Plan for anything that isn't in Build or Shipped.
const laneOf = n => TAB_ORDER.find(l => within(n, $(LANES[l][1])) || within(n, $(LANES[l][2]))) || 'plan';
function openTab(lane) {
  if (!LANES[lane]) return;
  if (lane !== openLane) {
    laneScroll.set(openLane, $(LANES[openLane][2]).scrollTop || 0);
    const from = rowAt();
    openLane = lane;
    slideFrom(from); // 0476: slides to its card
  }
  drawTabs();
  if (laneScroll.has(lane)) { $(LANES[lane][2]).scrollTop = laneScroll.get(lane); laneScroll.delete(lane); }
}
function drawTabs() {
  for (const l of TAB_ORDER) {
    const [tab, section] = LANES[l], on = l === openLane;
    $(tab).setAttribute('aria-selected', String(on));
    $(section).hidden = !on;
  }
  placeLanes(touch && touch.way === 'x' ? touch.shown : 0); // a refresh leaves a card a finger is moving where it is
  // Build says how many things need you, as the Foreman's status does (0477: whichever lane is in view)
  const needs = /^Needs you (\d+)$/.exec(foremanOf(state).word);
  // 0425: the number alone; its accessible name says what it is
  setText($('build-needs'), needs ? needs[1] : '');
  $('tab-build').setAttribute('aria-label', needs ? `Build, ${needs[1]} needs you` : 'Build');
}
for (const [i, l] of TAB_ORDER.entries()) {
  const tab = $(LANES[l][0]);
  tab.addEventListener('click', () => { openTab(l); render(); });
  // The left and right arrow keys open the tab beside it, round from the last to the first, with the focus on it.
  tab.addEventListener('keydown', e => {
    const step = e.altKey || e.ctrlKey || e.metaKey ? 0 : e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; // Alt+Left is the browser's Back
    if (!step) return;
    if (e.preventDefault) e.preventDefault();
    const next = TAB_ORDER[(i + step + TAB_ORDER.length) % TAB_ORDER.length];
    openTab(next);
    render();
    const to = $(LANES[next][0]);
    if (to.focus) to.focus();
  });
}
// 0476: the lanes are three cards in one row, as wide as the column. At rest only the open one shows, as before; while
// the row moves, all three show in their places (data-slide on the lanes' box: 'drag' while a finger moves it, 'settle'
// while it comes to rest), and the row is moved so the open card is in view: --lane is its place in the row, and --drag
// how far a finger has moved the row from there. A swipe, a sideways scroll on a trackpad, the left and right arrow keys
// or a tab bring another card into view.
const lanesBox = document.querySelector?.('main') || $('lanes');
const SLIDE_MS = 200; // how long a card takes to come to rest
let slides = []; // the slide's animations, one for each card, while the row comes to rest
function placeLanes(drag = 0) {
  if (!lanesBox.style) return;
  lanesBox.style.setProperty('--lane', String(TAB_ORDER.indexOf(openLane)));
  lanesBox.style.setProperty('--drag', `${drag}px`);
}
// Shows every card in its place in the row, each closed lane's list where it was left.
function showRow(how) {
  if (!lanesBox.dataset.slide) for (const l of TAB_ORDER) if (l !== openLane && laneScroll.has(l)) $(LANES[l][2]).scrollTop = laneScroll.get(l);
  lanesBox.dataset.slide = how;
}
// Where the row is now, in pixels from the first card: moved by a finger or a slide, or at rest on the open card.
function rowAt() {
  if (!lanesBox.dataset) return 0;
  if (lanesBox.dataset.slide) return new DOMMatrix(getComputedStyle($(LANES[openLane][1])).transform).m41;
  return -TAB_ORDER.indexOf(openLane) * lanesBox.clientWidth;
}
// Slides the row from `from` px to the open card, and shows only that card once it's there. With reduced motion, the
// open card shows at once.
function slideFrom(from) {
  if (!lanesBox.dataset) return;
  for (const a of slides) a.cancel();
  slides = [];
  placeLanes();
  const to = -TAB_ORDER.indexOf(openLane) * lanesBox.clientWidth;
  if (reducedMotion() || Math.abs(from - to) < 1 || typeof lanesBox.animate !== 'function') { delete lanesBox.dataset.slide; return; }
  showRow('settle');
  const mine = slides = TAB_ORDER.map(l => $(LANES[l][1]).animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }], { duration: SLIDE_MS, easing: 'cubic-bezier(.25, .8, .35, 1)' }));
  mine[0].finished.then(() => { if (slides === mine) { slides = []; delete lanesBox.dataset.slide; } }, () => {});
}
// The lane beside the open one, `step` along the row (-1 left, 1 right), opened if there is one there. The ends don't
// wrap round, as a card can't be swiped past the last one. Without one, the row slides back to the open card.
function stepLane(step) {
  const next = TAB_ORDER[TAB_ORDER.indexOf(openLane) + step];
  if (next) { openTab(next); render(); } else slideFrom(rowAt());
}
// Whether a node, or one it's in, inside the lanes scrolls sideways itself, as a wide code block does: a swipe or a
// sideways scroll that starts there scrolls it instead.
function scrollsSideways(n) {
  for (; n && n !== lanesBox && n.nodeType === 1; n = n.parentNode) {
    if (n.scrollWidth > n.clientWidth + 1 && /^(auto|scroll)$/.test(getComputedStyle(n).overflowX)) return true;
  }
  return false;
}
// A touch is followed sideways or left to the browser to scroll up and down, by the way it has gone more once it's gone
// 10 px. Followed sideways, the row moves with the finger (a third as far past either end), and on lifting it a quick
// flick changes lane however short it was, and a slower drag past a third of the card's width does. The lists only
// scroll up and down themselves (touch-action: pan-y), so the browser never holds on to a sideways touch.
let touch = null; // { x, y, way: null | 'x' | 'y', drag, base, shown, at: [[time, x]…] } while a finger is down, or null
const FLICK = 0.3; // px per ms
if (lanesBox.addEventListener) {
  lanesBox.addEventListener('touchstart', e => {
    touch = null;
    if (e.touches.length !== 1 || pageHeld() || scrollsSideways(e.target)) return;
    const t = e.touches[0];
    touch = { x: t.clientX, y: t.clientY, way: null, drag: 0, base: 0, shown: 0, at: [[e.timeStamp, t.clientX]] };
  }, { passive: true });
  lanesBox.addEventListener('touchmove', e => {
    if (!touch || touch.way === 'y') return;
    if (e.touches.length !== 1) { touch = null; slideFrom(rowAt()); return; }
    const t = e.touches[0], dx = t.clientX - touch.x, dy = t.clientY - touch.y;
    if (!touch.way) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 10) return;
      touch.way = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (touch.way === 'y') return;
      // A card still coming to rest stops where the finger catches it
      touch.base = slides.length ? rowAt() + TAB_ORDER.indexOf(openLane) * lanesBox.clientWidth : 0;
      for (const a of slides) a.cancel();
      slides = [];
      if (!reducedMotion()) showRow('drag');
    }
    if (e.cancelable) e.preventDefault();
    touch.at.push([e.timeStamp, t.clientX]);
    if (touch.at.length > 6) touch.at.shift();
    const i = TAB_ORDER.indexOf(openLane), pastEnd = (i === 0 && dx > 0) || (i === TAB_ORDER.length - 1 && dx < 0);
    touch.drag = dx;
    touch.shown = reducedMotion() ? 0 : touch.base + (pastEnd ? dx / 3 : dx);
    placeLanes(touch.shown);
  }, { passive: false });
  const lift = e => {
    const was = touch;
    touch = null;
    if (!was || was.way !== 'x') return;
    // The finger's speed over the last 100 ms of its moving, or none when it stopped for 100 ms before lifting
    const [t1, x1] = was.at[was.at.length - 1], [t0, x0] = was.at.find(([t]) => t1 - t <= 100);
    const speed = t1 > t0 && e.timeStamp - t1 <= 100 ? (x1 - x0) / (t1 - t0) : 0;
    const step = e.type === 'touchcancel' ? 0
      : Math.abs(speed) >= FLICK && Math.sign(speed) === Math.sign(was.drag) ? -Math.sign(speed)
        : Math.abs(was.drag) > lanesBox.clientWidth / 3 ? -Math.sign(was.drag) : 0;
    if (step) stepLane(step); else slideFrom(rowAt());
  };
  lanesBox.addEventListener('touchend', lift);
  lanesBox.addEventListener('touchcancel', lift);
  // A sideways scroll on a trackpad changes lane once it has gone 40 px, and once only: its glide after the fingers lift
  // keeps it going the same way, slowing down. 0514: the next scroll changes lane again, with or without a pause, as the
  // next swipe's fingers stop the glide: one after a pause of 150 ms, one the other way (40 px of it, as a glide never
  // turns back) and one the same way that speeds up again once the glide has slowed steadily, five steps in a row none
  // faster than the one before, to a quarter of its fastest, so fingers that slow a little and speed up again within one
  // swipe don't change lane twice. `way` is the way the last change went (0 before one), `sum` how far it has gone
  // towards the next, `top`, `last` and `low` the glide's fastest step, its last and, once it has slowed, its slowest,
  // `run` how many steps in a row have been no faster than the one before, and `push` how far a scroll that has sped up
  // again has gone.
  let wheel = { way: 0, sum: 0, at: -Infinity };
  const wheelStep = (way, a) => { wheel = { way, sum: 0, top: a, last: a, run: 0, low: 0, push: 0, at: wheel.at }; stepLane(way); };
  lanesBox.addEventListener('wheel', e => {
    if (e.ctrlKey || Math.abs(e.deltaX) <= Math.abs(e.deltaY) || scrollsSideways(e.target)) return;
    if (e.cancelable) e.preventDefault();
    const w = e.timeStamp - wheel.at >= 150 ? (wheel = { way: 0, sum: 0 }) : wheel, dx = e.deltaX, a = Math.abs(dx);
    w.at = e.timeStamp;
    if (Math.sign(dx) !== w.way) {
      w.sum += dx;
      if (Math.abs(w.sum) >= 40) wheelStep(Math.sign(w.sum), a);
      return;
    }
    w.sum = 0;
    if (!w.low) {
      w.run = a <= w.last ? w.run + 1 : 0;
      w.top = Math.max(w.top, a);
      w.last = a;
      if (w.run >= 5 && a <= w.top / 4) w.low = a;
      return;
    }
    w.low = Math.min(w.low, a);
    w.push = a >= 2 * w.low + 4 ? w.push + a : 0;
    if (w.push >= 40) wheelStep(w.way, a);
  }, { passive: false });
}
// The left and right arrow keys, pressed anywhere but in a text field or on a tab (which has its own), with nothing
// over the lanes, change lane. The page's own key handler sends them here.
const TYPED = /^(INPUT|TEXTAREA|SELECT)$/i;
function laneKey(e) {
  const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
  if (!step || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || pageHeld() || priorityMenu !== null) return;
  const n = e.target;
  if (n && (TYPED.test(n.tagName || '') || n.isContentEditable || (n.getAttribute && n.getAttribute('role') === 'tab'))) return;
  if (e.preventDefault) e.preventDefault();
  stepLane(step);
}
drawTabs();
