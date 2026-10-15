// Reads the version from each place a release names it, so tests can check they agree.

// The version of the newest (first) `## <version>` section of a changelog.
export function changelogVersion(changelog) {
  return changelog.match(/^## \[?(\d+\.\d+\.\d+)\]?/m)?.[1] || null;
}

// The version in the README's setup prompt (`npx github:<owner>/<repo>#v<version> init`).
export function setupPromptVersion(readme) {
  return readme.match(/npx github:[\w.-]+\/[\w.-]+#v(\d+\.\d+\.\d+) init/)?.[1] || null;
}

// The text of one `## <version>` section, up to the next `## ` heading or the end.
export function changelogSection(changelog, version) {
  const v = version.replace(/\./g, '\\.');
  return changelog.match(new RegExp(`^## \\[?${v}\\]?[^\\n]*\\n[\\s\\S]*?(?=^## |(?![\\s\\S]))`, 'm'))?.[0] || null;
}

// A list of plain-English mismatches between package.json, the changelog and the setup prompt; empty when they agree.
export function releaseMismatches({ pkg, changelog, readme }) {
  const found = {
    'package.json': JSON.parse(pkg).version || null,
    'the newest section of CHANGELOG.md': changelogVersion(changelog),
    "the README's setup prompt": setupPromptVersion(readme),
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
