import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { CLI, reviewRepo, changesVerdict, commandRepo } from './support/speck.mjs';

test('0012 AC1: speck review runs the configured command from the repo root, sends the speck prompt text on stdin and records the round', () => {
  const r = commandRepo();
  const tests = path.join(r.dir, '..', `tests-${path.basename(r.dir)}.txt`);
  fs.writeFileSync(tests, '# pass 9\n');
  const sub = path.join(r.dir, 'sub');
  fs.mkdirSync(sub);
  const res = spawnSync(process.execPath, [CLI, 'review', '1', `--tests=${tests}`], { cwd: sub, encoding: 'utf8' });
  assert.equal(res.status, 10, res.stderr);
  assert.match(res.stdout, /NEXT: fix/);
  const [call] = r.calls();
  assert.equal(fs.realpathSync(call.cwd), fs.realpathSync(r.dir), 'runs from the repo root');
  assert.equal(call.stdin.trimEnd(), r.run('prompt', '1', `--tests=${tests}`).stdout.trimEnd(), 'the same text speck prompt prints');
  assert.match(call.stdin, /Return ONLY a JSON object matching this schema/);
  const r1 = r.roundFile(1);
  assert.equal(r1.meta.reviewer, 'fake');
  assert.equal(r1.meta.reviewed_sha, r.git('rev-parse', 'HEAD').stdout.trim());
  assert.equal(r1.verdict.verdict, 'changes_requested');
  assert.equal(r.calls().length, 1);
  assert.equal(fs.existsSync(path.join(r.dir, 'speck', 'reviews')), false);
});

test('0012 AC2: {model} and {effort} are filled in, and a blank one goes with the flag before it', () => {
  const set = commandRepo({ ticketFields: 'reviewer_model: m-1\nreviewer_effort: high' });
  assert.equal(set.run('review', '1').status, 10);
  assert.deepEqual(set.calls()[0].args, ['--model', 'm-1', '--effort', 'high', '--flag', 'two words']);
  assert.equal(set.roundFile(1).meta.reviewer_model, 'm-1');

  const blank = commandRepo();
  assert.equal(blank.run('review', '1').status, 10);
  assert.deepEqual(blank.calls()[0].args, ['--flag', 'two words']);

  const one = commandRepo({ ticketFields: 'reviewer_model: m-2' });
  assert.equal(one.run('review', '1').status, 10);
  assert.deepEqual(one.calls()[0].args, ['--model', 'm-2', '--flag', 'two words']);

  const joined = commandRepo({ command: '{bin} --model={model} -x' });
  assert.equal(joined.run('review', '1').status, 10);
  assert.deepEqual(joined.calls()[0].args, ['-x'], 'a blank --model={model} disappears');

  // Values are passed as arguments, never through a shell.
  const odd = commandRepo({ ticketFields: 'reviewer_model: "a b;echo hi"' });
  assert.equal(odd.run('review', '1').status, 10);
  assert.deepEqual(odd.calls()[0].args.slice(0, 2), ['--model', 'a b;echo hi']);
});

test('0012 AC3: the verdict is read from raw JSON, a fenced block or a result envelope', () => {
  for (const mode of ['raw', 'fenced', 'envelope']) {
    const r = commandRepo();
    const res = r.runEnv({ FAKE_MODE: mode }, 'review', '1');
    assert.equal(res.status, 10, `${mode}: ${res.stderr}`);
    assert.equal(r.roundFile(1).verdict.findings[0].id, 'F1', mode);
  }
  const env = commandRepo();
  env.runEnv({ FAKE_MODE: 'envelope' }, 'review', '1');
  assert.deepEqual(env.roundFile(1).meta.usage, { input_tokens: 100, output_tokens: 20 }, 'token use from the envelope is kept');
});

test('0012 AC3: anything else, or a non-zero exit, is a plain error quoting the last five lines of stderr, and records nothing', () => {
  const junk = commandRepo();
  let res = junk.runEnv({ FAKE_MODE: 'garbage' }, 'review', '1');
  assert.equal(res.status, 1);
  assert.match(res.stderr, /didn't return a verdict/);
  assert.match(res.stderr, /note one\nnote two/);
  assert.equal(junk.roundFile(1), undefined);

  const fail = commandRepo();
  res = fail.runEnv({ FAKE_MODE: 'fail' }, 'review', '1');
  assert.equal(res.status, 1);
  assert.match(res.stderr, /exited 3/);
  assert.match(res.stderr, /err line 3\nerr line 4\nerr line 5\nerr line 6\nerr line 7/);
  assert.doesNotMatch(res.stderr, /err line 2/);
  assert.equal(fail.roundFile(1), undefined);

  // Valid JSON that isn't a valid verdict also quotes stderr (round 1 F1).
  const shape = commandRepo();
  res = shape.runEnv({ FAKE_MODE: 'badshape' }, 'review', '1');
  assert.equal(res.status, 1);
  assert.match(res.stderr, /Reviewer output is missing or invalid/);
  assert.match(res.stderr, /warn line 3\nwarn line 4\nwarn line 5\nwarn line 6\nwarn line 7/);
  assert.doesNotMatch(res.stderr, /warn line 2/);
  assert.equal(shape.roundFile(1), undefined);

  const missing = commandRepo({ command: 'speck-no-such-reviewer-cmd -p' });
  res = missing.run('review', '1');
  assert.equal(res.status, 1);
  assert.match(res.stderr, /speck-no-such-reviewer-cmd/);
  assert.doesNotMatch(res.stderr, /    at /);
  assert.equal(missing.roundFile(1), undefined);
});

test('0012 AC4: later rounds resend the round-1 prompt, then every earlier verdict and builder response in order, then the new diff', () => {
  const r = commandRepo();
  const resp = n => { const f = path.join(r.dir, '..', `resp-${n}-${path.basename(r.dir)}.md`); fs.writeFileSync(f, `- F1: fixed in round ${n} response.\n`); return f; };
  const testsFile = n => { const f = path.join(r.dir, '..', `tests-${n}-${path.basename(r.dir)}.txt`); fs.writeFileSync(f, `# tests output ${n}\n`); return f; };
  assert.equal(r.run('review', '1', `--tests=${testsFile(1)}`).status, 10);
  fs.writeFileSync(path.join(r.dir, 'a.txt'), 'second\n');
  r.git('add', '-A'); r.git('commit', '-qm', 'fix 1');
  const v2 = { ...changesVerdict, summary: 'Round two summary.' };
  assert.equal(r.runEnv({ FAKE_VERDICT: JSON.stringify(v2) }, 'review', '1', `--response=${resp(2)}`, `--tests=${testsFile(2)}`).status, 10);
  const sha2 = r.git('rev-parse', 'HEAD').stdout.trim();
  fs.writeFileSync(path.join(r.dir, 'a.txt'), 'third-line-marker\n');
  r.git('add', '-A'); r.git('commit', '-qm', 'fix 2');
  assert.equal(r.run('review', '1', `--response=${resp(3)}`, `--tests=${testsFile(3)}`).status, 11, 'third round hits the default limit and blocks');
  const third = r.calls()[2].stdin;
  const round1Now = r.calls()[0].stdin.trimEnd();
  assert.ok(third.startsWith(round1Now), 'starts with the round-1 prompt exactly as it was sent (round 1 F2)');
  assert.match(round1Now, /# tests output 1/);
  assert.doesNotMatch(round1Now, /third-line-marker/);
  assert.match(third.slice(round1Now.length), /# tests output 3/, 'the current test output comes after the history');
  const order = ['Round one summary.', 'fixed in round 2 response', 'Round two summary.', 'fixed in round 3 response', `${sha2.slice(0, 8)}..HEAD`, '+third-line-marker'];
  const at = order.map(s => third.indexOf(s, round1Now.length));
  assert.ok(at.every(i => i > 0), JSON.stringify(at));
  assert.deepEqual([...at].sort((a, b) => a - b), at, 'in order');
  assert.ok(third.indexOf('"F1"', round1Now.length) > 0, 'earlier verdicts are sent in full, with finding ids');
  assert.equal(r.roundFile(2).meta.builder_response, '- F1: fixed in round 2 response.\n');
});

test('0012 AC5: codex without a command and reviewers with no command behave as before', () => {
  const codex = reviewRepo();
  assert.equal(codex.run('review', '1').status, 10);
  assert.equal(codex.calls().length, 1, 'the codex adapter ran');
  assert.equal(codex.roundFile(1).meta.reviewer, 'codex');
  assert.equal(codex.roundFile(1).meta.builder_response, undefined);
  const other = reviewRepo({ ticketFields: 'reviewer: someone' });
  const res = other.run('review', '1');
  assert.equal(res.status, 1);
  assert.match(res.stderr, /speck record 1/);
  assert.equal(other.calls().length, 0);
});

test('0012 AC4 (F2): without the saved round-1 prompt, later rounds rebuild it from the round-1 commit', () => {
  const r = commandRepo();
  assert.equal(r.run('review', '1').status, 10);
  const sent = r.calls()[0].stdin.trimEnd();
  fs.rmSync(path.join(r.dir, 'speck', '.cache'), { recursive: true, force: true });
  fs.writeFileSync(path.join(r.dir, 'a.txt'), 'later-change-marker\n');
  r.git('add', '-A'); r.git('commit', '-qm', 'fix 1');
  assert.equal(r.run('review', '1').status, 10);
  const second = r.calls()[1].stdin;
  const history = second.indexOf('# Earlier review rounds');
  const rebuilt = second.slice(0, history);
  assert.ok(history > 0);
  assert.equal(rebuilt.replace('(the round-1 test output was not kept)', '(no test output provided)').trimEnd(), sent, 'same as round 1, except the test output');
  assert.doesNotMatch(rebuilt, /later-change-marker/);
  assert.match(second.slice(history), /later-change-marker/);
});

// ---------- 0013: resume a configured reviewer's session between rounds ----------

const resumeOptions = { session_id_path: 'session_id', resume_command: '{bin} --resume {session} --model {model}' };
function twoRounds(r, env = {}) {
  const env1 = { FAKE_MODE: 'envelope', ...env };
  assert.equal(r.runEnv(env1, 'review', '1').status, 10);
  fs.writeFileSync(path.join(r.dir, 'a.txt'), 'resume-fix-marker\n');
  r.git('add', '-A'); r.git('commit', '-qm', 'fix 1');
  const resp = path.join(r.dir, '..', `resp-${path.basename(r.dir)}.md`);
  fs.writeFileSync(resp, '- F1: fixed for the resumed round.\n');
  return r.runEnv({ ...env1, FAKE_SESSION: 'S2' }, 'review', '1', `--response=${resp}`);
}

test('0013 AC1: session_id_path picks the session id out of the output and saves it as thread_id', () => {
  const top = commandRepo({ options: { session_id_path: 'session_id' } });
  assert.equal(top.runEnv({ FAKE_MODE: 'envelope' }, 'review', '1').status, 10);
  assert.equal(top.roundFile(1).meta.thread_id, 'S1');
  const nested = commandRepo({ options: { session_id_path: 'meta.sid' } });
  assert.equal(nested.runEnv({ FAKE_MODE: 'envelope' }, 'review', '1').status, 10);
  assert.equal(nested.roundFile(1).meta.thread_id, 'N1');
  const none = commandRepo();
  assert.equal(none.runEnv({ FAKE_MODE: 'envelope' }, 'review', '1').status, 10);
  assert.equal(none.roundFile(1).meta.thread_id, undefined, 'nothing saved without session_id_path');
  const missing = commandRepo({ options: { session_id_path: 'no.such.path' } });
  assert.equal(missing.runEnv({ FAKE_MODE: 'envelope' }, 'review', '1').status, 10);
  assert.equal(missing.roundFile(1).meta.thread_id, undefined);
});

test('0013 AC2: later rounds run resume_command with the saved session and send only the round-2 prompt', () => {
  const r = commandRepo({ ticketFields: 'reviewer_model: m-9', options: resumeOptions });
  const res = twoRounds(r);
  assert.equal(res.status, 10, res.stderr);
  const [first, second] = r.calls();
  assert.ok(!first.args.includes('--resume'));
  assert.deepEqual(second.args, ['--resume', 'S1', '--model', 'm-9']);
  assert.match(second.stdin, /^# Review round 2/);
  assert.match(second.stdin, /fixed for the resumed round/);
  assert.match(second.stdin, /\+resume-fix-marker/);
  assert.doesNotMatch(second.stdin, /You are the speck reviewer|# Earlier review rounds/, 'no round-1 prompt or history');
  assert.equal(r.roundFile(2).meta.thread_id, 'S2', 'the session id from the resumed run is saved');
  assert.equal(r.roundFile(2).meta.session, 'continued');
  assert.doesNotMatch(res.stdout, /fresh/i);
});

test('0013 AC3: with no session, no resume_command or a failed resume, speck sends the full history to a fresh run and says so in one line', () => {
  const cases = [
    ['no resume_command', { session_id_path: 'session_id' }, {}, /no resume_command/],
    ['no saved session', { resume_command: resumeOptions.resume_command }, {}, /no session id/],
    ['resume failed', resumeOptions, { FAKE_RESUME_FAIL: '1' }, /exited 4/],
  ];
  for (const [name, options, env, why] of cases) {
    const r = commandRepo({ options });
    const res = twoRounds(r, env);
    assert.equal(res.status, 10, `${name}: ${res.stderr}`);
    const plain = r.calls().filter(c => !c.args.includes('--resume'));
    assert.equal(plain.length, 2, `${name}: round 2 ran the plain command`);
    assert.match(plain[1].stdin, /# Earlier review rounds/, name);
    const notes = res.stdout.split('\n').filter(l => /fresh/i.test(l));
    assert.equal(notes.length, 1, `${name}: one line says so`);
    assert.match(notes[0], why, name);
    assert.equal(r.roundFile(2).meta.session, 'fresh', name);
  }
});

test('0013 AC4: the review pack says whether each round continued a session or started fresh', () => {
  const r = commandRepo({ options: resumeOptions });
  twoRounds(r);
  const pack = r.run('pack', '1').stdout;
  assert.match(pack, /- Round 1 \(fake[^)]*\): .*fresh session/);
  assert.match(pack, /- Round 2 \(fake[^)]*\): .*continued session/);

  const codex = reviewRepo();
  assert.equal(codex.run('review', '1').status, 10);
  codex.git('add', '-A'); codex.git('commit', '-qm', 'round 1');
  assert.equal(codex.run('review', '1').status, 10);
  const cpack = codex.run('pack', '1').stdout;
  assert.match(cpack, /- Round 1 \(codex[^)]*\): .*fresh session/);
  assert.match(cpack, /- Round 2 \(codex[^)]*\): .*continued session/);
});

test('0013 AC2/AC3 (F1): a session is only resumed from the latest round, never across a fresh run', () => {
  const r = commandRepo({ options: resumeOptions });
  const resp = n => { const f = path.join(r.dir, '..', `resp3-${n}-${path.basename(r.dir)}.md`); fs.writeFileSync(f, `- round ${n} response\n`); return f; };
  const commit = n => { fs.writeFileSync(path.join(r.dir, 'a.txt'), `change ${n}\n`); r.git('add', '-A'); r.git('commit', '-qm', `fix ${n}`); };
  assert.equal(r.runEnv({ FAKE_MODE: 'envelope' }, 'review', '1').status, 10);
  assert.equal(r.roundFile(1).meta.thread_id, 'S1');
  commit(1);
  // Resuming fails, and the fresh run reports no session id.
  const two = r.runEnv({ FAKE_MODE: 'raw', FAKE_RESUME_FAIL: '1' }, 'review', '1', `--response=${resp(2)}`);
  assert.equal(two.status, 10, two.stderr);
  assert.equal(r.roundFile(2).meta.session, 'fresh');
  assert.equal(r.roundFile(2).meta.thread_id, undefined);
  commit(2);
  const three = r.runEnv({ FAKE_MODE: 'envelope' }, 'review', '1', `--response=${resp(3)}`);
  assert.equal(three.status, 11, three.stderr);
  const calls = r.calls();
  assert.ok(!calls[calls.length - 1].args.includes('--resume'), 'S1 never saw round 2, so it is not resumed');
  assert.match(calls[calls.length - 1].stdin, /# Earlier review rounds/);
  assert.match(three.stdout, /fresh .*no session id/i);
  assert.equal(r.roundFile(3).meta.session, 'fresh');
});

// ---------- 0014: check the configured builder in speck doctor ----------

// A repo with speck installed and the given config lines, plus a PATH holding only node, git and the named fake tools.
