// 0295: pull request mode. With `ship_mode: pr`, an approved ticket's branch is pushed and a GitHub pull request is
// opened for it with `gh`, its body the ticket's plain review pack, instead of it being merged locally. The link is
// kept on the ticket (its `pull_request` field) and in <id>.pr.json in the main checkout's speck/.cache/runs/, with
// why the last try failed, so the panel and speck run can say so.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SpeckError, sh, git, findRepoRoot, loadConfig, findTicket, writeField, ticketBranches, ticketsElsewhere, padId } from './core.mjs';
import { shipChecks } from './ship.mjs';
import { plainPack } from './pack.mjs';
import { commitTicketOnly } from './close.mjs';
import { sharedCacheDir } from './turns.mjs';
import { pushDone } from './pr-done.mjs';

export const SHIP_MODES = Object.freeze(['local', 'pr']);
export const prMode = cfg => cfg?.ship_mode === 'pr';

// The last line of a command's output, as one line.
export const lastLine = r => String(r.stderr || r.stdout || r.error?.message || '').trim().split('\n').pop().trim();

// The folder the ticket's branch is checked out in, which may be this one, or else a temporary worktree of it, which
// `temp` says is to be removed afterwards.
export function branchFolder(repo, cfg, pad, branch) {
  if (git(['branch', '--show-current'], repo).trim() === branch) return { at: repo, temp: null };
  const there = ticketsElsewhere(repo, cfg, pad).at(-1);
  if (there) return { at: there.at, temp: null };
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-pr-wt-'));
  const at = path.join(temp, 'wt');
  const added = sh('git', ['worktree', 'add', '-q', at, branch], { cwd: repo });
  if (added.status !== 0) { fs.rmSync(temp, { recursive: true, force: true }); throw new SpeckError(`Couldn't check ${branch} out to open its pull request: ${lastLine(added)}`); }
  return { at, temp };
}

export function removeFolder(repo, temp) {
  if (!temp) return;
  sh('git', ['worktree', 'remove', '--force', path.join(temp, 'wt')], { cwd: repo });
  fs.rmSync(temp, { recursive: true, force: true });
}

// Runs gh, giving back { status, stdout, stderr } and `missing` when it isn't installed.
export function runGh(gh, args, cwd) {
  const r = spawnSync(gh, args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '', missing: r.error?.code === 'ENOENT', error: r.error };
}

// The ticket's pull request into the base branch, open or merged, or null.
function existing(gh, repo, branch, base) {
  const r = runGh(gh, ['pr', 'list', '--head', branch, '--base', base, '--state', 'all', '--json', 'url,state'], repo);
  if (r.status !== 0) throw new SpeckError(`gh couldn't look for ${branch}'s pull request: ${lastLine(r)}`);
  let list;
  try { list = JSON.parse(r.stdout || '[]'); } catch { throw new SpeckError(`gh's list of pull requests for ${branch} wasn't JSON, so speck couldn't tell whether it has one.`); }
  const pr = (Array.isArray(list) ? list : []).find(p => p && typeof p.url === 'string' && ['OPEN', 'MERGED'].includes(String(p.state).toUpperCase()));
  return pr ? pr.url : null;
}

// Pushes the ticket's branch, with the commit that files it as done on top (0315), and opens its pull request, or finds the one it already has, once the checks speck ship
// makes before merging pass: the reviewer approved it, and nothing outside speck/ changed since. Returns { url, found,
// remote }, or throws a SpeckError of one line saying why, having merged and changed nothing on the base branch.
// `at` is the folder its branch is checked out in.
function openPullRequest(repo, cfg, pad, branch, at, gh) {
  const base = cfg.base_branch;
  const t = findTicket(at, pad);
  if (t.fm.status !== 'approved') throw new SpeckError(`${pad} is ${t.fm.status}, not approved, so speck opens no pull request for it yet.`);
  shipChecks(at, cfg, pad, branch);
  const version = runGh(gh, ['--version'], repo);
  if (version.missing) throw new SpeckError(`gh, GitHub's command line tool, isn't installed, so speck couldn't open ${pad}'s pull request. Install it from https://cli.github.com, sign in with \`gh auth login\`, then run \`speck pr ${pad}\`.`);
  if (version.status !== 0) throw new SpeckError(`gh didn't run (${lastLine(version)}), so speck couldn't open ${pad}'s pull request.`);
  const auth = runGh(gh, ['auth', 'status'], repo);
  if (auth.status !== 0) throw new SpeckError(`gh isn't signed in to GitHub, so speck couldn't open ${pad}'s pull request. Run \`gh auth login\`, then \`speck pr ${pad}\`.`);
  const remote = sh('git', ['config', `branch.${base}.remote`], { cwd: repo }).stdout.trim();
  if (!remote) throw new SpeckError(`${base} has no remote set, so speck can't push ${branch} for a pull request. Set one with \`git branch --set-upstream-to=origin/${base} ${base}\`, then run \`speck pr ${pad}\`.`);
  // 0315: with the commit that files the ticket as done on top, so merging the pull request is what makes it done.
  const push = pushDone(repo, remote, branch, pad);
  if (push.status !== 0) throw new SpeckError(`Couldn't push ${branch} to ${remote}, so no pull request was opened: ${lastLine(push)}`);
  let url = existing(gh, repo, branch, base);
  if (url) return { url, found: true, remote };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-pr-'));
  try {
    const body = path.join(dir, 'body.md');
    fs.writeFileSync(body, `${plainPack(repo, pad)}\n`);
    const made = runGh(gh, ['pr', 'create', '--base', base, '--head', branch, '--title', `${pad} · ${t.fm.title}`, '--body-file', body], repo);
    url = (made.stdout.match(/https?:\/\/\S+/g) || []).pop() || null;
    if (made.status === 0 && url) return { url, found: false, remote };
    // Another try may have opened it meanwhile: then that's the one.
    const since = existing(gh, repo, branch, base);
    if (since) return { url: since, found: true, remote };
    throw new SpeckError(`gh couldn't open ${pad}'s pull request: ${lastLine(made) || `it exited with ${made.status}`}`);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// ---------- the record, for the panel and speck run ----------

const recordFile = (repo, pad) => path.join(sharedCacheDir(repo, 'runs'), `${pad}.pr.json`);

// { url } or { error }, with when it was written, or null.
export function readPrRecord(runs, id) {
  try {
    const rec = JSON.parse(fs.readFileSync(path.join(runs, `${padId(id)}.pr.json`), 'utf8'));
    return rec && typeof rec === 'object' && !Array.isArray(rec) ? rec : null;
  } catch { return null; }
}

function saveRecord(repo, pad, rec) {
  const file = recordFile(repo, pad), tmp = `${file}.${process.pid}.tmp`;
  try { fs.writeFileSync(tmp, `${JSON.stringify({ ...rec, at: new Date().toISOString() }, null, 2)}\n`); fs.renameSync(tmp, file); }
  catch { fs.rmSync(tmp, { force: true }); }
}

// The pull request as `speck status --json` gives it: its link, from the ticket or the record, and why the last try
// failed, if it did: to open it, or to write its link on the ticket. Null when there's neither.
export function prShown(runs, id, fm = {}) {
  const field = typeof fm.pull_request === 'string' && /^https?:\/\//.test(fm.pull_request) ? fm.pull_request : null;
  const rec = readPrRecord(runs, id);
  const url = field || (typeof rec?.url === 'string' && /^https?:\/\//.test(rec.url) ? rec.url : null);
  const error = typeof rec?.error === 'string' && rec.error && !(field && rec.url === field) ? rec.error : null;
  return url || error ? { url, error } : null;
}

// Opens the ticket's pull request and keeps its link: on the ticket, committed on its branch where it's checked out,
// or in a temporary worktree of it, then pushed so the pull request has that commit too, and in the record. A failure
// is kept in the record and thrown: one with `opened` set opened the pull request but couldn't write its link.
export function openAndKeep(repo, cfg, id, { gh = 'gh' } = {}) {
  const pad = padId(id);
  const fail = (message, url = null) => { saveRecord(repo, pad, { ...(url ? { url } : {}), error: message.split('\n')[0] }); const e = new SpeckError(message); e.opened = !!url; return e; };
  const names = ticketBranches(repo, cfg, pad);
  if (names.length !== 1) throw fail(names.length
    ? `${pad} has ${names.length} branches (${names.join(', ')}), so speck can't tell which to open a pull request for. Delete the extra ones.`
    : `${pad} has no branch called ${cfg.branch_prefix}${pad}-…, so there's nothing to open a pull request for.`);
  const branch = names[0];
  let folder;
  try { folder = branchFolder(repo, cfg, pad, branch); } catch (e) { throw e instanceof SpeckError ? fail(e.message) : e; }
  try {
    let pr;
    try { pr = openPullRequest(repo, cfg, pad, branch, folder.at, gh); } catch (e) { throw e instanceof SpeckError ? fail(e.message) : e; }
    const t = findTicket(folder.at, pad);
    if (t.fm.pull_request !== pr.url) {
      const original = t.raw;
      writeField(t, 'pull_request', pr.url);
      const commit = commitTicketOnly(folder.at, t.file, original, `speck(${pad}): pull request`);
      if (commit.status !== 0) throw fail(`Opened ${pad}'s pull request, ${pr.url}, but couldn't write its link on the ticket: ${lastLine(commit)}. Run \`speck pr ${pad}\` to try again.`, pr.url);
      pushDone(repo, pr.remote, branch, pad);
    }
    saveRecord(repo, pad, { url: pr.url });
    return pr;
  } finally { removeFolder(repo, folder.temp); }
}

// `speck pr <id>`: opens the approved ticket's pull request, or finds the one it has.
export function cmdPr(args) {
  const id = args.find(a => !a.startsWith('--'));
  if (!id) throw new SpeckError('Usage: speck pr <id>');
  const repo = findRepoRoot(), cfg = loadConfig(repo);
  if (!prMode(cfg)) throw new SpeckError(`ship_mode is ${cfg.ship_mode || 'local'}, so speck opens no pull requests: it merges approved tickets itself. Run \`speck config set ship_mode pr\` to open pull requests instead.`);
  const pr = openAndKeep(repo, cfg, id);
  console.log(`${pr.found ? `${padId(id)} already has a pull request` : `Opened ${padId(id)}'s pull request`}: ${pr.url}.`);
}
