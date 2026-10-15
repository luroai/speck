// 0234: one repo and one `speck panel` for a whole real-browser test file whose page stub answers every request, so the
// panel only serves the page. The first sharedPanel() starts them and the rest share them. The repo is in a
// speck-keep-* folder, which tmp.mjs leaves in place between tests. Once the file's tests are done, however they ended,
// the panel is stopped and the repo removed.
import { after } from 'node:test';
import fs from 'node:fs';
import { panelRepo, freePort, startPanel, stop } from './panel.mjs';

let shared = null; // a promise of the file's panel, with its repo as `dir`, or null before the first test asks for it
export function sharedPanel() {
  if (!shared) shared = (async () => {
    const { dir } = panelRepo({ prefix: 'speck-keep-panel-' });
    try { return { ...await startPanel(dir, ['--port', String(await freePort())]), dir }; } catch (e) { remove(dir); throw e; }
  })();
  return shared;
}
const remove = dir => fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
after(async () => {
  const p = shared;
  shared = null;
  const panel = await p?.catch(() => null);
  if (panel) try { await stop(panel); } finally { remove(panel.dir); }
});
