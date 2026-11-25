// 0740: the main checkout stops being a work tree when core.bare is true in its .git/config, as a test's `git init`
// once set it under `git bisect run`. git then lists it as bare, so speck ship found the base branch checked out
// nowhere and merged in the ticket's worktree, moving the base branch without updating the main checkout's files.
// speck ship and speck run's ship queue check for it and ship nothing until it's set back.
import fs from 'node:fs';
import path from 'node:path';
import { SpeckError, sh } from './core.mjs';

// The main checkout's path while git takes it as bare, from `git worktree list` run in `repo` or any of its
// worktrees, or null. Only a checkout with its own .git folder counts: a repository made bare to hold worktrees has
// no files of its own to fall behind.
export function bareMain(repo) {
  let r;
  try { r = sh('git', ['worktree', 'list', '--porcelain'], { cwd: repo }); } catch { return null; }
  if (r.status !== 0) return null;
  const first = r.stdout.split('\n\n')[0].split('\n');
  const main = first.find(l => l.startsWith('worktree '))?.slice('worktree '.length);
  if (!main || !first.includes('bare')) return null;
  try { return fs.statSync(path.join(main, '.git')).isDirectory() ? main : null; } catch { return null; }
}

// The command that sets it back, with the path quoted for the shell when it needs it.
export const setBackCommand = main => `git -C ${/^[\w./@%+=:,-]+$/.test(main) ? main : `'${main.replaceAll("'", `'\\''`)}'`} config core.bare false`;

const WHY = "isn't a work tree, because core.bare is set to true in its .git/config";

// What speck run's ship queue holds every ship for, after "Shipping is " (as speck status and the panel show it).
export const bareMainHold = (main, base) => `on hold: the main checkout at ${main} ${WHY}, so a ship would move ${base} without updating the files there. Set it back with \`${setBackCommand(main)}\`, and shipping starts again.`;

// 0749: what Needs you says while it's bare, in speck status and the panel: what's wrong and the command that sets it back.
export const bareMainNeeds = main => ({ path: main, command: setBackCommand(main),
  says: `The main checkout at ${main} ${WHY}, so builds can't start and nothing ships. Set it back with \`${setBackCommand(main)}\`.` });

// Refuses, changing nothing, while the main checkout of `repo` is bare.
export function refuseBareMain(repo, base) {
  const main = bareMain(repo);
  if (main) throw new SpeckError(`The main checkout at ${main} ${WHY}, so nothing was shipped: git would move ${base} without updating the files there. Set it back with \`${setBackCommand(main)}\`, then ship again.`);
}
