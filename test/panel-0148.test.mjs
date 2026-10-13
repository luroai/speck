import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { CLI, env, panelRepo, cliCopy, freePort, startPanel, stop, request, post, tokenOf, readyPath, fm, readT } from './support/panel.mjs';
import { shipRepo } from './support/ship.mjs';
import { runRepo, alive, killAll } from './support/run.mjs';

// ---------- 0148: speck panel --url serves the panel at one private https address too ----------

const NAME = 'panel.example.ts.net';
const URL_ = `https://${NAME}`;
const wait = ms => new Promise(r => setTimeout(r, ms));

// A panel repo with a draft 0002 that passes lint, served on a free port with `extra` arguments.
async function served(extra, cli = CLI) {
  const r = panelRepo();
  r.write('0002-two.md', fm({ id: '"0002"', title: 'Two' }));
  const p = await startPanel(r.dir, ['--port', String(await freePort()), ...extra], cli);
  return { r, p, port: p.port };
}
// The panel for `dir`, at the --url address, with the token of the page served there.
async function remote(dir, extraEnv = {}) {
  const p = await startPanel(dir, ['--port', String(await freePort()), '--url', URL_], CLI, extraEnv);
  return { p, port: p.port, token: tokenOf((await request(p.port, { host: NAME })).body) };
}
// A write as the page at the --url address sends it.
const remotePost = (port, pathName, token) => post(port, pathName, { host: NAME, origin: URL_, token });
// `speck panel` with these arguments, when it refuses before starting: its exit code and output.
function refused(args) {
  const r = panelRepo();
  const res = spawnSync(process.execPath, [CLI, 'panel', '--port', '1', ...args], { cwd: r.dir, env, encoding: 'utf8', timeout: 10000 });
  return { code: res.status, out: `${res.stdout}${res.stderr}` };
}

for (const form of [['--url', URL_], [`--url=${URL_}/`]]) {
  test(`0148 AC1: ${form.join(' ')} serves the page and /api/state at that hostname, and still at 127.0.0.1 and localhost`, async () => {
    const { p, port } = await served(form);
    try {
      for (const host of [NAME, `127.0.0.1:${port}`, `localhost:${port}`, NAME.toUpperCase()]) {
        const page = await request(port, { host });
        assert.equal(page.status, 200, `the page at ${host}`);
        assert.ok(tokenOf(page.body), `the page at ${host} has its token`);
        const state = await request(port, { host, pathName: '/api/state' });
        assert.equal(state.status, 200, `/api/state at ${host}`);
        assert.ok(Array.isArray(JSON.parse(state.body).tickets));
      }
    } finally { await stop(p); }
  });
}

test('0148 AC1: any other Host is still refused with 403', async () => {
  const { p, port } = await served(['--url', URL_]);
  try {
    for (const host of ['evil.example', `${NAME}:${port}`, `${NAME}:443`, `${NAME}.evil.example`, `x${NAME}`, `127.0.0.2:${port}`]) {
      for (const pathName of ['/', '/api/state']) assert.equal((await request(port, { host, pathName })).status, 403, `${host} ${pathName}`);
    }
  } finally { await stop(p); }
});

test('0148 AC2: a write from the --url page, with its Origin and token, is accepted', async () => {
  const { r, p, port } = await served(['--url', URL_]);
  try {
    const token = tokenOf((await request(port, { host: NAME })).body);
    const res = await post(port, readyPath('0002'), { host: NAME, origin: URL_, token });
    assert.equal(res.status, 200, res.body);
    assert.match(readT(r, '0002-two.md'), /status: ready/);
  } finally { await stop(p); }
});

test('0148 AC2: priority and Back to Plan work from the --url page', async () => {
  const { r, p, port } = await served(['--url', URL_]);
  try {
    const token = tokenOf((await request(port, { host: NAME })).body);
    const prio = await remotePost(port, '/api/tickets/0002/priority/1', token);
    assert.equal(prio.status, 200, prio.body);
    assert.match(readT(r, '0002-two.md'), /^priority: 1$/m);
    assert.equal((await remotePost(port, readyPath('0002'), token)).status, 200);
    const back = await remotePost(port, '/api/tickets/0002/draft', token);
    assert.equal(back.status, 200, back.body);
    assert.match(readT(r, '0002-two.md'), /^status: draft$/m);
    assert.equal(r.g('log', '-1', '--format=%s'), 'speck(0002): draft');
  } finally { await stop(p); }
});

test('0148 AC2: Stop build works from the --url page', async () => {
  const r = panelRepo();
  fs.writeFileSync(r.file, fs.readFileSync(r.file, 'utf8').replace(/^status: .*$/m, 'status: building'));
  r.g('add', '-A'); r.g('commit', '-qm', 'building');
  const build = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: 'ignore' });
  build.unref();
  const runs = path.join(r.dir, 'speck', '.cache', 'runs');
  fs.mkdirSync(runs, { recursive: true });
  fs.writeFileSync(path.join(runs, '0001.json'), JSON.stringify({ session: 's-0148', pid: build.pid, cwd: r.dir }));
  const { p, port, token } = await remote(r.dir);
  try {
    const res = await remotePost(port, '/api/tickets/0001/stop', token);
    assert.equal(res.status, 200, res.body);
    assert.match(fs.readFileSync(r.file, 'utf8'), /^status: blocked/m);
    assert.equal(r.g('log', '-1', '--format=%s'), 'speck(0001): stopped');
    await wait(200);
    assert.equal(alive(build.pid), false, 'the build has stopped');
  } finally { killAll([build.pid]); await stop(p); }
});

test('0148 AC2: Ship works from the --url page', async () => {
  const r = shipRepo();
  const { p, port, token } = await remote(r.dir);
  try {
    const res = await remotePost(port, '/api/tickets/1/ship', token);
    assert.equal(res.status, 200, res.body);
    assert.match(JSON.parse(res.body).message, /Shipped 0001/);
    assert.equal(r.statusIn(r.dir), 'done');
  } finally { await stop(p); }
});

test('0148 AC2: the Auto-build switch turns speck run on and off from the --url page', async () => {
  const r = runRepo({ tickets: [] });
  const { p, port, token } = await remote(r.dir, { SPECK_RUN_POLL_MS: '100' });
  let pid = null;
  try {
    const on = await remotePost(port, '/api/run/on', token);
    assert.equal(on.status, 200, on.body);
    pid = JSON.parse(on.body).run.pid;
    assert.equal(alive(pid), true, 'speck run is running');
    const off = await remotePost(port, '/api/run/off', token);
    assert.equal(off.status, 200, off.body);
    assert.equal(alive(pid), false, 'speck run has stopped');
  } finally { await stop(p); if (pid) killAll([pid]); }
});

test('0148 AC2: every write is refused with 403 for any other Origin, or a missing or wrong token, and changes nothing', async () => {
  const { r, p, port } = await served(['--url', URL_]);
  try {
    const token = tokenOf((await request(port, { host: NAME })).body);
    const before = readT(r, '0002-two.md');
    const head = r.g('rev-parse', 'HEAD');
    const writes = [readyPath('0002'), '/api/tickets/0002/draft', '/api/tickets/0002/priority/1', '/api/tickets/0002/stop', '/api/tickets/0002/ship', '/api/run/on', '/api/run/off'];
    const bad = [
      { origin: `http://${NAME}`, token }, { origin: `${URL_}:443`, token }, { origin: `${URL_}:${port}`, token },
      { origin: `https://x${NAME}`, token }, { origin: `https://${NAME}.evil.example`, token }, { origin: 'https://evil.example', token },
      { origin: null, token }, { origin: 'null', token },
      { origin: URL_ }, { origin: URL_, token: '' }, { origin: URL_, token: 'wrong' }, { origin: URL_, token: token.replace(/^./, c => (c === 'a' ? 'b' : 'a')) },
    ];
    for (const pathName of writes) {
      for (const b of bad) {
        const res = await post(port, pathName, { host: NAME, ...b });
        assert.equal(res.status, 403, `${pathName} ${JSON.stringify({ ...b, token: b.token === token ? 'right' : b.token })}`);
      }
    }
    assert.equal(readT(r, '0002-two.md'), before);
    assert.equal(r.g('rev-parse', 'HEAD'), head);
  } finally { await stop(p); }
});

test('0148 AC3: --url must be https with a hostname only, or speck panel stops before starting and says why, with an example', () => {
  const values = [['--url', `http://${NAME}`], ['--url', `${URL_}/panel`], ['--url', `${URL_}/?a=1`], ['--url', `${URL_}?a=1`],
    ['--url', `https://user@${NAME}`], ['--url', `https://user:pw@${NAME}`], ['--url', `${URL_}#x`], ['--url', `${URL_}//`],
    ['--url', NAME], ['--url', 'https://'], ['--url', `${URL_}:8443`], ['--url', 'https:// space.example'],
    ['--url'], ['--url='], ['--url', '--port'], ['--url', URL_, '--url', 'https://other.example']];
  for (const args of values) {
    const { code, out } = refused(args);
    assert.notEqual(code, 0, `${args.join(' ')} is refused`);
    assert.match(out, /--url/, `${args.join(' ')}: names --url`);
    assert.match(out, /for example --url https:\/\/[a-z]/, `${args.join(' ')}: gives an example: ${out}`);
    assert.doesNotMatch(out, /speck panel: http/, `${args.join(' ')}: never started`);
    assert.doesNotMatch(out, /\n\s+at /, `${args.join(' ')}: no stack trace`);
  }
});

test('0148 AC4: the panel prints the --url address alongside its local one', async () => {
  const { p, port } = await served(['--url', `${URL_}/`]);
  try {
    await wait(100);
    const line = p.out().split('\n').find(l => l.includes(`http://127.0.0.1:${port}/`));
    assert.ok(line, p.out());
    assert.ok(line.includes(`${URL_}/`), `the same line names ${URL_}/: ${line}`);
  } finally { await stop(p); }
});

test('0148 AC4: after restarting on new code, the panel still serves and accepts writes at the --url address', async () => {
  const c = cliCopy();
  const { r, p, port } = await served(['--url', URL_], c.cli);
  try {
    const code = c.cli.replace(/speck\.mjs$/, 'panel.mjs');
    fs.writeFileSync(code, fs.readFileSync(code, 'utf8').replace(/'Not found\.\\n'/, `'Not found. v2\\n'`));
    const t0 = Date.now();
    while ((await request(port, { pathName: '/nope' }).catch(() => ({}))).body !== 'Not found. v2\n') {
      if (Date.now() - t0 > 8000) assert.fail('the panel never restarted on the new code');
      await wait(100);
    }
    assert.equal((await request(port, { host: NAME, pathName: '/nope' })).body, 'Not found. v2\n', 'the new server serves the --url hostname');
    assert.equal((await request(port, { host: NAME, pathName: '/api/state' })).status, 200);
    const token = tokenOf((await request(port, { host: NAME })).body);
    assert.equal((await post(port, readyPath('0002'), { host: NAME, origin: URL_, token })).status, 200);
    assert.match(readT(r, '0002-two.md'), /status: ready/);
  } finally { await stop(p); }
});

test('0148 AC5: without --url, the hostname and its Origin are refused, and the start line is as before', async () => {
  const { r, p, port } = await served([]);
  try {
    assert.equal((await request(port, { host: NAME })).status, 403);
    const token = tokenOf((await request(port)).body);
    assert.equal((await post(port, readyPath('0002'), { origin: URL_, token })).status, 403);
    assert.match(readT(r, '0002-two.md'), /status: draft/);
    await wait(100);
    assert.match(p.out(), new RegExp(`^speck panel: http://127\\.0\\.0\\.1:${port}/ \\(press Ctrl\\+C to stop\\)\\n`));
  } finally { await stop(p); }
});
