// Reads the version from each place a release names it, so tests can check they agree.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './panel.mjs';

// The version of the newest (first) `## <version>` section of a changelog.
export function changelogVersion(changelog) {
  return changelog.match(/^## \[?(\d+\.\d+\.\d+)\]?/m)?.[1] || null;
}

// The command that installs or runs speck's latest release, quoted so the `*` works in zsh as well as bash (0253).
export const LATEST = "npx 'github:luroai/speck#semver:*'";

// A list of plain-English problems with the README's setup prompt; empty when it runs `<LATEST> init` and no
// other speck install command, such as a fixed release (`#v0.5.3`), no release at all or the package unquoted.
export function setupPromptProblems(readme) {
  const section = readme.match(/^## Get started\n([\s\S]*?)(?=^## |(?![\s\S]))/m)?.[1] || '';
  const prompt = section.match(/```[^\n]*\n([\s\S]*?)```/)?.[1];
  if (!prompt) return ["The README has no setup prompt under Get started."];
  const commands = [...prompt.matchAll(/npx (?:-y )?['"]?github:[\w.-]+\/[\w.-]+[^\s`]*/g)].map(m => m[0]);
  if (!commands.includes(LATEST) || !prompt.includes(`${LATEST} init`)) return [`The README's setup prompt doesn't run \`${LATEST} init\`.`];
  const others = commands.filter(c => c !== LATEST);
  if (others.length) return [`The README's setup prompt also installs ${others.join(', ')}, not the latest release.`];
  return [];
}

// The text of one `## <version>` section, up to the next `## ` heading or the end.
export function changelogSection(changelog, version) {
  const v = version.replace(/\./g, '\\.');
  return changelog.match(new RegExp(`^## \\[?${v}\\]?[^\\n]*\\n[\\s\\S]*?(?=^## |(?![\\s\\S]))`, 'm'))?.[0] || null;
}

// A list of plain-English mismatches between package.json and the newest changelog section; empty when they agree.
// The setup prompt always installs the latest release (0253), so setupPromptProblems checks it instead.
export function releaseMismatches({ pkg, changelog }) {
  const found = {
    'package.json': JSON.parse(pkg).version || null,
    'the newest section of CHANGELOG.md': changelogVersion(changelog),
  };
  const problems = Object.entries(found).filter(([, v]) => !v).map(([where]) => `No version found in ${where}.`);
  if (problems.length) return problems;
  const versions = new Set(Object.values(found));
  if (versions.size === 1) return [];
  return [`The release versions don't match: ${Object.entries(found).map(([where, v]) => `${where} says ${v}`).join(', ')}.`];
}

// The README's "Built with speck" figures, worked out from a folder of done tickets: shipped (status done) and
// cancelled counts, the median minutes from a build's `started` to its `finished`, rounded, and the median of the
// Delivery log's "Review rounds" with how many were approved in round 1. Tickets without a time or rounds are left
// out of those medians.
export function builtWithSpeckFigures(tickets) {
  const median = a => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  let shipped = 0, cancelled = 0, firstRound = 0;
  const minutes = [], rounds = [];
  for (const t of tickets) {
    const status = t.match(/^status:\s*(\w+)/m)?.[1];
    if (status === 'cancelled') { cancelled++; continue; }
    if (status !== 'done') continue;
    shipped++;
    const start = t.match(/^started:\s*"?([^"\n]+)"?/m)?.[1], end = t.match(/^finished:\s*"?([^"\n]+)"?/m)?.[1];
    if (start && end) minutes.push((Date.parse(end) - Date.parse(start)) / 60000);
    const r = t.match(/^- Review rounds:\s*(\d+)/m)?.[1];
    if (r) { rounds.push(Number(r)); if (r === '1') firstRound++; }
  }
  return { shipped, cancelled, medianMinutes: Math.round(median(minutes)), medianRounds: median(rounds), firstRound };
}

// The same figures as the README's "Built with speck" section states them.
export function readmeFigures(readme) {
  const s = readme.match(/^## Built with speck\n([\s\S]*?)(?=^## )/m)?.[1] || '';
  const n = re => { const m = s.match(re); return m ? Number(m[1]) : null; };
  return {
    shipped: n(/\*\*(\d+) tickets shipped\*\*/), cancelled: n(/tickets shipped\*\* and (\d+) cancelled/),
    medianMinutes: n(/\*\*(\d+) minutes?\*\* median/), medianRounds: n(/\*\*(\d+) review rounds?\*\* median/),
    firstRound: n(/(\d+) tickets were approved in the first round/),
  };
}

// The done tickets as they were in a commit, read with git. Throws when the commit is missing or can't be read.
export function doneTicketsAt(commit) {
  if (!commit) throw new Error('no commit to read the done tickets from');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speck-'));
  const archive = spawnSync('git', ['archive', '--format=tar', commit, 'speck/tickets/done'], { cwd: ROOT, maxBuffer: 1 << 28 });
  if (archive.status !== 0) throw new Error(String(archive.stderr));
  const tar = spawnSync('tar', ['-x', '-C', dir], { input: archive.stdout });
  if (tar.status !== 0) throw new Error(String(tar.stderr));
  const done = path.join(dir, 'speck', 'tickets', 'done');
  return fs.readdirSync(done).filter(f => f.endsWith('.md')).map(f => fs.readFileSync(path.join(done, f), 'utf8'));
}
