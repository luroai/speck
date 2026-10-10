// speck merge-check: what merging the base branch into a ticket's branch would conflict on, as JSON.
// git merge-tree does the merge in the object store only, so no branch, worktree or index changes.

import fs from 'node:fs';
import { SpeckError, sh, git, findRepoRoot, loadConfig, findTicket, worktreeList, LOCKFILES } from './core.mjs';

// Runs git merge-tree for the branch (ours) and the base (theirs). Returns the merged tree and, for each conflicted
// path, which index stages it has (1 is the base's version, 2 ours, 3 theirs).
function mergeTree(repo, branch, base, config = []) {
  const r = sh('git', [...config, 'merge-tree', '--write-tree', '-z', branch, base], { cwd: repo });
  if (r.status !== 0 && r.status !== 1)
    throw new SpeckError(`Couldn't work out the merge of ${base} into ${branch}: ${(r.stderr || r.stdout).trim().split('\n').pop()}`);
  const [tree, ...rest] = r.stdout.split('\0');
  const stages = new Map();
  for (const entry of rest) {
    if (!entry) break; // the conflicted file list ends with an empty entry, then git's messages follow
    const m = entry.match(/^\d+ [0-9a-f]+ (\d)\t([\s\S]*)$/);
    if (!m) continue;
    if (!stages.has(m[2])) stages.set(m[2], new Set());
    stages.get(m[2]).add(m[1]);
  }
  return { clean: r.status === 0, tree, stages };
}

// The conflict marker length git uses for each file: its conflict-marker-size attribute, read from the same
// folder as the merge (git reads attributes from the checkout it runs in), or 7.
function markerSizes(cwd, files) {
  const sizes = new Map(files.map(f => [f, 7]));
  if (!files.length) return sizes;
  const r = sh('git', ['check-attr', '-z', 'conflict-marker-size', '--', ...files], { cwd });
  const parts = r.status === 0 ? r.stdout.split('\0') : [];
  for (let i = 0; i + 2 < parts.length; i += 3) if (/^[1-9]\d*$/.test(parts[i + 2])) sizes.set(parts[i], Number(parts[i + 2]));
  return sizes;
}

// The conflicts in a merged file: each one's 1-based first and last line (markers included) and its sections.
function conflictsIn(cwd, tree, file, size) {
  const r = sh('git', ['cat-file', 'blob', `${tree}:${file}`], { cwd });
  if (r.status !== 0) return [];
  const marker = ch => new RegExp(`^\\${ch}{${size}}( |$)`);
  const [open, mid, close] = [marker('<'), marker('|'), marker('>')];
  const sep = '='.repeat(size);
  const out = [];
  let cur = null;
  r.stdout.split('\n').forEach((line, i) => {
    if (!cur) {
      if (open.test(line)) cur = { start: i + 1, part: 'ours', ours: [], base: [], theirs: [] };
    } else if (close.test(line) && cur.part === 'theirs') {
      out.push({ ...cur, end: i + 1 });
      cur = null;
    } else if (mid.test(line) && cur.part === 'ours') cur.part = 'base';
    else if (line === sep && cur.part !== 'theirs') cur.part = 'theirs';
    else cur[cur.part].push(line);
  });
  return out;
}

// Whether every line of `small` appears in `big`, in order: then that side kept the base's lines and only added.
const keeps = (small, big) => { let i = 0; for (const l of big) if (i < small.length && l === small[i]) i++; return i === small.length; };

function classify(file, stages, diff3) {
  if (LOCKFILES.test(file)) return 'lockfile';
  if (file.startsWith('speck/')) return 'ticket';
  // Without the base's version (both sides added the file), or with no markers (deleted on one side, binary), the
  // conflict isn't lines added to what the base had.
  if (!stages.has('1') || !stages.has('2') || !stages.has('3') || !diff3.length) return 'logic';
  return diff3.every(c => keeps(c.base, c.ours) && keeps(c.base, c.theirs)) ? 'added-lines' : 'logic';
}

export function cmdMergeCheck(args) {
  const id = args[0];
  if (!id) throw new SpeckError('Usage: speck merge-check <id>');
  const repo = findRepoRoot();
  const cfg = loadConfig(repo);
  const pad = findTicket(repo, id).fm.id;
  const base = cfg.base_branch;
  const prefix = `refs/heads/${cfg.branch_prefix}${pad}-`;
  const branches = git(['for-each-ref', '--format=%(refname)', `${prefix}*`], repo).split('\n').filter(Boolean)
    .filter(ref => !ref.slice(prefix.length).includes('/')).map(ref => ref.slice('refs/heads/'.length));
  if (!branches.length) throw new SpeckError(`Ticket ${pad} has no branch (${cfg.branch_prefix}${pad}-…), so there's nothing to check. Start it with speck start ${pad}.`);
  if (branches.length > 1) throw new SpeckError(`Ticket ${pad} has more than one branch: ${branches.join(', ')}. Delete the ones you don't need, then run this again.`);
  const branch = branches[0];
  if (sh('git', ['rev-parse', '--verify', '-q', `refs/heads/${base}`], { cwd: repo }).status !== 0)
    throw new SpeckError(`The base branch ${base} (base_branch in speck/config.yml) doesn't exist here. Fix base_branch, then run this again.`);
  const at = worktreeList(repo).find(w => w.branch === branch && fs.existsSync(w.path));
  if (at) {
    const dirty = sh('git', ['--no-optional-locks', 'status', '--porcelain', '--untracked-files=no'], { cwd: at.path });
    if (dirty.status === 0 && dirty.stdout.trim())
      throw new SpeckError(`${branch} has uncommitted changes in ${at.path}, so a check of its commits wouldn't match what's there. Commit or stash them, then run this again.`);
  }
  // Line ranges come from the merge as git merge would write it in the branch's folder; the classes from diff3, which
  // shows the base's lines.
  const cwd = at ? at.path : repo;
  const merged = mergeTree(cwd, branch, base);
  const withBase = merged.clean ? merged : mergeTree(cwd, branch, base, ['-c', 'merge.conflictStyle=diff3']);
  const paths = [...merged.stages.keys()].sort();
  const sizes = markerSizes(cwd, paths);
  const files = paths.map(file => {
    const found = conflictsIn(cwd, merged.tree, file, sizes.get(file));
    return {
      path: file,
      class: classify(file, withBase.stages.get(file) || merged.stages.get(file), conflictsIn(cwd, withBase.tree, file, sizes.get(file))),
      conflicts: Math.max(found.length, 1),
      lines: found.map(c => ({ start: c.start, end: c.end })),
    };
  });
  console.log(JSON.stringify({ id: pad, branch, base, clean: merged.clean, files }));
}
