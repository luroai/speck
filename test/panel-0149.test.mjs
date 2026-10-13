import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, freePort, startPanel, stop, request, tokenOf, page, PALETTE, findChrome, browserPage, cliCopy, raw } from './support/panel.mjs';
import { ICONS, PNGS, png, readPng } from './support/icons.mjs';

// ---------- 0149: the panel can be added to a phone's home screen as an app ----------

const NAME = 'panel.example.ts.net';
const URL_ = `https://${NAME}`;
const ASSETS = ['/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];
const skip = { skip: findChrome() ? false : 'no Chromium found: set SPECK_TEST_CHROME to run it' };
const colour = name => PALETTE.match(new RegExp(`${name}: (#[0-9a-f]{6})`))[1];
const hex = c => `#${c.map(n => n.toString(16).padStart(2, '0')).join('')}`;

async function served(extra = []) {
  const r = panelRepo();
  const p = await startPanel(r.dir, ['--port', String(await freePort()), ...extra]);
  return { r, p, port: p.port };
}
// The <head> of the page, and the attributes of each of its tags with this name.
const head = () => (page().match(/<head>([\s\S]*?)<\/head>/) || [])[1] || '';
const tags = name => [...head().matchAll(new RegExp(`<${name}\\b([^>]*)>`, 'g'))]
  .map(m => Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(a => [a[1], a[2]])));

test('0149 AC1: /manifest.webmanifest names the app speck, opens it full screen at /, in the panel\'s colours', async () => {
  const { p, port } = await served();
  try {
    const res = await request(port, { pathName: '/manifest.webmanifest' });
    assert.equal(res.status, 200);
    assert.match(res.headers['content-type'], /^application\/manifest\+json\b/);
    const m = JSON.parse(res.body);
    assert.equal(m.name, 'speck');
    assert.equal(m.short_name, 'speck');
    assert.equal(m.start_url, '/');
    assert.equal(m.scope, '/');
    assert.equal(m.display, 'standalone');
    assert.equal(m.background_color, colour('--bg'));
    assert.equal(m.theme_color, colour('--bg'));
  } finally { await stop(p); }
});

test('0149 AC1: the manifest\'s icons are PNGs at 192 × 192 and 512 × 512, served at their sizes', async () => {
  const { p, port } = await served();
  try {
    const m = JSON.parse((await request(port, { pathName: '/manifest.webmanifest' })).body);
    assert.deepEqual(m.icons.map(i => i.sizes).sort(), ['192x192', '512x512']);
    for (const icon of m.icons) {
      assert.equal(icon.type, 'image/png');
      const res = await raw(port, icon.src);
      assert.equal(res.status, 200, icon.src);
      assert.equal(res.headers['content-type'], 'image/png');
      const img = readPng(res.body);
      assert.equal(`${img.w}x${img.h}`, icon.sizes, icon.src);
    }
  } finally { await stop(p); }
});

test('0149 AC1: each PNG is the logo from icon.svg, centred on a solid background with no transparency', () => {
  const svg = fs.readFileSync(path.join(ICONS, 'icon.svg'), 'utf8');
  assert.match(svg, /<rect width="64" height="64" fill="#faf9f5"\/>/);
  assert.match(svg, /<path d="M18\.5 14\.1 A22 22 0 1 0 28\.5 10" fill="none" stroke="#141413" stroke-width="[\d.]+" stroke-linecap="round"\/>/);
  assert.match(svg, /<circle cx="32" cy="32" r="2\.5" fill="#b0412e"\/>/);
  for (const [name, size] of Object.entries(PNGS)) {
    const file = fs.readFileSync(path.join(ICONS, name));
    assert.ok(file.equals(png(size)), `${name} is drawn from icon.svg: make it again with writeIcons() in test/support/icons.mjs`);
    const img = readPng(file);
    assert.equal(img.type, 2, `${name} is RGB, with no alpha channel`);
    const at = (u, v) => hex(img.at(Math.floor(u * size / 64), Math.floor(v * size / 64)));
    for (const [u, v] of [[1, 1], [63, 1], [1, 63], [63, 63], [32, 20]]) assert.equal(at(u, v), '#faf9f5', `${name} background at ${u},${v}`);
    assert.equal(at(32, 32), '#b0412e', `${name} has the red dot at its centre`);
    for (const [u, v] of [[32, 54], [10, 32], [54, 32]]) assert.equal(at(u, v), '#141413', `${name} has the ensō at ${u},${v}`);
    assert.equal(at(24, 10.5), '#faf9f5', `${name} has the ensō open at the top left`);
  }
});

test('0149 AC2: the page links the manifest with the login cookies, and has the home-screen icon, title and colour', () => {
  const manifest = tags('link').filter(l => l.rel === 'manifest');
  assert.deepEqual(manifest, [{ rel: 'manifest', href: '/manifest.webmanifest', crossorigin: 'use-credentials' }]);
  const touch = tags('link').filter(l => l.rel === 'apple-touch-icon');
  assert.equal(touch.length, 1);
  assert.equal(touch[0].href, '/apple-touch-icon.png');
  const meta = n => tags('meta').filter(m => m.name === n);
  assert.equal(meta('apple-mobile-web-app-capable')[0]?.content, 'yes');
  assert.equal(meta('apple-mobile-web-app-title')[0]?.content, 'speck');
  assert.ok(meta('theme-color').length >= 1, 'a theme-color meta tag');
  assert.ok(meta('theme-color').some(m => m.content === colour('--bg')), 'the light theme colour is the panel\'s background');
  assert.ok(!/href="data:,"/.test(head()), 'no blank tab icon');
});

test('0149 AC2: the tab icon and the 180 × 180 apple-touch-icon are served', async () => {
  const { p, port } = await served();
  try {
    const icons = tags('link').filter(l => l.rel === 'icon');
    assert.ok(icons.length >= 1, 'a tab icon');
    for (const l of icons) {
      const res = await raw(port, l.href);
      assert.equal(res.status, 200, l.href);
      assert.equal(res.headers['content-type'].split(';')[0], l.type, l.href);
    }
    const touch = await raw(port, '/apple-touch-icon.png');
    assert.equal(touch.status, 200);
    assert.equal(touch.headers['content-type'], 'image/png');
    const img = readPng(touch.body);
    assert.deepEqual([img.w, img.h], [180, 180]);
  } finally { await stop(p); }
});

test('0149 AC3: the manifest and icons are served at 127.0.0.1, localhost and the --url address, refused elsewhere, with no token', async () => {
  const { p, port } = await served(['--url', URL_]);
  try {
    const token = tokenOf((await request(port)).body);
    assert.ok(token);
    for (const where of ASSETS) {
      for (const host of [`127.0.0.1:${port}`, `localhost:${port}`, NAME]) {
        const res = await raw(port, where, host);
        assert.equal(res.status, 200, `${where} at ${host}`);
        assert.ok(!res.body.includes(token), `${where} has no token`);
      }
      for (const host of ['evil.example', `${NAME}:${port}`, `x${NAME}`, `127.0.0.2:${port}`]) {
        const res = await raw(port, where, host);
        assert.equal(res.status, 403, `${where} at ${host}`);
        assert.ok(!res.body.includes(token));
      }
    }
  } finally { await stop(p); }
});

test('0149 AC3: without --url, the --url hostname is refused for the manifest and icons', async () => {
  const { p, port } = await served();
  try {
    for (const where of ASSETS) assert.equal((await raw(port, where, NAME)).status, 403, where);
  } finally { await stop(p); }
});

test('0149 AC3: the manifest and icons take only GET, and nothing beside them is served from the icons folder', async () => {
  const { p, port } = await served();
  try {
    for (const where of ASSETS) assert.equal((await request(port, { method: 'POST', pathName: where })).status, 405, where);
    for (const where of ['/icons/icon.svg', '/manifest.json', '/icon-180.png', '/constructor', '/__proto__', '/hasOwnProperty', '/../panel.html'])
      assert.equal((await request(port, { pathName: where })).status, 404, where);
  } finally { await stop(p); }
});

test('0149 AC3: a missing icon file gets a plain 500 saying which file to put back, and the page is still served', async () => {
  const { cli, page: pageFile } = cliCopy();
  fs.rmSync(path.join(path.dirname(pageFile), 'icons', 'icon-192.png'));
  const r = panelRepo();
  const p = await startPanel(r.dir, ['--port', String(await freePort())], cli);
  try {
    const res = await request(p.port, { pathName: '/icon-192.png' });
    assert.equal(res.status, 500);
    assert.match(res.body, /^Couldn't read .*icon-192\.png: .*\nPut the file back, then reload\.\n$/);
    assert.ok(!/\bat \S+ \(/.test(res.body), 'no stack trace');
    assert.equal((await request(p.port)).status, 200);
    assert.equal((await request(p.port, { pathName: '/icon-512.png' })).status, 200);
  } finally { await stop(p); }
});

test('0149 AC4: in a browser, the page reports no manifest errors, and its icons load and match icon.svg', skip, async () => {
  const { p, port } = await served();
  const b = await browserPage(`http://127.0.0.1:${port}/`);
  try {
    await b.loaded(); // the panel's page itself, not the blank one Chrome opens first: asked about that, Chrome never answers (0159)
    // Chrome reads the manifest a little after the page has loaded: until then it reports none.
    let app;
    for (let i = 0; i < 50 && !app?.url; i++) { if (i) await new Promise(r => setTimeout(r, 100)); app = await b.send('Page.getAppManifest'); }
    assert.deepEqual(app.errors, [], JSON.stringify(app.errors));
    assert.match(app.url, /\/manifest\.webmanifest$/);
    assert.equal(JSON.parse(app.data).name, 'speck');
    // Every icon the manifest and the page name loads as an image of the size it says.
    const loaded = await b.js(`(async () => {
      const m = await (await fetch('/manifest.webmanifest', { credentials: 'include' })).json();
      const links = [...document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]')].map(l => ({ src: l.getAttribute('href'), sizes: l.getAttribute('sizes') }));
      const size = src => new Promise(ok => { const i = new Image(); i.onload = () => ok(i.naturalWidth + 'x' + i.naturalHeight); i.onerror = () => ok('failed'); i.src = src; });
      return Promise.all([...m.icons, ...links].map(async i => ({ src: i.src, want: i.sizes, got: await size(i.src) })));
    })()`);
    assert.ok(loaded.length >= 5, JSON.stringify(loaded));
    for (const i of loaded) {
      assert.notEqual(i.got, 'failed', `${i.src} loads`);
      if (i.want && !i.src.endsWith('.svg')) assert.equal(i.got, i.want, i.src);
    }
    // The browser's own drawing of icon.svg, at 180 × 180, is the apple-touch-icon to within a little anti-aliasing.
    const diff = await b.js(`(async () => {
      const draw = src => new Promise(ok => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 180;
        const x = c.getContext('2d'); x.drawImage(i, 0, 0, 180, 180); ok(x.getImageData(0, 0, 180, 180).data); }; i.src = src; });
      const [a, b] = await Promise.all([draw('/icon.svg'), draw('/apple-touch-icon.png')]);
      let sum = 0; for (let k = 0; k < a.length; k++) if (k % 4 !== 3) sum += Math.abs(a[k] - b[k]);
      return sum / (180 * 180 * 3);
    })()`);
    assert.ok(diff < 2, `the PNG differs from the browser's drawing of icon.svg by ${diff.toFixed(2)} a channel on average`);
  } finally { await b.close(); await stop(p); }
});
