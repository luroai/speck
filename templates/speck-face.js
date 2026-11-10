// 0578: speck's character, the design's Premium screen: a small dark device whose red visor is its eye, one drawing at
// every size from 16 px. SpeckFace.draw({ mood, size, look, label }) gives an <svg> to put on the page. It follows the
// page's light or dark look unless look says which. Only the red light moves, and only by the stylesheet below, so with
// reduced motion set it rests in its mood's shape. 0579: speck-mood.js changes a drawn face's mood as the pipeline's does.
(() => {
  'use strict';
  const SVG = 'http://www.w3.org/2000/svg';

  // Each mood's visor, one curve with a stroke: its ends, the point it bends towards, its height and its brightness.
  // All six are the same kind of curve, so one can ease into another.
  const VISORS = {
    watching: { x1: -5, y1: -25, cx: 0, cy: -25, x2: 5, y2: -25, stroke: 5, opacity: 1 },
    focused: { x1: -3, y1: -22, cx: 0, cy: -22, x2: 3, y2: -22, stroke: 4, opacity: 1 },
    pleased: { x1: -6, y1: -23, cx: 0, cy: -31, x2: 6, y2: -23, stroke: 4, opacity: 1 }, // 0605: a closed eye arched upwards, like ^
    sheepish: { x1: -3, y1: -19, cx: 0, cy: -20.1, x2: 3, y2: -21.2, stroke: 4, opacity: 1 },
    asking: { x1: 0, y1: -16.5, cx: 0, cy: -16.5, x2: 0.01, y2: -16.5, stroke: 4.6, opacity: 1 }, // the dot of the question mark
    asleep: { x1: -9, y1: -20, cx: -5, cy: -20, x2: -1, y2: -20, stroke: 2.2, opacity: 0.5 },
  };
  const GLOW = 3.6, MIN_SIZE = 16, DEFAULT_SIZE = 44, MARKS_FROM = 24; // below MARKS_FROM, the question mark and the z's are too small to read
  const HOOK = 'M -5.5 -30 C -5.5 -35.5 5.5 -35.5 5.5 -30 C 5.5 -26.5 0 -26.5 0 -22';
  const ZS = [{ x: 2, y: -21, size: 3 }, { x: 6.5, y: -27.5, size: 4 }, { x: 11, y: -34.5, size: 5 }];

  // Everything that moves is in the no-preference block, so reduced motion needs no code of its own. Asking's dot and
  // asleep's line don't blink: one pulses and the other is already closed.
  const STYLE = `
.speck-face { --sf-bezel-a: #45484F; --sf-bezel-b: #0D0E11; --sf-rim: #5D6169; --sf-eye: #D63F28; display: block; flex: none; }
:root[data-theme="dark"] .speck-face:not([data-look="light"]), .speck-face[data-look="dark"] { --sf-bezel-a: #5A5C54; --sf-bezel-b: #1D1E1A; --sf-rim: #70726A; --sf-eye: #FF6A4D; }
.sf-stop-a { stop-color: var(--sf-bezel-a); }
.sf-stop-b { stop-color: var(--sf-bezel-b); }
.sf-body { stroke: var(--sf-rim); }
.sf-screen { fill: #06070A; }
.sf-light { fill: none; stroke: var(--sf-eye); stroke-linecap: round; stroke-linejoin: round; }
.sf-blink { transform-box: fill-box; transform-origin: center; }
@media (prefers-reduced-motion: no-preference) {
  @keyframes sf-drift { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-2.6px); } 75% { transform: translateX(2.6px); } }
  @keyframes sf-scan { 0%, 100% { transform: translateX(-4px); } 50% { transform: translateX(4px); } }
  @keyframes sf-lift { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1.2px); } }
  @keyframes sf-glance { 0%, 55%, 100% { transform: translateX(0); } 65%, 85% { transform: translateX(-3px); } }
  @keyframes sf-glow { 0%, 100% { opacity: 1; } 50% { opacity: .55; } }
  @keyframes sf-blink { 0%, 96%, 100% { transform: scaleY(1); } 98% { transform: scaleY(.12); } }
  @keyframes sf-pulse { 0%, 18%, 34%, 50%, 100% { transform: scale(1); } 26%, 42% { transform: scale(1.35); } }
  @keyframes sf-fade { 0%, 100% { opacity: 1; } 50% { opacity: .6; } }
  @keyframes sf-breathe { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(.85); } }
  @keyframes sf-z { 0% { opacity: 0; } 8%, 60% { opacity: 1; } 72%, 100% { opacity: 0; } }
  .speck-face .sf-glow { animation: sf-glow 6.2s ease-in-out infinite; }
  .speck-face[data-mood="watching"] .sf-move { animation: sf-drift 16s ease-in-out infinite; }
  .speck-face[data-mood="focused"] .sf-move { animation: sf-scan 5.2s ease-in-out infinite; }
  .speck-face[data-mood="pleased"] .sf-move { animation: sf-lift 6.5s ease-in-out infinite; }
  .speck-face[data-mood="sheepish"] .sf-move { animation: sf-glance 9.5s ease-in-out infinite; }
  .speck-face[data-mood="asleep"] .sf-move { animation: sf-fade 9s ease-in-out infinite; }
  .speck-face[data-mood="asleep"] .sf-blink { animation: sf-breathe 11s ease-in-out infinite; }
  .speck-face[data-mood="asking"]:not([data-small]) .sf-blink { animation: sf-pulse 5.6s ease-in-out infinite; }
  .speck-face[data-mood="watching"] .sf-blink, .speck-face[data-mood="focused"] .sf-blink, .speck-face[data-mood="pleased"] .sf-blink, .speck-face[data-mood="sheepish"] .sf-blink, .speck-face[data-small][data-mood="asking"] .sf-blink { animation: sf-blink 8.5s linear infinite; }
  .speck-face .sf-z1 { animation: sf-z 9s ease-in-out 0s infinite backwards; }
  .speck-face .sf-z2 { animation: sf-z 9s ease-in-out 1s infinite backwards; }
  .speck-face .sf-z3 { animation: sf-z 9s ease-in-out 2s infinite backwards; }
}`;

  let styled = false, drawn = 0;
  const addStyle = () => {
    if (styled) return;
    styled = true;
    const style = document.createElement('style');
    style.textContent = STYLE;
    document.head?.appendChild(style);
  };
  const make = (tag, attrs, ...children) => {
    const n = document.createElementNS(SVG, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    for (const c of children) n.appendChild(c);
    return n;
  };
  const curve = v => `M ${v.x1} ${v.y1} Q ${v.cx} ${v.cy} ${v.x2} ${v.y2}`;
  const SCREEN = { x: -18, y: -38, width: 36, height: 26, rx: 7 };
  const known = mood => (Object.hasOwn(VISORS, mood) ? String(mood) : 'watching');
  const shapeOf = (name, small) => VISORS[small && name === 'asking' ? 'watching' : name];
  const marksOf = (name, small) => (small ? [] : name === 'asking' ? [make('path', { class: 'sf-hook sf-light', d: HOOK, 'stroke-width': 3 })]
    : name === 'asleep' ? ZS.map((z, i) => make('path', { class: `sf-z sf-z${i + 1} sf-light`, 'stroke-width': 1.3,
      d: `M ${z.x} ${z.y} L ${z.x + z.size} ${z.y} L ${z.x} ${z.y + z.size} L ${z.x + z.size} ${z.y + z.size}` })) : []);
  const faces = new WeakMap(); // 0579: what setMood needs of each face draw made

  const draw = options => {
    const { mood, size, look, label } = options || {};
    const name = known(mood);
    const px = typeof size === 'number' && Number.isFinite(size) ? Math.max(MIN_SIZE, size) : DEFAULT_SIZE;
    const small = px < MARKS_FROM;
    const shape = shapeOf(name, small), d = curve(shape);
    const id = ++drawn, bezel = `sf-bezel-${id}`, clip = `sf-clip-${id}`;
    addStyle();
    const glow = make('path', { class: 'sf-glow sf-light', d, 'stroke-width': shape.stroke + GLOW, 'stroke-opacity': 0.28, opacity: shape.opacity });
    const visor = make('path', { class: 'sf-visor sf-light', d, 'stroke-width': shape.stroke, opacity: shape.opacity });
    const move = make('g', { class: 'sf-move' }, make('g', { class: 'sf-blink' }, glow, visor));
    const glass = make('path', { class: 'sf-glass', d: 'M -18 -38 L 6 -38 L -10 -12 L -18 -12 Z', fill: '#FFFFFF', 'fill-opacity': 0.07 });
    const lit = make('g', { class: 'sf-lit', 'clip-path': `url(#${clip})` }, move, ...marksOf(name, small), glass);
    const svg = make('svg', { class: 'speck-face', viewBox: '-26 -50 52 52', width: px, height: px, role: 'img', 'aria-label': label || name, 'data-mood': name, ...(small ? { 'data-small': 'true' } : {}), ...(look === 'light' || look === 'dark' ? { 'data-look': look } : {}) },
      make('defs', {},
        make('linearGradient', { id: bezel, x1: 0, y1: 0, x2: 0, y2: 1 }, make('stop', { class: 'sf-stop-a', offset: 0 }), make('stop', { class: 'sf-stop-b', offset: 1 })),
        make('clipPath', { id: clip }, make('rect', SCREEN))),
      make('rect', { class: 'sf-body', x: -22, y: -42, width: 44, height: 34, rx: 11, fill: `url(#${bezel})`, 'stroke-width': 0.8 }),
      make('rect', { class: 'sf-screen', ...SCREEN }),
      lit);
    faces.set(svg, { name, small, labelled: !!label, shape, glow, visor, lit, move, glass, turn: 0 });
    return svg;
  };

  // 0579: changes a face draw made to another mood, leaving a face already in it alone. Without `ease` the visor goes
  // straight there. With it, ease(from, to, paint) moves it, from wherever it is now, by calling paint with each shape
  // on the way: paint says false once a later change has taken over. speck-mood.js has the one the panel uses.
  const paint = (face, shape) => {
    const d = curve(shape);
    face.shape = shape;
    face.glow.setAttribute('d', d);
    face.glow.setAttribute('stroke-width', shape.stroke + GLOW);
    face.glow.setAttribute('opacity', shape.opacity);
    face.visor.setAttribute('d', d);
    face.visor.setAttribute('stroke-width', shape.stroke);
    face.visor.setAttribute('opacity', shape.opacity);
  };
  const setMood = (svg, mood, ease) => {
    const face = faces.get(svg), name = known(mood);
    if (!face || name === face.name) return;
    face.name = name;
    svg.setAttribute('data-mood', name);
    if (!face.labelled) svg.setAttribute('aria-label', name);
    face.lit.replaceChildren(face.move, ...marksOf(name, face.small), face.glass);
    const turn = ++face.turn, to = shapeOf(name, face.small);
    const step = shape => { if (turn !== face.turn) return false; paint(face, shape); return true; };
    if (typeof ease === 'function') ease(face.shape, to, step); else step(to);
  };

  globalThis.SpeckFace = { draw, setMood, moods: Object.freeze(Object.keys(VISORS)) };
})();
