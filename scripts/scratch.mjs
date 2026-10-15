// A ticket's scratch files: what a build writes in the temporary folder as speck-<id>-…, such as the test output,
// the review prompt and the reviewer's verdict. Once the ticket is shipped or cancelled nothing needs them, and
// where the temporary folder is held in memory they'd use it until the next restart.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Removes every file and folder in the temporary folder whose name starts with speck-<id>-. The dash after the id
// keeps ticket 0001's files apart from 00010's. Nothing here stops the caller: what can't be removed is named in one line.
export function removeScratch(id, dir = os.tmpdir()) {
  const pad = String(id).padStart(4, '0');
  if (!/^\d{4}$/.test(pad)) return;
  const prefix = `speck-${pad}-`;
  let names;
  try { names = fs.readdirSync(dir); } catch (e) {
    console.log(`Couldn't look for ticket ${pad}'s scratch files in ${dir} (${e.code || e.message}), so any there are kept. Delete ${path.join(dir, prefix)}* yourself.`);
    return;
  }
  const stuck = [];
  for (const name of names) {
    if (!name.startsWith(prefix)) continue;
    try { fs.rmSync(path.join(dir, name), { recursive: true, force: true }); } catch (e) { stuck.push(`${name} (${e.code || e.message})`); }
  }
  if (stuck.length) console.log(`Couldn't remove ticket ${pad}'s scratch files ${stuck.join(', ')} in ${dir}. Delete them yourself.`);
}
