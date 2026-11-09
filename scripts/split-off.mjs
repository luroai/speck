// 0563: speck split-off, the size guard's split once speck has chosen it (watch: fix). The resumed build gives the scope
// its ticket is giving up, and this makes the new ticket that holds it: ready, as its scope was approved when the
// original was set ready, to run after the original, committed on the base branch, where speck new knows every ticket
// number in use and speck run looks for ready tickets. With worktrees off the build has the main checkout on its own
// branch, so a short-lived checkout of the base branch takes the commit, leaving the build's files as they are.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { SpeckError, contentLines, findRepoRoot, listTickets, loadConfig, speckNameOf, parseTicket, setField, sh, syncHeader, worktreeList } from './core.mjs';
import { fixingOf } from './foreman.mjs';
import { buildTicket } from './build-records.mjs';
import { commitTicketOnly, replaceSection } from './close.mjs';
import { FOREMAN_CHOSE } from './go-with.mjs';
import { lintTicket } from './lint.mjs';
import { questionFacts } from './question-facts.mjs';

const CLI = fileURLToPath(new URL('./speck.mjs', import.meta.url));
const USAGE = 'Usage: speck split-off <id> "<title>" --from=<file>, the file holding the new ticket\'s ## Problem, ## Outcome, ## Acceptance criteria and, if it has one, ## Out of scope.';
const NEEDED = ['Problem', 'Outcome', 'Acceptance criteria'];
const COPIED = ['priority', 'size', 'risk', 'kind', 'type']; // as the original's, so its review and auto_ship stay as they were
const CAME_FROM = id => `Split off from ticket ${id}`;

// The sections of a scope file by lower-cased name: each one's text.
function scopeSections(text) {
  const out = new Map();
  let name = null;
  for (const line of text.split('\n')) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) { name = m[1].toLowerCase(); out.set(name, []); } else if (name) out.get(name).push(line);
  }
  return new Map([...out].map(([k, v]) => [k, v.join('\n').trim()]));
}

// Returns the new ticket's id. Every refusal comes before the first write.
export function splitOff(repo, rawId, title, from) {
  if (!rawId || !title || !from) throw new SpeckError(USAGE);
  const cfg = loadConfig(repo);
  let t;
  try { ({ t } = buildTicket(repo, cfg, rawId)); } catch (e) { if (e instanceof SpeckError) throw new SpeckError(`No ticket ${rawId}: ${e.message}`); throw e; }
  const id = t.fm.id, recommended = questionFacts(contentLines(t.sections['blocked question']));
  const chose = (t.sections.notes || []).some(line => line.includes(`Went with the recommendation: ${recommended.recommendation} (${FOREMAN_CHOSE}`));
  if (!['building', 'reviewing'].includes(t.fm.status) || recommended.sizeGuard !== true || !chose)
    throw new SpeckError(`A split-off ticket is made only once ${speckNameOf(cfg)} chose the size guard's split for a ticket being built, and it didn't for ${id}. Nothing changed. Ask for the ticket you need with /speck-ticket.`);
  let text;
  try { text = fs.readFileSync(path.resolve(from), 'utf8'); } catch (e) { throw new SpeckError(`Couldn't read the scope file ${from} (${e.code || e.message}), so no ticket was made. ${USAGE}`); }
  const scope = scopeSections(text), missing = NEEDED.filter(n => !scope.get(n.toLowerCase()));
  if (missing.length) throw new SpeckError(`The scope file has nothing under ${missing.map(n => `## ${n}`).join(', ')}, so no ticket was made. ${USAGE}`);
  return onBase(repo, cfg, main => writeSplitOff(main, cfg, t, id, title, scope));
}

// Calls `use` with a checkout of the base branch: the one that has it, or else one made just for this and removed after.
function onBase(repo, cfg, use) {
  const have = worktreeList(repo).find(w => w.branch === cfg.base_branch);
  if (have) return use(have.path);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-split-off-'));
  const added = sh('git', ['worktree', 'add', '-q', '--force', dir, cfg.base_branch], { cwd: repo });
  if (added.status !== 0) { fs.rmSync(dir, { recursive: true, force: true }); throw new SpeckError(`Couldn't check out ${cfg.base_branch} to commit the split-off ticket, so no ticket was made:\n${(added.stderr || '').trim()}`); }
  try { return use(dir); }
  finally { sh('git', ['worktree', 'remove', '--force', dir], { cwd: repo }); fs.rmSync(dir, { recursive: true, force: true }); }
}

function writeSplitOff(main, cfg, t, id, title, scope) {
  const made = listTickets(main).find(x => contentLines(x.sections?.notes).some(l => l.includes(CAME_FROM(id))));
  if (made) throw new SpeckError(`Ticket ${id} already has its split-off ticket, ${made.fm.id}, so no other was made.`);
  const r = spawnSync(process.execPath, [CLI, 'new', title], { cwd: main, encoding: 'utf8' });
  if (r.status !== 0) throw new SpeckError(`speck new refused the split-off ticket: ${(r.stderr || r.stdout).trim()}`);
  const file = path.resolve(main, r.stdout.trim().split('\n').pop()), rel = path.relative(main, file);
  const drop = why => { fs.rmSync(file, { force: true }); throw new SpeckError(`${why}\nNo ticket was made. Correct the scope file, then run this again.`); };
  const raw = fs.readFileSync(file, 'utf8');
  let body = raw;
  const fill = (n, v) => { try { body = replaceSection(body, n, () => v, rel); } catch (e) { if (e instanceof SpeckError) drop(e.message); throw e; } };
  for (const n of [...NEEDED, 'Out of scope']) if (scope.get(n.toLowerCase())) fill(n, scope.get(n.toLowerCase()));
  const note = `- ${CAME_FROM(id)}, because its build went over the size limit (\`limits.max_changed_lines\`) and speck took the split it recommended, as watch is ${fixingOf(cfg) === 'decide' ? 'decide' : 'fix'}. Its scope was approved when ${id} was set ready.`;
  fill('Notes', note);
  for (const key of COPIED) if (t.fm[key] !== undefined && t.fm[key] !== '') body = setField(body, key, t.fm[key]);
  body = syncHeader(setField(setField(body, 'after', `["${id}"]`), 'status', 'ready'));
  const { errors } = lintTicket({ ...parseTicket(body), file, raw: body }, cfg);
  if (errors.length) drop(`The split-off ticket wouldn't be ready:\n${errors.map(e => `  ✗ ${e}`).join('\n')}`);
  fs.writeFileSync(file, body);
  const newId = parseTicket(body).fm.id;
  const commit = commitTicketOnly(main, file, raw, `speck(${newId}): split off from ${id}`);
  if (commit.status !== 0) drop(`Couldn't commit ${rel}:\n${(commit.stderr || commit.stdout || '').trim().split('\n').slice(-5).join('\n')}`);
  return newId;
}

export function cmdSplitOff(args) {
  const from = (args.find(a => a.startsWith('--from=')) || '').slice('--from='.length);
  const [id, ...words] = args.filter(a => !a.startsWith('--'));
  const made = splitOff(findRepoRoot(), id, words.join(' ').trim(), from);
  console.log(`${made}: ready, split off from ${id}, committed on the base branch. It runs once ${id} has shipped.`);
}
