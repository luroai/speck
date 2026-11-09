// 0579: what speck's face does as the pipeline changes, on top of speck-face.js (which this needs loaded first). The mood
// the board gives comes from speckMood on the server, as /api/state's foreman.mood.
(() => {
  'use strict';
  const EASE_MS = 420, PLEASED_MS = 10000;

  const between = (a, b, t) => Object.fromEntries(Object.keys(a).map(k => [k, Math.round((a[k] + (b[k] - a[k]) * t) * 1000) / 1000]));
  // For SpeckFace.setMood: over EASE_MS, gently at both ends, or straight there with reduced motion set.
  const ease = (from, to, paint) => {
    if (typeof requestAnimationFrame !== 'function' || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return paint(to);
    let start = null;
    const frame = at => {
      start ??= at;
      const t = Math.min(1, (at - start) / EASE_MS);
      if (paint(t === 1 ? to : between(from, to, t * t * (3 - 2 * t))) && t < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  // Changes a face to another mood, its visor easing there.
  const change = (svg, mood) => SpeckFace.setMood(svg, mood, ease);

  // The mood of a face shown beside one ticket or Decided for you line (either has criteria_changed, 0565), given the pipeline's.
  const beside = (ticket, mood) => (ticket && ticket.criteria_changed === true ? 'sheepish' : mood);

  // What's happened so far that makes speck pleased: tickets shipped and recommendations it took.
  const eventsOf = state => new Set([
    ...state.tickets.filter(t => t && t.status === 'done' && !(t.ship && t.ship.running === true)).map(t => `shipped ${t.id}`),
    ...(Array.isArray(state.foreman?.took) ? state.foreman.took : []).filter(Boolean).map(w => `took ${w.id} ${w.at} ${w.option}`),
  ]);
  // Follows the pipeline: give the function this returns each /api/state the page gets, and it calls onMood with the mood
  // each time that changes. That's the state's foreman.mood, or pleased for PLEASED_MS after speck takes a recommendation or a
  // ticket ships. It goes by what's new since the last state, as a choice's recorded time is only to the minute, so what
  // happened before the page opened doesn't count.
  const watcher = onMood => {
    let base = null, seen = null, timer = null, told = null;
    const tell = () => {
      const mood = timer === null ? base : 'pleased';
      if (mood !== null && mood !== told) onMood(told = mood);
    };
    return state => {
      if (!state || typeof state !== 'object') return;
      base = SpeckFace.moods.includes(state.foreman?.mood) ? state.foreman.mood : 'watching';
      if (Array.isArray(state.tickets)) {
        const now = eventsOf(state), fresh = seen !== null && [...now].some(e => !seen.has(e));
        seen = now;
        if (fresh) {
          if (timer !== null) clearTimeout(timer);
          timer = setTimeout(() => { timer = null; tell(); }, PLEASED_MS);
        }
      }
      tell();
    };
  };

  globalThis.SpeckMood = { change, beside, watcher };
})();
