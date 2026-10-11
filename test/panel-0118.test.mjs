import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { ROOT, panelRepo, freePort, startPanel, stop, request, readyPanel } from './support/panel.mjs';

// ---------- 0118: a panel test whose port another test took starts the panel on another free port ----------

// A port held open by this test, as another test would hold the port freePort() picked.
async function held() {
  const s = net.createServer();
  await new Promise(res => s.listen(0, '127.0.0.1', res));
  return { port: s.address().port, close: () => new Promise(res => s.close(res)) };
}

for (const [label, form] of [['--port <n>', port => ['--port', String(port)]], ['--port=<n>', port => [`--port=${port}`]]]) {
  test(`0118 AC1 AC3: a picked port that is taken by the time the panel starts moves the panel to another free port (${label})`, async () => {
    const r = panelRepo();
    const blocker = await held();
    try {
      const p = await startPanel(r.dir, form(blocker.port));
      try {
        assert.notEqual(p.port, blocker.port, 'not the taken port');
        assert.match(p.out(), new RegExp(`http://127\\.0\\.0\\.1:${p.port}/`), 'the port it reports is the one the panel printed');
        assert.equal((await request(p.port)).status, 200, 'requests reach the panel on the port it started on');
      } finally { await stop(p); }
    } finally { await blocker.close(); }
  });
}

test('0118 AC3: a panel on a free port reports that port', async () => {
  const r = panelRepo();
  const asked = await freePort(); // only to compare: requests go to p.port
  const p = await startPanel(r.dir, ['--port', String(asked)]);
  try {
    assert.equal(p.port, asked);
    assert.equal((await request(p.port)).status, 200);
  } finally { await stop(p); }
  const { port: readyPort, p: rp } = await readyPanel();
  try { assert.equal(readyPort, rp.port, 'readyPanel gives the port its panel started on'); } finally { await stop(rp); }
});

test('0118 AC2: a panel that fails for any other reason still fails the test with its own message', async () => {
  const notSpeck = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  await assert.rejects(startPanel(notSpeck, ['--port', String(await freePort())]), e => {
    assert.match(e.message, /No speck\/config\.yml found/);
    assert.notEqual(e.code, 0);
    return true;
  });
  const r = panelRepo();
  await assert.rejects(startPanel(r.dir, ['--port', 'abc']), e => { assert.match(e.message, /--port/); return true; });
});

test('0118 AC3: every test that starts a panel on a picked port sends its requests to the port the panel started on', () => {
  const dir = path.join(ROOT, 'test');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.mjs')).map(f => path.join(dir, f));
  const bad = [];
  for (const file of files) {
    fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      // The picked port goes straight into startPanel, and the test reads the port back from what startPanel returns.
      if (/startPanel\(/.test(line) && /\bString\(port\d*\)|\$\{port\d*\}/.test(line)) bad.push(`${path.basename(file)}:${i + 1}`);
    });
  }
  assert.deepEqual(bad, []);
});
