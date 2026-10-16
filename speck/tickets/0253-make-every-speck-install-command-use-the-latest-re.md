---
id: "0253"
title: "Make every speck install command use the latest release"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0256", "0252"]                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T13:58:08.923Z"

---
# 0253 · Make every speck install command use the latest release

**Status:** 🔨 building

## Problem
The README's setup prompt installs a fixed release (`#v0.5.3`) that each release ticket has to bump by hand, so it falls behind whenever that step is missed. Other install commands (the README's "Without an agent" section, the brief, `speck init`'s own message and `/speck-setup`) name no release at all, so they install whatever is on `main` at that moment rather than a release. The landing page already installs the latest release with `#semver:*` (speck-site 0005).

## Outcome
Every command that tells someone how to install or run speck before it's installed uses the latest release, `npx 'github:luroai/speck#semver:*'`, so nobody needs to update it at a release and nobody gets an unreleased `main`.

## Acceptance criteria
1. The README's setup prompt runs `npx 'github:luroai/speck#semver:*' init`, with the package in single quotes so the `*` works in zsh as well as bash, and names no fixed release. Its other words are unchanged.
2. Every other command for installing or running speck before it's installed uses `npx 'github:luroai/speck#semver:*'`, quoted the same way: the README's "Without an agent" section, `docs/brief.md` (its command table and "Releases"), the message `speck init` prints when a copy of speck can't install itself, and `/speck-setup`. Commands in `CHANGELOG.md` and `docs/releases/` keep their fixed version, as each describes one release.
3. `docs/brief.md`'s "Releases" section says the setup prompt always installs the newest release tag, so a release ticket no longer changes it, and the version check covers `package.json` and the newest changelog section.
4. `npm test` fails when the README's setup prompt names a fixed release (for example `#v0.5.3`) or no release at all (`npx github:luroai/speck init`), and passes with `'github:luroai/speck#semver:*'` quoted. Release tests that checked the prompt names the current version check this instead.
5. No test that passed before this change fails, apart from tests that check the old fixed-version prompt, which check the new one instead.

## Out of scope
- The landing page, which already does this (speck-site 0005).
- The README's and the brief's status lines ("Status: 0.5.3, a public preview"), which still name the current version and are updated by each release.
- `CHANGELOG.md` and `docs/releases/`, which name the release they describe.

## Notes
- Decided 2026-10-16: always the latest release, rather than a fixed version bumped at each release, as on the landing page.
- Checked 2026-10-16: `npx -y 'github:luroai/speck#semver:*' help` resolves to the newest release tag (npm 10.9.9, on the build machine; recorded in speck-site 0005): v0.5.2 at first, then v0.5.3 once it was released.
- Waits for 0256, the last of the README tickets (0255, 0251, 0256), and 0252 (also changes `/speck-setup`).
- Checked 2026-10-16: unquoted, `github:luroai/speck#semver:*` fails in zsh with "no matches found" (zsh 5.9 from Ubuntu's package, `zsh -f -c` and `zsh -c`), because zsh's default NOMATCH option rejects a glob that matches no file. Single-quoted, it passes through unchanged.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
