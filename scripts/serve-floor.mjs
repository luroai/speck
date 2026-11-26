// 0765: the factory floor, a page at speck serve's address, /floor, for a laptop or desktop window: a station for each
// project on `speck projects`' list that isn't off, numbered in the list's order, over the chosen project's four lanes
// side by side. Its page (templates/floor.html, with floor.css and floor.js) asks for them with POST /api/floor every
// 2 seconds. The answer has each project's summary, from its own panel, as All projects has it (0595), how many tickets
// it shipped on each of the last 14 days, from its board, and the chosen project's board, which the page makes into
// its lanes with the panel's own model, each read from that project's panel, whatever speck it's on.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { TEMPLATES } from './core.mjs';
import { summaryOf } from './panel-projects.mjs';
import { floorUsage } from './subscriptions.mjs';

const DAYS = 14; // the station's line: a day each, today last
// How long a panel has to give its board, and how much of it is read; how long an answer waits for a board being read,
// as one that comes later is kept for the next answer, so a slow panel never holds up the floor.
const BOARD_MS = 5000, BOARD_BYTES = 64 << 20, BOARD_WAIT_MS = 1500;
const FILES = { '/floor': ['floor.html', 'text/html'], '/floor.css': ['floor.css', 'text/css'], '/floor.js': ['floor.js', 'text/javascript'] };

// Answers a GET for the floor's page or one of its own files, read afresh as the panel's are, and returns true; false
// for anything else. The panel's model, typefaces and icons it loads come from beside it, as the panel's own files.
export function floorFile(where, res) {
  if (!Object.hasOwn(FILES, where)) return false;
  const [name, type] = FILES[where], file = path.join(TEMPLATES, name);
  const answer = (status, kind, body) => { res.writeHead(status, { 'Content-Type': `${kind}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(body); };
  let body;
  try { body = fs.readFileSync(file); } catch (e) { answer(500, 'text/plain', `Couldn't read ${file}: ${e.message}\nPut the file back, then reload.\n`); return true; }
  answer(200, type, body);
  return true;
}

// A project's station on the floor, by its folder, which never goes to the page: the same whichever port its panel is on.
export const stationKey = folder => crypto.createHash('sha256').update(String(folder)).digest('hex').slice(0, 12);

// How many of a board's `tickets` shipped on each of the DAYS days up to `now`'s, oldest first, by the day on this
// machine's clock: those done, with a finished time, and not still being shipped, as the panel's Shipped counts them.
export function shippedDays(tickets, now = Date.now()) {
  const out = new Array(DAYS).fill(0), first = new Date(now);
  first.setHours(0, 0, 0, 0);
  first.setDate(first.getDate() - (DAYS - 1));
  for (const t of Array.isArray(tickets) ? tickets : []) {
    if (!t || typeof t !== 'object' || t.status !== 'done' || (t.ship && typeof t.ship === 'object' && t.ship.running === true)) continue;
    const at = typeof t.finished === 'string' ? Date.parse(t.finished) : NaN;
    if (!Number.isFinite(at)) continue;
    const day = new Date(at);
    day.setHours(0, 0, 0, 0);
    const i = Math.round((day.getTime() - first.getTime()) / 864e5); // a day of 23 or 25 hours, as the clocks change, still counts as one
    if (i >= 0 && i < DAYS) out[i]++;
  }
  return out;
}

// The board the panel on `to` gives its own page (/api/state), as text, or null when it doesn't give one within
// BOARD_MS. `via` is the port asking, which the panel answers as another speck, itself, never passing it on to a
// project chosen there. A board's number of 0 has it answer with the reading it has, or read it if it has changed (0177).
function boardOf(to, via) {
  return new Promise(resolve => {
    const parts = [];
    let size = 0, over = false;
    const up = http.get({ host: '127.0.0.1', port: to, path: '/api/state', headers: { host: `127.0.0.1:${to}`, 'x-speck-via': String(via), 'x-speck-board': '0' }, agent: false }, answer => {
      answer.on('data', d => { size += d.length; if (size > BOARD_BYTES) done(null); else parts.push(d); });
      answer.on('end', () => done(answer.statusCode === 200 ? Buffer.concat(parts).toString('utf8') : null));
      answer.on('error', () => done(null));
    });
    const timer = setTimeout(() => done(null), BOARD_MS);
    timer.unref();
    function done(v) { if (over) return; over = true; clearTimeout(timer); up.destroy(); resolve(v); }
    up.on('error', () => done(null));
  });
}

// Each panel's board for the floor's answers, by the panel's port, as { name, board }, name being a hash of it as the
// panel sent it. A panel's board is read at most once at a time, and an answer waits up to `wait` ms for it: a reading
// that comes later is kept for the next answer, one that fails forgets the board, and an unchanged one isn't parsed again.
export function floorBoards({ wait = BOARD_WAIT_MS } = {}) {
  const kept = new Map(), reading = new Map(); // port → { name, board }; port → its reading
  function keep(to, text) {
    if (text === null) return void kept.delete(to);
    const name = crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
    if (kept.get(to)?.name === name) return;
    let board = null;
    try { board = JSON.parse(text); } catch { /* not a board */ }
    if (!board || typeof board !== 'object' || Array.isArray(board) || !Array.isArray(board.tickets)) return void kept.delete(to);
    delete board.projects; // its project menu's list (0516): not the floor's, and it can name panels the address leaves out (0762)
    kept.set(to, { name, board });
  }
  return {
    // The board of the panel on `to`, as it is now, or as it last was while it's still being read; null when it gives none.
    async of(to, via) {
      if (!reading.has(to)) reading.set(to, boardOf(to, via).then(text => { reading.delete(to); keep(to, text); }));
      let timer;
      await Promise.race([reading.get(to), new Promise(r => { timer = setTimeout(r, wait); timer.unref(); })]);
      clearTimeout(timer);
      return kept.get(to) || null;
    },
    // Forgets the boards of panels on any port but `ports`.
    only(ports) { for (const to of [...kept.keys()]) if (!ports.has(to)) kept.delete(to); },
  };
}

// The floor's answer. A station for each project on the list (`listed`, each { folder, name, port }, port being where
// its panel answers or null), numbered in the list's order, with the summary its panel gives (0595's: its status, tone,
// counts and what needs you), whether it gave one (running), and its ships on each of the last 14 days (shipped_days),
// or null while its board can't be read. Then the chosen station, the one whose key is `station`, or else the first,
// with its board, unless the page has it already, as `have`, its name, says; board_name is null while it gives none.
// `live` holds the ports panels are running on, `via` is the address's own port and `boards` is floorBoards'.
// 0768: and `usage`, each subscription's tightest window (floorUsage's), from `readings`, newestUsage's for the projects.
export async function floorAnswer({ listed, live, via, station = null, have = null, boards, readings = {}, now = Date.now() }) {
  const read = await Promise.all(listed.map(async p => {
    const port = Number.isInteger(p.port) && live.has(p.port) ? p.port : null;
    if (port === null) return { p, port, summary: null, board: null };
    const [summary, board] = await Promise.all([summaryOf(port, via), boards.of(port, via)]);
    return { p, port, summary, board };
  }));
  boards.only(new Set(read.map(r => r.port).filter(to => to !== null)));
  const stations = read.map(({ p, port, summary, board }, i) => ({ ...(summary || {}), key: stationKey(p.folder), n: i + 1, name: p.name, port, running: !!summary,
    shipped_days: board ? shippedDays(board.board.tickets, now) : null }));
  const at = Math.max(0, stations.findIndex(s => s.key === station));
  if (!stations.length) return { stations, chosen: null, board_name: null }; // no projects, so no readings either
  let usage = [];
  try { usage = floorUsage(readings, now); } catch { /* none when the readings can't be read */ }
  const b = read[at].board;
  return { stations, chosen: stations[at].key, board_name: b ? b.name : null, ...(b && b.name !== have ? { board: b.board } : {}), usage };
}
