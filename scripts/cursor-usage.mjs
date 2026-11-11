// 0643: Cursor's usage, read from the /usage screen of its interactive agent, as nothing else Cursor has reports it:
// in print mode /usage goes to the model as a prompt. speck opens the agent with no prompt in a pseudo-terminal that
// `script` gives (util-linux on Linux, BSD on macOS), types /usage, follows the screen's drawing codes to read its text,
// then closes it, so no model runs. It opens it in an empty folder of speck's own (cursorUsageDir), trusted with
// --trust so it never stops to ask, and so none of the project's own Cursor rules or tools load. The reading runs in a process of its own (this file, run with node), so
// `speck agents` can wait for it, and is given at most CURSOR_USAGE_TIMEOUT_MS. Whatever happens, everything it
// started is stopped before it ends.

import fs from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const CURSOR_USAGE_TIMEOUT_MS = 20_000;
const COLS = 120, ROWS = 40;
const SELF = fileURLToPath(import.meta.url);

// ---------- the screen ----------

// The text a terminal of `cols` by `rows` shows after `raw`, with every line that scrolled off the top before it, each
// line without trailing spaces. It follows what Cursor's screen uses: moving the cursor, erasing and scrolling. Colours,
// modes and the terminal's titles are skipped.
export function screenText(raw, { cols = COLS, rows = ROWS } = {}) {
  const blank = () => Array(cols).fill(' ');
  const grid = Array.from({ length: rows }, blank), history = [];
  let r = 0, c = 0, saved = [0, 0];
  const clampR = v => Math.max(0, Math.min(rows - 1, v)), clampC = v => Math.max(0, Math.min(cols - 1, v));
  const down = () => { if (r < rows - 1) r++; else { history.push(grid.shift()); grid.push(blank()); } };
  const s = String(raw ?? '');
  for (let i = 0; i < s.length;) {
    const ch = s[i];
    if (ch === '\x1b') {
      const next = s[i + 1];
      if (next === '[') {
        const m = /^\x1b\[([<=>?]?)([0-9;:]*)([ -/]*)([@-~])/.exec(s.slice(i, i + 64));
        if (!m) { i += 2; continue; }
        i += m[0].length;
        if (m[1] || m[3]) continue; // private modes, keyboard protocols and the like
        const ps = m[2].split(/[;:]/).map(n => (n === '' ? null : Number(n))), n = ps[0] ?? 1, n0 = ps[0] ?? 0;
        switch (m[4]) {
          case 'A': r = clampR(r - n); break;
          case 'B': r = clampR(r + n); break;
          case 'C': c = clampC(c + n); break;
          case 'D': c = clampC(Math.min(c, cols - 1) - n); break;
          case 'E': r = clampR(r + n); c = 0; break;
          case 'F': r = clampR(r - n); c = 0; break;
          case 'G': case '`': c = clampC(n - 1); break;
          case 'd': r = clampR(n - 1); break;
          case 'H': case 'f': r = clampR((ps[0] ?? 1) - 1); c = clampC((ps[1] ?? 1) - 1); break;
          case 'K': {
            const row = grid[r], from = n0 === 0 ? Math.min(c, cols) : 0, to = n0 === 1 ? Math.min(c + 1, cols) : cols;
            for (let k = from; k < to; k++) row[k] = ' ';
            break;
          }
          case 'J':
            if (n0 === 2 || n0 === 3) { for (const row of grid) row.fill(' '); }
            else if (n0 === 1) { for (let k = 0; k < r; k++) grid[k].fill(' '); for (let k = 0; k <= Math.min(c, cols - 1); k++) grid[r][k] = ' '; }
            else { for (let k = Math.min(c, cols); k < cols; k++) grid[r][k] = ' '; for (let k = r + 1; k < rows; k++) grid[k].fill(' '); }
            break;
          case 'X': for (let k = c; k < Math.min(cols, c + n); k++) grid[r][k] = ' '; break;
          case 'P': grid[r].splice(c, n); while (grid[r].length < cols) grid[r].push(' '); break;
          case '@': grid[r].splice(c, 0, ...Array(n).fill(' ')); grid[r].length = cols; break;
          case 's': saved = [r, c]; break;
          case 'u': [r, c] = saved; break;
          default: break; // colours (m) and anything else that doesn't move text
        }
      } else if (next === ']' || next === 'P' || next === '_' || next === '^') {
        // A title, a query or another string, ending at BEL or ESC \.
        let end = i + 2;
        while (end < s.length && s[end] !== '\x07' && !(s[end] === '\x1b' && s[end + 1] === '\\')) end++;
        i = end + (s[end] === '\x07' ? 1 : 2);
      } else {
        if (next === '7') saved = [r, c];
        else if (next === '8') [r, c] = saved;
        else if (next === 'M') { if (r > 0) r--; }
        else if (next === 'D') down();
        else if (next === 'E') { down(); c = 0; }
        i += next === '(' || next === ')' || next === '#' ? 3 : 2;
      }
      continue;
    }
    i++;
    if (ch === '\r') c = 0;
    else if (ch === '\n' || ch === '\v' || ch === '\f') down();
    else if (ch === '\b') c = Math.max(0, Math.min(c, cols - 1) - 1);
    else if (ch === '\t') c = Math.min(cols - 1, (Math.floor(c / 8) + 1) * 8);
    else if (ch >= ' ' && ch !== '\x7f') {
      if (c >= cols) { c = 0; down(); }
      grid[r][c++] = ch;
    }
  }
  return [...history, ...grid].map(row => row.join('').replace(/\s+$/, ''));
}

// ---------- what it shows ----------

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const money = s => Number(String(s).replace(/[$,]/g, ''));
const MONEY = String.raw`\$[\d,]+(?:\.\d+)?`;

// The day `said` names, such as `12 Nov` or `Nov 12`, as YYYY-MM-DD: the first such day from yesterday on, as the screen
// gives no year. null when it isn't a day.
export function resetsOn(said, now = Date.now()) {
  const m = /^(\d{1,2})\s+([A-Za-z]{3})[a-z]*$/.exec(said) || /^([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2})$/.exec(said);
  if (!m) return null;
  const [day, mon] = /^\d/.test(m[1]) ? [Number(m[1]), m[2]] : [Number(m[2]), m[1]];
  const month = MONTHS.indexOf(mon.toLowerCase());
  if (month < 0 || day < 1 || day > 31) return null;
  const today = new Date(now), yesterday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1);
  for (const year of [today.getUTCFullYear(), today.getUTCFullYear() + 1]) {
    const at = Date.UTC(year, month, day);
    if (new Date(at).getUTCDate() !== day) continue;
    if (at >= yesterday) return new Date(at).toISOString().slice(0, 10);
  }
  return null;
}

// Cursor's usage in the text of its /usage screen: { reading } or { why } in a few words, when the screen doesn't show
// everything speck reads. The reading is { read_at, plan, resets_on, windows: { included, auto, api }, each with
// used_percent, on_demand: { spent, limit } }, in dollars, limit null when there's no monthly limit. Of several
// screens, the last one counts.
export function parseCursorUsage(lines, now = Date.now()) {
  const text = Array.isArray(lines) ? lines : String(lines ?? '').split('\n');
  const head = text.findLastIndex(l => /^\s*Usage\s+[•·]\s+\S/.test(l));
  if (head < 0) return { why: 'it showed no usage screen' };
  const top = /^\s*Usage\s+[•·]\s+(.+?)(?:\s{2,}Resets\s+(.+?))?\s*$/.exec(text[head]);
  const plan = top[1].trim(), resets = top[2] ? resetsOn(top[2].trim(), now) : null;
  if (!resets) return { why: 'its usage screen shows no reset day' };
  const rest = text.slice(head + 1), windows = {};
  for (const [key, label] of [['included', 'Included'], ['auto', 'Auto'], ['api', 'API']]) {
    const row = rest.map(l => new RegExp(`^\\s*${label}\\s+(\\d+(?:\\.\\d+)?)%\\s+used\\b`).exec(l)).find(Boolean);
    if (!row) return { why: `its usage screen has no ${label} row` };
    windows[key] = { used_percent: Number(row[1]) };
  }
  const at = rest.findIndex(l => /^\s*On-Demand\s/.test(l));
  const od = at < 0 ? null : new RegExp(`^\\s*On-Demand\\s+(${MONEY})(?:\\s*/\\s*(${MONEY}))?`).exec(rest[at]);
  if (!od) return { why: 'its usage screen has no On-Demand row' };
  const after = rest.slice(at + 1).find(l => l.trim()) ?? '';
  let limit;
  if (od[2]) limit = money(od[2]);
  else if (/\bno monthly limit\b/i.test(after)) limit = null;
  else {
    const said = new RegExp(`(${MONEY}).*\\blimit\\b|\\blimit\\b.*?(${MONEY})`, 'i').exec(after);
    if (!said) return { why: 'its usage screen gives no on-demand limit' };
    limit = money(said[1] ?? said[2]);
  }
  return { reading: { read_at: new Date(now).toISOString(), plan, resets_on: resets, windows, on_demand: { spent: money(od[1]), limit } } };
}

// ---------- reading it ----------

// The command that runs Cursor's CLI `command` in a pseudo-terminal of COLS by ROWS on `platform`: [cmd, args].
export function ptyCommand(command, platform = process.platform) {
  const inner = `stty cols ${COLS} rows ${ROWS} 2>/dev/null; exec ${command} --trust`;
  return platform === 'darwin' ? ['script', ['-q', '/dev/null', 'sh', '-c', inner]] : ['script', ['-qfec', inner, '/dev/null']];
}

// Every process descended from `pid`, from ps, which Linux and macOS both have.
function descendants(pid) {
  const r = spawnSync('ps', ['-A', '-o', 'pid=,ppid='], { encoding: 'utf8' });
  const kids = new Map();
  for (const line of String(r.stdout || '').split('\n')) {
    const [p, pp] = line.trim().split(/\s+/).map(Number);
    if (p && pp) kids.set(pp, [...(kids.get(pp) || []), p]);
  }
  const out = [], todo = [pid];
  while (todo.length) for (const k of kids.get(todo.pop()) || []) if (!out.includes(k)) { out.push(k); todo.push(k); }
  return out;
}
const alive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
const signal = (pid, sig) => { try { process.kill(pid, sig); } catch { /* already gone */ } };
const pause = ms => new Promise(res => setTimeout(res, ms));

// Reads Cursor's usage by opening `command` in `cwd`: { reading } or { why }. Gives up after `timeoutMs`. Stops the
// agent and everything it started before it resolves.
export function readCursorUsage({ command = 'agent', cwd = process.cwd(), timeoutMs = CURSOR_USAGE_TIMEOUT_MS, now = () => Date.now() } = {}) {
  return new Promise(resolve => {
    const [cmd, args] = ptyCommand(command);
    let child;
    try { child = spawn(cmd, args, { cwd, env: { ...process.env, TERM: 'xterm-256color' }, stdio: ['pipe', 'pipe', 'pipe'], detached: true }); }
    catch (e) { resolve({ why: `couldn't start it (${e.message})` }); return; }
    let raw = '', state = 'starting', done = false, exited = false, idle, settle, lastWhy = null;
    const started = Date.now();
    const type = text => { if (!exited) try { child.stdin.write(text); } catch { /* it closed */ } };
    child.stdin.on('error', () => {});
    const finish = async result => {
      if (done) return;
      done = true;
      clearTimeout(idle); clearTimeout(settle); clearTimeout(timer);
      const family = [child.pid, ...descendants(child.pid)];
      if (!exited) {
        // Close the screen, then the agent, as a person would: Esc, then Ctrl+C twice.
        type('\x1b'); await pause(300); type('\x03'); await pause(300); type('\x03');
        for (let k = 0; k < 15 && family.some(alive); k++) await pause(100);
      }
      for (const sig of ['SIGTERM', 'SIGKILL']) {
        const left = family.filter(alive);
        if (!left.length) break;
        signal(-child.pid, sig);
        for (const p of left) signal(p, sig);
        for (let k = 0; k < 10 && left.some(alive); k++) await pause(100);
      }
      resolve(result);
    };
    const check = () => {
      if (done) return;
      const lines = screenText(raw);
      if (state === 'starting') {
        if (lines.some(l => /trust this workspace/i.test(l))) { finish({ why: `it asks whether to trust this folder: run ${command} here once and trust it` }); return; }
        if (!lines.some(l => /\bCursor Agent\b/.test(l))) return;
        state = 'asked';
        type('/usage');
        setTimeout(() => type('\r'), 400);
        return;
      }
      const got = parseCursorUsage(lines, now());
      if (got.reading) { finish(got); return; }
      lastWhy = got.why;
      // A usage screen that has settled without what speck reads won't show it.
      if (got.why !== 'it showed no usage screen') settle = setTimeout(() => finish({ why: `${got.why}` }), 1500);
    };
    child.stdout.on('data', d => {
      raw += d.toString('utf8');
      clearTimeout(idle); clearTimeout(settle);
      // The welcome screen is drawn in bursts: wait until it settles before typing.
      idle = setTimeout(check, state === 'starting' ? 700 : 100);
    });
    child.stderr.on('data', () => {});
    child.on('error', e => { exited = true; finish({ why: e.code === 'ENOENT' ? 'this system has no script command, which speck opens its screen with' : `couldn't start it (${e.message})` }); });
    child.on('exit', () => {
      exited = true;
      if (done) return;
      const got = state === 'asked' ? parseCursorUsage(screenText(raw), now()) : {};
      finish(got.reading ? got : { why: `it closed before showing its usage${got.why && got.why !== 'it showed no usage screen' ? ` (${got.why})` : ''}` });
    });
    const timer = setTimeout(() => {
      const secs = Math.round((Date.now() - started) / 1000);
      finish({ why: `its usage screen couldn't be read within ${secs} seconds${lastWhy && lastWhy !== 'it showed no usage screen' ? ` (${lastWhy})` : ''}` });
    }, timeoutMs);
  });
}

// The same, waiting for it, in a node process of its own: for `speck agents`, which waits for each agent. Never throws.
export function readCursorUsageSync({ command = 'agent', cwd = process.cwd(), timeoutMs = CURSOR_USAGE_TIMEOUT_MS } = {}) {
  const r = spawnSync(process.execPath, [SELF, command, String(timeoutMs)], { cwd, encoding: 'utf8', timeout: timeoutMs + 10_000, stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.error) return { why: r.error.code === 'ETIMEDOUT' ? `its usage screen couldn't be read within ${Math.round(timeoutMs / 1000)} seconds` : `couldn't start it (${r.error.message})` };
  try {
    const got = JSON.parse(String(r.stdout).trim().split('\n').pop());
    if (got && typeof got === 'object' && (got.reading || typeof got.why === 'string')) return got;
  } catch { /* below */ }
  const line = String(r.stderr || '').trim().split('\n').pop();
  return { why: `reading it failed${line ? ` (${line.slice(0, 200)})` : ''}` };
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === SELF) {
  const [command, ms] = process.argv.slice(2);
  readCursorUsage({ command: /^[\w.-]+$/.test(command || '') ? command : 'agent', cwd: process.cwd(), timeoutMs: Number(ms) > 0 ? Number(ms) : CURSOR_USAGE_TIMEOUT_MS })
    .then(got => { process.stdout.write(`${JSON.stringify(got)}\n`); }, e => { process.stdout.write(`${JSON.stringify({ why: `reading it failed (${e.message})` })}\n`); });
}
