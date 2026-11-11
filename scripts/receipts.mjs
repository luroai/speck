// Review receipts (0629): when `speck review` runs the reviewer itself and saves its round, it keeps a receipt for
// that round in the main checkout's speck/.cache/receipts/<id>/, which no ticket branch carries. A round saved with
// `speck record`, or one edited in the ticket after it was saved, has no receipt that matches it, so it can't ship by
// itself (`speck ship --auto`) and waits for you at Ship.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { worktreeList } from './core.mjs';
import { sharedCacheDir } from './turns.mjs';

const pad = id => String(id).padStart(4, '0');
const receiptsDir = (repo, id) => sharedCacheDir(repo, path.join('receipts', pad(id)));
// The same folder, for reading: nothing is created, and a folder that can't be found is one with no receipts.
function readDir(repo, id) {
  let main = repo;
  try { main = worktreeList(repo)[0]?.path || repo; } catch { /* not a git checkout: this one */ }
  return path.join(main, 'speck', '.cache', 'receipts', pad(id));
}
// The round as the ticket holds it, so any change to its record there changes this.
const digest = rec => crypto.createHash('sha256').update(JSON.stringify(rec)).digest('hex');

// Keeps the receipt for `rec`, a round as read back from the ticket just after it was saved, replacing any earlier
// receipt for the same round number, such as one from an earlier build of the ticket. The round is already saved, so
// a receipt that can't be written is said in one line, and the ticket then waits for you at Ship.
export function keepReceipt(repo, id, rec) {
  const receipt = { round: rec.meta.round, reviewed_sha: rec.meta.reviewed_sha ?? null, verdict: rec.verdict.verdict, digest: digest(rec) };
  try { fs.writeFileSync(path.join(receiptsDir(repo, id), `${rec.meta.round}.json`), `${JSON.stringify(receipt, null, 2)}\n`); }
  catch (e) { console.error(`Couldn't keep the receipt for review round ${rec.meta.round} of ${pad(id)} (${e.code || e.message}), so it won't ship by itself: ship it with \`speck ship ${pad(id)}\`.`); }
}

// Whether round `rec` has a receipt that matches it: its round number, reviewed commit and verdict, and its record unchanged.
// `dir` is the ticket's receipts folder, readDir(repo, id). A receipt that can't be read is one that doesn't match.
function matches(dir, rec) {
  const round = rec?.meta?.round;
  if (!Number.isInteger(round) || round < 1) return false;
  let r;
  try { r = JSON.parse(fs.readFileSync(path.join(dir, `${round}.json`), 'utf8')); } catch { return false; }
  return !!r && r.round === round && r.reviewed_sha === (rec.meta.reviewed_sha ?? null) && r.verdict === rec.verdict?.verdict && r.digest === digest(rec);
}

// The round numbers in `all` with no receipt that matches them.
export function unreceiptedRounds(repo, id, all) {
  if (!all.length) return [];
  const dir = readDir(repo, id);
  return all.filter(r => !matches(dir, r)).map(r => r?.meta?.round);
}

// Why the latest round in `all` can't ship by itself, or '' when speck's own run of the reviewer recorded it unchanged.
export function receiptWhyNot(repo, id, all) {
  const last = all.at(-1);
  if (!last || matches(readDir(repo, id), last)) return '';
  return `review round ${last.meta?.round} of ticket ${pad(id)} wasn't recorded by speck's own run of the reviewer, or was changed in the ticket since, so it waits for you to ship it`;
}
