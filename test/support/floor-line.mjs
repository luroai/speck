// 0766: shared helpers for the tests of the line on the factory floor: the page's nodes on fakePage's DOM, and floor
// answers whose stations' summaries give a line as 0764's projectSummary does.
import { summary } from './floor.mjs';

export const nodes = (n, out = []) => { out.push(n); for (const c of n.children || []) nodes(c, out); return out; };
export const classes = n => String(n.className || '').split(' ');
export const byClass = (root, cls) => nodes(root).filter(n => classes(n).includes(cls));
export const textOf = (root, cls) => { const n = byClass(root, cls)[0]; return n ? n.textContent : null; };

// A stopped clock: 26 Nov 2026, 15:30 on this machine's clock, and times before it.
export const NOW = new Date(2026, 10, 26, 15, 30).getTime();
export const minutesAgo = m => new Date(NOW - m * 60000).toISOString();
export const at = (h, m = 0) => new Date(2026, 10, 26, h, m).toISOString();

// A ticket at a station, as the line's `work` gives it.
export const run = (id, station, o = {}) => ({ id, title: `Ticket ${id}`, station, agent: 'claude', agent_name: 'Claude Code', model: 'its own default', model_slug: '',
  effort: 'default effort', why: 'settings', level: null, stands_in_for: null, since: null, ...o });

// What each station would run on, as the line's `idle` gives it.
const idle = (o = {}) => ({
  builder: { agent: 'claude', agent_name: 'Claude Code', model: 'its own default', model_slug: '', effort: 'default effort' },
  reviewer: { agent: 'codex', agent_name: 'Codex', model: 'default model', model_slug: '', effort: 'default effort' },
  qa: { agent: 'codex', agent_name: 'Codex', model: 'default model', model_slug: '', effort: 'default effort', set_up: true }, ...o });

// alpha's line: two at the builder, one at the reviewer on a stand-in, one at QA still to run, five ready and three at
// Ship; `o` over it.
export const lineOf = (o = {}) => ({
  work: [
    run('0101', 'builder', { title: 'Paint the shed', model: 'Opus 4.5', model_slug: 'opus', effort: 'high', why: 'level', level: 'deep', since: minutesAgo(12) }),
    run('0102', 'builder', { title: 'Mend the gate', agent: 'cursor', agent_name: 'Cursor', model: 'default model', effort: null, why: 'ticket', since: minutesAgo(125) }),
    run('0103', 'reviewer', { title: 'Sweep the yard', why: 'bench', stands_in_for: { agent: 'codex', agent_name: 'Codex' }, since: new Date(NOW - 20000).toISOString() }),
    run('0104', 'qa', { title: 'Check the lights', agent: 'codex', agent_name: 'Codex', model: 'gpt-5', model_slug: 'gpt-5', effort: 'medium' }),
  ],
  idle: idle(),
  queue: { ready: 5, next: ['0110', '0111', '0112'] },
  ship: [{ id: '0120', title: 'Ready to go', yours: true, shipping: false }, { id: '0121', title: 'On its way', yours: false, shipping: true },
    { id: '0122', title: 'In the queue', yours: false, shipping: false }],
  ...o });

// bravo's: nothing on it, its builder a model provider's, and no QA set up.
export const quietLine = () => ({ work: [], queue: { ready: 0, next: [] }, ship: [],
  idle: idle({ builder: { agent: 'local', agent_name: 'Local LLM', model: 'llama-3', model_slug: 'llama-3', effort: null },
    qa: { agent: 'codex', agent_name: 'Codex', model: 'default model', model_slug: '', effort: 'default effort', set_up: false } }) });

const KEYS = { alpha: 'a1a1a1a1a1a1', bravo: 'b2b2b2b2b2b2', charlie: 'c3c3c3c3c3c3' };
const station = (n, name, o = {}) => ({ ...summary(), key: KEYS[name], n, name, port: 4800 + n, running: true, shipped_days: new Array(14).fill(0), ...o });

// The floor's answer: alpha busy, bravo idle and charlie not answering. `alpha` and `bravo` give their lines (null: none).
export const lineAnswer = ({ alpha = lineOf(), bravo = quietLine(), alphaMood = 'focused' } = {}) => ({
  stations: [
    station(1, 'alpha', { status: 'Building 2', tone: 'ok', busy: true, building: 2, mood: alphaMood, line: alpha }),
    station(2, 'bravo', { line: bravo }),
    { key: KEYS.charlie, n: 3, name: 'charlie', port: null, running: false, shipped_days: null },
  ],
  chosen: KEYS.alpha, board_name: null });
