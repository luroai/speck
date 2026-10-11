import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseTicket, lintTicket, ticketHeader, syncHeader, ticketRounds } from '../scripts/speck.mjs';
import { cfg, ticket, good, fm, round, reviewRepo, approveVerdict, shipRepo, doneRepo } from './support/speck.mjs';

const EMOJI = { draft: '📝', ready: '📋', building: '🔨', reviewing: '🔍', blocked: '⛔', approved: '👍', done: '✅' };
const bodyOf = text => text.slice(text.indexOf('\n---', 4) + 5);
const headerOf = text => bodyOf(text).split('\n').slice(0, 3).join('\n');

test('AC1: speck new writes the heading and status line straight after the frontmatter', () => {
  const r = shipRepo({ approve: false });
  const file = path.join(r.dir, r.run('new', 'Search: by date').stdout.trim());
  const text = fs.readFileSync(file, 'utf8');
  assert.equal(headerOf(text), '# 0002 · Search: by date\n\n**Status:** 📝 draft');
  assert.equal(parseTicket(text).fm.title, 'Search: by date');
});

test('AC1: every status has its own emoji, and none is a coloured circle', () => {
  for (const [status, emoji] of Object.entries(EMOJI))
    assert.match(ticketHeader({ id: '0009', title: 'T', status }), new RegExp(`\\*\\*Status:\\*\\* ${emoji} ${status}$`));
  assert.equal(new Set(Object.values(EMOJI)).size, 7);
  assert.doesNotMatch(Object.values(EMOJI).join(''), /[🔴🟠🟡🟢🔵🟣🟤⚫⚪]/u);
});

test('AC2: speck set and speck ship keep the header in sync, and add it if missing', () => {
  const r = shipRepo();
  const file = () => fs.readdirSync(path.join(r.dir, 'speck', 'tickets')).includes('0001-export-bookings.md')
    ? path.join(r.dir, 'speck', 'tickets', '0001-export-bookings.md') : path.join(r.dir, 'speck', 'tickets', 'done', '0001-export-bookings.md');
  assert.equal(headerOf(fs.readFileSync(file(), 'utf8')), '# 0001 · Export bookings\n\n**Status:** 👍 approved');
  // A ticket with no header at all gets one from the next speck set.
  const bare = fs.readFileSync(file(), 'utf8').replace(/\n---\n[\s\S]*?(?=## Problem)/, '\n---\n');
  fs.writeFileSync(file(), bare);
  assert.equal(r.run('set', '1', 'priority', '2').status, 0);
  assert.equal(headerOf(fs.readFileSync(file(), 'utf8')), '# 0001 · Export bookings\n\n**Status:** 👍 approved');
  r.g('commit', '-qam', 'header');
  // A hand edit to the header is overwritten on the next change.
  fs.writeFileSync(file(), fs.readFileSync(file(), 'utf8').replace('# 0001 · Export bookings', '# 0001 · Something else'));
  r.run('set', '1', 'title', 'Export bookings as CSV');
  assert.equal(headerOf(fs.readFileSync(file(), 'utf8')), '# 0001 · Export bookings as CSV\n\n**Status:** 👍 approved');
  assert.equal(fs.readFileSync(file(), 'utf8').split('**Status:**').length, 2, 'only one status line');
  r.g('commit', '-qam', 'title');
  assert.equal(r.run('ship', '1').status, 0);
  assert.equal(headerOf(fs.readFileSync(file(), 'utf8')), '# 0001 · Export bookings as CSV\n\n**Status:** ✅ done');
});

test('AC3: lint warns when the heading or status line is missing or out of date', () => {
  const synced = t => parseTicket(syncHeader(`---\n${t}\n---\n${good}`));
  const headerWarnings = t => lintTicket(t, cfg).warnings.filter(w => /heading|status line/i.test(w));
  assert.deepEqual(headerWarnings(synced(fm())), []);
  assert.equal(headerWarnings(ticket(fm(), good)).length, 2, 'both missing');
  const stale = synced(fm()).raw.replace('📝 draft', '📋 ready');
  assert.equal(headerWarnings(parseTicket(stale)).length, 1, 'status line out of date');
  const renamed = synced(fm()).raw.replace('· Export bookings as CSV', '· Old title');
  assert.equal(headerWarnings(parseTicket(renamed)).length, 1, 'heading out of date');
});

test('AC4: re-running init adds or corrects every header and changes nothing else', () => {
  const r = shipRepo({ approve: false });
  const live = path.join(r.dir, 'speck', 'tickets', '0001-export-bookings.md');
  const done = path.join(r.dir, 'speck', 'tickets', 'done', '0002-old.md');
  const doneText = `---\nid: "0002"\ntitle: "Old"\nstatus: done\n\n---\n# 0002 · Wrong\n\n**Status:** 🔍 reviewing\n\n## Problem\nX.\n`;
  fs.writeFileSync(done, doneText);
  const before = fs.readFileSync(live, 'utf8');
  assert.equal(r.run('init', '--skip-checks').status, 0);
  const after = fs.readFileSync(live, 'utf8');
  assert.equal(headerOf(after), '# 0001 · Export bookings\n\n**Status:** 📝 draft');
  assert.equal(after.slice(0, after.indexOf('\n---', 4)), before.slice(0, before.indexOf('\n---', 4)), 'frontmatter unchanged');
  assert.equal(after.slice(after.indexOf('**Status:**')).split('\n').slice(1).join('\n'), before.slice(before.indexOf('**Status:**')).split('\n').slice(1).join('\n'), 'body after the header unchanged');
  assert.equal(fs.readFileSync(done, 'utf8'), doneText.replace('# 0002 · Wrong\n\n**Status:** 🔍 reviewing', '# 0002 · Old\n\n**Status:** ✅ done'));
  // Running it again changes nothing.
  assert.equal(r.run('init', '--skip-checks').status, 0);
  assert.equal(fs.readFileSync(live, 'utf8'), after);
});

test('AC2/AC4 (F1): syncing the header keeps the rest of the body byte for byte', () => {
  const head = '---\nid: "0003"\ntitle: "T"\nstatus: ready\n\n---\n';
  const header = '# 0003 · T\n\n**Status:** 📋 ready';
  const bodies = ['\n\n\n    indented code\n\n## Problem\nX.\n', '\n## Problem\n  - nested\n', '    indented first line\n## Problem\n'];
  for (const body of bodies) {
    // With no header yet: the header goes on top, and the body is untouched apart from one separating empty line if it had none.
    const added = syncHeader(head + body);
    assert.equal(added, head + header + '\n' + (body.startsWith('\n') ? '' : '\n') + body, JSON.stringify(body));
    // With a stale header: only the header changes.
    const stale = head + '# 0003 · Old\n\n**Status:** 📝 draft\n' + body;
    assert.equal(syncHeader(stale), added, JSON.stringify(body));
    // And syncing again changes nothing.
    assert.equal(syncHeader(added), added);
  }
});

// ---------- 0011: review rounds live in the ticket file ----------

const roundsSection = text => text.slice(text.indexOf('\n## Review rounds\n'));

test('AC1: review rounds are added to a Review rounds section at the end of the ticket, and nothing else is tracked', () => {
  const r = reviewRepo();
  assert.equal(r.run('review', '1').status, 10);
  assert.equal(r.run('review', '1').status, 10, 'a round only changes the ticket, so the next round still runs');
  const text = fs.readFileSync(r.ticketFile, 'utf8');
  const section = roundsSection(text);
  assert.ok(text.includes('\n## Review rounds\n'), 'section added');
  assert.doesNotMatch(section.slice(1), /\n## /, 'it is the last section');
  const blocks = [...section.matchAll(/<details><summary>(.*?)<\/summary>\n\n```json\n([\s\S]*?)\n```\n\n<\/details>/g)];
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0][1], 'Round 1 · codex · changes_requested');
  assert.equal(blocks[1][1], 'Round 2 · codex · changes_requested');
  const rec = JSON.parse(blocks[1][2]);
  assert.equal(rec.meta.round, 2);
  assert.equal(rec.meta.thread_id, 'T1');
  assert.equal(rec.verdict.summary, 'fine');
  assert.deepEqual(r.roundFile(2), rec);
  assert.equal(fs.existsSync(path.join(r.dir, 'speck', 'reviews')), false, 'no speck/reviews/');
  assert.equal(r.git('status', '--porcelain').stdout.trim(), `M ${path.relative(r.dir, r.ticketFile)}`, 'only the ticket changed');
  // Recorded rounds from another reviewer go in the same place.
  const v = path.join(os.tmpdir(), `v-${path.basename(r.dir)}.json`);
  fs.writeFileSync(v, JSON.stringify(approveVerdict));
  assert.equal(r.run('reviewer-settings', '1').status, 0);
  assert.equal(r.run('record', '1', v, '--reviewer=claude-subagent').status, 0);
  assert.match(roundsSection(fs.readFileSync(r.ticketFile, 'utf8')), /<summary>Round 3 · claude-subagent · approve<\/summary>/);
  assert.equal(r.git('status', '--porcelain').stdout.trim(), `M ${path.relative(r.dir, r.ticketFile)}`, 'working files are not tracked');
});

test('AC1: the rest of the ticket is kept byte for byte when a round is added', () => {
  const r = reviewRepo();
  const before = fs.readFileSync(r.ticketFile, 'utf8');
  assert.equal(r.run('review', '1').status, 10);
  const after = fs.readFileSync(r.ticketFile, 'utf8');
  assert.ok(after.startsWith(before.replace(/\n*$/, '\n')), 'everything before the section is unchanged');
});

test('AC2: next, pack and ship read rounds from the ticket file', () => {
  const r = shipRepo({ approve: false });
  const v = path.join(os.tmpdir(), `v-${path.basename(r.dir)}.json`);
  assert.equal(r.run('next', '1').stdout.trim(), 'review');
  fs.writeFileSync(v, JSON.stringify({ ...approveVerdict, verdict: 'changes_requested', findings: [{ id: 'F1', severity: 'blocking', state: 'open', file: 'shared.txt', issue: 'bad', suggested_fix: '' }] }));
  assert.equal(r.run('record', '1', v).status, 10);
  assert.equal(r.run('next', '1').stdout.trim(), 'fix');
  fs.writeFileSync(v, JSON.stringify({ ...approveVerdict, findings: [{ id: 'F1', severity: 'blocking', state: 'resolved', file: 'shared.txt', issue: 'bad', suggested_fix: '' }] }));
  assert.equal(r.run('record', '1', v).status, 0);
  assert.equal(r.run('next', '1').stdout.trim(), 'ship');
  const pack = r.run('pack', '1').stdout;
  assert.match(pack, /Round 1 \(claude-subagent.*\*\*changes_requested\*\*, 1 open blocking/);
  assert.match(pack, /Round 2 \(claude-subagent.*\*\*approve\*\*, 0 open blocking, 1 resolved/);
  r.run('set', '1', 'status', 'approved');
  r.g('add', '-A'); r.g('commit', '-qm', 'approved');
  const res = r.run('ship', '1');
  assert.equal(res.status, 0, res.stderr);
  const done = fs.readFileSync(path.join(r.dir, 'speck', 'tickets', 'done', '0001-export-bookings.md'), 'utf8');
  assert.equal(ticketRounds(done).rounds.length, 2, 'the rounds travel with the ticket into done/');
  assert.equal(r.run('next', '1').stdout.trim(), 'ship');
});

test('AC3: the reviewer diff and size count leave out the Review rounds section, but show other ticket edits', () => {
  const r = reviewRepo();
  assert.equal(r.run('review', '1').status, 10);
  // The builder edits the ticket's notes and commits it, together with round 1.
  fs.writeFileSync(r.ticketFile, fs.readFileSync(r.ticketFile, 'utf8').replace('## Out of scope', '## Notes\nA builder note.\n\n## Out of scope'));
  r.git('add', '-A'); r.git('commit', '-qm', 'fixes');
  assert.equal(r.run('review', '1').status, 10);
  const round2 = r.prompts()[1];
  assert.match(round2, /\+A builder note\./, 'other ticket edits are shown');
  assert.doesNotMatch(round2, /Review rounds|<details>|"verdict"|"thread_id"/, 'the rounds section is left out');
  // speck diff prints the same diff for reviewers speck doesn't start itself.
  r.git('add', '-A'); r.git('commit', '-qm', 'round 2');
  const d = r.run('diff', '1');
  assert.equal(d.status, 0, d.stderr);
  assert.doesNotMatch(d.stdout, /Review rounds|"verdict"/);
  const p = r.run('prompt', '1');
  assert.match(p.stdout, /A builder note/);
  assert.doesNotMatch(p.stdout.split('Return ONLY')[0], /## Review rounds|"thread_id"/, 'the round-1 prompt leaves the section out too');
  // The size count leaves out all of speck/ by design (tickets, ideas), so neither the rounds nor the notes count.
  assert.match(r.run('diffstat').stdout, /^1 changed lines/m, 'only a.txt counts towards the size limit');
});

test('AC3 (F3): other tickets in the diff lose their Review rounds sections too, but keep their other edits', () => {
  const r = reviewRepo();
  const other = path.join(r.dir, 'speck', 'tickets', 'done', '0002-older.md');
  const otherText = `---\nid: "0002"\ntitle: "Older"\nstatus: done\n\n---\n## Problem\nX.\n`;
  fs.writeFileSync(other, otherText);
  fs.mkdirSync(path.join(r.dir, 'speck', 'reviews', '0002'), { recursive: true });
  fs.writeFileSync(path.join(r.dir, 'speck', 'reviews', '0002', 'round-1.json'), '{"meta":{"round":1,"thread_id":"OLD"}}\n');
  r.git('add', '-A'); r.git('commit', '-qm', 'older ticket');
  r.git('branch', '-f', 'main');
  const block = `<details><summary>Round 1 · codex · approve</summary>\n\n\`\`\`json\n{"meta":{"round":1,"thread_id":"OLD"}}\n\`\`\`\n\n</details>`;
  fs.writeFileSync(other, otherText.replace('X.', 'X, edited.') + `\n## Review rounds\n\n${block}\n`);
  fs.rmSync(path.join(r.dir, 'speck', 'reviews'), { recursive: true }); // as init does when it migrates them
  r.git('add', '-A'); r.git('commit', '-qm', 'migrated');
  const p = r.run('prompt', '1').stdout.split('Return ONLY')[0];
  assert.match(p, /\+X, edited\./, 'the ordinary edit is shown');
  assert.doesNotMatch(p, /## Review rounds|"thread_id"|OLD|speck\/reviews/, "the other ticket's rounds, and the old review files it replaced, are left out");
});

// A ticket with one round written the way speck writes it.
const appendable = (body, rec) => `---\n${fm()}\n---\n${body}\n## Review rounds\n\n<details><summary>Round 1 · codex · approve</summary>\n\n\`\`\`json\n${JSON.stringify(rec, null, 2)}\n\`\`\`\n\n</details>\n`;

test('AC4 (F1): a damaged round block is an error, not silently dropped', () => {
  const block = n => `<details><summary>Round ${n} · codex · approve</summary>\n\n\`\`\`json\n{"meta":{"round":${n}}}\n\`\`\`\n\n</details>`;
  const t = blocks => `---\n${fm()}\n---\n${good}\n## Review rounds\n\n${blocks.join('\n\n')}\n`;
  const noClose = block(2).replace('}\n```', '}\n');
  assert.equal(ticketRounds(t([block(1), noClose, block(3)])).errors.length, 1, 'missing closing fence');
  assert.equal(ticketRounds(t([block(1), block(2).replace('```json', '```')])).errors.length, 1, 'not a json fence');
  assert.equal(ticketRounds(t([block(1), block(2).replace('</details>', '')])).errors.length, 1, 'missing </details>');
  assert.equal(ticketRounds(t(['```json\n{}\n```'])).errors.length, 1, 'a code block outside any round');
  // Round 3 F1: a stray, invalid block before a valid round is reported, not dropped.
  assert.equal(ticketRounds(t(['```json\n{ not json\n```', block(1)])).errors.length, 1, 'stray invalid block before round 1');
  assert.equal(ticketRounds(t(['Some text', block(1)])).errors.length, 1, 'stray text before round 1');
  assert.deepEqual(ticketRounds(t(['<!-- a comment -->', block(1)])).errors, [], 'comments are fine');
  assert.equal(lintTicket(parseTicket(t([block(1), noClose])), cfg).errors.filter(e => /round/i.test(e)).length, 1, 'lint reports it');
  // A reviewer quoting "<details>" or a code fence in its own words doesn't break the round it's in.
  const quoted = { meta: { round: 1 }, verdict: { summary: 'A <details> block with ```json and </details> inside.' } };
  const qt = parseTicket(appendable(good, quoted));
  assert.deepEqual(ticketRounds(qt.raw), { rounds: [quoted], errors: [] });
  // Commands that read the history refuse rather than guess.
  const rr = reviewRepo();
  fs.writeFileSync(rr.ticketFile, fs.readFileSync(rr.ticketFile, 'utf8') + `\n## Review rounds\n\n${block(1)}\n\n${noClose}\n`);
  const next = rr.run('next', '1');
  assert.notEqual(next.status, 0);
  assert.match(next.stderr, /Review round 2 .*isn't a complete block/);
  const stray = reviewRepo();
  fs.writeFileSync(stray.ticketFile, fs.readFileSync(stray.ticketFile, 'utf8') + `\n## Review rounds\n\n\`\`\`json\n{ not json\n\`\`\`\n\n${block(1)}\n`);
  assert.notEqual(stray.run('next', '1').status, 0, 'next refuses');
  assert.notEqual(stray.run('lint', '1').status, 0, 'lint refuses');
});

test('AC4: lint reports an error for a round that is not valid JSON, or rounds out of order', () => {
  const block = n => `<details><summary>Round ${n} · codex · approve</summary>\n\n\`\`\`json\n${JSON.stringify({ meta: { round: n }, verdict: { verdict: 'approve' } }, null, 2)}\n\`\`\`\n\n</details>`;
  const withRounds = blocks => ticket(fm(), `${good}\n## Review rounds\n\n${blocks.join('\n\n')}\n`);
  const roundErrors = t => lintTicket(t, cfg).errors.filter(e => /round/i.test(e));
  assert.deepEqual(roundErrors(withRounds([block(1), block(2)])), []);
  assert.equal(ticketRounds(withRounds([block(1), block(2)]).raw).rounds.length, 2);
  assert.equal(roundErrors(withRounds([block(1), block(2).replace('"round": 2', '"round": 2,,')])).length, 1, 'bad JSON');
  assert.equal(roundErrors(withRounds([block(1), block(3)])).length, 1, 'a gap');
  assert.equal(roundErrors(withRounds([block(2), block(1)])).length, 1, 'out of order');
  assert.deepEqual(roundErrors(ticket(fm(), good)), [], 'no section is fine');
});

test('AC5: init moves old review files into their tickets, removes speck/reviews/, and a second run changes nothing', () => {
  const r = doneRepo();
  r.add('Live work');
  const finished = r.add('Finished work');
  assert.equal(r.run('set', '2', 'status', 'done').status, 0);
  const rec = (n, verdict) => ({ meta: { round: n, reviewer: 'codex', thread_id: 'T9' }, verdict: { ...approveVerdict, round: n, verdict } });
  const old = (id, files) => {
    const d = path.join(r.dir, 'speck', 'reviews', id);
    fs.mkdirSync(d, { recursive: true });
    for (const [f, c] of Object.entries(files)) fs.writeFileSync(path.join(d, f), typeof c === 'string' ? c : JSON.stringify(c, null, 2) + '\n');
  };
  old('0001', { 'round-1.json': rec(1, 'changes_requested'), 'round-2.json': rec(2, 'approve'), 'round-10.json': rec(3, 'approve'), 'codex-thread': 'T9\n' });
  old('0002', { 'round-1.json': rec(1, 'approve'), 'reviewer-settings.json': '{}' });
  fs.writeFileSync(path.join(r.dir, 'speck', 'reviews', '.gitkeep'), '');
  const res = r.run('init', '--skip-checks');
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /moved\s+review rounds for 2 tickets/);
  const live = ticketRounds(r.read('speck/tickets/0001-live-work.md')).rounds;
  assert.deepEqual(live.map(x => x.verdict.verdict), ['changes_requested', 'approve', 'approve'], 'in round order, not file-name order');
  assert.equal(ticketRounds(r.read(path.join('speck', 'tickets', 'done', path.basename(finished)))).rounds.length, 1, 'done tickets too');
  assert.equal(r.at('speck/reviews'), false, 'speck/reviews/ is gone');
  assert.equal(r.run('lint', '1').status, 0, 'the migrated ticket passes lint');
  const snapshot = () => [r.read('speck/tickets/0001-live-work.md'), r.read(path.join('speck', 'tickets', 'done', path.basename(finished)))];
  const after = snapshot();
  const again = r.run('init', '--skip-checks');
  assert.equal(again.status, 0);
  assert.doesNotMatch(again.stdout, /review rounds/);
  assert.deepEqual(snapshot(), after, 'running it again changes nothing');
  assert.equal(r.at('speck/reviews'), false, 'init no longer creates speck/reviews/');
});

test('AC5: rounds init cannot place are left where they are with a reason, and the rest are migrated', () => {
  const r = doneRepo();
  r.add('Live work');
  r.add('Already migrated');
  const rec = n => JSON.stringify({ meta: { round: n, reviewer: 'codex' }, verdict: { ...approveVerdict, round: n } });
  const put = (id, f, c) => { const d = path.join(r.dir, 'speck', 'reviews', id); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, f), c); };
  put('0001', 'round-1.json', rec(1));
  put('0099', 'round-1.json', rec(1));                  // no ticket 0099
  put('0003', 'round-1.json', rec(1));                  // ticket 0003 can't be read
  fs.writeFileSync(path.join(r.dir, 'speck', 'tickets', '0003-broken.md'), 'no frontmatter\n');
  put('0002', 'round-1.json', '{ not json');            // a round that isn't JSON
  const res = r.run('init', '--skip-checks');
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /skipped speck\/reviews\/0099\/: .*no ticket/i);
  assert.match(res.stdout, /skipped speck\/reviews\/0003\/: /);
  assert.match(res.stdout, /skipped speck\/reviews\/0002\/: .*round-1\.json/);
  assert.equal(ticketRounds(r.read('speck/tickets/0001-live-work.md')).rounds.length, 1, 'the good one is migrated');
  assert.equal(r.at('speck/reviews/0001'), false);
  for (const id of ['0099', '0003', '0002']) assert.equal(r.at(`speck/reviews/${id}/round-1.json`), true, `${id} left where it was`);
  assert.doesNotMatch(r.read('speck/tickets/0002-already-migrated.md'), /Review rounds/, 'a ticket is not half-migrated');
  // A ticket that already has rounds is not given a second set.
  const t1 = r.read('speck/tickets/0001-live-work.md');
  put('0001', 'round-1.json', rec(1));
  const again = r.run('init', '--skip-checks');
  assert.match(again.stdout, /skipped speck\/reviews\/0001\/: .*already has review rounds/);
  assert.equal(r.read('speck/tickets/0001-live-work.md'), t1);
});

// ---------- 0001: warn when the reviewer cannot run commands ----------
