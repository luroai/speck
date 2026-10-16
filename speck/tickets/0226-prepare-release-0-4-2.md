---
id: "0226"
title: Prepare release 0.5.1                # one outcome, no "and"
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
after: ["0213","0214","0215","0216","0217","0218","0219","0220","0221","0222","0223","0224","0225","0236"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-16T03:10:56.254Z"
approved: "2026-10-16T03:14:26.331Z"

---
# 0226 · Prepare release 0.5.1

**Status:** 👍 approved

## Problem
The 0.5.1 tickets fix problems in what 0.4.0 shipped: the ship queue's messages, stopping and restarting builds, build timers, the reviewer's test summary, review packs and the panel. Anyone following the README's setup prompt still gets 0.5.0 without them.

## Outcome
speck is ready to be released as 0.5.1.

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1. `package.json` has version `0.5.1`, and `speck init` prints `speck 0.5.1`.
2. `CHANGELOG.md` has a 0.5.1 section above the 0.5.0 one. It describes, in plain English and under a few headings, what someone using speck will notice is fixed or changed since the `v0.5.0` tag, from the tickets shipped since. The 0.5.0 and 0.4.0 sections are unchanged.
3. The README's setup prompt names `v0.5.1`, and the README's and the brief's status lines say 0.5.1, a public preview, and the README says nothing about how speck builds, reviews or ships that the tickets shipped since `v0.5.0` have made untrue.
4. `docs/releases/v0.5.1.md` holds the notes for the GitHub release page: one short paragraph saying this is a patch release of fixes to what 0.4.0 shipped, the three to five fixes that matter most, how to install it (the setup prompt's command), anything that changes for someone upgrading from 0.5.0, and a link to the 0.5.1 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0210 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json`, the newest changelog section and the README's setup prompt match passes with 0.5.1.

## Out of scope
- Creating the `v0.5.1` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.5.1.md` when this lands on `main`.
- New features, which wait for 0.6.0.

## Notes
- Asked for 2026-10-15, for patch release 0.5.1. Follows 0210 (0.4.0) and 0106 (0.3.0).
- Waits for every ticket planned for this release (0213 to 0225), so they're in it.
- After it ships, check that the `v0.5.1` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.5.1 --target main --title "speck 0.5.1" --notes-file docs/releases/v0.5.1.md`.

- Failing before this build: none
- Changed 0236's tests that named 0.5.0 as the current version to check the current version instead, and its figures test to read the README as 0236 shipped it, as 0236 did for 0210, so they keep passing with 0.5.1.
- Also fixed two README command rows the tickets since v0.5.0 made untrue: `run` now says one at a time unless you raise `max_parallel_builds` (0225; this covers the inbox idea `speck/ideas/2026-10-15-say-in-the-readme-s-run-row-that-more-builds-can-run.md`), and `stop` keeps a branch only once the build had started (0219).
- Self-check: reworded the changelog's review-round line to say "the last round's findings" rather than a fixed round number.

## In plain words
speck is ready to go out as version 0.5.1, a release of fixes to what came before, such as quicker stopping of builds, timers that leave out waiting and clearer messages in the panel and review packs. The changelog has a new 0.5.1 section listing them, the release page's notes are written, and the setup prompt in the README now installs 0.5.1. The README's "Built with speck" figures are brought up to date: 223 tickets shipped. To see it, read the top of the changelog and the new release notes. Once it lands, check that the 0.5.1 release page appears on GitHub.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 210,784
- Elapsed since build started: 4 min
- Changed lines: 76 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none. The inbox idea `speck/ideas/2026-10-15-say-in-the-readme-s-run-row-that-more-builds-can-run.md` is now done by this ticket's README `run` row change, so it can be filed as done when the inbox is next triaged.
- After it ships: check the `v0.5.1` tag and GitHub release appeared (0240's workflow).

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
    "reviewed_sha": "75eadf51c633b937b32d312e2bccda7c65ac794b",
    "thread_id": "01a142b3-6f11-78b2-95a9-cab8498a1a60",
    "seconds": 40,
    "usage": {
      "input_tokens": 209533,
      "cached_input_tokens": 156800,
      "cache_write_input_tokens": 0,
      "output_tokens": 1251,
      "reasoning_output_tokens": 44
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T03:14:17.464Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.5.1; scripts/install.mjs cmdInit prints the package version. Both AC1 tests passed, including invoking init."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md adds 0.5.1 above 0.5.0 and covers shipped tickets 0213–0225 under five headings. Existing sections are unchanged; the coverage and section-hash tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md state 0.5.1, a public preview. The setup prompt uses v0.5.1, and run/stop descriptions reflect 0225 and 0219. All three AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.5.1.md contains a short introduction, five principal fixes, installation and upgrade instructions, and the correct changelog link. Claims match shipped tickets and installation code; no person's name appears. AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independently recalculated current done-ticket figures: 223 shipped, 16 cancelled, 14 median minutes, 1 median review round, 112 first-round approvals; README matches. The supplied full output confirms all 25 targeted tests passed. Updated 0236 tests preserve historical checks while allowing the new release."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The release version, setup instructions, changelog and release notes consistently describe 0.5.1. The claims match the shipped fixes, the published figures match the ticket records, and all 25 targeted tests passed. Ready for the owner's merge decision."
  }
}
```

</details>
