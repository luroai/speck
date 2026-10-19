// 0318: answering or dismissing a question the Foreman agent asked you (0287), from the panel or `speck foreman answer`
// and `speck foreman dismiss`. Each reply is kept in speck run's runs folder in a file of its own, taken only when it
// isn't there yet, so a question is dealt with once, however many try at the same moment. The reply is noted in the
// ticket's Notes. speck run's next check carries an answer out as the Foreman would its own instruction: it resumes the
// build's own session with it, or ships an approved ticket auto_ship covers again, once.
import fs from 'node:fs';
import path from 'node:path';
import { SpeckError, loadConfig, worktreeList, findRepoRoot } from './core.mjs';
import { buildTicket } from './build-records.mjs';
import { resumeFor } from './hand-back.mjs';
import { runWords } from './go-with.mjs';
import { readActions, noteInTicket, foremanSubject } from './foreman-agent.mjs';
import { statusData } from './speck.mjs';

// Not <id>.json, so nothing that reads the runs folder's build records takes one for one. <key>.claim while a reply is
// being noted, then <key>.json once it has been.
const PREFIX = 'run.foreman-answer.';
const stamp = at => String(at).replace(/\D/g, '');
// The question the Foreman asked about ticket `id` at `at`, as its reply's file names it.
export const askKey = (id, at) => `${id}.${stamp(at)}`;
const fileOf = (runs, key, ext) => path.join(runs, `${PREFIX}${key}.${ext}`);
const names = runs => { try { return fs.readdirSync(runs).filter(n => n.startsWith(PREFIX)); } catch { return []; } };

// The questions dealt with, or being dealt with, by their askKey.
export function dealtWith(runs) {
  return new Set(names(runs).flatMap(n => { const m = n.slice(PREFIX.length).match(/^(\d+\.\d+)\.(json|claim)$/); return m ? [m[1]] : []; }));
}

// The replies noted, each { key, id, ask_at, question, action, text, at, status, carry? }, carry being what speck run
// does with an answer: 'resume' or 'reship'.
export function readReplies(runs) {
  return names(runs).filter(n => n.endsWith('.json')).sort().flatMap(n => {
    try {
      const v = JSON.parse(fs.readFileSync(path.join(runs, n), 'utf8'));
      return v && typeof v === 'object' && typeof v.id === 'string' && ['answer', 'dismiss'].includes(v.action) ? [{ ...v, key: n.slice(PREFIX.length, -'.json'.length) }] : [];
    } catch { return []; }
  });
}

const textOf = v => (typeof v === 'string' ? v.trim() : '');
const oneLine = v => textOf(v).replace(/\s+/g, ' '); // kept to one line in the Notes
const readObject = file => { try { const v = JSON.parse(fs.readFileSync(file, 'utf8')); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; } catch { return null; } };
const sentence = v => (/[.!?]$/.test(v) ? v : `${v}.`);
const when = at => `${new Date(at).toISOString().slice(0, 16).replace('T', ' ')} UTC`;

// Answers (`action` 'answer', with `text`) or dismisses ('dismiss') the Foreman's latest question about ticket `rawId`.
// Every refusal comes before the first write, and says what to do. Returns what it says.
export function foremanReply(repo, action, rawId, text, { now = new Date(), env = process.env, tickets = null } = {}) {
  if (!['answer', 'dismiss'].includes(action) || !rawId) throw new SpeckError('Usage: speck foreman answer <id> "<your answer>" | speck foreman dismiss <id>');
  if (textOf(env.SPECK_FOREMAN_RUN)) throw new SpeckError('The Foreman can\'t answer or dismiss its own question: only you can.');
  const answer = oneLine(text);
  if (action === 'answer' && !answer) throw new SpeckError(`speck foreman answer needs your answer: speck foreman answer ${rawId} "<your answer>".`);
  const cfg = loadConfig(repo);
  let main = repo;
  try { main = worktreeList(repo)[0]?.path || repo; } catch { /* not a git checkout: this one */ }
  const runs = path.join(main, 'speck', '.cache', 'runs');
  let at, t;
  try { ({ at, t } = buildTicket(repo, cfg, rawId)); } catch (e) { if (e instanceof SpeckError) throw new SpeckError(`No ticket ${rawId}: ${e.message}`); throw e; }
  const id = t.fm.id;
  const mine = readActions(runs).filter(a => a.id === id);
  const ask = mine.filter(a => a.action === 'ask').pop();
  if (!ask) throw new SpeckError(`The Foreman hasn't asked you anything about ${id}, so there's nothing to answer or dismiss.`);
  if (typeof ask.at !== 'string' || !Number.isFinite(Date.parse(ask.at))) throw new SpeckError(`The Foreman's question about ${id} has no time in ${path.relative(main, runs)}, so it can't be answered or dismissed here. Answer it in the ticket's Notes, then carry on with /speck-build ${id}.`);
  const key = askKey(id, ask.at), done = fileOf(runs, key, 'json'), claim = fileOf(runs, key, 'claim');
  const already = () => {
    const r = readObject(done);
    return new SpeckError(`The Foreman's question about ${id} has already been dealt with${r ? `: you ${r.action === 'answer' ? 'answered' : 'dismissed'} it at ${when(r.at)}` : ''}. Nothing changed.`);
  };
  if (dealtWith(runs).has(key)) throw already();
  if (mine[mine.length - 1] !== ask) throw new SpeckError(`The Foreman's question about ${id} no longer waits for you: it has done something else about the ticket since. Nothing changed.`);
  if (t.fm.status !== ask.status) throw new SpeckError(`The Foreman's question about ${id} no longer waits for you: the ticket has moved on from ${ask.status} to ${t.fm.status}. Nothing changed.`);
  let carry = null;
  if (action === 'answer') {
    const row = t.fm.status === 'approved' ? (tickets || statusData(repo).tickets).find(x => String(x.id) === id) : null;
    if (row && row.auto_ship === true) carry = 'reship';
    else {
      const rec = readObject(path.join(runs, `${id}.json`));
      const cant = !rec ? 'it has no run record from speck run' : resumeFor(runWords(cfg), cfg, id, rec, '').why;
      if (cant) throw new SpeckError(`speck run can't resume ticket ${id}'s build (${cant}), so your answer wasn't recorded. Dismiss the question with speck foreman dismiss ${id}, then carry on with /speck-build ${id} yourself.`);
      carry = 'resume';
    }
  }
  const question = oneLine(ask.text);
  const record = { id, ask_at: ask.at, question, action, text: answer, at: now.toISOString(), status: t.fm.status, ...(carry ? { carry } : {}) };
  try { fs.writeFileSync(claim, `${JSON.stringify(record)}\n`, { flag: 'wx' }); }
  catch (e) { if (e.code === 'EEXIST') throw already(); throw new SpeckError(`Couldn't write your reply in ${path.relative(main, runs)} (${e.message}), so nothing changed. Check you can write to that folder, then try again.`); }
  // A reply that finished between the check and the claim.
  if (fs.existsSync(done)) { fs.rmSync(claim, { force: true }); throw already(); }
  const line = action === 'answer' ? `- You answered the Foreman (${when(now)}): ${sentence(answer)} Its question: ${question}`
    : `- You dismissed the Foreman's question (${when(now)}): ${question}`;
  try { noteInTicket(at, t, line, `${foremanSubject(id)} ${action}`); } catch (e) { fs.rmSync(claim, { force: true }); throw e; }
  try { fs.renameSync(claim, done); } catch (e) {
    throw new SpeckError(`Your reply is noted in ${id}'s Notes, but speck run couldn't be told of it (${e.message}). Check you can write to ${path.relative(main, runs)}, then carry on with /speck-build ${id} yourself.`);
  }
  if (action === 'dismiss') return `Dismissed the Foreman's question about ${id}, and noted it in its Notes. The ticket is left as it is.`;
  return carry === 'reship' ? `Noted your answer in ${id}'s Notes. speck run ships it again, once, on its next check while it's on.`
    : `Noted your answer in ${id}'s Notes. speck run resumes its build with your answer on its next check while it's on.`;
}

// The panel's write: `body` is the request's, JSON with the answer's text. Returns { status, body } for the server.
export function panelForemanReply(repo, id, action, body, o = {}) {
  let text = '';
  if (action === 'answer') {
    let v = null;
    try { v = JSON.parse(body || ''); } catch { /* refused below */ }
    if (!v || typeof v !== 'object' || typeof v.text !== 'string') return { status: 400, body: { error: 'The answer didn\'t arrive as the panel sends it. Reload the page and try again.' } };
    text = v.text;
  }
  try { return { status: 200, body: { message: foremanReply(repo, action, id, text, o) } }; }
  catch (e) { return e instanceof SpeckError ? { status: 409, body: { error: e.message } } : { status: 500, body: { error: String(e?.message || e) } }; }
}

// speck foreman answer|dismiss <id> ["<text>"]. Everything after the id is the answer, even words starting with --.
export function cmdForemanReply(args) {
  const [action, id, ...rest] = args;
  console.log(foremanReply(findRepoRoot(), action, id, rest.join(' ')));
}
