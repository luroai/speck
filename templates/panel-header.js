'use strict';
// 0474: the panel's header, which the page loads from /panel-header.js after its own script and before the pop-ups: the
// dark bar with speck and the status (0580) and the strip of the Capture, Plan, Build and Shipped lanes under it (0477).
// It uses the page's helpers ($, el, setText, within, foremanOf and the rest), and the page's render() calls drawHeader and drawTabs.

// 0160: the header stays at the top of the screen. --head is its height on screen, so a ticket scrolled to sits below
// it. 0580: the project and the base branch, cut short when the bar is narrow, show in full in their tooltips.
const pageHeader = document.querySelector?.('header');
if (pageHeader) {
  new ResizeObserver(() => document.documentElement.style.setProperty('--head', `${pageHeader.offsetHeight}px`)).observe(pageHeader);
  const repo = pageHeader.querySelector('.repo');
  if (repo) repo.title = repo.textContent.trim();
  const base = pageHeader.querySelector('.bar-more code');
  if (base) base.title = base.textContent.trim();
}
function reducedMotion() { return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches; }
const NEEDS_YOU = /^Needs you \d+$/;
// 0285: the Foreman, speck run's one status for the whole pipeline. Pressing it opens its detail. 0580: its word is on
// the bar's first line, and the bar's edge is in the needs-you colour while the word is "Needs you <n>". The button stays
// put and only what's in it changes, so it keeps the focus.
function drawHeader(f, stale) {
  const run = $('run'), word = stale ? 'Reload page' : f.word;
  $('bezel').className = NEEDS_YOU.test(word) ? 'bezel needs' : 'bezel';
  drawBar(f, word);
  run.setAttribute('aria-expanded', String(foremanOpen));
  run.title = `speck: ${word} · ${stale ? 'The panel is running newer code than this page shows: open to reload it' : 'The pipeline: speck run\'s log'}`;
  drawProjects(); // 0516
}
// 0580: what's on the bar. speck's face is made once, in the pipeline's mood, and SpeckMood eases it from one to the next.
let barFace = null, barMood = null;
function drawBar(f, word) {
  if (!barFace && globalThis.SpeckFace) { // without its script the bar still shows the status
    barFace = SpeckFace.draw({ mood: state && state.foreman && state.foreman.mood, size: 44, look: 'dark' });
    $('bar-face').replaceChildren(barFace);
    barMood = SpeckMood.watcher(mood => SpeckMood.change(barFace, mood));
  }
  if (barMood) barMood(state);
  setText($('bar-word'), word);
  const queued = f.ready.length, needs = /^Needs you (\d+)$/.exec(f.word);
  setText($('bar-queued'), queued ? `${queued} queued` : 'Nothing queued');
  $('bar-needs-part').hidden = !needs;
  if (needs) setText($('bar-needs'), `${needs[1]} need${needs[1] === '1' ? 's' : ''} you`);
}
// 0516: the project menu. While two or more speck panels are running on this machine, a menu after the project's name
// in the title row lists every running panel's project, by its folder name (and its port, when two share a name), with
// the one shown chosen. Choosing another shows that project's panel here, at this address: the panel serving this address
// passes the page's requests on to it from then on. While the project shown has stopped, the page says so, and the
// menu lists the ones still running.
// The panel that sent this page is in its speck-panel tag. Once another tab at this address chooses another project,
// this page's next answer comes from that project's panel: rather than show it under this project's name, or send it
// this one's key, the page reloads.
if (typeof globalThis.fetch === 'function') {
  const fetchFrom = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (...args) => {
    const res = await fetchFrom(...args), from = res && res.headers && typeof res.headers.get === 'function' ? res.headers.get('X-Speck-Panel') : null;
    const own = $('speck-panel').content;
    if (from && own && from !== own) { location.reload(); return new Promise(() => {}); } // answered by the reload
    return res;
  };
}
let projectsGoneList = null, projectsDrawn = null; // the panels still running while the one shown has stopped; what the menu was drawn from
// The project shown, by the name the menu last gave it.
function projectShown() {
  const p = state && state.projects, me = p && Array.isArray(p.list) ? p.list.find(x => x.port === p.self) : null;
  return me ? String(me.name) : 'This project';
}
function projectsGone(gone) {
  // Another tab at this address chose a project that has stopped since: not this page's, so it reloads to show the address's own.
  const self = state && state.projects && state.projects.self;
  if (gone && Number.isInteger(gone.port) && Number.isInteger(self) && gone.port !== self) return location.reload();
  projectsGoneList = gone && Array.isArray(gone.list) ? gone.list : null;
  if (projectsGoneList) {
    $('offline').hidden = false;
    $('offline').textContent = `${projectShown()}'s panel has stopped, so this shows the last state received. Pick another project from the menu at the top, or start its panel again with speck panel.`;
  }
  drawProjects();
}
function drawProjects() {
  const projects = state && state.projects, list = projectsGoneList || (projects && Array.isArray(projects.list) ? projects.list : []);
  const self = projectsGoneList ? null : projects && projects.self, show = list.length > (projectsGoneList ? 0 : 1);
  $('project-pick').hidden = !show;
  const drawn = JSON.stringify([show && list, self]);
  if (!show || drawn === projectsDrawn) return;
  projectsDrawn = drawn;
  const named = new Map();
  for (const p of list) named.set(p.name, (named.get(p.name) || 0) + 1);
  const option = (value, text, chosen) => { const o = el('option', null, text); o.value = value; o.selected = chosen; return o; };
  const options = list.map(p => option(String(p.port), named.get(p.name) > 1 ? `${p.name} · ${p.port}` : String(p.name), p.port === self));
  if (projectsGoneList) { const o = option('', `${projectShown()} (stopped)`, true); o.disabled = true; options.unshift(o); }
  $('project').replaceChildren(...options);
}
async function chooseProject(port) {
  if (!/^\d{1,5}$/.test(port)) return;
  let res = null, body = null;
  try { res = await fetch(`/api/projects/${port}`, { method: 'POST' }); body = await res.json(); } catch { /* answered below */ }
  if (res && res.ok) return location.reload();
  $('offline').hidden = false;
  $('offline').textContent = `Couldn't show that project: ${(body && body.error) || "can't reach speck panel."}`;
  projectsDrawn = null;
  drawProjects(); // the menu goes back to the project shown
}
$('project').addEventListener('change', () => chooseProject($('project').value));
// 0410: Plan, Build and Shipped are tabs under the header (0520: with Capture first), and only the open one's lane shows. 0582: each says
// how many its lane holds. Build opens with the
// page. Each lane's list keeps its own scroll position, put back when its tab opens again.
const LANES = { capture: ['tab-capture', 'capture-section', 'capture'], plan: ['tab-plan', 'shaping-section', 'shaping'], build: ['tab-build', 'build-section', 'queue'], shipped: ['tab-shipped', 'shipped-section', 'shipped-list'] };
const TAB_ORDER = ['capture', 'plan', 'build', 'shipped'];
let openLane = 'build';
let laneCounts = null; // 0582: how many each lane holds, from the last board drawn, or null before the first
const laneScroll = new Map(); // a closed lane's list's scroll position, by lane
// The lane a node is in, by the list or section holding it: Plan for anything that isn't in another lane.
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
function drawTabs(m) {
  if (m) laneCounts = { capture: m.capture.length, plan: m.drafts.length, build: m.queue.length, shipped: m.shippedTotal };
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
  // 0582: each tab's count, and its accessible name says what the count is
  for (const l of TAB_ORDER) {
    const n = laneCounts && laneCounts[l], name = l[0].toUpperCase() + l.slice(1);
    setText($(`${LANES[l][0]}-n`), laneCounts ? String(n) : '');
    const held = laneCounts ? `, ${n} ${l === 'capture' ? 'note' : 'ticket'}${n === 1 ? '' : 's'}` : '';
    $(LANES[l][0]).setAttribute('aria-label', `${name}${held}${l === 'build' && needs ? `, ${needs[1]} needs you` : ''}`);
  }
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
// 0476: the lanes are four cards (0520) in one row, as wide as the column. At rest only the open one shows, as before; while
// the row moves, all four show in their places (data-slide on the lanes' box: 'drag' while a finger moves it, 'settle'
// while it comes to rest), and the row is moved so the open card is in view: --lane is its place in the row, and --drag
// how far a finger has moved the row from there. A swipe, a sideways scroll on a trackpad, the left and right arrow keys
// or a tab bring another card into view.
const lanesBox = document.querySelector?.('main') || $('lanes');
const SLIDE_MS = 120; // how long a card takes to come to rest (0517: 200 before)
let slides = []; // the slide's animations, one for each card, while the row comes to rest
// 0517: a redraw never holds up a slide. One asked for while the row comes to rest, by the lane change itself or the
// refresh, is made once it's there: render(), and the buttons' measuring after a change to the page, ask slideHolds()
// first, and are held, once each, until then.
const held = new Set();
function slideHolds(redraw) {
  if (!slides.length) { held.delete(redraw); return false; }
  held.add(redraw);
  return true;
}
function rested() {
  const redraws = [...held];
  held.clear();
  for (const redraw of redraws) redraw();
}
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
  if (reducedMotion() || Math.abs(from - to) < 1 || typeof lanesBox.animate !== 'function') { delete lanesBox.dataset.slide; rested(); return; }
  showRow('settle');
  const mine = slides = TAB_ORDER.map(l => $(LANES[l][1]).animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }], { duration: SLIDE_MS, easing: 'cubic-bezier(.25, .8, .35, 1)' }));
  mine[0].finished.then(() => { if (slides === mine) { slides = []; delete lanesBox.dataset.slide; rested(); } }, () => {});
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
// A touch is followed sideways or left to the browser to scroll up and down, by the way it has gone 6 px more than the
// other (0517: once it had gone 10 px before). Followed sideways, the row moves with the finger (a third as far past
// either end), and on lifting it a quick flick changes lane however short it was, and a slower drag past a quarter of
// the card's width does (0517: a third before). The lists only scroll up and down themselves (touch-action: pan-y), so
// the browser never holds on to a sideways touch.
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
      const lead = Math.abs(dx) - Math.abs(dy);
      if (Math.abs(lead) < 6) return;
      touch.way = lead > 0 ? 'x' : 'y';
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
        : Math.abs(was.drag) > lanesBox.clientWidth / 4 ? -Math.sign(was.drag) : 0;
    if (step) stepLane(step); else slideFrom(rowAt());
  };
  lanesBox.addEventListener('touchend', lift);
  lanesBox.addEventListener('touchcancel', lift);
  // A sideways scroll on a trackpad changes lane once it has gone 20 px (0517: 40 px before), and once only: its glide
  // after the fingers lift keeps it going the same way. 0514: the next scroll changes lane again, as the next swipe's
  // fingers stop the glide: one after a pause of 50 ms (three frames with no step sideways), and one the other way, 20 px
  // of it, with no pause, as a glide never turns back. How fast it goes says nothing, as fingers slow down and speed up within one swipe.
  // `way` is the way the last change went (0 before one, and after a pause), `sum` how far it has gone towards the next
  // and `at` when its last step was, or when the page had finished changing lane, so a step held up meanwhile isn't
  // taken for one after a pause.
  let wheel = { way: 0, sum: 0, at: -Infinity };
  lanesBox.addEventListener('wheel', e => {
    if (e.ctrlKey || Math.abs(e.deltaX) <= Math.abs(e.deltaY) || scrollsSideways(e.target)) return;
    if (e.cancelable) e.preventDefault();
    if (e.timeStamp - wheel.at >= 50) wheel = { way: 0, sum: 0, at: e.timeStamp };
    wheel.at = Math.max(wheel.at, e.timeStamp); // 0517: a step held up after a change never moves it back
    if (Math.sign(e.deltaX) === wheel.way) { wheel.sum = 0; return; } // the glide, which undoes any jitter the other way
    wheel.sum += e.deltaX;
    if (Math.abs(wheel.sum) < 20) return;
    wheel = { way: Math.sign(wheel.sum), sum: 0, at: wheel.at };
    stepLane(wheel.way);
    if (globalThis.performance) wheel.at = Math.max(wheel.at, performance.now());
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
