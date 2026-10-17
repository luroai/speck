import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseYaml, parseTicket, setField, lintTicket, reviewerSettings } from '../scripts/speck.mjs';
import { ROOT, cfg, ticket, good, fm, reviewRepo, fenced, subagentVerdict, subagentRepo } from './support/speck.mjs';

const EFFORT_VALUES = ['low', 'medium', 'high', 'xhigh', 'max'];
test('AC1: config and ticket templates have blank reviewer_model and reviewer_effort', () => {
  const config = parseYaml(fs.readFileSync(path.join(ROOT, 'templates', 'config.yml'), 'utf8'));
  assert.equal(config.reviewer_model, '');
  assert.equal(config.reviewer_effort, '');
  const t = parseTicket(fs.readFileSync(path.join(ROOT, 'templates', 'ticket.md'), 'utf8'));
  assert.equal(t.fm.reviewer_model, '');
  assert.equal(t.fm.reviewer_effort, '');
});

test('AC1: speck new copies the config values into the ticket', () => {
  const { ticketFile } = reviewRepo({ config: 'reviewer_model: some-model-1\nreviewer_effort: high\n' });
  const t = parseTicket(fs.readFileSync(ticketFile, 'utf8'));
  assert.equal(t.fm.reviewer_model, 'some-model-1');
  assert.equal(t.fm.reviewer_effort, 'high');
});

test('AC1: a ticket value overrides config and a blank ticket value falls back to config', () => {
  const c = { reviewer_model: 'cfg-model', reviewer_effort: 'low' };
  assert.deepEqual(reviewerSettings({ reviewer_model: 'tkt-model', reviewer_effort: 'max' }, c), { model: 'tkt-model', effort: 'max' });
  assert.deepEqual(reviewerSettings({ reviewer_model: '', reviewer_effort: '' }, c), { model: 'cfg-model', effort: 'low' });
  assert.deepEqual(reviewerSettings({}, c), { model: 'cfg-model', effort: 'low' });
  assert.deepEqual(reviewerSettings({ reviewer_model: 'tkt-model' }, { reviewer_model: '', reviewer_effort: '' }), { model: 'tkt-model', effort: null });
});

test('AC2: with nothing set, no model or effort is passed to codex', () => {
  assert.deepEqual(reviewerSettings({ reviewer_model: '', reviewer_effort: '' }, { reviewer_model: '', reviewer_effort: '' }), { model: null, effort: null });
  const { run, calls } = reviewRepo();
  assert.equal(run('review', '1').status, 10);
  const args = calls()[0];
  assert.ok(!args.includes('-m') && !args.includes('--model'), args.join(' '));
  // 0276: a setting given with -c (model=…, model_reasoning_effort=…), not a path that happens to have "model" in it,
  // such as a worktree named after its ticket's title
  assert.ok(!args.some(a => /^model/.test(a)), args.join(' '));
});

test('AC2: no model name is hard-coded in speck code, templates or skills', () => {
  const MODEL = /\b(gpt-[\w.-]+|o[1-9](-mini|-pro)?|claude-(opus|sonnet|haiku|instant)[\w.-]*|(opus|sonnet|haiku)-?\d[\w.-]*|gemini-(?!cli\b)[\w.-]+|codex-mini[\w.-]*)\b/i;
  const files = d => fs.readdirSync(path.join(ROOT, d), { recursive: true }).map(f => path.join(ROOT, d, f)).filter(f => fs.statSync(f).isFile());
  for (const f of [...files('scripts'), ...files('templates'), ...files('skills')]) {
    const hit = fs.readFileSync(f, 'utf8').match(MODEL);
    assert.equal(hit, null, `${path.relative(ROOT, f)} names a model: ${hit && hit[0]}`);
  }
});

test('AC3: speck review passes the model and effort to codex in round 1 and resumed rounds', () => {
  const { run, calls } = reviewRepo({ config: 'reviewer_model: cfg-model\nreviewer_effort: low\n', ticketFields: 'reviewer_model: tkt-model-2\nreviewer_effort: xhigh' });
  assert.equal(run('review', '1').status, 10);
  assert.equal(run('review', '1').status, 10);
  const [r1, r2] = calls();
  assert.deepEqual(r1.slice(0, 1), ['exec']);
  assert.deepEqual(r2.slice(0, 2), ['exec', 'resume']);
  for (const args of [r1, r2]) {
    assert.equal(args[args.indexOf('-m') + 1], 'tkt-model-2');
    assert.ok(args.includes('model_reasoning_effort="xhigh"'), args.join(' '));
  }
});

test('AC3: the review skill tells the builder to start a claude-subagent with the resolved model and effort (manual smoke test in ticket 0005 Notes)', () => {
  const skill = fs.readFileSync(path.join(ROOT, 'skills', 'speck-review', 'SKILL.md'), 'utf8');
  assert.match(skill, /speck reviewer-settings <id>/);
  assert.match(skill, /`model`/);
  assert.match(skill, /`effort`/);
  const { run } = reviewRepo({ ticketFields: 'reviewer_model: tkt-model\nreviewer_effort: medium' });
  assert.match(run('reviewer-settings', '1').stdout, /model: tkt-model\neffort: medium/);
  assert.match(reviewRepo().run('reviewer-settings', '1').stdout, /model: default\neffort: default/);
});

test('AC4: lint rejects an unknown reviewer_effort and passes model names through', () => {
  for (const e of ['', ...EFFORT_VALUES])
    assert.deepEqual(lintTicket(ticket(fm({ reviewer_effort: `"${e}"`, reviewer_model: 'Anything at all/9' }), good), cfg).errors, [], e);
  for (const e of ['huge', 'minimal', 'HIGH'])
    assert.equal(lintTicket(ticket(fm({ reviewer_effort: e }), good), cfg).errors.length, 1, e);
  assert.equal(lintTicket(ticket(fm(), good), { ...cfg, reviewer_effort: 'huge' }).errors.length, 1, 'config value is checked too');
});

test('AC5: saved rounds and the review pack show the reviewer model and effort, or default', () => {
  const set = reviewRepo({ ticketFields: 'reviewer_model: tkt-model\nreviewer_effort: high' });
  assert.equal(set.run('review', '1').status, 10);
  assert.equal(set.roundFile(1).meta.reviewer_model, 'tkt-model');
  assert.equal(set.roundFile(1).meta.reviewer_effort, 'high');
  const pack = set.run('pack', '1').stdout;
  assert.match(pack, /\*\*Verdict:\*\*.*model tkt-model, effort high/);
  assert.match(pack, /Round 1 \(codex, model tkt-model, effort high\)/);

  const unset = reviewRepo();
  assert.equal(unset.run('review', '1').status, 10);
  assert.equal(unset.roundFile(1).meta.reviewer_model, 'default');
  assert.equal(unset.roundFile(1).meta.reviewer_effort, 'default');
  assert.match(unset.run('pack', '1').stdout, /Round 1 \(codex, model default, effort default\)/);

  // Rounds recorded from another reviewer carry the settings too.
  const v = path.join(unset.dir, 'v.json');
  fs.writeFileSync(v, JSON.stringify({ verdict: 'approve', criteria: [{ id: 1, status: 'pass', evidence: 'ok' }], findings: [], summary: 's', escalation_question: '' }));
  unset.run('record', '1', v, '--reviewer=claude-subagent');
  assert.equal(unset.roundFile(2).meta.reviewer_model, 'default');
  assert.equal(unset.roundFile(2).meta.reviewer_effort, 'default');
});

test('AC5: recorded subagent rounds keep the settings the reviewer was started with', () => {
  const r = reviewRepo({ ticketFields: 'reviewer_model: first-model\nreviewer_effort: low' });
  assert.match(r.run('reviewer-settings', '1').stdout, /model: first-model\neffort: low/);
  const v = path.join(r.dir, 'v.json');
  fs.writeFileSync(v, JSON.stringify({ verdict: 'changes_requested', criteria: [{ id: 1, status: 'pass', evidence: 'ok' }], findings: [], summary: 's', escalation_question: '' }));
  r.run('record', '1', v, '--reviewer=claude-subagent');
  // The ticket's settings change mid-loop, but the same subagent is resumed for round 2.
  fs.writeFileSync(r.ticketFile, setField(setField(fs.readFileSync(r.ticketFile, 'utf8'), 'reviewer_model', 'second-model'), 'reviewer_effort', 'max'));
  r.git('add', path.relative(r.dir, r.ticketFile)); r.git('commit', '-qm', 'settings changed'); // record needs tracked changes committed (0025)
  r.run('record', '1', v, '--reviewer=claude-subagent');
  for (const n of [1, 2]) {
    assert.equal(r.roundFile(n).meta.reviewer_model, 'first-model');
    assert.equal(r.roundFile(n).meta.reviewer_effort, 'low');
  }
});

// ---------- 0006: ship approved tickets locally ----------

const cmdEvent = (output, extra = {}) => JSON.stringify({ type: 'item.completed', item: { id: 'item_1', type: 'command_execution', command: 'git diff', aggregated_output: output, exit_code: 1, status: 'failed', ...extra } });
const BWRAP = 'bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted';

test('AC1: speck review warns when a command failed because of the sandbox', () => {
  const r = reviewRepo({ extraEnv: { FAKE_CODEX_EVENT: cmdEvent(BWRAP) } });
  const res = r.run('review', '0001', '--tests=/dev/null');
  assert.match(res.stdout, /⚠️ Reviewer could not inspect the repo; reviewed the diff only/);
});

test('AC1: a non-zero exit with sandbox output warns whatever the status label says', () => {
  const r = reviewRepo({ extraEnv: { FAKE_CODEX_EVENT: cmdEvent(BWRAP, { status: 'completed', exit_code: 1 }) } });
  assert.match(r.run('review', '0001', '--tests=/dev/null').stdout, /could not inspect/);
  assert.equal(r.roundFile(1).meta.sandbox_ok, false);
});

test('AC1: no warning when commands ran, or failed for another reason', () => {
  for (const ev of [undefined, cmdEvent('npm: not found'), cmdEvent('ok', { exit_code: 0, status: 'completed' }), cmdEvent(BWRAP, { exit_code: 0, status: 'completed' })]) {
    const r = reviewRepo({ extraEnv: ev ? { FAKE_CODEX_EVENT: ev } : {} });
    assert.doesNotMatch(r.run('review', '0001', '--tests=/dev/null').stdout, /could not inspect/);
  }
});

test('AC2: the round stores sandbox_ok: false in meta only when the sandbox failed', () => {
  const bad = reviewRepo({ extraEnv: { FAKE_CODEX_EVENT: cmdEvent(BWRAP) } });
  bad.run('review', '0001', '--tests=/dev/null');
  assert.equal(bad.roundFile(1).meta.sandbox_ok, false);
  const good = reviewRepo();
  good.run('review', '0001', '--tests=/dev/null');
  assert.notEqual(good.roundFile(1).meta.sandbox_ok, false);
});

test('AC3: the review pack flags each round where the reviewer could not inspect the repo', () => {
  const bad = reviewRepo({ extraEnv: { FAKE_CODEX_EVENT: cmdEvent(BWRAP) } });
  bad.run('review', '0001', '--tests=/dev/null');
  assert.match(bad.run('pack', '0001').stdout, /⚠️ Reviewer could not inspect the repo; reviewed the diff only \(round 1\)/);
  const good = reviewRepo();
  good.run('review', '0001', '--tests=/dev/null');
  assert.doesNotMatch(good.run('pack', '0001').stdout, /could not inspect/);
});

// ---------- 0008: cancel a ticket with a recorded reason ----------

// A repo with speck installed, plus helpers for lint-clean tickets and file paths.
test('0003 AC1: a claude-subagent round 1 records changes_requested from the reply as sent', () => {
  const r = subagentRepo();
  assert.equal(r.run('lint', '1').status, 0);
  assert.match(r.run('review', '1').stderr, /speck record 1/, 'speck review points a claude-subagent ticket at speck record');
  const tests = path.join(r.dir, 'tests.txt');
  fs.writeFileSync(tests, '# pass 1\n');
  const prompt = r.run('prompt', '1', `--tests=${tests}`).stdout;
  assert.match(prompt, /Export bookings/);
  assert.match(prompt, /# pass 1/);
  assert.match(prompt, /Return ONLY a JSON object/);
  assert.match(r.run('reviewer-settings', '1').stdout, /model: default\neffort: default/);
  const v = path.join(r.dir, 'v.json');
  fs.writeFileSync(v, fenced(subagentVerdict('changes_requested', 'open')));
  const rec = r.run('record', '1', v, '--reviewer=claude-subagent');
  assert.equal(rec.status, 10, rec.stderr);
  assert.match(rec.stdout, /NEXT: fix/);
  // The same reply with Windows line endings, or with no fence at all, records just the same.
  for (const reply of [fenced(subagentVerdict('changes_requested', 'open')).replace(/\n/g, '\r\n'), JSON.stringify(subagentVerdict('changes_requested', 'open'))]) {
    const other = subagentRepo(), w = path.join(other.dir, 'w.json');
    fs.writeFileSync(w, reply);
    assert.equal(other.run('record', '1', w, '--reviewer=claude-subagent').status, 10);
  }
  const r1 = r.roundFile(1);
  assert.equal(r1.meta.reviewer, 'claude-subagent');
  assert.equal(r1.verdict.verdict, 'changes_requested');
  assert.equal(r1.meta.reviewed_sha, r.git('rev-parse', 'HEAD').stdout.trim());
  assert.equal(r.run('next', '1').stdout.trim(), 'fix');
});

test('0003 AC2: round 2 sees only the fix, and an approval from the same reviewer ends the loop at ship', () => {
  const r = subagentRepo();
  r.run('reviewer-settings', '1');
  const v = path.join(r.dir, 'v.json');
  fs.writeFileSync(v, fenced(subagentVerdict('changes_requested', 'open')));
  assert.equal(r.run('record', '1', v, '--reviewer=claude-subagent').status, 10);
  fs.writeFileSync(path.join(r.dir, 'a.txt'), 'fixed\n');
  r.git('add', 'a.txt', path.relative(r.dir, r.ticketFile)); r.git('commit', '-qm', 'review round 1 fixes');
  const diff = r.run('diff', '1').stdout;
  assert.match(diff, /^\+fixed$/m, 'speck diff shows the fix');
  assert.doesNotMatch(diff, /Review rounds/, 'and leaves out the recorded round');
  fs.writeFileSync(v, fenced(subagentVerdict('approve', 'resolved')));
  const rec = r.run('record', '1', v, '--reviewer=claude-subagent');
  assert.equal(rec.status, 0, rec.stderr);
  assert.equal(r.run('next', '1').stdout.trim(), 'ship');
  assert.equal(r.roundFile(2).meta.reviewed_sha, r.git('rev-parse', 'HEAD').stdout.trim());
  assert.match(r.run('pack', '1').stdout, /Round 2 \(claude-subagent, model default, effort default\): \*\*approve\*\*/);
});

test('0003 AC1: a reply that is not a verdict gets a plain error, and no round is recorded', () => {
  const r = subagentRepo();
  const v = path.join(r.dir, 'v.json');
  for (const reply of ['Looks good to me!', '```json\n{"verdict": \n```\n', '', 'null', '[1]']) {
    fs.writeFileSync(v, reply);
    const rec = r.run('record', '1', v, '--reviewer=claude-subagent');
    assert.equal(rec.status, 1, JSON.stringify(reply));
    assert.match(rec.stderr, /isn't a JSON verdict/, JSON.stringify(reply));
    assert.doesNotMatch(rec.stderr, /at JSON\.parse|SyntaxError/, 'no stack trace');
    assert.equal(r.roundFile(1), undefined);
  }
  // A JSON object with a broken entry in criteria or findings is refused plainly too (round 1 F1).
  for (const broken of [{ criteria: [null] }, { findings: [null] }, { criteria: ['pass'] }, { findings: [[]] }]) {
    fs.writeFileSync(v, JSON.stringify({ ...subagentVerdict('changes_requested', 'open'), ...broken }));
    const rec = r.run('record', '1', v, '--reviewer=claude-subagent');
    assert.equal(rec.status, 1, JSON.stringify(broken));
    assert.match(rec.stderr, /Reviewer output is missing or invalid/, JSON.stringify(broken));
    assert.doesNotMatch(rec.stderr, /TypeError|    at /, 'no stack trace');
    assert.equal(r.roundFile(1), undefined);
  }
});

test('0003 AC3: the review skill says how to save a fenced subagent reply and how to resume it for round 2', () => {
  const md = fs.readFileSync(path.join(ROOT, 'skills', 'speck-review', 'SKILL.md'), 'utf8');
  const sub = md.split('**`claude-subagent`**')[1].split('## Your turn')[0];
  assert.match(sub, /```json[` ]*fence, and `speck record` accepts that/, 'round 1: a fenced reply can be saved as it is');
  assert.match(sub, /SendMessage/, 'round 1: says the agent id is for SendMessage in round 2');
  const r2 = md.split('**claude-subagent:**')[1].split('## Ending the loop')[0];
  assert.match(r2, /agent id/);
  assert.match(r2, /speck record <id> \/tmp\/speck-<id>-verdict\.json --reviewer=claude-subagent/);
});

// ---------- 0009: record which tickets an idea became ----------
