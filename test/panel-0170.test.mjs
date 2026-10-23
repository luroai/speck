import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { panelRepo, freePort, startPanel, stop, raw } from './support/panel.mjs';
import { ICONS, readPng } from './support/icons.mjs';

// ---------- 0170: speck's eared logo, from the landing page, across the panel ----------

// 0305: the app icon is speck on the LCD screen now, in place of the eared mark, so its checks are in
// icons-0305.test.mjs. 0413: the header's mark went with the header row, so where it sat is no longer checked.

test('0170 AC4: the manifest and icons are still served', async () => {
  const r = panelRepo();
  const p = await startPanel(r.dir, ['--port', String(await freePort())]);
  try {
    const m = await raw(p.port, '/manifest.webmanifest');
    assert.equal(m.status, 200);
    for (const icon of JSON.parse(m.body).icons) {
      const res = await raw(p.port, icon.src);
      assert.equal(res.status, 200, icon.src);
      assert.ok(res.body.equals(fs.readFileSync(path.join(ICONS, path.basename(icon.src)))), `${icon.src} is the file in templates/icons`);
    }
    const svg = await raw(p.port, '/icon.svg');
    assert.equal(svg.status, 200);
    assert.ok(svg.body.equals(fs.readFileSync(path.join(ICONS, 'icon.svg'))), 'icon.svg is the file in templates/icons');
    const touch = await raw(p.port, '/apple-touch-icon.png');
    assert.equal(touch.status, 200);
    assert.deepEqual([readPng(touch.body).w, readPng(touch.body).h], [180, 180]);
  } finally { await stop(p); }
});
