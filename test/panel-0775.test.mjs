// 0775: the 0067 AC2 and AC4 restart tests hold up on a busy machine and still catch a real fault. A new server that
// takes 6 s to load stands in for a busy machine: longer than the 5 s those tests allowed before.
import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { panelRepo, cliCopy, freePort, startPanel, stop, request } from './support/panel.mjs';
import { RESTART_MS, code, within, slowToLoad, tokenSurvivesRestart, failedRestartKeepsServing } from './support/panel-restart.mjs';

const SLOW = 6000;
// A new server that makes its own token rather than keeping the one passed down, as a broken restart would.
const freshToken = src => {
  const out = src.replace('SPECK_PANEL_TOKEN: token,', "SPECK_PANEL_TOKEN: from ? crypto.randomBytes(32).toString('hex') : token,");
  assert.notEqual(out, src, 'the token line is where the test expects it');
  return out;
};
// A server that stops serving once new code has failed to start, as a broken restart would: it stops when it's next asked
// for a page it hasn't got, as the test does to see the old code still serving, so the test sees the error first.
const stopsOnFailure = src => {
  const out = src.replace("    return send(res, 404, 'text/plain', 'Not found.\\n');\n  });", "    if (restartError) { stop(); return res.destroy(); }\n    return send(res, 404, 'text/plain', 'Not found.\\n');\n  });");
  assert.notEqual(out, src, 'the not-found answer is where the test expects it');
  return out;
};

test('0775 AC1: the 0067 AC2 token test passes when the new server takes longer to load than the 5 s it allowed', () =>
  tokenSurvivesRestart({ newCode: slowToLoad(SLOW) }));

test('0775 AC1: the 0067 AC2 token test still fails when a restart changes the token', async () => {
  await assert.rejects(tokenSurvivesRestart({ broken: freshToken }), /the same token in the page/);
});

test('0775 AC2: the 0067 AC4 test passes when the fixed code takes longer to load than the 5 s it allowed', () =>
  failedRestartKeepsServing({ fixedCode: slowToLoad(SLOW) }));

test('0775 AC2: the 0067 AC4 test still fails when failing new code stops the old server serving', async () => {
  await assert.rejects(failedRestartKeepsServing({ broken: stopsOnFailure }), /socket hang up|ECONNRESET|ECONNREFUSED/);
});

test('0775 AC1: a new server gets as long as SPECK_PANEL_START_MS says to be ready', async () => {
  const r = panelRepo(), c = cliCopy();
  const p = await startPanel(r.dir, ['--port', String(await freePort())], c.cli, { SPECK_PANEL_START_MS: '500' }, RESTART_MS);
  try {
    fs.writeFileSync(code(c), slowToLoad(3000)(fs.readFileSync(code(c), 'utf8')));
    const state = async () => JSON.parse((await request(p.port, { pathName: '/api/state' })).body);
    await within(RESTART_MS, async () => (await state()).restart_error, 'the restart error');
    assert.equal((await state()).restart_error, "it wasn't ready within 0.5 seconds");
  } finally { await stop(p); }
});

test('0775 AC1: startPanel waits as long as it is told for the panel to print its URL', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0775-'));
  const late = `${dir}/late.mjs`;
  fs.writeFileSync(late, "setTimeout(() => console.log('speck panel: http://127.0.0.1:4999/'), 400); setTimeout(() => {}, 60000);");
  await assert.rejects(startPanel(dir, [], late, {}, 100), /panel didn't start within 0.1 s/);
  const p = await startPanel(dir, [], late, {}, 5000);
  assert.equal(p.port, 4999);
  await stop(p);
});
