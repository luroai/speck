#!/usr/bin/env node
// Publishes speck's own GitHub release for the version in package.json, once (0240).
// Run by .github/workflows/release.yml on each push to main, from the repo root,
// with GH_TOKEN for `gh` and GITHUB_SHA naming the pushed commit.
// It isn't part of speck: `speck init` doesn't copy it.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  if (r.error) fail(`Couldn't run ${cmd}: ${r.error.message}`);
  if (r.status !== 0) fail(`\`${cmd} ${args.join(' ')}\` failed (exit ${r.status}). Nothing was tagged or released.`);
  return r.stdout;
}

let version;
try { version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version; } catch {}
if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  fail(`package.json has no version like 1.2.3 (found ${JSON.stringify(version ?? null)}). Nothing was tagged or released.`);
}
const sha = process.env.GITHUB_SHA;
if (!sha) fail('GITHUB_SHA is not set, so there is no pushed commit to tag. Nothing was tagged or released.');

const tag = `v${version}`;
if (run('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`]).trim()) {
  console.log(`${tag} is already tagged. Nothing to release.`);
  process.exit(0);
}

const notes = `docs/releases/${tag}.md`;
if (!fs.existsSync(notes)) fail(`${notes} is missing, so ${tag} has no release notes. Add it to publish the release. Nothing was tagged or released.`);

// gh creates the tag on the pushed commit along with the release.
run('gh', ['release', 'create', tag, '--target', sha, '--title', `speck ${version}`, '--notes-file', notes]);
console.log(`Published speck ${version} as ${tag} on ${sha}.`);
