// A stand-in for GitHub's gh, for the pull request mode tests (0295): a script called gh in a folder of its own,
// which logs each call and keeps the pull requests it has "opened" in that folder. 0296: it views and merges them too,
// merging into the bare repo named in its file `remote`, as GitHub would.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SCRIPT = `#!${process.execPath}
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const dir = __dirname, args = process.argv.slice(2);
const read = (f, d) => { try { return fs.readFileSync(path.join(dir, f), 'utf8'); } catch { return d; } };
fs.appendFileSync(path.join(dir, 'calls.jsonl'), JSON.stringify({ args, body: args.includes('--body-file') ? fs.readFileSync(args[args.indexOf('--body-file') + 1], 'utf8') : null }) + '\\n');
const prs = JSON.parse(read('prs.json', '[]'));
const opt = k => args[args.indexOf(k) + 1];
if (args[0] === '--version') { console.log('gh version 2.101.0 (fake)'); process.exit(0); }
if (args[0] === 'auth') { if (read('auth', 'ok').trim() === 'ok') process.exit(0); console.error('You are not logged into any GitHub hosts. To log in, run: gh auth login'); process.exit(1); }
if (args[0] === 'pr' && args[1] === 'list') { console.log(JSON.stringify(prs.filter(p => p.head === opt('--head') && p.base === opt('--base')).map(p => ({ url: p.url, state: p.state, number: p.number ?? Number(p.url.split('/').pop()) })))); process.exit(0); }
if (args[0] === 'pr' && args[1] === 'create') {
  if (read('create', 'ok').trim() !== 'ok') { console.error('pull request create failed: GraphQL: Resource not accessible by integration (createPullRequest)'); process.exit(1); }
  const url = 'https://github.com/o/r/pull/' + (prs.length + 1);
  prs.push({ url, state: 'OPEN', head: opt('--head'), base: opt('--base'), title: opt('--title') });
  fs.writeFileSync(path.join(dir, 'prs.json'), JSON.stringify(prs));
  console.log(url);
  process.exit(0);
}
const remote = read('remote', '').trim();
const git = (...a) => execFileSync('git', ['-c', 'user.name=gh', '-c', 'user.email=gh@x', ...a], { cwd: remote, encoding: 'utf8' }).trim();
const tip = b => { try { return git('rev-parse', '--verify', '-q', 'refs/heads/' + b); } catch { return null; } };
const find = ref => prs.find(p => p.url === ref || String(p.number ?? p.url.split('/').pop()) === String(ref));
if (args[0] === 'pr' && args[1] === 'view') {
  if (read('view', 'ok').trim() !== 'ok') { console.error('GraphQL: API rate limit exceeded'); process.exit(1); }
  const p = find(args[2]);
  if (!p) { console.error('no pull requests found'); process.exit(1); }
  const out = { number: p.number ?? Number(p.url.split('/').pop()), url: p.url, state: p.state, isDraft: !!p.isDraft, mergeable: p.mergeable ?? 'MERGEABLE',
    mergeStateStatus: p.mergeStateStatus ?? 'CLEAN', reviewDecision: p.reviewDecision ?? '', statusCheckRollup: p.statusCheckRollup ?? [],
    headRefOid: p.headRefOid ?? (remote ? tip(p.head) : null), mergeCommit: p.mergeCommit ?? null };
  const want = opt('--json').split(',');
  console.log(JSON.stringify(Object.fromEntries(want.map(k => [k, out[k]]))));
  process.exit(0);
}
if (args[0] === 'pr' && args[1] === 'merge') {
  const p = find(args[2]);
  if (!['ok', 'queue'].includes(read('merge', 'ok').trim())) { console.error('GraphQL: Pull request is not mergeable: the base branch policy prohibits the merge. (mergePullRequest)'); process.exit(1); }
  if (read('merge', 'ok').trim() === 'queue') { console.log('! Pull request #' + args[2] + ' will be added to the merge queue for main when ready'); process.exit(0); }
  const head = tip(p.head);
  if (args.includes('--match-head-commit') && opt('--match-head-commit') !== head) { console.error('GraphQL: Head branch was modified. Review and try the merge again. (mergePullRequest)'); process.exit(1); }
  const base = tip(p.base), tree = git('merge-tree', '--write-tree', base, head).split('\\n')[0];
  const merged = git('commit-tree', tree, '-p', base, '-p', head, '-m', 'Merge pull request #' + (p.number ?? p.url.split('/').pop()));
  git('update-ref', 'refs/heads/' + p.base, merged, base);
  Object.assign(p, { state: 'MERGED', headRefOid: head, mergeCommit: { oid: merged } });
  fs.writeFileSync(path.join(dir, 'prs.json'), JSON.stringify(prs));
  process.exit(0);
}
console.error('fake gh: unexpected ' + args.join(' '));
process.exit(2);
`;

// { bin, gh, calls(), prs(), set(name, value) }: put `bin` first on PATH, or pass `gh` as the command.
export function fakeGh() {
  const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-gh-'));
  const gh = path.join(bin, 'gh');
  fs.writeFileSync(gh, SCRIPT, { mode: 0o755 });
  const lines = f => { try { return fs.readFileSync(path.join(bin, f), 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch { return []; } };
  return {
    bin, gh,
    calls: () => lines('calls.jsonl'),
    prs: () => { try { return JSON.parse(fs.readFileSync(path.join(bin, 'prs.json'), 'utf8')); } catch { return []; } },
    // Changes the pull request at `url`, as someone on GitHub might.
    edit: (url, change) => { const prs = JSON.parse(fs.readFileSync(path.join(bin, 'prs.json'), 'utf8')); Object.assign(prs.find(p => p.url === url), change); fs.writeFileSync(path.join(bin, 'prs.json'), JSON.stringify(prs)); },
    set: (name, value) => fs.writeFileSync(path.join(bin, name), typeof value === 'string' ? value : JSON.stringify(value)),
    env: (base = process.env) => ({ ...base, PATH: `${bin}${path.delimiter}${base.PATH}` }),
  };
}
