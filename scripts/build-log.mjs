// Build logs as people read them, and the end of one as the board shows it (0176).

import fs from 'node:fs';

// A build log as people read it. With `--output-format stream-json`, Claude Code writes one JSON event per line as it
// works: these become the agent's text and one line per tool call ("→ Bash: run the tests"), and the rest (tool output,
// session and rate-limit events) are left out. Any other line, such as plain `claude -p` output or an error, is kept as is.
// With `times`, each agent message, tool call and failed tool result starts with its event's local time (`HH:MM:SS `),
// when the event has an ISO 8601 timestamp that reads as a date.
const LOG_DETAIL = 200;
export function readableLog(text, { times = false } = {}) {
  return readable(text, times, null).out.join('\n');
}

// readableLog's lines. last is the agent's latest text before this text starts, or UNSAID when it isn't known (a
// piece cut from the end of a log); unsure then says whether a result needed it, so it may be wrong.
const UNSAID = Symbol('unsaid');
function readable(text, times, last) {
  const out = [];
  let unsure = false;
  const short = s => { s = String(s).replace(/\s+/g, ' ').trim(); return s.length > LOG_DETAIL ? `${s.slice(0, LOG_DETAIL - 1)}…` : s; };
  const two = n => String(n).padStart(2, '0');
  const clock = t => {
    const d = times && typeof t === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(t) ? new Date(t) : null;
    return d && !Number.isNaN(d.getTime()) ? `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())} ` : '';
  };
  for (const line of String(text ?? '').split('\n')) {
    let e = null;
    if (line.startsWith('{')) { try { e = JSON.parse(line); } catch { /* not an event */ } }
    if (!e || typeof e !== 'object' || typeof e.type !== 'string') { out.push(line); continue; }
    const at = clock(e.timestamp);
    if (e.type === 'assistant' && Array.isArray(e.message?.content)) {
      for (const b of e.message.content) {
        if (b?.type === 'text' && typeof b.text === 'string' && b.text.trim()) { out.push(at + b.text.trim(), ''); last = b.text.trim(); }
        else if (b?.type === 'tool_use') {
          const i = b.input && typeof b.input === 'object' ? b.input : {};
          const what = i.description || i.command || i.file_path || i.path || i.pattern || i.url || i.query || i.prompt || i.skill || '';
          out.push(`${at}→ ${b.name || 'tool'}${what ? `: ${short(what)}` : ''}`);
        }
      }
    } else if (e.type === 'user' && Array.isArray(e.message?.content)) {
      for (const b of e.message.content) {
        if (b?.type !== 'tool_result' || b.is_error !== true) continue;
        const c = typeof b.content === 'string' ? b.content : Array.isArray(b.content) ? b.content.map(x => x?.text || '').join(' ') : '';
        out.push(`${at}  ✗ ${short(c) || 'failed'}`);
      }
    } else if (e.type === 'result') {
      const r = typeof e.result === 'string' ? e.result.trim() : '';
      if (r && last === UNSAID) unsure = true;
      if (r && r !== last) out.push(r);
      if (e.is_error === true || (e.subtype && e.subtype !== 'success')) out.push(`Build ended: ${e.subtype || 'error'}`);
    }
  }
  return { out, unsure };
}

// The last n lines of a build log as readableLog shows them, trailing blank lines dropped, or null when there are none.
// It reads only the end of the log, twice as much each time until that holds those lines, so a big log costs no more
// than a small one. What it found is kept until the log changes, so a log read once isn't read again.
const LOG_PIECE = 64 * 1024;
const logTails = new Map(); // log file → { key, tail }
export function logTail(file, n = 50) {
  const fd = fs.openSync(file, 'r');
  try {
    const st = fs.fstatSync(fd);
    const key = `${st.dev}:${st.ino}:${st.size}:${st.mtimeMs}:${st.ctimeMs}`;
    const kept = logTails.get(file);
    if (kept?.key === key) return kept.tail;
    let tail;
    for (let want = LOG_PIECE; ; want *= 2) {
      const start = Math.max(0, st.size - want);
      const buf = Buffer.alloc(st.size - start);
      for (let got = 0; got < buf.length;) {
        const read = fs.readSync(fd, buf, got, buf.length - got, start + got);
        if (!read) throw new Error('the log got shorter while it was read');
        got += read;
      }
      // A piece that doesn't start the log starts after its first newline, so it holds whole lines only.
      const from = start ? buf.indexOf(10) + 1 : 0;
      if (start && !from) continue;
      const { out, unsure } = readable(buf.toString('utf8', from), false, start ? UNSAID : null);
      const lines = out.join('\n').replace(/\s+$/, '').split('\n');
      if (!start || (!unsure && lines.length > n)) { tail = lines.slice(-n).join('\n') || null; break; }
    }
    logTails.set(file, { key, tail });
    return tail;
  } finally { fs.closeSync(fd); }
}
