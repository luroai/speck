---
id: "0336"
title: "Prepare release 0.10.0"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0330","0331","0332","0333","0334","0335"]                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T12:34:34.527Z"
approved: "2026-10-20T12:37:43.753Z"
finished: "2026-10-20T12:40:12.389Z"

---
# 0336 · Prepare release 0.10.0

**Status:** ✅ done

## Problem
0330 to 0335 make an all-Cursor setup work from setup's questions alone: Cursor builds on Auto, a built-in Cursor reviewer on a chosen model, the Foreman on Cursor, models picked from the account's list, and a test command for folders without tests. Anyone following the setup prompt gets 0.9.1 without them, and the user is waiting for this release to test speck in Cursor on their work laptop.

## Outcome
speck is ready to be released as 0.10.0, the Cursor-native release.

## Acceptance criteria
1. `package.json` has version `0.10.0`, and `speck init` prints `speck 0.10.0`.
2. `CHANGELOG.md` has a 0.10.0 section above the 0.9.1 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v0.9.1` tag, from the tickets shipped since, leading with setting speck up to run entirely in Cursor (checked by review). The 0.9.1 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.10.0, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.10.0.md` holds the notes for the GitHub release page: one short paragraph saying this release makes speck work entirely in Cursor, each change in it and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.9.1, and a link to the 0.10.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.10.0.

## Out of scope
- Creating the `v0.10.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.10.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-10-20 as the Cursor-native release. Follows 0329 (0.9.1). A minor release, as it adds features.
- Covers every ticket shipped since `v0.9.1`: 0330 to 0335, which it waits for (`after:`).
- After it ships, check that the `v0.10.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.10.0 --target main --title "speck 0.10.0" --notes-file docs/releases/v0.10.0.md`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Covers every ticket shipped since `v0.9.1`: 0330–0335, and 0337, which fixed one of speck's own tests and changes nothing anyone using speck notices, so the changelog and release notes leave it out.
- Built from main at `speck(0335): Read the agents' models outside the setup agent's sandbox`: 320 shipped, 16 cancelled, 13 minutes median, 1.5 rounds median, 158 approved in the first round, worked out as 0307 did, with its figures test.
- 0329's checks that named 0.9.1 as the current version now check the current version, and its figures test checks only the figures 0.9.1 was built from, as 0329 did for 0307.
- README: only its status line and figures change here. 0332 and 0333 already updated its Cursor reviewer and Foreman text.
- Self-check: the release notes' upgrade line on `allow_same_model_review` now names every condition 0330 needs (`build_command` blank, a reviewer model other than `auto` and the builder's), and the line on the Settings view says it offers Cursor as the reviewer only with a `reviewer_options.cursor` command.
- Pictures: none, because only text changes: the README's status line and figures, which render as before.

## In plain words
speck is ready to go out as 0.10.0, the release that lets you run speck entirely in Cursor. The changelog has a 0.10.0 section, led by the all-Cursor setup, and the release page's notes say what each change is for, how to update and what changes when upgrading from 0.9.1, such as the Foreman now running on Cursor when Cursor builds your tickets. The README and the brief now say 0.10.0, and the README's "Built with speck" figures are up to date: 320 tickets shipped and 158 approved in the first review round. Once this lands, the release page should appear on GitHub by itself. Worth checking that it did, as the ticket's Notes say how to publish it by hand if not.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 213,933
- Elapsed since build started: 3 min
- Changed lines: 60 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none new. The Settings view not offering Cursor as the reviewer is already in the inbox (from 0332). The README's review-loop paragraph says a same-family reviewer needs both models set; for Cursor, a blank `builder_model` runs on `auto`, which counts as set, as the brief explains.

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
    "reviewed_sha": "c52493a41204af94707d547de0e9310bd7a893b9",
    "thread_id": "01a15950-9ec9-77e2-ba5c-dff5792a59c1",
    "seconds": 37,
    "usage": {
      "input_tokens": 212918,
      "cached_input_tokens": 156416,
      "cache_write_input_tokens": 0,
      "output_tokens": 1015,
      "reasoning_output_tokens": 65
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T12:37:34.743Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.10.0. Passing 0336 AC1 tests check the version and invoke speck init to verify its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md leads with the all-Cursor setup and describes shipped tickets 0330–0335. The diff only prepends the new section; 0.9.1 and earlier entries are unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md say 0.10.0, a public preview. Passing 0336 AC3 tests verify the version and the unchanged latest-release setup command."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.10.0.md includes the opening paragraph, six changes and their benefits, per-project update command, upgrade implications and changelog link. Claims match shipped tickets and the setup, reviewer, same-model and Foreman implementations. No person's name appears. Passing AC4 tests check technical facts, the command and link."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independent recalculation using builtWithSpeckFigures on the current done tickets matches the README: 320 shipped, 16 cancelled, 13 minutes median, 1.5 review rounds median and 158 first-round approvals. The recorded run has 129 passes, three skips and no failures; the version/changelog consistency test passes."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The release is ready for the owner's merge decision. Version numbers, release notes and README figures agree with the shipped work. The recorded checks pass, earlier changelog entries are preserved, and no blocking concerns were found."
  }
}
```

</details>
