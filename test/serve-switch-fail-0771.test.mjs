import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
// 0771: new code that fails to start leaves speck serve on the code it has. This runs speck serve --background from a
// copy of the CLI, so what it says goes to its log, ~/.config/speck/serve.log, and changes that copy's code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { machine, standInProject, addProject, serveOnce, until, portOf, getJson, readJson, freePortNow } from './support/serve.mjs';
import { serveCopy, readCode, writeCode, marked, slowToLoad, throwsOnLoad, backgroundFrom, workersOf, askFresh } from './support/serve-switch.mjs';

const count = (text, part) => text.split(part).length - 1;
const KEEPS_ON = 'It\'s still running the code it had, and tries again at the next change.';

test('0771 AC4: new code that fails to start leaves the old code serving, says why in its log, and the next change tries again', async () => {
  const m = machine(), a = standInProject('alpha'), cli = serveCopy(), front = readCode(cli, 'serve-front.mjs'), port = freePortNow();
  addProject(m, a);
  writeCode(cli, 'serve-front.mjs', marked(front, 'v1'));
  const r = backgroundFrom(cli, m, port, { SPECK_SERVE_SWITCH_MS: '2000' }); // new code has 2 seconds to be ready
  try {
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const host = readJson(m.record).pid, pa = portOf(r.stdout, 'alpha'), alpha = (await getJson(pa, '/copy'))?.pid;
    assert.ok(alpha, r.stdout);
    const log = () => fs.readFileSync(m.log, 'utf8');
    // The old code still answers, with alpha's panel as it was, and nothing on the new code is left running.
    const unchanged = async () => {
      const got = await askFresh(port);
      assert.equal(got.status, 200, JSON.stringify(got));
      assert.equal(got.version, 'v1', 'the old code still answering');
      assert.equal((await getJson(pa, '/copy'))?.pid, alpha, 'alpha\'s panel as it was');
      assert.equal(readJson(m.record).pid, host);
      await until('no worker left on the new code', () => workersOf(host).length === 0);
    };
    const says = (why, n) => until(`the log saying why: ${why}`, () => count(log(), KEEPS_ON) === n && log().includes(`speck serve: couldn't switch to the new code: ${why}. ${KEEPS_ON}`), 15000);

    writeCode(cli, 'serve-front.mjs', `${marked(front, 'v2')}\nfunction broken( {\n`); // doesn't parse
    await until('the log saying why', () => /speck serve: couldn't switch to the new code: SyntaxError: [^\n]+\. It's still running the code it had, and tries again at the next change\./.test(log()), 15000);
    await unchanged();
    writeCode(cli, 'serve-front.mjs', throwsOnLoad(marked(front, 'v2'), 'boom 0771')); // the next change: throws as it loads
    await says('Error: boom 0771', 2);
    await unchanged();
    writeCode(cli, 'serve-front.mjs', slowToLoad(marked(front, 'v2'), 4000)); // isn't ready in time
    await says('it wasn\'t ready within 2 seconds', 3);
    await unchanged();
    writeCode(cli, 'serve-front.mjs', marked(front, 'v2')); // works
    await until('the new code answering', async () => (await askFresh(port)).version === 'v2', 10000);
    assert.match(log(), /speck serve: its code changed, so it switched to the new code\./);
    assert.equal(count(log(), 'couldn\'t switch'), 3, 'each failure said once');
    assert.doesNotMatch(log(), /\bat .*\.mjs:\d+/, 'no stack trace');
    assert.equal((await getJson(pa, '/copy'))?.pid, alpha, 'alpha\'s panel kept through it all');
    assert.equal(readJson(m.record).pid, host, 'and speck serve is the same process');
    assert.equal(workersOf(host).length, 1, 'with the new code in a worker of its own');
  } finally { serveOnce(m, '--stop'); }
});
