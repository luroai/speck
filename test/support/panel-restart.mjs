// 0775: the 0067 AC2 and AC4 restart checks, shared so 0775's tests can run them on code slowed down or broken on
// purpose. Each allows a restart as long as a busy machine needs (RESTART_MS), rather than 5 s: a restart that takes
// longer is a slow machine, and what they check is the token and the old server, not how fast it restarts.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { panelRepo, cliCopy, freePort, startPanel, stop, request, post, tokenOf, readyPath, fm } from './panel.mjs';

// How long these allow the panel to start, a restart to be seen and a new server to be ready (SPECK_PANEL_START_MS).
export const RESTART_MS = 60000;
const wait = ms => new Promise(r => setTimeout(r, ms));
// The panel's code, in the CLI copy: it has been in scripts/panel.mjs since 0018.
export const code = c => c.cli.replace(/speck\.mjs$/, 'panel.mjs');
// Polls `check` until it's true, failing after `ms`. Resolves with how long it took.
export async function within(ms, check, what) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { if (await check()) return Date.now() - t0; } catch { /* not answering yet */ }
    await wait(100);
  }
  throw new Error(`not within ${ms} ms: ${what}`);
}
// Changes the copied CLI's code: every response gets an X-Speck-Test header, and 404s say which version answered.
// `more` changes it further, as the slow-to-load code in 0775's tests does.
export function edit(c, version, more = src => src) {
  const src = fs.readFileSync(code(c), 'utf8')
    .replace(/'X-Content-Type-Options': 'nosniff',( 'X-Speck-Test': '[^']*',)?/, `'X-Content-Type-Options': 'nosniff', 'X-Speck-Test': '${version}',`)
    .replace(/'Not found\.( [^\\']*)?\\n'/, `'Not found. ${version}\\n'`);
  fs.writeFileSync(code(c), more(src));
}
// Code that takes `ms` to load in a server process, as a new server can on a busy machine. Only a server process's main
// thread (started with --input-type=module) waits, not its board reader or the other speck commands that load the same code.
export const slowToLoad = ms => src => src.replace('const PANEL_PORT = 4777;', `const PANEL_PORT = 4777; if (process.execArgv.includes('--input-type=module') && (await import('node:worker_threads')).isMainThread) { const t0 = Date.now(); while (Date.now() - t0 < ${ms}); }`);

// Starts the panel from a CLI copy, whose code `broken` changes first, allowing a busy machine's time to start and restart.
async function served(r, broken) {
  const c = cliCopy();
  if (broken) fs.writeFileSync(code(c), broken(fs.readFileSync(code(c), 'utf8')));
  const p = await startPanel(r.dir, ['--port', String(await freePort())], c.cli, { SPECK_PANEL_START_MS: String(RESTART_MS) }, RESTART_MS);
  return { c, port: p.port, p };
}

// 0067 AC2: the token survives a restart, so Set ready works with the token from before it. `newCode` changes the code
// the panel restarts on further.
export async function tokenSurvivesRestart({ broken, newCode } = {}) {
  const r = panelRepo();
  r.write('0002-two.md', fm({ id: '"0002"', title: 'Two' }));
  const { c, port, p } = await served(r, broken);
  try {
    const token = tokenOf((await request(port)).body);
    assert.ok(token);
    edit(c, 'v2', newCode);
    await within(RESTART_MS, async () => (await request(port)).headers['x-speck-test'] === 'v2', 'the restart');
    assert.equal(tokenOf((await request(port)).body), token, 'the same token in the page');
    const res = await post(port, readyPath('0002'), { token });
    assert.equal(res.status, 200, res.body);
    assert.equal(res.headers['x-speck-test'], 'v2');
  } finally { await stop(p); }
}

// 0067 AC4: new code that fails to start leaves the old server serving, shows the error and the next change tries
// again. `fixedCode` changes the code that works, which the last change puts in, further.
export async function failedRestartKeepsServing({ broken, fixedCode } = {}) {
  const { c, port, p } = await served(panelRepo(), broken);
  try {
    const good = fs.readFileSync(code(c), 'utf8');
    fs.writeFileSync(code(c), `${good}\nfunction broken( {\n`);
    const state = async () => JSON.parse((await request(port, { pathName: '/api/state' })).body);
    await within(RESTART_MS, async () => (await state()).restart_error, 'the restart error in /api/state');
    const err = (await state()).restart_error;
    assert.match(err, /^SyntaxError: /, err);
    assert.doesNotMatch(err, /\n/, 'one line');
    assert.equal((await request(port, { pathName: '/nope' })).body, 'Not found.\n', 'the old code still serves');
    assert.ok(Array.isArray((await state()).tickets));
    // A code change that throws when it loads, rather than failing to parse.
    fs.writeFileSync(code(c), good.replace("const PANEL_PORT = 4777;", "const PANEL_PORT = 4777; throw new Error('boom 0067');"));
    await within(RESTART_MS, async () => (await state()).restart_error === 'Error: boom 0067', 'the second error');
    assert.equal((await request(port, { pathName: '/nope' })).body, 'Not found.\n', 'the old code still serves');
    // The next change that works is picked up, and the error goes.
    fs.writeFileSync(code(c), good);
    edit(c, 'v3', fixedCode);
    await within(RESTART_MS, async () => (await request(port, { pathName: '/nope' })).body === 'Not found. v3\n', 'the fixed code');
    assert.equal((await state()).restart_error, undefined);
    assert.doesNotMatch(p.out(), /at .*\.mjs:\d+/, 'no stack trace');
  } finally { await stop(p); }
}
