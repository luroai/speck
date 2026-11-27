// 0761's swipes on a lane's list in a real Chromium with touch, shared with 0776's tests of 0761 AC2.

// A finger on the page, down at the first point and through the rest, then up.
export async function swipe(b, points, midway) {
  const at = ([x, y]) => [{ x, y, id: 1 }];
  await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(points[0]) });
  if (midway) await midway();
  for (const p of points.slice(1)) await b.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: at(p) });
  await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
export const leftFrom = ([x, y]) => Array.from({ length: 9 }, (_, i) => [x - i * 20, y]); // 160 px to the left, quickly
// Puts a block 2000 px wide at the top of a list, so something in it is wider than the list.
export const widen = id => `(() => { const n = document.createElement('div'); n.className = 'wide-0761'; n.style.cssText = 'width: 2000px; height: 40px';
  n.textContent = 'wide'; document.getElementById(${JSON.stringify(id)}).prepend(n); return true; })()`;
// The middle of what shows of the element a selector finds, across the page, and near its top.
export const middleOf = (b, sel) => b.js(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(), right = Math.min(r.right, innerWidth);
  return [Math.round((Math.max(r.left, 0) + right) / 2), Math.round(r.top + Math.min(r.height, 40) / 2)]; })()`);
// 0776: as widen, but the block stays: the panel draws Plan's list again on each of its 5-second pings, which takes out
// anything it didn't put there, so it puts the same block back at once. A swipe that started on it, when it was taken
// out partway, would otherwise never reach the lanes, as a touch keeps to the node it started on.
export const widenKept = id => `(() => { ${widen(id)}; const l = document.getElementById(${JSON.stringify(id)}), n = l.querySelector('.wide-0761');
  new MutationObserver(() => { if (!n.isConnected) l.prepend(n); }).observe(l, { childList: true }); return true; })()`;
// Swipes left from the middle of the element `sel` finds and waits, up to `ms`, for Build to be the open lane.
// `midway`, if given, runs once the finger is down, before it moves.
export async function swipeChangesLane(b, sel, what, { midway, ms } = {}) {
  await swipe(b, leftFrom(await middleOf(b, sel)), midway);
  await b.until(`document.getElementById('tab-build').getAttribute('aria-selected') === 'true'`, what, ms);
}
