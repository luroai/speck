---
id: "0253"
title: "Make every speck install command use the latest release"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 🔍 reviewing

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
- Self-check: no changes

## In plain words
Every place that tells someone how to install speck, including the setup prompt at the top of the README, now installs the newest release, whichever that is. Nobody has to update the prompt when a new release comes out, and nobody gets unreleased work by accident. The command is written in single quotes so it works the same in zsh, the default shell on a Mac, as in bash. To see it, read the README's Get started and Without an agent sections. Worth knowing: until a new release has been tagged, the prompt keeps installing the release before it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
- Follow-ups: none for the inbox.
- Known limit: the setup prompt check wants `npx 'github:luroai/speck#semver:*' init` on one line of the prompt, so rewrapping the prompt between the command and `init` would fail the test.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "9ff918ab996ee1dcfdca6b8651ec078a8c4d8b70",
    "thread_id": "01a14505-6b31-7892-9be9-e90261f6b11e",
    "seconds": 40,
    "usage": {
      "input_tokens": 174273,
      "cached_input_tokens": 121088,
      "cache_write_input_tokens": 0,
      "output_tokens": 747,
      "reasoning_output_tokens": 30
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T14:03:04.853Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "README.md's Get started prompt uses the exact single-quoted latest-release command. Both AC1 tests in test/install-0253.test.mjs passed, including preservation of its other words."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Verified README.md, docs/brief.md, installTooling in scripts/install.mjs and skills/speck-setup/SKILL.md. AC2 tests passed; test/luro-0082.test.mjs exercises the actual CLI fallback message. Changelog and release notes are unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "docs/brief.md's Releases section describes automatic newest-release installation and the package/changelog version check. The corresponding AC3 test passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "setupPromptProblems in test/support/release.mjs rejects fixed, missing and incorrectly quoted release selectors. Positive and negative AC4 tests passed. Updated release tests invoke this check, and npm test discovers these test files."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded targeted run passed all 133 tests across the ticket's test file and every changed existing test file. Test changes preserve existing checks except those explicitly replaced by the ticket. No unrelated changes found; whole-suite verification remains the shipping gate."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "All current setup instructions now select the latest release with consistent shell quoting. Historical release instructions remain unchanged. Regression tests reject fixed or missing release selectors, and all 133 targeted tests passed. No blocking concerns found."
  }
}
```

</details>
