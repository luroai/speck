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
