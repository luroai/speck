---
id: "0307"
title: "Prepare release 0.9.0"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0302", "0303", "0304", "0305", "0306", "0308", "0309", "0310", "0311", "0312", "0313", "0314", "0315", "0316", "0317", "0318", "0319", "0320", "0321"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-19T06:09:32.538Z"

---
# 0307 · Prepare release 0.9.0

**Status:** 🔍 reviewing

## Problem
Once 0302–0306 ship, the panel has the LCD look from the Luro design (its badges, mark, title and app icon), and the README and its picture describe speck as it is now. Anyone following the setup prompt, or updating speck on another machine, gets 0.8.0 without it.

## Outcome
speck is ready to be released as 0.9.0.

## Acceptance criteria
1. `package.json` has version `0.9.0`, and `speck init` prints `speck 0.9.0`.
2. `CHANGELOG.md` has a 0.9.0 section above the 0.8.0 one. It describes, in plain English, what someone using speck will notice is new, fixed or changed since the `v0.8.0` tag, from the tickets shipped since. The 0.8.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.9.0, a public preview, the setup prompt still installs the latest release as 0253 left it, and the README says nothing about how speck builds, reviews, ships or is set up that the tickets shipped since `v0.8.0` have made untrue.
4. `docs/releases/v0.9.0.md` holds the notes for the GitHub release page: one short paragraph saying what this release is for, each change in it and why it matters, how to install or update it (running the install command again in each project), anything that changes for someone upgrading from 0.8.0 (such as new settings and their defaults), and a link to the 0.9.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0298 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.9.0.

## Out of scope
- Creating the `v0.9.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.9.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-10-18, so the user can update speck on their other machines. Follows 0298 (0.8.0).
- Covers: 0302–0306. It waits for all of them (`after:`), so they're all in it.
- After it ships, check that the `v0.9.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.9.0 --target main --title "speck 0.9.0" --notes-file docs/releases/v0.9.0.md`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Covers every ticket shipped since `v0.8.0`: 0302–0306 and 0308–0321.
- Built from main at `speck(0306): Bring the README and its picture up to date`: 304 shipped, 16 cancelled, 13 minutes median, 2 rounds median, 147 approved in the first round, worked out as 0298 did, with its figures test. The README now says "2 review rounds".
- 0298's checks that named 0.8.0 as the current version now check the current version, and its figures test checks only the figures 0.8.0 was built from, as 0298 did for 0297.
- README: 0306 already brought it up to date with every ticket shipped since `v0.8.0`, so only its status line and figures change here.
- Self-check: the release notes no longer say a Codex build is never started with a Claude model, as `builder_model` can still be set by hand; they say it isn't left over from a switch.

## In plain words
speck is ready to be released as 0.9.0. The changelog and the GitHub release notes describe what's new since 0.8.0: the panel's LCD look and new logo, answering the Foreman's questions and seeing what it will do, each ticket built by the agent it was made for, pull request mode on a main branch that only takes pull requests, a Claude reviewer without your connected services, and only ever one speck run per project. The README and the product brief say 0.9.0, and the README's "Built with speck" figures are up to date: 304 tickets shipped, with a median of 2 review rounds. Once this ships, the release should appear on GitHub by itself: check that it did, and on your other machines run the install command again in each project to update.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Tidy-up: 0297's and 0298's release tests still check that each changelog section sits above the one before and that older sections match their tag, which the build rules now forbid as tests of a document's wording or order. 0307's tests leave those to review.
- After it ships, check that the `v0.9.0` tag and its GitHub release page appeared (see Notes).

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
    "reviewed_sha": "77f9300de9e0b101816843cb51fc48fd07a4dd42",
    "thread_id": "01a152ca-3533-76c2-ade5-536ce8b53102",
    "seconds": 36,
    "usage": {
      "input_tokens": 161066,
      "cached_input_tokens": 109696,
      "cache_write_input_tokens": 0,
      "output_tokens": 1146,
      "reasoning_output_tokens": 147
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T06:13:01.974Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.9.0; both 0307 AC1 tests passed, including invoking speck init."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 0.9.0 above 0.8.0 and covers shipped tickets 0302–0306 and 0308–0321. The reported comparison against v0.8.0 passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md name 0.9.0 as a public preview. The setup-prompt tests passed; README workflow descriptions agree with the shipped changes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.9.0.md describes the release, changes, installation in each project and upgrade implications, with the changelog link. Claims agree with the shipped tickets; no person's name appears."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The figures test passed. Independent reading of current done tickets confirms 304 shipped, 16 cancelled, median 2 rounds and 147 first-round approvals. Reported tests: 132 passed, zero failed; version/changelog agreement passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/release-0307.test.mjs:35",
        "issue": "The new tests assert document heading order at line 35 and exact historical changelog prose at lines 40–44. The review rules explicitly prohibit adding tests of document wording or heading order, even though these checks reflect ticket requirements.",
        "suggested_fix": "Remove these ordering and prose-equality assertions and leave those requirements to review. Retain tests of factual content such as versions, commands, settings and links.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The release content and version updates meet the acceptance criteria, and the reported tests pass. Before approval, remove the new tests that lock document prose and heading order; the review rules explicitly forbid them."
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
    "reviewed_sha": "4723f2b2956a00485d358f4515ad72e8ac94bcbe",
    "thread_id": "01a152ca-3533-76c2-ade5-536ce8b53102",
    "seconds": 21,
    "usage": {
      "input_tokens": 272272,
      "cached_input_tokens": 212992,
      "cache_write_input_tokens": 0,
      "output_tokens": 1803,
      "reasoning_output_tokens": 147
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T06:13:37.600Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.9.0. Both AC1 tests passed, including invoking speck init and checking its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md describes the shipped changes in plain English. Read-only comparison confirms 0.9.0 is above 0.8.0 and all historical sections match v0.8.0 unchanged. The factual-content test passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md say 0.9.0, a public preview. The latest-release setup prompt remains unchanged and its tests passed. The README's workflow descriptions remain consistent with the shipped tickets reviewed in round 1."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.9.0.md retains the verified release summary, changes and benefits, install command, per-project update instructions, upgrade implications and changelog link. No person's name appears. All AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The figures test passed with 304 shipped, 16 cancelled, 13 minutes median, 2 review rounds median and 147 first-round approvals. Version/changelog agreement passed. The reported run had 131 passes, zero failures and three skips."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/release-0307.test.mjs",
        "issue": "The previous tests asserted changelog heading order and exact historical prose. Both prohibited assertions have now been removed; the remaining checks cover facts.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Release 0.9.0 is ready for the owner's merge decision. The version, release notes, status lines and usage figures meet the criteria. The test issue is fixed, and the reported tests pass."
  }
}
```

</details>
