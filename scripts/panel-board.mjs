// The panel's board reader, which reads the board in a worker thread.

import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SpeckError } from './speck.mjs';

// 0177: reads the board (speck status --json's data) in a worker thread, so the server keeps answering everything else
// while it does. A module of its own, from a data: URL, that loads the code as the server did. Resolves once that code
// has loaded, with a function that reads the board and resolves with { board } or { error }, one reading at a time.
const BOARD_READER = `import { parentPort, workerData } from 'node:worker_threads';
// Without a script name in argv[1], speck.mjs doesn't run as the CLI when it's imported.
process.argv.splice(1);
const code = import(workerData.code);
code.then(() => parentPort.postMessage({ loaded: true }));
parentPort.on('message', async () => {
  try { const m = await code; const board = m.statusData(workerData.repo); parentPort.postMessage({ board }); }
  catch (e) { parentPort.postMessage({ error: String(e && e.message || e) }); }
});`;
export function boardReader(repo) {
  const code = pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.url)), 'speck.mjs')).href;
  let worker = null, pending = null;
  const start = () => new Promise((loaded, failed) => {
    const w = worker = new Worker(new URL(`data:text/javascript,${encodeURIComponent(BOARD_READER)}`), { workerData: { repo, code } });
    w.unref();
    const answer = out => { if (worker !== w) return; if (out.loaded) return loaded(); const p = pending; pending = null; if (p) p(out); };
    // A reader that stops answers its reading with the reason, and the next reading starts a new one.
    const gone = message => { failed(new SpeckError(message)); answer({ error: message }); if (worker === w) worker = null; };
    w.on('message', answer);
    w.on('error', e => gone(`The board reader stopped: ${e.message}`));
    w.on('exit', c => gone(`The board reader stopped with exit code ${c}.`));
  });
  const read = () => new Promise(resolve => { if (!worker) start().catch(() => {}); pending = resolve; worker.postMessage('read'); });
  return start().then(() => read);
}
