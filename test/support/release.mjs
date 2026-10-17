// Reads the version from each place a release names it, so tests can check they agree.

// The version of the newest (first) `## <version>` section of a changelog.
export function changelogVersion(changelog) {
  return changelog.match(/^## \[?(\d+\.\d+\.\d+)\]?/m)?.[1] || null;
}

// The command that installs or runs speck's latest release, quoted so the `*` works in zsh as well as bash (0253).
export const LATEST = "npx 'github:luroai/speck#semver:*'";

// The README's setup prompt: the first code block that names the speck-setup skill, wherever it is (0267), or null.
export function setupPrompt(readme) {
  return [...readme.matchAll(/^```[^\n]*\n([\s\S]*?)^```/gm)].map(m => m[1]).find(b => b.includes('speck-setup')) ?? null;
}

// A list of plain-English problems with the README's setup prompt; empty when it runs `<LATEST> init` and no
// other speck install command, such as a fixed release (`#v0.5.3`), no release at all or the package unquoted.
export function setupPromptProblems(readme) {
  const prompt = setupPrompt(readme);
  if (!prompt) return ["The README has no setup prompt: no code block names speck-setup."];
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
