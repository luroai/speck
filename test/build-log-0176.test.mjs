import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test, describe, before as beforeAll } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readableLog, statusData } from '../scripts/speck.mjs';
import { CLI, env, runRepo } from './support/run.mjs';
import { idleCpu, idleSays, CHECK_BUDGET_S } from './support/quick-run.mjs';
import { costMs } from './support/timing.mjs';

// ---------- 0176: keep the board quick to read however many tickets are built ----------

const ev = o => JSON.stringify(o);
const say = t => ev({ type: 'assistant', message: { content: [{ type: 'text', text: t }] } });
const tool = (name, input) => ev({ type: 'assistant', message: { content: [{ type: 'tool_use', name, input }] } });
const output = (content, is_error = false) => ev({ type: 'user', message: { content: [{ type: 'tool_result', is_error, content }] } });
const result = (r, subtype = 'success') => ev({ type: 'result', subtype, result: r });

// build_exit.message as it was worked out before 0176: the whole log read and made readable, then its last 50 lines.
const before = text => readableLog(text).replace(/\s+$/, '').split('\n').slice(-50).join('\n') || null;

// A repo whose tickets are all done, each with a finished build: its run record and the given log.
function boardRepo(logs) {
  const { dir } = runRepo({ tickets: logs.map((_, i) => [String(i + 1).padStart(4, '0'), { status: 'done' }]) });
  const runs = path.join(dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  logs.forEach((log, i) => {
    const id = String(i + 1).padStart(4, '0');
    fs.writeFileSync(path.join(runs, `${id}.json`), ev({ id, session: `s-${id}`, cwd: dir, pid: 1, started: '2026-10-14T10:00:00.000Z', exited: '2026-10-14T11:00:00.000Z', exit_code: 0 }));
    if (log !== undefined) fs.writeFileSync(path.join(runs, `${id}.log`), log);
  });
  return { dir, runs };
}
const messages = dir => Object.fromEntries(statusData(dir).tickets.map(t => [t.id, t.build_exit?.message]));

// A log of the size given, as a build writes it: agent text, tool calls and long tool output, ending in the result.
function streamLog(bytes) {
  const out = [];
  let size = 0, i = 0;
  while (size < bytes) {
    const unit = [say(`Step ${i}: checking the next part of the ticket.`), tool('Bash', { description: `Run step ${i}` }), output('x'.repeat(1500) + i)];
    if (i % 7 === 0) unit.push(output(`error ${i}`, true));
    for (const l of unit) { out.push(l); size += l.length + 1; }
    i++;
  }
  out.push(say('All done.'), result('All done.'));
  return `${out.join('\n')}\n`;
}

// A small seeded random number generator, so the mixed logs are the same every run.
function random(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}
function mixedLog(seed) {
  const r = random(seed);
  const pick = a => a[Math.floor(r() * a.length)];
  const words = ['tests', 'ticket', 'é', '漢字', '🙂', 'done', '  ', '\t', 'x'.repeat(70000)];
  const text = () => Array.from({ length: 1 + Math.floor(r() * 4) }, () => pick(words)).join(r() < 0.3 ? '\n' : ' ');
  const lines = [];
  const count = Math.floor(r() * 400);
  for (let i = 0; i < count; i++) {
    lines.push(pick([
      () => say(text()),
      () => say(text()),
      () => tool(pick(['Bash', 'Read', 'Edit']), { description: text() }),
      () => output('y'.repeat(Math.floor(r() * 140000))),
      () => output(text(), true),
      () => result(pick(['All done.', text(), ''])),
      () => result(text(), 'error_max_turns'),
      () => `plain ${text()}`,
      () => '',
      () => '   ',
      () => '{"type": "assistant", broken',
      () => `${say(text())}\r`,
    ])());
  }
  return lines.join('\n') + pick(['', '\n', '\n\n\n', ' \n \n', '\n'.repeat(2000)]);
}

// AC3 watches an idle speck run for 12 seconds, so the other tests run meanwhile, one at a time, so that nothing else
// they do is going on while AC1 times speck status (0198). They start once AC3's speck run is watching, or AC3 has
// failed before that: their work blocks this process, which would keep AC3 from seeing speck run start.
let watching;
const watched = new Promise(res => { watching = res; });
if (process.platform !== 'linux') watching(); // AC3 is skipped
describe('0176: the board stays quick to read however many tickets are built', { concurrency: true }, () => {
  describe('0176 AC1 and AC2', { concurrency: 1 }, () => {
    beforeAll(() => watched);

    test('0176 AC2: build_exit.message is exactly what reading the whole log gave, for logs of every kind', () => {
      const big = 'z'.repeat(300 * 1024);
      const logs = [
        '',
        '   \n\n \t\n',
        'just one line',
        'no events here\nonly plain output\r\nfrom claude -p\n',
        streamLog(200 * 1024),
        streamLog(2 * 1024 * 1024),
        // The last 50 readable lines span far more than the last few hundred KB: each is followed by very long tool output.
        `${Array.from({ length: 80 }, (_, i) => `${say(`Line ${i}`)}\n${output(big)}`).join('\n')}\n`,
        // It ends in several very long tool-output lines, with the readable lines before them.
        `${Array.from({ length: 60 }, (_, i) => say(`Before ${i}`)).join('\n')}\n${Array.from({ length: 6 }, () => output(big)).join('\n')}\n`,
        // The result repeats agent text from megabytes earlier, so it isn't shown twice.
        `${say('Earlier')}\n${say('The last thing said.')}\n${Array.from({ length: 12 }, () => output(big)).join('\n')}\n${result('The last thing said.')}\n`,
        // The same, but the result says something new, so it is shown.
        `${say('The last thing said.')}\n${Array.from({ length: 12 }, () => output(big)).join('\n')}\n${result('Something new.')}\n`,
        // The same two, with more than 50 readable lines after the long output, so the last piece read holds enough lines.
        `${say('The last thing said.')}\n${Array.from({ length: 12 }, () => output(big)).join('\n')}\n${Array.from({ length: 60 }, (_, i) => `plain ${i}`).join('\n')}\n${result('The last thing said.')}\n`,
        `${say('The last thing said.')}\n${Array.from({ length: 12 }, () => output(big)).join('\n')}\n${Array.from({ length: 60 }, (_, i) => `plain ${i}`).join('\n')}\n${result('Something new.')}\n`,
        // A result with no agent text anywhere before it.
        `${Array.from({ length: 12 }, () => output(big)).join('\n')}\n${result('Only a result.')}\n`,
        // Characters of several bytes and bytes that aren't UTF-8, around where the log would be cut into pieces.
        Buffer.concat([Buffer.from(`${say('🙂'.repeat(40000))}\n`), Buffer.from([0xe2, 0x82, 0x0a, 0xff, 0x0a]), Buffer.from(`${say('漢字'.repeat(30000))}\n${say('end é')}\n`)]),
        `${say('trailing spaces   ')}\n${'\n'.repeat(5000)}`,
        `${say('first\nsecond\n\nthird')}\n${result('first\nsecond\n\nthird')}`,
        ...Array.from({ length: 40 }, (_, i) => mixedLog(i + 1)),
      ];
      const { dir, runs } = boardRepo(logs);
      const got = messages(dir);
      logs.forEach((_, i) => {
        const id = String(i + 1).padStart(4, '0');
        assert.equal(got[id], before(fs.readFileSync(path.join(runs, `${id}.log`), 'utf8')), `log ${id}`);
      });
    });

    test('0176 AC2: a log that changes after the board was read shows its new end the next time', () => {
      const { dir, runs } = boardRepo([`${say('one')}\n`, undefined]);
      const log = path.join(runs, '0001.log');
      assert.equal(messages(dir)['0001'], 'one');
      assert.equal(messages(dir)['0002'], null);
      fs.appendFileSync(log, `${say('two')}\n`);
      assert.equal(messages(dir)['0001'], 'one\n\ntwo');
      // Rewritten to the same size: still read again.
      fs.writeFileSync(log, `${say('six')}\n`);
      fs.utimesSync(log, new Date('2026-01-01T00:00:00Z'), new Date('2026-01-01T00:00:00Z'));
      assert.equal(messages(dir)['0001'], 'six');
      fs.writeFileSync(path.join(runs, '0002.log'), `${say('late')}\n`);
      assert.equal(messages(dir)['0002'], 'late');
      fs.rmSync(log);
      assert.equal(messages(dir)['0001'], null);
    });

    // How long `speck status --json` takes, in ms of the CPU time it uses (costMs), so other builds' test runs on the
    // same machine don't count (0207): the least of several runs, so a busy moment on the machine doesn't count either.
    function statusMs(dir, tries) {
      let best = Infinity;
      for (let i = 0; i < tries; i++) {
        let r;
        best = Math.min(best, costMs(() => { r = spawnSync(process.execPath, [CLI, 'status', '--json'], { cwd: dir, env, maxBuffer: 1 << 30 }); }));
        assert.equal(r.status, 0, String(r.stderr));
      }
      return best;
    }

    test('0176 AC1: with 200 finished builds, logs 10 times bigger add less than 10% to how long speck status --json takes', () => {
      const small = streamLog(200 * 1024), large = streamLog(2 * 1024 * 1024);
      const { dir, runs } = boardRepo(Array(200).fill(small));
      // Both sets of logs are written first and swapped in by renaming their folder, so writing them doesn't slow a timing.
      const sets = { small: `${runs}-small`, large: `${runs}-large` };
      fs.cpSync(runs, sets.large, { recursive: true });
      for (let i = 1; i <= 200; i++) fs.writeFileSync(path.join(sets.large, `${String(i).padStart(4, '0')}.log`), large);
      fs.renameSync(runs, sets.small);
      spawnSync('sync');
      const timed = set => {
        fs.renameSync(sets[set], runs);
        try { statusMs(dir, 1); return statusMs(dir, 3); } finally { fs.renameSync(runs, sets[set]); }
      };
      // Alternated, so a slow patch on the machine falls on both sizes alike.
      let fast = Infinity, slow = Infinity;
      for (let round = 0; round < 4; round++) {
        fast = Math.min(fast, timed('small'));
        slow = Math.min(slow, timed('large'));
      }
      assert.ok(slow < fast * 1.1, `200 KB logs: ${fast.toFixed(0)} ms; 2 MB logs: ${slow.toFixed(0)} ms`);
    });
  });

  // A minute of the real 5-second wait is 12 checks. speck run makes them a second apart instead, which costs the same
  // CPU for each check, and each may use what 5% of one core over the real wait allows (0232).
  test('0176 AC3: with 200 finished builds whose logs are 2 MB each, an idle speck run uses less than 5% of one core over a minute\'s checks', { skip: process.platform !== 'linux' && 'reads /proc', timeout: 120000 }, async () => {
    try {
      const { dir } = boardRepo(Array(200).fill(streamLog(2 * 1024 * 1024)));
      const m = await idleCpu(dir, { pollMs: 1000, checks: 12, watching });
      assert.ok(m.running, m.out);
      assert.ok(m.perCheck < CHECK_BUDGET_S, idleSays(m));
    } finally { watching(); }
  });
});
