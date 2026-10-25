import assert from 'node:assert/strict';

// 0500: a closed card's status line whose time is a ticket's time since it started, checked against the clock rather
// than a fixed window, so a panel that's slow to start can't fail it. `before` and `after` are the line's text on each
// side of the time. The time must read as MM:SS past an hour (minutes counting past 59), and come to between `least`
// and `most` seconds.
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function timeLine(text, { before, after, least, most }, message = 'the line') {
  const m = String(text).match(new RegExp(`^${escape(before)} · (\\d{2,}):([0-5]\\d) · ${escape(after)}$`));
  assert.ok(m, `${message}: "${text}" reads "${before} · MM:SS · ${after}"`);
  const minutes = Number(m[1]), seconds = minutes * 60 + Number(m[2]);
  assert.ok(minutes >= 60, `${message}: "${m[1]}:${m[2]}" is past an hour`);
  assert.ok(seconds >= least && seconds <= most, `${message}: "${m[1]}:${m[2]}" is between ${least} and ${most} seconds`);
  return seconds;
}
