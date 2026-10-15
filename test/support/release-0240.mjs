// A repo and stand-ins for `git` and `gh` to run speck's own release script against (0240).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './panel.mjs';

const SCRIPT = path.join(ROOT, '.github', 'scripts', 'release.mjs');

// A folder with a package.json at `version` (none when undefined) and, when `notes`, its release notes.
export function releaseRepo({ version, notes }) {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0240-'));
  const pkg = version === undefined ? {} : { version };
  fs.writeFileSync(path.join(repo, 'package.json'), JSON.stringify(pkg));
  if (notes) {
    fs.mkdirSync(path.join(repo, 'docs', 'releases'), { recursive: true });
    fs.writeFileSync(path.join(repo, 'docs', 'releases', `v${version}.md`), 'Notes.\n');
  }
  return repo;
}

// Each stand-in logs its arguments, one call per line. `git ls-remote` prints a tag line when `tagged`, or fails.
function fakeBin(dir) {
  const bin = path.join(dir, 'bin');
  fs.mkdirSync(bin);
  const script = name => `#!/bin/sh
echo "${name} $*" >> "$FAKE_LOG"
if [ "${name}" = git ] && [ "$1" = ls-remote ]; then
  [ -n "$FAKE_LS_REMOTE_FAILS" ] && { echo "fatal: could not read from remote" >&2; exit 128; }
  [ -n "$FAKE_TAGGED" ] && printf 'deadbeef\\t%s\\n' "$5"
fi
exit 0
`;
  for (const name of ['git', 'gh']) fs.writeFileSync(path.join(bin, name), script(name), { mode: 0o755 });
  return bin;
}

// Runs the release script in `repo` with the stand-ins first on PATH. Returns its exit status, output and calls.
export function runRelease(repo, { sha, tagged = false, lsRemoteFails = false }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-0240-bin-'));
  const log = path.join(dir, 'calls.log');
  const env = { ...process.env, PATH: `${fakeBin(dir)}${path.delimiter}${process.env.PATH}`, FAKE_LOG: log, GITHUB_SHA: sha };
  if (tagged) env.FAKE_TAGGED = '1';
  if (lsRemoteFails) env.FAKE_LS_REMOTE_FAILS = '1';
  const r = spawnSync(process.execPath, [SCRIPT], { cwd: repo, env, encoding: 'utf8' });
  const calls = fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean) : [];
  return { status: r.status, stdout: r.stdout, stderr: r.stderr, calls };
}
