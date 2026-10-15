// Setting up a temporary speck repo runs git init, speck and several commits, so the test helpers set up each kind
// once per test file, in a speck-keep-* folder that stays until the file's process exits (see tmp.mjs), and give
// each call a copy of it of its own in a new folder, which is removed when its test ends (0198, 0230).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const templates = new Map();

// A new folder named `prefix…` holding a copy of the repo `build(dir)` sets up for `kind` and `options`, which it
// sets up the first time they're asked for. Anything `build` writes must hold no path made for one call.
export function copied(kind, options, prefix, build) {
  const key = JSON.stringify([kind, options]);
  if (!templates.has(key)) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), `speck-keep-${kind}-`));
    build(dir);
    templates.set(key, dir);
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.cpSync(templates.get(key), dir, { recursive: true, preserveTimestamps: true });
  return dir;
}

// A file of `text` that stays until the process exits, written once per text: a fake command that a repo's config
// names, so every copy of the repo can name the same one.
const kept = new Map();
export function keptFile(name, text, mode = 0o644) {
  const key = JSON.stringify([name, text]);
  if (!kept.has(key)) {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'speck-keep-file-')), name);
    fs.writeFileSync(file, text, { mode });
    kept.set(key, file);
  }
  return kept.get(key);
}
