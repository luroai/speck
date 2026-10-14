// A shell loop that waits until a file exists, so whatever runs it stays running until a test lets it go. It also
// ends, with exit code 1, once the gate's folder is gone, so one left behind by a test file that was killed outright
// doesn't wait for ever.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const gateDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'speck-gate-'));
export const waitFor = gate => `while [ ! -f ${gate} ]; do [ -d ${path.dirname(gate)} ] || exit 1; sleep 0.05; done`;

// A test command that waits until `gate` exists, so a ship stays running until the test lets it go. It makes `reached`
// first, so a test can wait until the ship is in its tests, past any git command a kill could leave a lock behind from.
export const gated = () => {
  const dir = gateDir();
  const gate = path.join(dir, 'go'), reached = path.join(dir, 'reached');
  return { gate, reached, test: `sh -c 'touch ${reached}; ${waitFor(gate)}'` };
};
