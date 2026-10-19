---
id: "0329"
title: "Prepare release 0.9.1"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0328"]                # ticket ids that must be done first
created: 2026-10-19
started: "2026-10-19T09:45:52.601Z"
approved: "2026-10-19T09:49:23.568Z"

---
# 0329 · Prepare release 0.9.1

**Status:** 👍 approved

## Problem
Six bug fixes have shipped since 0.9.0 (0322–0327), and 0328 will add a seventh. Anyone following the setup prompt, or updating speck on another machine, gets 0.9.0 without them.

## Outcome
speck is ready to be released as 0.9.1.

## Acceptance criteria
1. `package.json` has version `0.9.1`, and `speck init` prints `speck 0.9.1`.
2. `CHANGELOG.md` has a 0.9.1 section above the 0.9.0 one. It describes, in plain English, what someone using speck will notice is fixed or changed since the `v0.9.0` tag, from the tickets shipped since (checked by review). The 0.9.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.9.1, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.9.1.md` holds the notes for the GitHub release page: one short paragraph saying this is a bug-fix release, each fix in it and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.9.0, and a link to the 0.9.1 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.9.1.

## Out of scope
- Creating the `v0.9.1` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.9.1.md` when this lands on `main`.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-10-19 as a patch release. Follows 0307 (0.9.0).
- Covers every ticket shipped since `v0.9.0`: 0322–0327, and 0328, which it waits for (`after:`).
- After it ships, check that the `v0.9.1` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.9.1 --target main --title "speck 0.9.1" --notes-file docs/releases/v0.9.1.md`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Covers every ticket shipped since `v0.9.0`: 0322–0328.
- Built from main at `speck(0328): Say what became of a question the Foreman asked in its recent actions`: 312 shipped, 16 cancelled, 13 minutes median, 2 rounds median, 152 approved in the first round, worked out as 0307 did, with its figures test.
- 0307's checks that named 0.9.0 as the current version now check the current version, and its figures test checks only the figures 0.9.0 was built from, as 0307 did for 0298.
- README: no ticket since `v0.9.0` left it saying anything untrue (0324 updated its `build_command` line), so only its status line and figures change here.
- Self-check: the changelog no longer says the Foreman's detail tells you a ticket whose build never started is waiting to be set ready again: it's `speck run`'s log that says so.
- Pictures: none, because only text changes: the README's status line and figures, which render as before.

## In plain words
speck is ready to go out as 0.9.1, a bug-fix release with the seven fixes shipped since 0.9.0. The changelog has a 0.9.1 section listing them in plain words, the release page's notes say what each fix is for and how to update, and the README and the brief now say 0.9.1. The README's "Built with speck" figures are up to date: 312 tickets shipped and 152 approved in the first review round. Once this lands, the release page should appear on GitHub by itself. Worth checking that it did, as the ticket's Notes say how to publish it by hand if not.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The new tests assert document heading order at line 37 and the exact text of every historical changelog section at lines 40–44.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 489,456
- Elapsed since build started: 4 min
- Changed lines: 67 (limit 5000)
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
    "reviewed_sha": "39c6eabe4f1da88ef37448b447d74047127d964c",
    "thread_id": "01a1538f-b68d-76d3-9f75-f21476d6ff16",
    "seconds": 39,
    "usage": {
      "input_tokens": 189863,
      "cached_input_tokens": 140800,
      "cache_write_input_tokens": 0,
      "output_tokens": 1073,
      "reasoning_output_tokens": 138
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T09:48:48.342Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.9.1. Passing release-0329 tests check the version and run speck init to verify its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 0.9.1 above 0.9.0 and describes the seven fixes in shipped tickets 0322–0328. git diff v0.9.0 confirms all older sections are unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md say '0.9.1, a public preview'. Passing AC3 tests verify the versions and the unchanged latest-release setup command."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.9.1.md describes the seven shipped fixes, their benefits, updating each project, upgrade implications and the changelog link, without personal names. Passing AC4 tests cover commands, setting names and the link."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Passing AC5 tests recompute figures using the existing figures helper against the 0328 ship commit and compare them with README.md: 312 shipped, 16 cancelled, 13 minutes, 2 rounds and 152 first-round approvals. The version consistency check passes; the supplied run reports 130 passes and no failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/release-0329.test.mjs:37",
        "issue": "The new tests assert document heading order at line 37 and the exact text of every historical changelog section at lines 40–44. The review rules explicitly prohibit new tests that pin a document's wording or heading order. These checks would reject later editorial changes even when the release facts remain correct.",
        "suggested_fix": "Remove the heading-order assertion and historical-text equality test. Retain checks of release facts such as versions and install commands; verify section placement and unchanged historical text by review.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The release version, notes and published figures match the shipped work, and the reported tests pass. Before approval, remove two brittle documentation checks that lock heading order and historical wording."
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
    "reviewed_sha": "358ba4ce9c5bd9361929b5d9818fcbead292e32f",
    "thread_id": "01a1538f-b68d-76d3-9f75-f21476d6ff16",
    "seconds": 17,
    "usage": {
      "input_tokens": 296793,
      "cached_input_tokens": 238720,
      "cache_write_input_tokens": 0,
      "output_tokens": 1727,
      "reasoning_output_tokens": 138
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T09:49:16.341Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.9.1. Passing AC1 tests verify that version and exercise speck init to check its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 0.9.1 above 0.9.0 and describes the fixes from shipped tickets 0322–0328. The diff against v0.9.0 confirms older sections are unchanged. The remaining AC2 test checks release facts."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md both say '0.9.1, a public preview'. The setup prompt retains the quoted semver:* install command. Both AC3 tests pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.9.1.md includes the bug-fix introduction, seven shipped fixes and their benefits, instructions to update each project, upgrade implications and the changelog link. It uses no personal names. All AC4 tests pass."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The passing figures test uses the existing calculation against the 0328 ship commit and checks README.md: 312 shipped, 16 cancelled, 13 minutes median, 2 rounds median and 152 first-round approvals. Version consistency passes. The supplied run reports 129 passes and no failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/release-0329.test.mjs",
        "issue": "The previous heading-order assertion and exact historical changelog comparison have both been removed.",
        "suggested_fix": "No further action required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The release is ready for the owner's merge decision. Its version, release notes and published figures match the shipped work. The brittle documentation tests have been removed, and all reported tests pass."
  }
}
```

</details>
