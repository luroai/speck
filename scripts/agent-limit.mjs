// 0644: a Codex or Cursor build's usage limit, read from its log as 0622 reads Claude's. A Codex build's log is `codex
// exec --json` output, each line stamped with when it was written (codex-times.mjs), and refuses with an `error` and a
// `turn.failed` event, "…try again at 3:41 AM", a local time. Its session file keeps the refusal too, with
// `codex_error_info: usage_limit_exceeded`. Cursor's CLI has no wording of its own for its limit: it shows what Cursor's
// server says, so that's matched loosely, in its stream-json events or the lines it writes to standard error.
import fs from 'node:fs';
import os from 'node:os';
import { rollouts } from './round-cost.mjs';
import { threadId } from './codex-build.mjs';
import { reviewerRefused, resetIn } from './limit-words.mjs';

const CODEX_CODE = /usage_limit_exceeded/;
const CURSOR_CODE = /\b(?:FREE|PRO)_USER_USAGE_LIMIT\b/;
const COLOURS = /\x1b\[[0-9;]*[A-Za-z]/g;
const plain = v => v && typeof v === 'object' && !Array.isArray(v);
const said = v => (typeof v === 'string' ? v : '');

// The refusal a log `text` ends on, or null: { said, at }, `at` being when it was written in ms, or null. failure(e)
// gives an event's failure text, or null when the event is the run getting on with its work, which a refusal before it
// doesn't stop. A line that isn't an event is the agent's standard error.
function refusalIn(text, failure, refused) {
  let hit = null;
  for (const raw of String(text ?? '').split('\n')) {
    const line = raw.replace(COLOURS, '').trim();
    if (!line) continue;
    let e = null;
    if (line.startsWith('{')) try { e = JSON.parse(line); } catch { /* standard error */ }
    if (!plain(e)) { if (refused(line)) hit = { said: line, at: null }; continue; }
    const f = failure(e);
    if (f === null) hit = null;
    else if (refused(f)) { const at = Date.parse(e.speck_at); hit = { said: f, at: Number.isFinite(at) ? at : null }; }
  }
  return hit;
}

const codexFailure = e => (e.type === 'error' ? `${said(e.message)} ${said(e.codex_error_info)}`
  : e.type === 'turn.failed' ? `${said(e.error?.message)} ${said(e.error?.codex_error_info)}` : null);
const codexRefused = s => reviewerRefused(s) || CODEX_CODE.test(s);

// The reset time the newest session file of Codex thread `thread` gives, when its last turn ended on the usage limit.
function sessionReset(thread, home, now) {
  if (typeof thread !== 'string' || !/^[\w-]+$/.test(thread)) return null;
  const mtime = f => { try { return fs.statSync(f).mtimeMs; } catch { return 0; } };
  const [file] = rollouts(home, thread).sort((a, b) => mtime(b) - mtime(a));
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return null; }
  let last = null;
  for (const l of text.split('\n')) {
    if (!l.startsWith('{')) continue;
    try { const e = JSON.parse(l); if (e?.type === 'event_msg' && e.payload?.type === 'task_complete') last = e; } catch { /* not an event */ }
  }
  const err = last?.payload?.error;
  if (!plain(err) || err.codex_error_info !== 'usage_limit_exceeded') return null;
  const at = Date.parse(last.timestamp);
  return resetIn(err.message, Number.isFinite(at) ? at : now);
}

const CODEX_HOME = () => process.env.CODEX_HOME || `${os.homedir()}/.codex`;

// Whether Codex's log `text` ends refused for the usage limit: { resets, type }, resets being the reset time in ms that
// its message gives, read from when it was written, or else its session file's, or null. `thread` is the build's
// session, when its log doesn't name it.
export function codexLimitInLog(text, { thread, home = CODEX_HOME(), now = Date.now() } = {}) {
  const hit = refusalIn(text, codexFailure, codexRefused);
  if (!hit) return null;
  const resets = resetIn(hit.said, hit.at ?? now) ?? sessionReset(threadId(text) ?? thread, home, now);
  return { resets, type: null };
}

const cursorFailure = e => {
  if (!(e.type === 'error' || e.is_error === true || e.subtype === 'error')) return null;
  return [e.result, e.message, e.error, e.error?.message, e.detail].filter(v => typeof v === 'string').join(' ');
};
const cursorRefused = s => reviewerRefused(s) || CURSOR_CODE.test(s);

// The same for Cursor's stream-json output `text`, with the reset time its message gives, read from `now`.
export function cursorLimitInLog(text, { now = Date.now() } = {}) {
  const hit = refusalIn(text, cursorFailure, cursorRefused);
  return hit && { resets: resetIn(hit.said, now), type: null };
}
