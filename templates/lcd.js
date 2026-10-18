// speck on a dot-matrix LCD: one renderer for the landing page and the speck panel.
//
// Everything is drawn in speck's own units, the panel badge's (the body is a ring of radius 20, centred 24 above the
// feet), and rasterised onto a grid of dots on every frame. Strokes snap to the grid, so a line keeps its weight as it
// moves: two dots wide on the big screens, one in the panel. Dots switch on at once and clear in about a frame, so
// moving parts stay sharp. A change of state blends the two poses over 0.7 seconds with a small hop and a blink; props
// dissolve in and out through a dither.
(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const seg = (p, a, b) => clamp01((p - a) / (b - a));
  const lerp = (a, b, k) => a + (b - a) * k;
  const io = k => (k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const sine = k => -(Math.cos(Math.PI * k) - 1) / 2;
  const out = k => 1 - Math.pow(1 - k, 3);
  const back = k => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
  const hop = (k, n, h) => { const q = (k * n) % 1, s = Math.sin(q * Math.PI); return { y: -s * h, tuck: s }; };
  const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const win = (p, a, b, f = .2) => { if (p < a || p > b) return 0; const k = (p - a) / (b - a); return Math.min(1, k / f, (1 - k) / f); };
  const blinkAt = (t, phase = 0) => ((t + phase * 1000) % 3700) < 120;
  const pt = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) });
  const quad = (a, c, b, n = 4) => Array.from({ length: n }, (_, i) => { const t = (i + 1) / n, u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; });
  const RM = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Fonts, drawn by hand: 5 × 7 for the big screens, 3 × 5 for the panel's tiles ----
  const font = (w, h, src) => { const g = {}; for (const k of Object.keys(src)) g[k] = src[k].split('|'); return { w, h, g }; };
  const F5 = font(5, 7, {
    A: '.###.|#...#|#...#|#####|#...#|#...#|#...#', B: '####.|#...#|#...#|####.|#...#|#...#|####.', C: '.###.|#...#|#....|#....|#....|#...#|.###.',
    D: '####.|#...#|#...#|#...#|#...#|#...#|####.', E: '#####|#....|#....|####.|#....|#....|#####', F: '#####|#....|#....|####.|#....|#....|#....',
    G: '.###.|#...#|#....|#.###|#...#|#...#|.####', H: '#...#|#...#|#...#|#####|#...#|#...#|#...#', I: '.###.|..#..|..#..|..#..|..#..|..#..|.###.',
    J: '..###|...#.|...#.|...#.|...#.|#..#.|.##..', K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#', L: '#....|#....|#....|#....|#....|#....|#####',
    M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#', N: '#...#|#...#|##..#|#.#.#|#..##|#...#|#...#', O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
    P: '####.|#...#|#...#|####.|#....|#....|#....', Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#', R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
    S: '.####|#....|#....|.###.|....#|....#|####.', T: '#####|..#..|..#..|..#..|..#..|..#..|..#..', U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
    V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..', W: '#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.', X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
    Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..', Z: '#####|....#|...#.|..#..|.#...|#....|#####',
    0: '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.', 1: '..#..|.##..|..#..|..#..|..#..|..#..|.###.', 2: '.###.|#...#|....#|...#.|..#..|.#...|#####',
    3: '#####|...#.|..#..|...#.|....#|#...#|.###.', 4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', 5: '#####|#....|####.|....#|....#|#...#|.###.',
    6: '..##.|.#...|#....|####.|#...#|#...#|.###.', 7: '#####|....#|...#.|..#..|.#...|.#...|.#...', 8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
    9: '.###.|#...#|#...#|.####|....#|...#.|.##..',
    '.': '.....|.....|.....|.....|.....|.##..|.##..', ',': '.....|.....|.....|.....|.##..|..#..|.#...', "'": '.##..|..#..|.#...|.....|.....|.....|.....',
    '-': '.....|.....|.....|.###.|.....|.....|.....', ':': '.....|.##..|.##..|.....|.##..|.##..|.....', '!': '..#..|..#..|..#..|..#..|..#..|.....|..#..',
    '?': '.###.|#...#|....#|...#.|..#..|.....|..#..', '/': '.....|....#|...#.|..#..|.#...|#....|.....', '+': '.....|..#..|..#..|#####|..#..|..#..|.....',
    '%': '##...|##..#|...#.|..#..|.#...|#..##|...##', '&': '.##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#', '(': '...#.|..#..|.#...|.#...|.#...|..#..|...#.',
    ')': '.#...|..#..|...#.|...#.|...#.|..#..|.#...', '°': '.##..|#..#.|#..#.|.##..|.....|.....|.....', '×': '.....|#...#|.#.#.|..#..|.#.#.|#...#|.....',
    '{': '..##.|.#...|.#...|#....|.#...|.#...|..##.', '}': '.##..|...#.|...#.|....#|...#.|...#.|.##..', '<': '...#.|..#..|.#...|#....|.#...|..#..|...#.',
    '>': '.#...|..#..|...#.|....#|...#.|..#..|.#...', ';': '.....|.##..|.##..|.....|.##..|..#..|.#...', '=': '.....|.....|#####|.....|#####|.....|.....',
    '[': '.###.|.#...|.#...|.#...|.#...|.#...|.###.', ']': '.###.|...#.|...#.|...#.|...#.|...#.|.###.', '*': '.....|..#..|#.#.#|.###.|#.#.#|..#..|.....',
  });
  const F3 = font(3, 5, {
    '{': '.##|.#.|#..|.#.|.##', '}': '##.|.#.|..#|.#.|##.', '<': '..#|.#.|#..|.#.|..#', '>': '#..|.#.|..#|.#.|#..', ';': '...|.#.|...|.#.|#..',
    '/': '..#|..#|.#.|#..|#..', '=': '...|###|...|###|...', '(': '.#.|#..|#..|#..|.#.', ')': '.#.|..#|..#|..#|.#.', '[': '##.|#..|#..|#..|##.',
    ']': '.##|..#|..#|..#|.##', '*': '...|#.#|.#.|#.#|...', '?': '##.|..#|.#.|...|.#.', Z: '###|..#|.#.|#..|###', '!': '.#.|.#.|.#.|...|.#.', '+': '...|.#.|###|.#.|...',
  });
  const glyphOf = (f, ch) => f.g[ch] || f.g[ch.toUpperCase()] || (ch === '’' || ch === '‘' ? f.g["'"] : ch === '—' || ch === '–' ? f.g['-'] : null);

  // What a dot shows: nothing, faint ink, ink, or the speck's vermilion.
  const OFF = 0, FAINT = 1, INK = 2, RED = 3;
  // A 4 × 4 ordered dither, for anything that fades: a dot is drawn only where its threshold is below the alpha.
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
  // A stroke's middle sits on a dot's middle when it's an odd number of dots wide, and between dots when it's even.
  const snapTo = (x, w) => (w % 2 ? Math.floor(x) + .5 : Math.round(x));
  const inStroke = (d, w) => (w % 2 ? d <= w / 2 + 1e-6 : d < w / 2 - 1e-6);

  // ---- The pen: a canvas-like transform over the dot grid ----
  class Pen {
    constructor(buf, k = 1, ox = 0, oy = 0) { this.b = buf; this.m = [k, 0, 0, k, ox, oy]; this.st = []; this.alpha = 1; this.lw = 2.2; this.tone = INK; this.clip = null; }
    save() { this.st.push([this.m.slice(), this.alpha, this.lw, this.tone, this.clip]); return this; }
    restore() { [this.m, this.alpha, this.lw, this.tone, this.clip] = this.st.pop(); return this; }
    translate(x, y) { const m = this.m; m[4] += m[0] * x + m[2] * y; m[5] += m[1] * x + m[3] * y; return this; }
    rotate(a) { if (!a) return this; const c = Math.cos(a), s = Math.sin(a), m = this.m, [a0, b0, c0, d0] = m; m[0] = a0 * c + c0 * s; m[1] = b0 * c + d0 * s; m[2] = c0 * c - a0 * s; m[3] = d0 * c - b0 * s; return this; }
    scale(x, y = x) { const m = this.m; m[0] *= x; m[1] *= x; m[2] *= y; m[3] *= y; return this; }
    pt(x, y) { const m = this.m; return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; }
    get k() { const m = this.m; return Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])); }
    get kx() { return Math.hypot(this.m[0], this.m[1]); }
    get ky() { return Math.hypot(this.m[2], this.m[3]); }
    get rot() { return Math.atan2(this.m[1], this.m[0]); }
    w() { return Math.max(1, Math.round(this.lw * this.k)); }
    put(i, j, v = this.tone) {
      const b = this.b;
      if (i < 0 || j < 0 || i >= b.c || j >= b.r) return;
      const c = this.clip; if (c && (i < c[0] || j < c[1] || i >= c[2] || j >= c[3])) return;
      if (this.alpha < 1 && BAYER[(j & 3) * 4 + (i & 3)] >= this.alpha) return;
      b.v[j * b.c + i] = v;
    }
    // In dot coordinates, ignoring the transform.
    dots(i0, j0, w, h, v = this.tone) { for (let j = j0; j < j0 + h; j++) for (let i = i0; i < i0 + w; i++) this.put(i, j, v); }
    bitmap(rows, i0, j0, v = this.tone) { rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') this.put(i0 + i, j0 + j, v); }); }
    dotAt(x, y, v = this.tone) { const [i, j] = this.pt(x, y); this.put(Math.floor(i), Math.floor(j), v); }
    line(x1, y1, x2, y2, v = this.tone) {
      const w = this.w(), h = w / 2;
      let [ax, ay] = this.pt(x1, y1), [bx, by] = this.pt(x2, y2);
      ax = snapTo(ax, w); ay = snapTo(ay, w); bx = snapTo(bx, w); by = snapTo(by, w);
      const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
      for (let j = Math.floor(Math.min(ay, by) - h - 1); j <= Math.ceil(Math.max(ay, by) + h); j++) {
        for (let i = Math.floor(Math.min(ax, bx) - h - 1); i <= Math.ceil(Math.max(ax, bx) + h); i++) {
          const px = i + .5, py = j + .5, u = L2 ? clamp01(((px - ax) * dx + (py - ay) * dy) / L2) : 0;
          if (inStroke(Math.hypot(px - (ax + u * dx), py - (ay + u * dy)), w)) this.put(i, j, v);
        }
      }
    }
    poly(pts, v = this.tone, closed = true) { for (let n = 0; n < pts.length - (closed ? 0 : 1); n++) { const a = pts[n], b = pts[(n + 1) % pts.length]; this.line(a[0], a[1], b[0], b[1], v); } }
    fillPoly(pts, v = this.tone) {
      const q = pts.map(p => this.pt(p[0], p[1]));
      const xs = q.map(p => p[0]), ys = q.map(p => p[1]);
      for (let j = Math.floor(Math.min(...ys)); j <= Math.ceil(Math.max(...ys)); j++) {
        for (let i = Math.floor(Math.min(...xs)); i <= Math.ceil(Math.max(...xs)); i++) {
          const px = i + .5, py = j + .5;
          let inside = false;
          for (let a = 0, b = q.length - 1; a < q.length; b = a++) {
            if ((q[a][1] > py) !== (q[b][1] > py) && px < (q[b][0] - q[a][0]) * (py - q[a][1]) / (q[b][1] - q[a][1]) + q[a][0]) inside = !inside;
          }
          if (inside) this.put(i, j, v);
        }
      }
    }
    // A filled disc or ellipse; its middle snaps like a stroke `par` dots wide (odd by default, so it has a middle dot).
    disc(x, y, r, v = this.tone, ry = r, par = 1) {
      let [cx, cy] = this.pt(x, y); cx = snapTo(cx, par); cy = snapTo(cy, par);
      const R = Math.max(.5, r * this.kx), Ry = Math.max(.5, ry * this.ky);
      for (let j = Math.floor(cy - Ry - 1); j <= Math.ceil(cy + Ry); j++) for (let i = Math.floor(cx - R - 1); i <= Math.ceil(cx + R); i++) {
        const px = (i + .5 - cx) / R, py = (j + .5 - cy) / Ry;
        if (px * px + py * py <= 1 + 1e-6) this.put(i, j, v);
      }
    }
    // A ring, or an arc from a0 to a1 (radians, clockwise on screen) with round ends.
    ring(x, y, r, a0 = 0, a1 = a0 + TAU, v = this.tone, ry = r) {
      const w = this.w(), h = w / 2;
      let [cx, cy] = this.pt(x, y); cx = snapTo(cx, w); cy = snapTo(cy, w);
      const R = r * this.kx, Ry = ry * this.ky, Rm = (R + Ry) / 2, rot = this.rot, span = a1 - a0, full = span >= TAU - 1e-4, s0 = a0 + rot;
      const e0 = [cx + R * Math.cos(s0), cy + Ry * Math.sin(s0)], e1 = [cx + R * Math.cos(a1 + rot), cy + Ry * Math.sin(a1 + rot)];
      for (let j = Math.floor(cy - Ry - h - 1); j <= Math.ceil(cy + Ry + h); j++) for (let i = Math.floor(cx - R - h - 1); i <= Math.ceil(cx + R + h); i++) {
        const px = i + .5 - cx, py = j + .5 - cy, q = Math.hypot(px / R, py / Ry);
        let d = Math.abs(q - 1) * Rm;
        if (!full) {
          const u = ((Math.atan2(py / Ry, px / R) - s0) % TAU + TAU) % TAU;
          if (u > span) d = Math.min(Math.hypot(i + .5 - e0[0], j + .5 - e0[1]), Math.hypot(i + .5 - e1[0], j + .5 - e1[1]));
        }
        if (inStroke(d, w)) this.put(i, j, v);
      }
    }
    // The speck: a disc, with the dots above a straight lid left out. `lid` is how far down the lid sits (0 = none).
    eyeDisc(x, y, r, ry, lid = 0, slant = 0, v = RED) {
      let [cx, cy] = this.pt(x, y); cx = snapTo(cx, 1); cy = snapTo(cy, 1);
      const R = Math.max(.5, r * this.kx), Ry = Math.max(.5, ry * this.ky), top = cy - Ry + 2 * Ry * lid;
      for (let j = Math.floor(cy - Ry - 1); j <= Math.ceil(cy + Ry); j++) for (let i = Math.floor(cx - R - 1); i <= Math.ceil(cx + R); i++) {
        const px = i + .5 - cx, py = j + .5 - cy;
        if ((px / R) ** 2 + (py / Ry) ** 2 > 1 + 1e-6) continue;
        if (lid && j + .5 < top + slant * px) continue;
        this.put(i, j, v);
      }
    }
    textBox(str, x, y, o = {}) {
      const f = o.font || (this.k < .62 ? F3 : F5), sc = o.scale || 1, adv = (f.w + 1) * sc, W = str.length * adv - sc, H = f.h * sc;
      const [ax, ay] = this.pt(x, y);
      const left = Math.round(o.align === 'left' ? ax : o.align === 'right' ? ax - W : ax - W / 2);
      const top = Math.round(o.valign === 'top' ? ay : o.valign === 'bottom' ? ay - H : ay - H / 2);
      return { f, sc, adv, W, H, left, top };
    }
    textAt(str, b, v = this.tone) {
      for (let n = 0; n < str.length; n++) {
        const rows = glyphOf(b.f, str[n]); if (!rows) continue;
        for (let r = 0; r < b.f.h; r++) for (let c = 0; c < b.f.w; c++) if (rows[r][c] === '#') {
          for (let a = 0; a < b.sc; a++) for (let e = 0; e < b.sc; e++) this.put(b.left + n * b.adv + c * b.sc + a, b.top + r * b.sc + e, v);
        }
      }
      return b;
    }
    text(str, x, y, o = {}) { return this.textAt(str, this.textBox(str, x, y, o), o.v ?? this.tone); }
    // Corner brackets round a box, in dot coordinates: how a screen this small marks what's selected.
    brackets(l, t, w, h, v = this.tone) {
      const r = l + w - 1, b = t + h - 1;
      for (const [x, y, dx, dy] of [[l, t, 1, 1], [r, t, -1, 1], [l, b, 1, -1], [r, b, -1, -1]]) { this.put(x, y, v); this.put(x + dx, y, v); this.put(x, y + dy, v); }
    }
  }

  // ---- The characters ----
  // How far down the lid sits for each of the eye's looks, and its slant.
  const LIDS = { flat: { y: .5 }, sheepish: { y: .4, slant: -.18 }, skeptic: { y: .28, slant: .4 } };
  function limb(pen, a) { const p = a.pts || [a.s, a.h]; for (let n = 0; n < p.length - 1; n++) pen.line(p[n].x, p[n].y, p[n + 1].x, p[n + 1].y); }
  function eye(pen, x, y, kind, open) {
    if (kind === 'closed') { pen.save(); pen.lw = 2.2; pen.line(x - 5, y + 1, x + 5, y + 1, RED); pen.restore(); return; }
    if (kind === 'bliss') { pen.save(); pen.lw = 2.2; pen.ring(x, y + 3, 5, Math.PI + .3, TAU - .3, RED); pen.restore(); return; }
    const r = kind === 'wide' ? 5.5 : kind === 'focus' ? 3.6 : 4.5, L = LIDS[kind];
    pen.eyeDisc(x, y, r, r * open, L ? L.y : 0, L ? L.slant || 0 : 0);
  }
  // The builder, as on the panel: an ensō-shaped round body open at the top left, two round ears, two short legs and the
  // speck as its eye, with short straight arms when a pose gives it them.
  function builder(pen, P) {
    pen.save(); pen.translate(P.x || 0, P.y || 0); pen.rotate(P.rot || 0); pen.scale(1, P.sy || 1);
    pen.lw = 2.2; pen.tone = INK;
    const tk = P.tuck || 0, par = pen.w();
    for (const a of P.backArms || []) limb(pen, a);
    pen.line(-7, -5, -9 + tk * 2, -tk * 3); pen.line(7, -5, 9 - tk * 2, -tk * 3);
    for (const sx of [-1, 1]) { const ey = -40 + (P.droop || 0) - (sx === 1 ? P.ear || 0 : 0); pen.disc(sx * 12, ey, 5.5, OFF, 5.5, par); pen.ring(sx * 12, ey, 5.5); }
    pen.disc(0, -24, 20, OFF, 20, par);
    // The opening stays at least 2.6 dots long, so it still shows on the smallest screen. It closes to celebrate.
    const gap = Math.max(.35, 2.6 / (20 * pen.k)) * (1 - clamp01(P.close || 0));
    pen.ring(0, -24, 20, -2.0, -2.0 + TAU - gap);
    for (const a of P.arms || []) limb(pen, a);
    const fa = P.flag != null ? clamp01(P.flagA ?? 1) : 0;
    if (fa > .01) {
      pen.save(); pen.alpha *= fa; pen.translate(17, -34); pen.rotate(P.flag); pen.line(0, 0, 0, -26);
      const wv = P.flagWave || 0;
      pen.fillPoly([[0, -27], [6, -26 + wv * .5], [11, -24 + wv * .4], [16.5, -21], [0, -15.5]], INK); pen.restore();
    }
    eye(pen, (P.lookX || 0) * 8, -26 + (P.lookY || 0) * 6, P.eye || 'open', (blinkAt(P.t) ? .15 : 1) * (P.lid ?? 1));
    const qa = P.q ? clamp01(P.qA ?? 1) : 0;
    if (qa > .01) { pen.save(); pen.alpha *= qa; pen.text('?', P.q.x, P.q.y - 8, { scale: pen.k >= .9 ? 2 : 1 }); pen.restore(); }
    pen.restore();
  }
  // The reviewer, taller and squarer than the builder, with two small eyes and a mouth. (0, 0) is between its feet.
  const REVIEWER = [[-15, -4], [-16, -50], ...quad([-16, -50], [-15, -58], [-6, -58]), [8, -57], ...quad([8, -57], [16, -56], [15, -48]), [14, -4]];
  function reviewer(pen, R) {
    pen.save(); pen.translate(R.x, R.y || 0); pen.rotate(R.rot || 0); pen.scale(1, R.sy || 1); pen.lw = 2.2; pen.tone = INK;
    pen.line(-7, -4, -8, 0); pen.line(7, -4, 8, 0);
    pen.fillPoly(REVIEWER, OFF); pen.poly(REVIEWER, INK);
    const dx = (R.lookX || 0) * 4, dy = (R.lookY || 0) * 4, b = blinkAt(R.t || 0, 1.9) ? .15 : 1;
    for (const x of [-5, 5]) pen.eyeDisc(x + dx, -40 + dy, 2.4, 2.4 * b, 0, 0, INK);
    if ((R.talk || 0) > .35) pen.disc(dx, -30, 4, INK, 1 + R.talk * 2.4);
    else if (R.mouth) pen.ring(dx, -35, 6, .55, Math.PI - .55);
    else pen.line(-6 + dx, -30, 6 + dx, -30);
    pen.restore();
  }
  // One character of code hanging in the air, its baseline's middle at (x, y): faint, solid, or inverted once it's
  // been checked, with brackets while it's being discussed.
  function glyph(pen, x, y, ch, o = {}) {
    const b = pen.textBox(ch, x, y - 4, {});
    if (o.inv) { pen.dots(b.left - 1, b.top - 1, b.W + 2, b.H + 2, INK); pen.textAt(ch, b, OFF); return; }
    pen.textAt(ch, b, o.solid ? INK : FAINT);
    if (o.ring) pen.brackets(b.left - 2, b.top - 2, b.W + 4, b.H + 4, INK);
  }
  function tick(pen, x, y, k, a = 1) {
    if (k <= 0 || a <= 0) return;
    pen.save(); pen.alpha *= a; pen.lw = 2.6;
    const P = [[x - 6, y], [x - 2, y + 4], [x + 7, y - 6]], L1 = Math.hypot(4, 4), L2 = Math.hypot(9, 10);
    let left = k * (L1 + L2);
    for (let n = 0; n < 2 && left > 0; n++) { const a0 = P[n], b0 = P[n + 1], L = n ? L2 : L1, f = Math.min(1, left / L); pen.line(a0[0], a0[1], lerp(a0[0], b0[0], f), lerp(a0[1], b0[1], f)); left -= L; }
    pen.restore();
  }
  // A finished block of work.
  function box(pen, cx, by, o) {
    const s = o.s * 16; if (s <= .5 || o.a <= 0) return;
    pen.save(); pen.alpha *= o.a; pen.translate(cx, by - s / 2); pen.rotate(o.rot || 0); pen.lw = 1.7;
    const q = [[-s / 2, -s / 2], [s / 2, -s / 2], [s / 2, s / 2], [-s / 2, s / 2]];
    pen.fillPoly(q, OFF); pen.poly(q, INK); pen.restore();
  }

  // ---- The panel's seven poses, as the builder badge shows them, with the panel's own timings ----
  const GL = '{}<>;/=()[]*';
  const PANEL = {
    // At the laptop, from behind its lid: paws slapping the lid's top edge with bits of code flying off both sides, a
    // pause with its eye up and away, both paws up, one slam, and a finished block pops out.
    type(t) {
      const CY = 2800, p = (t % CY) / CY, P = { t, lookX: 0, lookY: .3 };
      let lh = -17, rh = -17;
      if (p < .62) {
        const k = t / 105, a = Math.max(0, Math.sin(k * Math.PI)), b = Math.max(0, Math.sin(k * Math.PI + Math.PI));
        lh = -16 - a * 9; rh = -16 - b * 9; P.sy = 1 + .02 * Math.abs(Math.sin(k * Math.PI)); P.lookX = .25 * Math.sin(t / 420);
      } else if (p < .76) {
        const k = sine(seg(p, .62, .70)); P.lookX = lerp(0, -.6, k); P.lookY = lerp(.3, -.7, k); P.rot = -.04 * sine(seg(p, .62, .76));
      } else if (p < .84) {
        const k = io(seg(p, .76, .84)); lh = rh = -17 - 21 * k; P.lookY = lerp(-.7, .3, k); P.lookX = lerp(-.6, 0, k); P.sy = 1 + .05 * k;
      } else if (p < .87) {
        const k = out(seg(p, .84, .87)); lh = rh = lerp(-38, -13, k); P.sy = lerp(1.05, .9, k); P.lookY = .6;
      } else { const k = sine(seg(p, .87, 1)); lh = rh = lerp(-13, -17, k); P.sy = lerp(.9, 1, k); P.lookY = .4; }
      return { B: P, props: [
        { key: 'laptop', draw(pen) {
          pen.lw = 2;
          for (const [x, y] of [[-10, lh], [10, rh]]) { pen.disc(x, y - 1, 5, OFF, 4.2); pen.ring(x, y - 1, 5, 0, TAU, INK, 4.2); }
          pen.lw = 2.2; const lid = [[-24, -16], [24, -16], [24, 0], [-24, 0]]; pen.fillPoly(lid, OFF); pen.poly(lid, INK);
          pen.lw = 1.4; pen.ring(0, -8, 3.4, -2.0, -2.35 + TAU);
        } },
        { key: 'code', draw(pen) {
          const step = 120, life = 650;
          for (let i = Math.floor((t - life) / step) + 1; i <= Math.floor(t / step); i++) {
            const te = i * step, pe = (te % CY) / CY, k = (t - te) / life;
            if (i < 0 || pe >= .6 || k < 0 || k > 1) continue;
            const side = i % 2 ? 1 : -1, x = side * (27 + rnd(i + 3) * 9) + side * k * 4;
            pen.save(); pen.alpha *= 1 - k; glyph(pen, x, -18 - k * 26, GL[Math.floor(rnd(i) * GL.length)], { solid: true }); pen.restore();
          }
        } },
        { key: 'block', draw(pen) { if (p >= .86) { const k = seg(p, .86, 1), e = out(k); box(pen, lerp(4, 24, e), lerp(-16, -52, e), { s: Math.min(1, back(seg(k, 0, .4))) * .8, rot: .4 * e, a: 1 - seg(k, .7, 1) }); } } },
      ] };
    },
    // Self-check: seven characters of code hang in a loose ring around it. Its eye moves to one every 0.64 seconds, the
    // body turning a beat later, and each one it looks at turns inverted for a moment. Every seventh glance, a hop and a tick.
    check(t) {
      const N = 7, G = 640, n = Math.floor(t / G), k = (t % G) / G;
      const pos = i => {
        const ang = -Math.PI + (i + .5) / N * Math.PI + (rnd(i + 40) - .5) * .2, R = 34 + rnd(i + 50) * 6;
        return { x: Math.cos(ang) * R + Math.sin(t / 1400 + i) * 1.6, y: -28 + Math.sin(ang) * R * .95 + Math.cos(t / 1100 + i * 1.7) * 1.6 };
      };
      const pick = j => Math.floor(rnd(j) * N);
      const dir = i => { const q = pos(i), dx = q.x, dy = q.y + 26, d = Math.hypot(dx, dy) || 1; return { x: dx / d, y: dy / d }; };
      const from = dir(pick(n - 1)), to = dir(pick(n)), m = io(seg(k, 0, .3)), body = io(seg(k, .08, .55));
      const P = { t, x: lerp(from.x, to.x, body) * 2.5, lookX: lerp(from.x, to.x, m), lookY: lerp(from.y, to.y, m) };
      P.rot = lerp(from.x, to.x, body) * .09; P.sy = 1 - .03 * Math.sin(seg(k, 0, .3) * Math.PI);
      if (rnd(n + 7) > .7) P.ear = 2.5 * Math.sin(seg(k, .3, .6) * Math.PI);
      const hopping = n % 7 === 6;
      if (hopping) { const h = hop(k, 1, 7); P.y = h.y; P.tuck = h.tuck; P.lookX = 0; P.lookY = -.3; }
      return { B: P, props: [
        { key: 'cloud', draw(pen) {
          for (let i = 0; i < N; i++) {
            let glow = 0;
            for (let j = n; j > n - 4 && j >= 0; j--) if (pick(j) === i) { const since = t - (j * G + G * .3); if (since >= 0) glow = Math.max(glow, 1 - since / 1500); }
            const q = pos(i);
            glyph(pen, q.x, q.y, GL[Math.floor(rnd(i + 60) * GL.length)], { inv: glow > .35, solid: glow > .02 });
          }
        } },
        { key: 'tick', draw(pen) { if (hopping) tick(pen, 0, -76, out(seg(k, 0, .5)), 1 - seg(k, .8, 1)); } },
      ] };
    },
    // Review, a loop of 6.2 seconds: the reviewer slides in, and a small page of code, three lines long, hangs above the
    // builder. Three times, the reviewer looks at a line and talks while that line blinks; then the builder looks at it,
    // answers with a bounce and an ear flick, and rewrites it, a cursor running along as it goes. Then the page turns
    // inverted, approved, the reviewer smiles, the builder hops, and the reviewer slides out. One thing moves at a time,
    // so it reads on 28 × 28 dots.
    review(t) {
      const CY = 6200, p = (t % CY) / CY, cycle = Math.floor(t / CY);
      const rx = p < .07 ? lerp(74, 26, out(seg(p, 0, .07))) : p < .93 ? 26 : lerp(26, 74, io(seg(p, .93, 1)));
      // The page is laid out on the badge's own dots (one dot is 3.125 units): three lines on rows 2, 4 and 6, starting
      // at column 6, with no outline, so three clear rows separate it from the builder's ears. Approved, it becomes a
      // solid block over columns 5 to 13 and rows 1 to 7, the lines cut out of it.
      const D = 3.125, cx = c => (c + .5 - 14) * D, cy = r => (r + .5 - 26) * D;
      const before = [0, 1, 2].map(i => 3 + Math.floor(rnd(cycle * 5 + i) * 5)), after = [0, 1, 2].map(i => 3 + Math.floor(rnd(cycle * 5 + i + 3) * 5));
      const turns = [['R', .09, .22, 0], ['B', .24, .36, 0], ['R', .38, .47, 1], ['B', .49, .61, 1], ['R', .63, .71, 2], ['B', .73, .79, 2]];
      const B = { t, x: -16, lookX: .15, lookY: -.95 }, R = { t, x: rx, lookX: -.7, lookY: -.5, rot: -.05 };
      const aim = (who, e) => { const dx = cx(6 + (before[e] - 1) / 2) - who.x, dy = cy(2 + 2 * e) - (who === B ? -26 : -40), d = Math.hypot(dx, dy) || 1; who.lookX = dx / d; who.lookY = dy / d; };
      for (const [who, a, b, e] of turns) {
        const w = win(p, a, b, .18);
        if (w <= 0) continue;
        const bounce = Math.abs(Math.sin(seg(p, a, b) * Math.PI * 5)) * w;
        aim(B, e); aim(R, e);
        if (who === 'R') { R.sy = 1 + .04 * bounce; R.rot = -.05 - .1 * w; R.talk = bounce; }
        else { B.sy = 1 + .06 * bounce; B.rot = .08 * w; B.ear = 2.5 * bounce; }
      }
      // Each line blinks from the reviewer's turn on it until the builder's; in the builder's turn it's wiped and retyped.
      const lines = [0, 1, 2].map(e => {
        const ra = turns[e * 2][1], ba = turns[e * 2 + 1][1], bb = turns[e * 2 + 1][2];
        if (p < ba) return { len: before[e], blink: p >= ra };
        if (p < bb) { const k = seg(p, ba, bb); return k < .35 ? { len: Math.round(before[e] * (1 - k / .35)) } : { len: Math.round(after[e] * (k - .35) / .65), cursor: true }; }
        return { len: after[e] };
      });
      const approved = p > .81;
      if (p > .81 && p < .93) { const k = seg(p, .81, .93); R.mouth = 1; R.rot = -.05 - .1 * Math.abs(Math.sin(k * Math.PI * 2)); R.lookX = -1; R.lookY = .2; const h = hop(seg(p, .83, .91), 1, 7); B.y = h.y; B.tuck = h.tuck; B.lookX = .8; B.lookY = -.2; }
      return { B, R, props: [{ key: 'page', draw(pen) {
        pen.lw = 1;
        if (approved) pen.fillPoly([[cx(5) - D * .4, cy(1) - D * .4], [cx(13) + D * .4, cy(1) - D * .4], [cx(13) + D * .4, cy(7) + D * .4], [cx(5) - D * .4, cy(7) + D * .4]], INK);
        const ink = approved ? OFF : INK;
        lines.forEach((l, e) => {
          const y = cy(2 + 2 * e);
          if (l.len > 0 && !(l.blink && Math.floor(t / 160) % 2)) pen.line(cx(6), y, cx(6 + l.len - 1), y, ink);
          if (l.cursor && Math.floor(t / 90) % 2 === 0) pen.dotAt(cx(6 + l.len), y, ink);
        });
      } }] };
    },
    // Shipping, a loop of 3.2 seconds: a finished block sits on a small paper boat on a line of water. The
    // builder puts both hands on the stern, leans back, shoves, and the boat slides off the screen. A new one pops up.
    ship(t) {
      const CY = 3200, p = (t % CY) / CY, P = { t, x: -18, lookX: .6, lookY: .5 };
      let bx = 18;
      if (p >= .42 && p < .5) bx = lerp(18, 24, io(seg(p, .42, .5)));
      else if (p >= .5) { const k = seg(p, .5, 1); bx = 24 + 40 * (.6 * k + .4 * (1 - (1 - k) * (1 - k))); }
      const bs = p < .12 ? Math.min(1.08, back(seg(p, 0, .12))) : 1;
      if (p >= .3 && p < .42) { const k = io(seg(p, .3, .42)); P.rot = -.05 * k; P.sy = 1 + .03 * k; P.lookX = .8; P.lookY = .4; }
      else if (p >= .42 && p < .5) { const k = out(seg(p, .42, .5)); P.rot = lerp(-.05, .1, k); P.x = lerp(-18, -15, k); P.sy = lerp(1.03, .96, k); P.lookX = 1; P.lookY = .3; }
      else if (p >= .5 && p < .62) { const k = sine(seg(p, .5, .62)); P.rot = lerp(.1, .03, k); P.x = lerp(-15, -16, k); P.sy = lerp(.96, 1, k); P.lookX = 1; P.lookY = lerp(.3, 0, k); }
      else if (p >= .62) { const k = sine(seg(p, .88, 1)); P.rot = .03 * (1 - k); P.x = lerp(-16, -18, k); P.lookX = lerp(1, .6, k); P.lookY = lerp(0, .5, k); }
      const local = w => { const dx = w.x - P.x, dy = w.y, r = -(P.rot || 0), c = Math.cos(r), s = Math.sin(r); return { x: dx * c - dy * s, y: (dx * s + dy * c) / (P.sy || 1) }; };
      const restF = { s: { x: 18, y: -16 }, h: { x: 21, y: -7 } }, restB = { s: { x: -18, y: -16 }, h: { x: -21, y: -7 } };
      const pushF = { x: 15, y: -11 }, pushB = { x: 11, y: -8 };
      const stern = x => [local({ x: x - 15, y: -9 }), local({ x: x - 12.5, y: -3 })];
      let F = restF, Bk = restB;
      if (p >= .14 && p < .5) { const k = sine(seg(p, .14, .28)), [hf, hb] = stern(bx); F = { s: pt(restF.s, pushF, k), h: pt(restF.h, hf, k) }; Bk = { s: pt(restB.s, pushB, k), h: pt(restB.h, hb, k) }; }
      else if (p >= .5 && p < .66) { const k = sine(seg(p, .5, .66)), [hf, hb] = stern(24); F = { s: pt(pushF, restF.s, k), h: pt(hf, restF.h, k) }; Bk = { s: pt(pushB, restB.s, k), h: pt(hb, restB.h, k) }; }
      P.arms = [F]; P.backArms = [Bk];
      return { B: P, props: [
        { key: 'water', layer: 'back', draw(pen) { pen.lw = 1.4; const q = []; for (let x = -4; x <= 34; x += 2) q.push([x, 2 + Math.sin(x / 4 + t / 240) * .6]); pen.poly(q, FAINT, false); } },
        { key: 'boat', draw(pen) {
          if (bs < .05) return;
          pen.translate(bx, 0); pen.scale(bs, bs); pen.lw = 1.8;
          const sail = [[-7, -4], [0, -23], [7, -4]], hull = [[-17, -11], [-9, -4], [9, -4], [17, -11], [11, 1], [-11, 1]];
          pen.fillPoly(sail, OFF); pen.poly(sail, INK); pen.fillPoly(hull, OFF); pen.poly(hull, INK);
          box(pen, 0, -4, { s: .8, rot: 0, a: 1 });
        } },
      ] };
    },
    // Waiting for you: facing front, waving a small flag that ripples a moment behind the wave, with a hop every few seconds.
    wait(t) {
      const hp = (t % 3800) / 3800, P = { t, x: -6, lookX: 0, lookY: .1, flag: -.18 + .32 * Math.sin(t / 280), flagWave: 3 * Math.sin(t / 280 - 1), rot: .025 * Math.sin(t / 560), sy: 1 + .015 * Math.sin(t / 520) };
      if (hp < .14) { const h = hop(seg(hp, 0, .14), 2, 6); P.y = h.y; P.tuck = h.tuck; }
      return { B: P, props: [] };
    },
    // Needs you: facing front with a "?" over its head, tilting; now and then it glances side to side.
    bad(t) {
      const p = (t % 4200) / 4200, look = p > .55 && p < .8 ? Math.sin(seg(p, .55, .8) * Math.PI * 2) * .8 : 0;
      return { B: { t, x: -4, lookX: look, lookY: .1, rot: .06 * Math.sin(t / 320), q: { x: 21, y: -52 - 2.5 * Math.sin(t / 230) } }, props: [] };
    },
    // Paused: still, facing front. It doesn't blink.
    still() { return { B: { t: 1000, lookX: 0, lookY: .1 }, props: [] }; },
    // The Auto-build button's builder, alone, hopping gently while builds run.
    hop(t) { const h = hop((t % 1400) / 1400, 1, 3); return { B: { t, lookX: 0, lookY: .1, y: h.y, tuck: h.tuck * .5 }, props: [] }; },
  };
  // The time each pose is drawn at when nothing moves.
  const STILL_AT = { type: 300, check: 300, review: 2600, ship: 1100, wait: 1000, bad: 1000, still: 1000, hop: 1000 };

  // ---- The landing page's ten states ----
  const glance = (t, period = 9000, amt = .55) => {
    const p = (t % period) / period;
    if (p < .3) return 0; if (p < .36) return lerp(0, -amt, sine(seg(p, .3, .36))); if (p < .6) return -amt;
    if (p < .66) return lerp(-amt, amt * .8, sine(seg(p, .6, .66))); if (p < .92) return amt * .8; return lerp(amt * .8, 0, sine(seg(p, .92, 1)));
  };
  const twitch = (t, period = 5300) => { const p = (t % period) / period; return p > .9 ? 2.5 * Math.sin(seg(p, .9, 1) * Math.PI) : 0; };
  // A point on the body's ring, for a shoulder: angle in radians, clockwise from the right.
  const rim = a => ({ x: 20 * Math.cos(a), y: -24 + 20 * Math.sin(a) });
  const PAWN = [[-4, 0], [4, 0], [3, -2], [1.5, -3], [2, -8], [-2, -8], [-1.5, -3], [-3, -2]];
  const STATES = {
    idle(t) { return { B: { t, lookX: glance(t), lookY: .1, sy: 1 + .02 * Math.sin(t / 650), ear: twitch(t) }, props: [] }; },
    // Tea: a mug on the floor beside it, steam rising. Every so often it closes its eye to savour it.
    eating(t) {
      const p = (t % 4600) / 4600, sip = win(p, .42, .86, .14);
      return { B: { t, x: -8, lookX: lerp(.75, .35, sip), lookY: lerp(.55, .05, sip), eye: sip > .5 ? 'bliss' : 'open', rot: .05 * sip, sy: 1 + .015 * Math.sin(t / 600) }, props: [{ key: 'mug', draw(pen) {
        const x = 24, body = [[x, -15], [x + 14, -15], [x + 14, -2], [x + 12, 0], [x + 2, 0], [x, -2]];
        pen.fillPoly(body, OFF); pen.poly(body, INK); pen.ring(x + 14, -8, 4.5, -Math.PI / 2, Math.PI / 2);
        pen.lw = 1.4;
        for (let i = 0; i < 3; i++) {
          const ph = (t / 2200 + i / 3) % 1, q = [];
          for (let y = 0; y <= 12; y += 2) q.push([x + 3.5 + i * 3.5 + Math.sin((y + ph * 14) / 3) * 1.4, -19 - y - ph * 6]);
          pen.save(); pen.alpha *= Math.sin(ph * Math.PI); pen.poly(q, FAINT, false); pen.restore();
        }
      } }] };
    },
    // Messy: crumbs about its feet, a smudge on its body, a fly. It looks down at the mess, a little embarrassed.
    messy(t) {
      return { B: { t, x: 4, lookX: -.5 + .25 * Math.sin(t / 1400), lookY: .65, eye: 'sheepish', rot: -.04, droop: 1.5 }, props: [
        { key: 'crumbs', layer: 'back', draw(pen) { for (const [x, r] of [[-40, 1.4], [-33, 1], [-27, 1.8], [31, 1.2], [38, 1.8], [45, 1]]) pen.disc(x, -r, r, INK); } },
        { key: 'smudge', draw(pen) { pen.fillPoly([[12, -16], [19, -18], [21, -13], [15, -9], [11, -11]], FAINT); } },
        { key: 'fly', draw(pen) {
          const fx = 32 + 10 * Math.sin(t / 700), fy = -54 + 5 * Math.sin(t / 330), up = Math.floor(t / 60) % 2;
          pen.disc(fx, fy, 1.2, INK); pen.lw = 1; pen.line(fx - 1, fy - 1, fx - 3, fy - (up ? 4 : 2)); pen.line(fx + 1, fy - 1, fx + 3, fy - (up ? 4 : 2));
        } },
      ] };
    },
    // Cleaning: sweeping with a broom held in both hands, dust kicked up behind it.
    cleaning(t) {
      const bx = 8, th = .62 + .26 * Math.sin(t / 240), top = { x: -10, y: -33 }, dir = { x: -Math.sin(th), y: Math.cos(th) };
      const at = d => ({ x: top.x + dir.x * d, y: top.y + dir.y * d }), perp = { x: dir.y, y: -dir.x }, loc = q => ({ x: q.x - bx, y: q.y });
      const s1 = rim(Math.PI + .5), s2 = rim(Math.PI - .25);
      return { B: { t, x: bx, lookX: -.7, lookY: .7, eye: 'focus', rot: -.02 + .02 * Math.sin(t / 240), arms: [{ s: s1, h: loc(at(4)) }, { s: s2, h: loc(at(12)) }] }, props: [
        { key: 'broom', layer: 'back', draw(pen) {
          const b = at(27), e = at(36);
          pen.line(top.x, top.y, b.x, b.y);
          pen.fillPoly([[b.x + perp.x * 2.5, b.y + perp.y * 2.5], [b.x - perp.x * 2.5, b.y - perp.y * 2.5], [e.x - perp.x * 7, e.y - perp.y * 7], [e.x + perp.x * 7, e.y + perp.y * 7]], INK);
        } },
        { key: 'dust', draw(pen) {
          const e = at(36);
          for (let i = 0; i < 6; i++) { const ph = (t / 900 + i / 6) % 1; pen.save(); pen.alpha *= 1 - ph; pen.disc(e.x - 5 - ph * 14 - i * 1.5, -2 - ph * 11 - rnd(i) * 4, .7, INK); pen.restore(); }
        } },
      ] };
    },
    // Playing: a pawn hops along three squares. It points out the move, and its eye follows the pawn.
    playing(t) {
      const CY = 2600, n = Math.floor(t / CY), k = (t % CY) / CY, sq = [-60, -50, -40], path = [0, 1, 2, 1];
      const ix = j => sq[path[((j % 4) + 4) % 4]] + 5, m = seg(k, 0, .24), px = lerp(ix(n - 1), ix(n), sine(m)), py = -Math.sin(m * Math.PI) * 8;
      return { B: { t, x: 12, lookX: -.9, lookY: .35 + py * .03, eye: 'wide', arms: [{ s: rim(Math.PI + .2), h: { x: -34, y: -32 } }] }, props: [{ key: 'pawn', layer: 'back', draw(pen) {
        pen.lw = 1.4;
        sq.forEach((x, i) => { const r = [[x, -4], [x + 10, -4], [x + 10, 0], [x, 0]]; if (i % 2) pen.fillPoly(r, INK); else pen.poly(r, INK); });
        pen.translate(px, -4 + py); pen.fillPoly(PAWN, INK); pen.disc(0, -10.5, 2.7, INK);
      } }] };
    },
    // Sleeping: eye closed, settled lower, ears down, and a Z drifting up that grows as it goes.
    sleeping(t) {
      return { B: { t, lookY: .35, eye: 'closed', sy: .965 + .015 * Math.sin(t / 900), droop: 2.5 }, props: [{ key: 'zz', draw(pen) {
        for (let i = 0; i < 3; i++) {
          const ph = (t / 3600 + i / 3) % 1;
          pen.save(); pen.alpha *= Math.min(1, ph * 5, (1 - ph) * 3); pen.text('Z', 18 + ph * 18 + Math.sin(ph * 6) * 2, -46 - ph * 20, { font: ph < .45 ? F3 : F5 }); pen.restore();
        }
      } }] };
    },
    // Grumpy: lid down, ears flat, a slow side-eye, and its own small raincloud.
    grumpy(t) {
      return { B: { t, x: -2, lookX: .75 + .1 * Math.sin(t / 1800), lookY: .05, eye: 'flat', droop: 3, rot: -.03 }, props: [{ key: 'cloud', draw(pen) {
        const cx = -2, cy = -58 + Math.sin(t / 900) * 1.2;
        pen.disc(cx - 8, cy + 1, 5, INK); pen.disc(cx + 1, cy - 2, 7, INK); pen.disc(cx + 9, cy + 1.5, 4.5, INK);
        pen.fillPoly([[cx - 13, cy + 1], [cx + 13.5, cy + 1], [cx + 13.5, cy + 6], [cx - 13, cy + 6]], INK);
        pen.lw = 1.4;
        for (let i = 0; i < 5; i++) { const x = cx - 10 + i * 5, ph = (t / 520 + rnd(i)) % 1, y = cy + 8 + ph * 6; pen.line(x, y, x - .8, y + 2.5, INK); }
      } }] };
    },
    // Building: the same pose as the panel's "writing code", at the laptop.
    building(t) { return PANEL.type(t); },
    // Celebrating: the ring closes, arms up, two hops at a time, sparks around it and confetti behind.
    celebrating(t) {
      const h = hop((t % 1500) / 1500, 2, 6);
      return { B: { t, y: h.y, tuck: h.tuck, close: 1, lookY: -.6, eye: 'wide', arms: [{ s: rim(-2.36), h: { x: -25, y: -55 + h.tuck * 3 } }, { s: rim(-.78), h: { x: 25, y: -55 + h.tuck * 3 } }] }, props: [
        { key: 'confetti', layer: 'back', draw(pen) { for (let i = 0; i < 14; i++) { const ph = (t / 2400 + rnd(i + 20)) % 1; pen.save(); pen.alpha *= 1 - seg(ph, .7, 1); pen.dotAt(-62 + rnd(i + 30) * 124 + Math.sin(ph * 8 + i) * 3, -66 + ph * 64, INK); pen.restore(); } } },
        { key: 'sparks', draw(pen) {
          pen.lw = 1.4;
          for (let i = 0; i < 9; i++) {
            const ang = -Math.PI + (i + .5) / 9 * Math.PI, R = 44 + rnd(i) * 12, x = Math.cos(ang) * R, y = -26 + Math.sin(ang) * R * .72, ph = (t / 1100 + rnd(i + 4)) % 1;
            if (ph > .6) continue; const r = 1 + 3 * Math.sin(ph / .6 * Math.PI);
            pen.line(x - r, y, x + r, y); pen.line(x, y - r, x, y + r);
          }
        } },
      ] };
    },
    // Confused: head tilted, one lid raised, a shrug, and a "?" that won't keep still.
    confused(t) {
      return { B: { t, rot: .1 + .03 * Math.sin(t / 700), lookX: .45 + glance(t + 2000, 5200, .5) * .6, lookY: -.45, eye: 'skeptic', arms: [{ pts: [rim(Math.PI - .2), { x: -28, y: -21 }, { x: -29, y: -29 }] }, { pts: [rim(.2), { x: 28, y: -21 }, { x: 29, y: -29 }] }] }, props: [
        { key: 'q', draw(pen) { pen.text('?', 28, -60 + Math.sin(t / 400) * 2, { font: F5, scale: pen.k >= .9 ? 2 : 1 }); } },
      ] };
    },
  };
  const STATE_AT = { idle: 1000, eating: 2600, messy: 1000, cleaning: 1000, playing: 1800, sleeping: 1400, grumpy: 1000, building: 300, celebrating: 380, confused: 1000 };

  // ---- Blending one pose into the next ----
  const NUM = { x: 0, y: 0, rot: 0, sy: 1, lookX: 0, lookY: 0, ear: 0, tuck: 0, close: 0, droop: 0 };
  const limbPts = a => (!a ? null : a.pts ? a.pts : [a.s, a.h]);
  function mixLimbs(A = [], B = [], k) {
    const res = [];
    for (let i = 0; i < Math.max(A.length, B.length); i++) {
      let a = limbPts(A[i]), b = limbPts(B[i]);
      if (!a && !b) continue;
      if (!a) a = b.map(() => b[0]); // an arm that's coming grows out of its shoulder
      if (!b) b = a.map(() => a[0]); // and one that's going folds back into it
      const pts = [];
      for (let j = 0; j < Math.max(a.length, b.length); j++) pts.push(pt(a[Math.min(j, a.length - 1)], b[Math.min(j, b.length - 1)], k));
      res.push({ pts });
    }
    return res;
  }
  function blend(A, B, k) {
    const a = A.B, b = B.B, P = { t: b.t };
    for (const n in NUM) P[n] = lerp(a[n] ?? NUM[n], b[n] ?? NUM[n], k);
    P.y -= Math.sin(k * Math.PI) * 3.5; // a small hop through the change
    P.eye = k < .5 ? a.eye : b.eye;
    P.lid = 1 - .9 * win(k, .36, .64, .5); // and a blink as it makes up its mind
    P.arms = mixLimbs(a.arms, b.arms, k); P.backArms = mixLimbs(a.backArms, b.backArms, k);
    if (a.flag != null || b.flag != null) { P.flag = lerp(a.flag ?? b.flag, b.flag ?? a.flag, k); P.flagWave = lerp(a.flagWave || 0, b.flagWave || 0, k); P.flagA = (a.flag != null ? 1 - k : 0) + (b.flag != null ? k : 0); }
    if (a.q || b.q) { const qa = a.q || b.q, qb = b.q || a.q; P.q = { x: lerp(qa.x, qb.x, k), y: lerp(qa.y, qb.y, k) }; P.qA = (a.q ? 1 - k : 0) + (b.q ? k : 0); }
    let R = null;
    if (A.R || B.R) { // the reviewer slides in or out
      const ra = A.R || { ...B.R, x: 84 }, rb = B.R || { ...A.R, x: 84 };
      R = { ...rb };
      for (const n of ['x', 'y', 'rot', 'lookX', 'lookY', 'talk']) R[n] = lerp(ra[n] || 0, rb[n] || 0, k);
      R.sy = lerp(ra.sy || 1, rb.sy || 1, k); R.mouth = k < .5 ? ra.mouth : rb.mouth;
    }
    const inA = new Set(A.props.map(p => p.key)), inB = new Set(B.props.map(p => p.key));
    const props = [...A.props.filter(p => !inB.has(p.key)).map(p => ({ ...p, a: (p.a ?? 1) * (1 - k) })), ...B.props.map(p => ({ ...p, a: (p.a ?? 1) * (inA.has(p.key) ? 1 : k) }))];
    return { B: P, R, props };
  }
  function render(pen, F) {
    const layer = L => {
      for (const p of F.props) {
        const a = p.a ?? 1;
        if ((p.layer || 'front') !== L || a <= .01) continue;
        pen.save(); pen.alpha = a; pen.lw = 2.2; pen.tone = INK; p.draw(pen); pen.restore();
      }
    };
    layer('back'); builder(pen, F.B); if (F.R) reviewer(pen, F.R); layer('front');
  }
  // A cast plays one set of poses, blending into each new one. Each pose's clock starts when it's chosen.
  class Cast {
    constructor(poses, state, o = {}) { this.poses = poses; this.cur = state; this.prev = null; this.cs = -200; this.ps = 0; this.t0 = -1e9; this.D = o.dur ?? 700; this.still = o.still ?? RM; this.at = o.at || {}; }
    set(state, now = performance.now()) { if (state === this.cur || !this.poses[state]) return false; this.prev = this.cur; this.ps = this.cs; this.cur = state; this.cs = now; this.t0 = now; return true; }
    frame(now) {
      if (this.still) return this.poses[this.cur](this.at[this.cur] ?? 1000);
      const B = this.poses[this.cur](Math.max(0, now - this.cs + 200));
      const k = (now - this.t0) / this.D;
      if (!this.prev || k >= 1) return B;
      return blend(this.poses[this.prev](Math.max(0, now - this.ps + 200)), B, io(clamp01(k)));
    }
  }

  // ---- The screen ----
  const screens = new Set();
  const seen = typeof IntersectionObserver === 'function' ? new IntersectionObserver(es => { for (const e of es) { const s = e.target.__lcd; if (s) { s.visible = e.isIntersecting; if (s.visible) s.dirty = true; } } }, { rootMargin: '160px' }) : null;
  const sized = typeof ResizeObserver === 'function' ? new ResizeObserver(es => { for (const e of es) if (e.target.__lcd) e.target.__lcd.size(); }) : null;
  class Screen {
    constructor(canvas, o) {
      this.cv = canvas; this.g = canvas.getContext('2d'); this.cols = o.cols; this.rows = o.rows; this.draw = o.draw;
      const N = o.cols * o.rows;
      this.buf = { c: o.cols, r: o.rows, v: new Uint8Array(N) }; this.ink = new Float32Array(N); this.red = new Float32Array(N);
      this.persist = o.persist !== false; this.still = o.still ?? RM; this.at = o.at ?? 1000; this.step = o.step || 0;
      this.crisp = o.crisp ? o.crisp[0] * o.cols : N; // rows from here down change at once: a ticker stays readable
      this.visible = true; this.dirty = true; this.fresh = true; this.d = 0; this.cache = null;
      canvas.width = o.cols; canvas.height = o.rows; canvas.__lcd = this;
      this.look(); this.size();
      screens.add(this); if (seen) seen.observe(canvas); if (sized) sized.observe(canvas); start();
    }
    pen(k = 1, ox = 0, oy = 0) { return new Pen(this.buf, k, ox, oy); }
    look() {
      const cs = getComputedStyle(this.cv), v = (n, d) => cs.getPropertyValue(n).trim() || d;
      this.L = { bg: v('--lcd-bg', '#c3c9b1'), off: v('--lcd-off', '#b8bea6'), ink: v('--lcd-ink', '#20241d'), red: v('--lcd-red', '#d63f28'), sh: v('--lcd-shadow', 'transparent') };
      this.cache = null; this.dirty = true;
    }
    size() {
      const css = this.cv.getBoundingClientRect().width; if (!css) return;
      const d = Math.max(1, Math.round(css * (devicePixelRatio || 1) / this.cols));
      if (d === this.d) return;
      this.d = d; this.cv.width = this.cols * d; this.cv.height = this.rows * d; this.cache = null; this.dirty = true;
    }
    tick(now, dt) {
      if (!this.cv.isConnected) { screens.delete(this); return; }
      if (!this.g || !this.d) { this.size(); if (!this.d) return; }
      if (this.still ? !this.dirty : !this.visible) return;
      let t = this.still ? this.at : now;
      if (this.step && !this.still) t = Math.floor(t / this.step) * this.step;
      const v = this.buf.v; v.fill(0); this.draw(this, t, dt);
      // Dots switch on at once and clear in about a frame: a hint of liquid crystal, never a blur.
      const inst = this.still || !this.persist || this.fresh, up = 1, down = inst ? 1 : 1 - Math.exp(-dt / 8);
      for (let n = 0; n < v.length; n++) {
        const x = v[n], ti = x === INK ? 1 : x === FAINT ? .42 : 0, tr = x === RED ? 1 : 0, a = this.ink[n], r = this.red[n];
        if (n >= this.crisp) { this.ink[n] = ti; this.red[n] = tr; continue; }
        this.ink[n] = a + (ti - a) * (ti > a ? up : down); this.red[n] = r + (tr - r) * (tr > r ? up : down);
      }
      this.fresh = false; this.paint(); this.dirty = false;
    }
    paint() {
      const { g, d, cols, rows, L } = this, gap = d >= 3 ? Math.max(1, Math.round(d * .16)) : 0, sz = d - gap, o0 = Math.floor(gap / 2);
      if (!this.cache) {
        const c = document.createElement('canvas'); c.width = cols * d; c.height = rows * d;
        const cg = c.getContext('2d');
        if (L.bg !== 'transparent') { cg.fillStyle = L.bg; cg.fillRect(0, 0, c.width, c.height); }
        if (L.off !== 'transparent') { cg.fillStyle = L.off; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) cg.fillRect(i * d + o0, j * d + o0, sz, sz); }
        this.cache = c;
      }
      g.globalAlpha = 1; g.clearRect(0, 0, this.cv.width, this.cv.height); g.drawImage(this.cache, 0, 0);
      const LV = 6, ip = new Array(LV).fill(null), rp = new Array(LV).fill(null);
      for (let n = 0; n < cols * rows; n++) {
        const a = this.ink[n], r = this.red[n];
        if (a < .04 && r < .04) continue;
        const x = (n % cols) * d + o0, y = ((n / cols) | 0) * d + o0;
        if (a >= .04) (ip[Math.min(LV, Math.ceil(a * LV)) - 1] ||= new Path2D()).rect(x, y, sz, sz);
        if (r >= .04) (rp[Math.min(LV, Math.ceil(r * LV)) - 1] ||= new Path2D()).rect(x, y, sz, sz);
      }
      const fill = (paths, col, dx) => { g.fillStyle = col; for (let l = 0; l < LV; l++) if (paths[l]) { g.globalAlpha = (l + 1) / LV; if (dx) { g.save(); g.translate(dx, dx); g.fill(paths[l]); g.restore(); } else g.fill(paths[l]); } };
      if (L.sh !== 'transparent' && L.sh !== 'none') { const dx = Math.max(1, Math.round(d * .24)); fill(ip, L.sh, dx); fill(rp, L.sh, dx); }
      fill(ip, L.ink, 0); fill(rp, L.red, 0); g.globalAlpha = 1;
    }
  }
  let running = false, last = 0;
  function start() {
    if (running || typeof requestAnimationFrame !== 'function') return;
    running = true;
    requestAnimationFrame(function frame(now) { const dt = last ? Math.min(80, now - last) : 16; last = now; for (const s of screens) s.tick(now, dt); requestAnimationFrame(frame); });
  }
  function relook() { for (const s of screens) s.look(); }
  if (typeof matchMedia === 'function') matchMedia('(prefers-color-scheme: dark)').addEventListener('change', relook);
  if (typeof MutationObserver === 'function') new MutationObserver(relook).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });

  // ---- The handheld's screen: an icon bar and a clock, speck in the middle, and a ticker for what the AI wrote ----
  const ICONS = {
    tea: ['..#.#..', '.#.#...', '#####..', '#...###', '#...#.#', '#...###', '.###...'],
    tidy: ['......#', '.....#.', '....#..', '..##...', '.####..', '#####..', '#.#.#..'],
    play: ['...#...', '..###..', '...#...', '..###..', '..###..', '.#####.', '#######'],
    idea: ['.#####.', '#.....#', '#.#.#.#', '#.....#', '.#####.', '.#.....', '#......'],
    sleep: ['..###..', '.##....', '##.....', '##.....', '##.....', '.##....', '..###..'],
  };
  const BAR = ['tea', 'tidy', 'play', 'idea', 'sleep'];
  function handheld(canvas, o = {}) {
    const still = o.still ?? RM, cast = new Cast(STATES, o.state || 'idle', { still, at: STATE_AT });
    const st = { caption: (o.caption || '').toUpperCase(), capAt: performance.now(), active: o.active || null };
    const scr = new Screen(canvas, { cols: 160, rows: 96, still, crisp: [87], draw(s, t) {
      const p = s.pen();
      BAR.forEach((name, i) => { const x = 4 + i * 12; if (st.active === name) { p.dots(x - 1, 1, 9, 9, INK); p.bitmap(ICONS[name], x, 2, OFF); } else p.bitmap(ICONS[name], x, 2, INK); });
      const now = new Date(), hh = String(now.getHours()).padStart(2, '0'), mm = String(now.getMinutes()).padStart(2, '0');
      p.text(`${hh}${s.still || now.getSeconds() % 2 ? ':' : ' '}${mm}`, 156, 2, { font: F5, align: 'right', valign: 'top' });
      for (let i = 1; i < 160; i += 2) { p.put(i, 12, FAINT); p.put(i, 86, FAINT); }
      for (let i = 20; i < 141; i += 3) p.put(i, 83, FAINT);
      render(s.pen(1, 80, 82), cast.frame(t));
      // The ticker shows the start of the caption first, then scrolls it through.
      const text = st.caption, W = text.length * 6, C = W + 160;
      let x = 4;
      if (!s.still) { const u = Math.floor(Math.max(0, performance.now() - st.capAt - 1800) / 45) % C; x = 4 - u; if (x < -W) x += C; }
      p.clip = [0, 87, 160, 96]; p.text(text, x, 88, { font: F5, align: 'left', valign: 'top' }); p.clip = null;
    } });
    return {
      scr, cast,
      set(state) { cast.set(state); scr.dirty = true; },
      say(text) { st.caption = String(text).toUpperCase(); st.capAt = performance.now(); scr.dirty = true; },
      active(name) { st.active = name; scr.dirty = true; },
      get state() { return cast.cur; },
    };
  }
  // A builder badge, as the panel shows it: 56 px, on 28 × 28 dots.
  function badge(canvas, pose, o = {}) {
    const cast = new Cast(PANEL, pose, { still: o.still ?? RM, at: STILL_AT });
    const scr = new Screen(canvas, { cols: 28, rows: 28, still: o.still ?? RM, draw(s, t) { render(s.pen(.32, 14, 26), cast.frame(t)); } });
    return { scr, cast, set(p) { cast.set(p); scr.dirty = true; } };
  }
  // The Auto-build button's builder: 28 px, on 14 × 14 dots, hopping or still.
  function mini(canvas, moving = true) {
    const cast = new Cast(PANEL, moving ? 'hop' : 'still', { at: STILL_AT });
    const scr = new Screen(canvas, { cols: 14, rows: 14, draw(s, t) { render(s.pen(.25, 7, 13.25), cast.frame(t)); } });
    return { scr, cast, set(on) { cast.set(on ? 'hop' : 'still'); } };
  }
  // A screen showing one state (or panel pose) with nothing else on it.
  function tile(canvas, poses, state, o = {}) {
    const cast = new Cast(poses, state, { still: o.still, at: o.at || (poses === PANEL ? STILL_AT : STATE_AT) });
    const scr = new Screen(canvas, { cols: o.cols, rows: o.rows, still: o.still, step: o.step, persist: o.persist, draw(s, t) { render(s.pen(o.k, o.ox, o.oy), cast.frame(t + (o.offset || 0))); } });
    return { scr, cast, set(p) { cast.set(p); scr.dirty = true; } };
  }

  window.SpeckLCD = { Screen, Pen, Cast, PANEL, STATES, STILL_AT, STATE_AT, F3, F5, ICONS, OFF, FAINT, INK, RED, RM, render, blend, builder, handheld, badge, mini, tile, io };
})();
