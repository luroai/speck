// 0315: in pull request mode the ticket is filed as done by its pull request, not by a push to the base branch, which
// may be protected so that it only takes pull requests. What speck pushes to the ticket's branch on GitHub is the local
// branch with one more commit on top, `speck(<id>): ship`, that files the ticket as done. The local branch keeps the
// ticket approved, so the board, the checks before merging and speck run see it as they did. The commit is made from the
// branch's tip alone, its dates and names taken from that tip, so the same tip always gives the same commit: speck can
// tell the pull request's head is the one it pushed, and a pull request merged by hand on GitHub files the ticket too.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SpeckError, sh, git, setField, syncHeader, parseTicket, waitFields, isAncestor } from './core.mjs';

export const shipMessage = pad => `speck(${pad}): ship`;

// The ticket's file on `ref`, open (in speck/tickets/) or done (in speck/tickets/done/), or null.
function ticketOn(repo, ref, pad) {
  const named = dir => sh('git', ['ls-tree', '--name-only', `${ref}:${dir}`], { cwd: repo }).stdout.split('\n').find(n => n.startsWith(`${pad}-`) && n.endsWith('.md'));
  const open = named('speck/tickets');
  if (open) return { file: `speck/tickets/${open}`, done: false };
  return named('speck/tickets/done') ? { done: true } : null;
}

// The commit that files the ticket as done on top of `ref`: the same for the same `ref`, made without touching any
// folder. `ref` itself when there's nothing to file: the ticket is done there already, or isn't there.
export function doneTip(repo, pad, ref) {
  const tip = git(['rev-parse', `${ref}^{commit}`], repo).trim();
  const t = ticketOn(repo, tip, pad);
  if (!t || t.done) return tip;
  const [name, email, date] = git(['log', '-1', '--format=%cn%x00%ce%x00%cI', tip], repo).trim().split('\0');
  const raw = git(['show', `${tip}:${t.file}`], repo);
  let text = setField(raw, 'status', 'done');
  text = setField(text, 'finished', new Date(date).toISOString());
  text = syncHeader(waitFields(text, parseTicket(raw).fm.status, 'done', Date.parse(date)));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-done-'));
  try {
    const env = { ...process.env, GIT_INDEX_FILE: path.join(dir, 'index'),
      GIT_AUTHOR_NAME: name, GIT_AUTHOR_EMAIL: email, GIT_AUTHOR_DATE: date, GIT_COMMITTER_NAME: name, GIT_COMMITTER_EMAIL: email, GIT_COMMITTER_DATE: date };
    const run = (args, input) => {
      const r = sh('git', args, { cwd: repo, env, input });
      if (r.status !== 0) throw new SpeckError(`Couldn't make the commit that files ${pad} as done: git ${args[0]}: ${r.stderr.trim()}`);
      return r.stdout.trim();
    };
    run(['read-tree', tip]);
    const blob = run(['hash-object', '-w', '--stdin'], text);
    run(['update-index', '--force-remove', t.file]);
    run(['update-index', '--add', '--cacheinfo', `100644,${blob},speck/tickets/done/${path.posix.basename(t.file)}`]);
    return run(['commit-tree', run(['write-tree']), '-p', tip, '-m', shipMessage(pad)]);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// Pushes the ticket's branch to `remote` with its done commit on top, as doneTip makes it. The done commit an earlier
// push left there, on an older tip of the branch, is replaced; anything else on the remote's branch that the local
// one doesn't have makes the push fail, as a plain push would. Gives back sh's result, with `sha`, what was pushed.
export function pushDone(repo, remote, branch, pad) {
  const sha = doneTip(repo, pad, `refs/heads/${branch}`);
  const ref = `refs/heads/${branch}`;
  const there = sh('git', ['ls-remote', remote, ref], { cwd: repo }).stdout.split(/\s/)[0] || '';
  const args = ['push', '-q', remote, `${sha}:${ref}`];
  if (there && there !== sha && !isAncestor(repo, there, sha) && staleDone(repo, remote, ref, there, branch, pad)) args.splice(2, 0, `--force-with-lease=${ref}:${there}`);
  return { ...sh('git', args, { cwd: repo }), sha };
}

// Whether `there`, the remote branch's tip, is a done commit speck pushed on an older tip of the local branch.
function staleDone(repo, remote, ref, there, branch, pad) {
  if (!has(repo, there) && sh('git', ['fetch', '-q', remote, ref], { cwd: repo }).status !== 0) return false;
  return pushedEarlier(repo, there, branch, pad);
}

const has = (repo, sha) => sh('git', ['cat-file', '-e', `${sha}^{commit}`], { cwd: repo }).status === 0;

// Whether `sha` is the done commit of an older tip of `branch`, as an earlier push left on GitHub.
export function pushedEarlier(repo, sha, branch, pad) {
  if (!/^[0-9a-f]{40,64}$/.test(String(sha)) || !has(repo, sha)) return false;
  const parent = sh('git', ['rev-parse', '-q', '--verify', `${sha}^1`], { cwd: repo }).stdout.trim();
  return !!parent && isAncestor(repo, parent, `refs/heads/${branch}`) && doneTip(repo, pad, parent) === sha;
}
