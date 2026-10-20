---
id: "0339"
title: "Prepare release 0.10.1"                # one outcome, no "and"
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
after: ["0338"]                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T13:04:07.132Z"

---
# 0339 · Prepare release 0.10.1

**Status:** 🔍 reviewing

## Problem
0338 stops the panel turning a ticket red, and asking the user to ship it, while speck run is already handling a failed auto-ship. Anyone following the setup prompt, or updating speck on another machine, gets 0.10.0 without the fix.

## Outcome
speck is ready to be released as 0.10.1.

## Acceptance criteria
1. `package.json` has version `0.10.1`, and `speck init` prints `speck 0.10.1`.
2. `CHANGELOG.md` has a 0.10.1 section above the 0.10.0 one. It describes, in plain English, what someone using speck will notice is fixed or changed since the `v0.10.0` tag, from the tickets shipped since (checked by review). The 0.10.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.10.1, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.10.1.md` holds the notes for the GitHub release page: one short paragraph saying this is a bug-fix release, each fix in it and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.10.0, and a link to the 0.10.1 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.10.1.

## Out of scope
- Creating the `v0.10.1` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.10.1.md` when this lands on `main`.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-10-20 as a patch release. Follows 0336 (0.10.0).
- Covers every ticket shipped since `v0.10.0`: 0338, which it waits for (`after:`), and any other that ships before this is built.
- After it ships, check that the `v0.10.1` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.10.1 --target main --title "speck 0.10.1" --notes-file docs/releases/v0.10.1.md`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Covers every ticket shipped since `v0.10.0`: only 0338. 0337 shipped before 0.10.0 was built, and 0336 covered it.
- Built from main at `speck(0338): Keep a handed-back ticket out of red while speck run is handling it`: 322 shipped, 16 cancelled, 13 minutes median, 1.5 rounds median, 159 approved in the first round, worked out as 0307 did, with its figures test.
- 0336's checks that named 0.10.0 as the current version now check the current version, and its figures test checks only the figures 0.10.0 was built from, as 0336 did for 0329.
- Self-check: dropped a sentence from the release notes' upgrade list saying to reload the panel, which nothing in 0338 backs.
- Pictures: none, because only text changes: the README's status line and figures, which render as before.

## In plain words
speck is ready to go out as 0.10.1, a bug-fix release. Its one fix: when an automatic ship fails and speck run is already sorting it out, the ticket no longer turns red in the panel or asks you to ship it yourself. The changelog has a 0.10.1 section, and the release page's notes say what's fixed, how to update and the one new field in `speck status --json`. The README and the brief now say 0.10.1, and the README's "Built with speck" figures are up to date: 322 tickets shipped and 159 approved in the first review round. Once this lands, the release page should appear on GitHub by itself. Worth checking that it did: the ticket's Notes say how to publish it by hand if not.

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
    "reviewed_sha": "0a0fe9a6f6639c59cf2ecdbb4177ae1cd92ee34b",
    "thread_id": "01a1596b-699f-7753-bcd0-b0d5d06cda28",
    "seconds": 33,
    "usage": {
      "input_tokens": 97422,
      "cached_input_tokens": 70656,
      "cache_write_input_tokens": 0,
      "output_tokens": 936,
      "reasoning_output_tokens": 82
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T13:06:46.680Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.10.1. The passing release-0339 AC1 tests check the version and invoke speck init to verify its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 0.10.1 above 0.10.0 and describes the panel recovery states, retained failure message and handed_back field from shipped ticket 0338. Earlier sections are unchanged in the diff."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md say 0.10.1, a public preview. Passing AC3 tests check both versions and verify the setup prompt still installs the latest release."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.10.1.md explains the bug fixes, update command, per-project updates, upgrade implications and changelog link without naming anyone. Claims match ticket 0338 and the existing update and run-switch behaviour. AC4 tests cover the command, setting names and link."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independent calculation using builtWithSpeckFigures on the current done tickets returns 322 shipped, 16 cancelled, 13 minutes median, 1.5 rounds median and 159 first-round approvals, matching README.md. Reported checks passed with zero failures, including release-version consistency."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/release-0339.test.mjs",
        "issue": "The new test comparing the 0.10.0 and earlier changelog sections uses exact text equality against the tag. This locks document wording and fails on subsequent edits to those sections, contrary to the explicit review rule against document wording tests.",
        "suggested_fix": "Remove the exact-text test. Verify preservation of earlier changelog sections by reviewing the diff; retain tests of release facts such as versions, commands and links.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The release content accurately describes the shipped fix, the version and figures agree, and the reported checks pass. Before approval, remove one test that locks older changelog wording; the review rules explicitly prohibit such tests."
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
    "reviewed_sha": "828f20015f12da03b84b1101564cc36d98246cc6",
    "thread_id": "01a1596b-699f-7753-bcd0-b0d5d06cda28",
    "seconds": 18,
    "usage": {
      "input_tokens": 184574,
      "cached_input_tokens": 150400,
      "cache_write_input_tokens": 0,
      "output_tokens": 1496,
      "reasoning_output_tokens": 82
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T13:07:15.165Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json has version 0.10.1. Both passing AC1 tests verify the version and invoke speck init to check that it prints speck 0.10.1."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 0.10.1 above 0.10.0 and describes shipped ticket 0338's panel fixes and handed_back field. The diff confirms that 0.10.0 and earlier sections are unchanged. The passing AC2 test checks the release section and install command."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md both say 0.10.1, a public preview. Passing AC3 tests verify the versions and that the setup prompt retains the latest-release install command."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.10.1.md contains the bug-fix introduction, fixes and their benefit, update command to rerun in each project, upgrade implications and changelog link. Its claims match shipped ticket 0338 and existing update behaviour, and it names no person. Passing AC4 tests check commands, setting names and the link."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "README.md retains the independently verified figures: 322 shipped, 16 cancelled, 13 minutes median, 1.5 review rounds median and 159 first-round approvals. Both AC5 tests pass. The fresh reported run has 129 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/release-0339.test.mjs",
        "issue": "The exact-text comparison of older changelog sections has been removed. Preservation of those sections is now checked by review.",
        "suggested_fix": "Completed; no further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Release 0.10.1 is ready for the owner's merge decision. The notes accurately describe the shipped fix, the version and figures agree, and all reported checks pass. The test issue from round 1 is resolved."
  }
}
```

</details>
