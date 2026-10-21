// 0356: changes the user asks for on an approved ticket, kept as dated lines in its Review log. Each says how many
// review rounds the ticket had when they were asked for, so a later round shows they've been reviewed.
import { parseTicket } from './core.mjs';

const LINE = /^\s*-\s+(\d{4}-\d{2}-\d{2} \d{2}:\d{2} UTC) · Changes asked for by the user after round (\d+): (.*\S)\s*$/;

// The line `speck changes` adds: the note on one line, with the time and the rounds so far.
export const changesLine = (note, after, now = new Date()) =>
  `- ${now.toISOString().slice(0, 16).replace('T', ' ')} UTC · Changes asked for by the user after round ${after}: ${oneLine(note)}`;

export const oneLine = note => String(note ?? '').replace(/\s+/g, ' ').trim();

// Every change asked for in a ticket's Review log, oldest first: { at, after, note, line }.
export function changesAsked(raw) {
  let lines;
  try { lines = parseTicket(raw).sections['review log'] || []; } catch { return []; }
  return lines.flatMap(line => { const m = line.match(LINE); return m ? [{ at: m[1], after: Number(m[2]), note: m[3], line: line.trim() }] : []; });
}

// The changes asked for that no review round has looked at yet: asked for after the last of `all` the rounds.
export const changesPending = (raw, all) => changesAsked(raw).filter(c => c.after >= all.length);

// The changes the reviewer checks in its next round: those asked for since the last approval in `prior`, until a
// round approves them.
export function changesToReview(raw, prior) {
  const approved = prior.map(r => r?.verdict?.verdict).lastIndexOf('approve') + 1;
  return approved ? changesAsked(raw).filter(c => c.after >= approved) : [];
}
