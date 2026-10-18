---
id: "0282"
title: "Prepare release 0.6.0"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T09:46:26.237Z"
approved: "2026-10-18T09:52:24.384Z"

---
# 0282 · Prepare release 0.6.0

**Status:** 👍 approved

## Problem
Since `v0.5.4`, speck has gained a Settings view in the panel that explains and changes the settings people tune, with settings for this machine only, a builder model and model lists for the reviewer (0257–0261, 0268, 0273–0281). Setup now goes through those settings (0269). Shipping copes better when `main` fails or has moved on GitHub (0263–0265). Builds run a project's quick repo-wide checks (0272), and a document's wording is checked by review, not by tests (0266, 0267). Anyone following the setup prompt today gets 0.5.4 without any of it.

## Outcome
speck is ready to be released as 0.6.0.

## Acceptance criteria
1. `package.json` has version `0.6.0`, and `speck init` prints `speck 0.6.0`.
2. `CHANGELOG.md` has a 0.6.0 section above the 0.5.4 one. It describes, in plain English, what someone using speck will notice is new, fixed or changed since the `v0.5.4` tag, from the tickets shipped since. The 0.5.4 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.6.0, a public preview, the setup prompt still installs the latest release as 0253 left it, and the README says nothing about how speck builds, reviews, ships or is set up that the tickets shipped since `v0.5.4` have made untrue.
4. `docs/releases/v0.6.0.md` holds the notes for the GitHub release page: one short paragraph saying what this release is for, each change in it and why it matters, how to install it, anything that changes for someone upgrading from 0.5.4 (such as new settings and their defaults), and a link to the 0.6.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0254 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.6.0.

## Out of scope
- Creating the `v0.6.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.6.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- Changing what the README says about builders other than Claude Code: `speck/ideas/2026-10-17-build-with-any-agent.md`.

## Notes
- Asked for 2026-10-18, for minor release 0.6.0: it adds features, so it isn't a patch. Follows 0254 (0.5.4).
- Covers every ticket shipped since `v0.5.4`: 0257–0281, apart from 0262, which only updated tests.
- After it ships, check that the `v0.6.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.6.0 --target main --title "speck 0.6.0" --notes-file docs/releases/v0.6.0.md`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Built from main at `speck(0281): Draw every Settings control's border on all four sides`: 265 shipped, 16 cancelled, 13 minutes median, 1 round median, 136 approved in the first round, worked out as 0254 did. 0267 made tests stop reading this repo's `speck/` folder and pinning wording, so the figures test reads the done tickets at that commit with git and looks for each figure in the README; it skips when that commit isn't in the checkout's history, as in 0267's rewording check.
- "The 0.5.4 and earlier sections are unchanged" is checked against the `v0.5.4` tag's changelog, skipped when the tag isn't there.
- 0254's checks that named 0.5.4 as the current version now check the current version, as 0254 did for 0248.
- Self-check: README's setup and ship-queue sentences narrowed to what 0263, 0265 and 0269 do; release notes no longer say the machine values live in `speck/config.yml`.

## In plain words
speck is ready to go out as version 0.6.0. It gathers everything shipped since 0.5.4: the panel's new Settings view, settings for one computer only, choosing the models that build and review, setup going through the settings that matter, shipping that copes better when the main branch fails or has moved on, quick project-wide checks in every build, and document wording checked by the reviewer instead of by tests. The changelog, the release notes, the README and its figures (265 tickets shipped) are up to date.

To see it, read the new 0.6.0 section at the top of the changelog, or the release notes. Someone upgrading just runs the install command again: the new settings default to how speck worked before. After it ships, check that the v0.6.0 release page appeared on GitHub; if it didn't, the ticket's Notes say how to publish it by hand.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Under “Everything in between”, the README says a build “writes a test for each acceptance criterion”.; F2 The first change says the only previous way to change a setting was to edit the file.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 699,787
- Elapsed since build started: 6 min
- Changed lines: 96 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "e68dfbba45fcedf1286e3b687ddc44255417f38d",
    "thread_id": "01a14e6b-bac2-70c2-bcfd-31fb18891419",
    "seconds": 46,
    "usage": {
      "input_tokens": 284879,
      "cached_input_tokens": 225664,
      "cache_write_input_tokens": 0,
      "output_tokens": 1703,
      "reasoning_output_tokens": 197
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T09:51:31.169Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.6.0; scripts/install.mjs reads and prints that version. Both 0282 AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md summarises shipped tickets 0257–0281 above 0.5.4. Both AC2 tests passed, including comparison of the older sections against v0.5.4."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "Status lines and setup command are correct, but README.md still says builds write a test for every acceptance criterion, contradicting 0266 and skills/speck-build/SKILL.md."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "Release notes include installation, upgrade defaults and the changelog link; AC4 tests passed. However, their claim that changing settings previously required editing the file is contradicted by v0.5.4's scripts/config.mjs and README."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independent recalculation from done tickets matches all five README figures. The reported run has 132 passes, zero failures and three skips; the version/changelog consistency test passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "README.md",
        "issue": "Under “Everything in between”, the README says a build “writes a test for each acceptance criterion”. Ticket 0266 changed this: criteria marked “(checked by review)” receive no test. This fails AC3's requirement to remove claims made untrue since 0.5.4.",
        "suggested_fix": "Explain that builds test acceptance criteria except document criteria marked for review, which the reviewer checks by reading.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "docs/releases/v0.6.0.md",
        "issue": "The first change says the only previous way to change a setting was to edit the file. Version 0.5.4 already provided and documented `config set <key> <value>`, so this release claim is false and fails AC4.",
        "suggested_fix": "Describe the panel as a new way to inspect and change settings alongside the existing command and config file.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The version bump, changelog, upgrade instructions and recalculated figures are in place, and the reported tests pass. Two documentation corrections are needed: builds no longer test every criterion, and settings could already be changed through a command before this release."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "787582461a3e31cacc000ee1467c70720c49241d",
    "thread_id": "01a14e6b-bac2-70c2-bcfd-31fb18891419",
    "seconds": 22,
    "usage": {
      "input_tokens": 410768,
      "cached_input_tokens": 344832,
      "cache_write_input_tokens": 0,
      "output_tokens": 2437,
      "reasoning_output_tokens": 197
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T09:52:17.095Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json remains at 0.6.0. Both AC1 tests passed, including running speck init and checking its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md describes the shipped changes under 0.6.0 above 0.5.4. Both AC2 tests passed, including comparison of all older sections with the v0.5.4 tag."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md identify 0.6.0 as a public preview. The latest-release setup prompt remains intact. README's build explanation now explicitly exempts document criteria marked '(checked by review)', resolving F1. AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.6.0.md explains the release, changes, installation and upgrade defaults, and links to the changelog without naming anyone. It now correctly acknowledges the existing config set command, resolving F2. AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "README figures remain consistent with the independently checked done tickets: 265 shipped, 16 cancelled, 13 minutes median, one review round median and 136 first-round approvals. Both AC5 tests passed. Current test output records 135 passes, zero failures and three skips."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "README.md",
        "issue": "The build explanation previously omitted the exception for document criteria checked by review.",
        "suggested_fix": "Completed: the paragraph now explicitly explains that these criteria receive no test and are checked by the reviewer.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "docs/releases/v0.6.0.md",
        "issue": "The release notes previously claimed that changing settings required editing the config file.",
        "suggested_fix": "Completed: the notes now acknowledge both file editing and the existing speck config set command.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The release preparation meets all five criteria. Both documentation errors are corrected, the figures match the shipped tickets, and the reported tests pass. No blocking concerns remain."
  }
}
```

</details>
