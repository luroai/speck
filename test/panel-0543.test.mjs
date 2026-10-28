import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { ROOT, page, styles, STYLE_FILES, panelRepo, freePort, startPanel, stop, findChrome, browserPage } from './support/panel.mjs';

// ---------- 0543: the panel's files load from addresses relative to the page, so it works under a proxy's path ----------

const MANIFEST = path.join(ROOT, 'templates', 'icons', 'manifest.webmanifest');
const PREFIX = '/api/browser/frame/abc123/http/127.0.0.1:4779';
const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };

// Every href and src in the page, and every url() in its stylesheets.
const links = html => [...html.matchAll(/<(?:link|script)\b[^>]*?\s(?:href|src)="([^"]*)"/g)].map(m => m[1]);
const urls = css => [...css.matchAll(/url\(\s*["']?([^"')]*)["']?\s*\)/gi)].map(m => m[1]);

// A proxy like cptr's: it forwards /<prefix>/… to the panel, as /…, and answers anything else with its own page.
async function proxy(panelPort) {
  const server = http.createServer((req, res) => {
    if (!req.url.startsWith(`${PREFIX}/`)) { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end('<!doctype html><p>the proxy\'s own app</p>'); }
    const up = http.request({ host: '127.0.0.1', port: panelPort, method: req.method, path: req.url.slice(PREFIX.length),
      headers: { ...req.headers, host: `127.0.0.1:${panelPort}` } }, back => { res.writeHead(back.statusCode, back.headers); back.pipe(res); });
    up.on('error', e => { res.writeHead(502); res.end(String(e)); });
    req.pipe(up);
  });
  const port = await freePort();
  await new Promise(r => server.listen(port, '127.0.0.1', r));
  return { port, base: `http://127.0.0.1:${port}${PREFIX}/`, close: () => new Promise(r => { server.closeAllConnections(); server.close(r); }) };
}

async function get(url) {
  const res = await fetch(url);
  return { status: res.status, type: res.headers.get('content-type') || '', body: Buffer.from(await res.arrayBuffer()), url };
}

// Every file the page at `base` links to, with the font its stylesheets link to and the manifest's icons, each fetched
// from the address it resolves to.
async function files(base) {
  const html = (await get(base)).body.toString();
  const out = [];
  for (const link of links(html)) {
    const at = new URL(link, base).href, got = await get(at);
    out.push(got);
    if (got.type.startsWith('text/css')) for (const u of urls(got.body.toString())) out.push(await get(new URL(u, at).href));
    if (got.type.startsWith('application/manifest+json')) {
      const m = JSON.parse(got.body.toString());
      for (const icon of m.icons) out.push(await get(new URL(icon.src, at).href));
      out.manifest = { at, m };
    }
  }
  return out;
}

test('0543 AC1: the page and its stylesheets link to nothing that starts with /, and the manifest\'s addresses are relative', () => {
  const found = links(page());
  for (const f of STYLE_FILES) assert.ok(found.includes(f), `the page links ${f}`);
  for (const f of ['panel.js', 'panel-model.js', 'icon.svg', 'manifest.webmanifest', 'apple-touch-icon.png']) assert.ok(found.includes(f), `the page links ${f}`);
  assert.deepEqual(found.filter(l => l.startsWith('/')), [], 'no link from the site\'s root');
  assert.ok(urls(styles()).includes('fonts/Doto.ttf'), 'the font, relative to the stylesheet');
  assert.deepEqual(urls(styles()).filter(u => u.startsWith('/')), [], 'no url() from the site\'s root');
  const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  for (const a of [m.id, m.start_url, m.scope, ...m.icons.map(i => i.src)]) assert.ok(!a.startsWith('/'), a);
});

function served(got, base) {
  assert.ok(got.length >= STYLE_FILES.length + 9, `every file: ${got.map(g => g.url)}`);
  for (const g of got) {
    assert.ok(g.url.startsWith(base), `${g.url} is under ${base}`);
    assert.equal(g.status, 200, g.url);
    assert.doesNotMatch(g.type, /^text\/html/, `${g.url} is the file, not a page`);
  }
  const font = got.find(g => g.url === new URL('fonts/Doto.ttf', base).href);
  assert.ok(font, 'the font');
  assert.equal(font.type, 'font/ttf');
}

test('0543 AC2: served at the site\'s root, the page\'s every file loads from the panel', async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  try {
    const base = `http://127.0.0.1:${panel.port}/`;
    served(await files(base), base);
  } finally { await stop(panel); }
});

test('0543 AC3: served under a proxy\'s path, the page\'s every file loads from under that path', async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const px = await proxy(panel.port);
  try {
    served(await files(px.base), px.base);
  } finally { await px.close(); await stop(panel); }
});

test('0543 AC4: from either address, the manifest opens the panel full screen at that address, with its icons', async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const px = await proxy(panel.port);
  try {
    for (const base of [`http://127.0.0.1:${panel.port}/`, px.base]) {
      const got = await files(base), { at, m } = got.manifest;
      assert.equal(m.display, 'standalone');
      for (const a of ['id', 'start_url', 'scope']) assert.equal(new URL(m[a], at).href, base, `${a} from ${base}`);
      const icons = got.filter(g => g.type === 'image/png');
      assert.ok(icons.some(g => g.url === new URL('apple-touch-icon.png', base).href), 'the home-screen icon for iPhones');
      for (const icon of m.icons) assert.ok(icons.some(g => g.url === new URL(icon.src, at).href), icon.src);
    }
  } finally { await px.close(); await stop(panel); }
});

// The files the page fetched, the header's font, whether Doto loaded and the manifest as Chrome reads it.
// The page's fetches and event stream (/api/…) stay at the site's root: out of scope here.
const LOOK = `(async () => {
  await document.fonts.ready;
  const n = document.querySelector('.bezel .name');
  return { font: getComputedStyle(n).fontFamily, loaded: document.fonts.check('900 18px Doto'),
    fetched: performance.getEntriesByType('resource').filter(e => !new URL(e.name).pathname.startsWith('/api/') || e.name.startsWith(location.href)).map(e => e.name) };
})()`;

test('0543 AC2, AC3 and AC4: in a real browser, at the root and under a proxy\'s path, the header is drawn in Doto and Chrome reads the manifest', skip, async () => {
  const panel = await startPanel(panelRepo().dir, ['--port', String(await freePort())]);
  const px = await proxy(panel.port);
  const b = await browserPage('about:blank');
  try {
    for (const base of [`http://127.0.0.1:${panel.port}/`, px.base]) {
      await b.send('Page.navigate', { url: base });
      await b.until(`location.href === ${JSON.stringify(base)} && document.readyState === 'complete' && !!document.querySelector('.bezel .name')`, base);
      const m = await b.js(LOOK);
      assert.ok(m.loaded, `Doto loaded at ${base}: ${JSON.stringify(m)}`);
      assert.match(m.font, /^Doto,/);
      assert.ok(m.fetched.some(u => u.endsWith('/fonts/Doto.ttf')), `the font fetched: ${m.fetched}`);
      for (const u of m.fetched) assert.ok(u.startsWith(base), `${u} under ${base}`);
      // Chrome reads the manifest a little after the page has loaded: until then it reports none (0149).
      let app;
      for (let i = 0; i < 50 && !app?.manifest; i++) { if (i) await new Promise(r => setTimeout(r, 100)); app = await b.send('Page.getAppManifest', {}); }
      assert.ok(app.url.startsWith(base), app.url);
      assert.deepEqual(app.errors, [], 'Chrome reads the manifest without errors');
      assert.equal(app.manifest.startUrl, base);
      assert.equal(app.manifest.scope, base);
      assert.equal(app.manifest.display, 'kStandalone', 'full screen');
      for (const icon of app.manifest.icons) assert.ok(icon.url.startsWith(base), icon.url);
    }
  } finally { await b.close(); await px.close(); await stop(panel); }
});
