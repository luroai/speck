---
id: "0297"
title: "Prepare release 0.7.0"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0288", "0289", "0290", "0291", "0292", "0293"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T12:25:35.297Z"

---
# 0297 · Prepare release 0.7.0

**Status:** 🔍 reviewing

## Problem
Once 0288–0293 ship, speck can build with Codex or Cursor as well as Claude Code, review with Claude Code from the command line, find the agents and models on the machine, and switch the builder from the panel and in setup. Anyone following the setup prompt, or updating speck on another machine, gets 0.6.0 without it.

## Outcome
speck is ready to be released as 0.7.0.

## Acceptance criteria
1. `package.json` has version `0.7.0`, and `speck init` prints `speck 0.7.0`.
2. `CHANGELOG.md` has a 0.7.0 section above the 0.6.0 one. It describes, in plain English, what someone using speck will notice is new, fixed or changed since the `v0.6.0` tag, from the tickets shipped since. The 0.6.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.7.0, a public preview, the setup prompt still installs the latest release as 0253 left it, and the README says nothing about how speck builds, reviews, ships or is set up that the tickets shipped since `v0.6.0` have made untrue.
4. `docs/releases/v0.7.0.md` holds the notes for the GitHub release page: one short paragraph saying what this release is for, each change in it and why it matters, how to install or update it (running the install command again in each project), anything that changes for someone upgrading from 0.6.0 (such as new settings and their defaults), and a link to the 0.7.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0282 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.7.0.

## Out of scope
- Creating the `v0.7.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.7.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-10-18, so the user can update speck on their other machines. Follows 0282 (0.6.0).
- Covers: 0288–0293. It waits for all of them (`after:`), so they're all in it.
- After it ships, check that the `v0.7.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.7.0 --target main --title "speck 0.7.0" --notes-file docs/releases/v0.7.0.md`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Covers every ticket shipped since `v0.6.0`: 0288–0293. 0283–0287 and 0294–0296 aren't shipped yet.
- Built from main at `speck(0293): Switch the builder from the panel and in setup`: 272 shipped, 16 cancelled, 13 minutes median, 1 round median, 139 approved in the first round, worked out as 0282 did, with its figures test.
- 0282's checks that named 0.6.0 as the current version now check the current version, and its figures test checks only the figures 0.6.0 was built from, as 0282 did for 0254.
- AC3's status-line test checks only the version on it: 0267's rewording check fails a test that pins "a public preview", so that wording is checked by review.
- Self-check: the release notes and changelog no longer say a Cursor builder needs a reviewer other than Codex (Cursor is its own family), setup notes rather than refuses a same-family reviewer, and `builder_model` reaches Codex and Cursor builds only through speck's own command for them.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "3fedf934b89243d855a7a3720983d08f7783691c",
    "thread_id": "01a14efd-a821-7b81-a138-c47905c25dbe",
    "seconds": 40,
    "usage": {
      "input_tokens": 220147,
      "cached_input_tokens": 161024,
      "cache_write_input_tokens": 0,
      "output_tokens": 1560,
      "reasoning_output_tokens": 149
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T12:30:48.731Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json declares 0.7.0. Both AC1 tests passed, including running init and checking its printed version."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The new changelog covers 0288–0293 and preserves earlier sections, confirmed by passing AC2 tests. Its unconditional claim about refusing same-family builders contradicts sameModelProblem in scripts/same-model.mjs."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md say 0.7.0, a public preview. Passing AC3 tests check versions, the latest-release setup command and new command names. README changes reflect the shipped builder and token-reporting behaviour."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "docs/releases/v0.7.0.md includes installation, per-project updates, upgrade guidance and the correct changelog link; AC4 tests passed. The Settings refusal claim omits the supported different-model exception."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independent recalculation from current speck/tickets/done matches all README figures: 272 shipped, 16 cancelled, 13 minutes median, one round median and 139 first-round approvals. Version consistency tests passed; the recorded run has 136 passes, no failures and three skips."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "CHANGELOG.md; docs/releases/v0.7.0.md",
        "issue": "Both documents say Settings refuses a builder from the reviewer's family without mentioning that Claude builder/reviewer pairs are allowed when builder_model and reviewer_model are both set and differ. scripts/same-model.mjs explicitly permits this, and shipped ticket 0293 records that exception. The release therefore describes an existing supported configuration incorrectly.",
        "suggested_fix": "Qualify the same-family refusal statements with the explicit different-model exception. Keep the distinction clear that the CLI builder switch warns about an incompatible reviewer, whereas Settings refuses it.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The version bump, installation guidance and refreshed project figures check out, and the reported tests pass. One release-documentation correction remains: the same-family reviewer restriction is described more strictly than it works."
  }
}
```

</details>
