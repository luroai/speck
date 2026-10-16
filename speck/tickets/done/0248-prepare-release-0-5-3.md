---
id: "0248"
title: "Prepare release 0.5.3"                # one outcome, no "and"
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
after: ["0247"]                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T10:07:12.997Z"
approved: "2026-10-16T10:10:10.131Z"
finished: "2026-10-16T10:12:08.181Z"

---
# 0248 · Prepare release 0.5.3

**Status:** ✅ done

## Problem
0247 makes `speck run` switch to its new code by itself once it's idle, so shipped changes to `speck run` go live without anyone turning it off and on. Anyone following the README's setup prompt still gets 0.5.2 without it.

## Outcome
speck is ready to be released as 0.5.3.

## Acceptance criteria
1. `package.json` has version `0.5.3`, and `speck init` prints `speck 0.5.3`.
2. `CHANGELOG.md` has a 0.5.3 section above the 0.5.2 one. It describes, in plain English, what someone using speck will notice is fixed or changed since the `v0.5.2` tag, from the tickets shipped since. The 0.5.2 and 0.5.1 sections are unchanged.
3. The README's setup prompt names `v0.5.3`, the README's and the brief's status lines say 0.5.3, a public preview, and the README says nothing about how speck builds, reviews or ships that the tickets shipped since `v0.5.2` have made untrue.
4. `docs/releases/v0.5.3.md` holds the notes for the GitHub release page: one short paragraph saying this is a patch release so that `speck run` runs its newest code by itself, each fix in it and why it matters, how to install it (the setup prompt's command), anything that changes for someone upgrading from 0.5.2, and a link to the 0.5.3 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0243 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json`, the newest changelog section and the README's setup prompt match passes with 0.5.3.

## Out of scope
- Creating the `v0.5.3` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.5.3.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- New features, which wait for 0.6.0.

## Notes
- Asked for 2026-10-16, for patch release 0.5.3. Follows 0243 (0.5.2).
- Waits for every ticket planned for this release (0247), so it's in it.
- Upgrading from 0.5.2: a `speck run` that's already on is still running 0.5.2's code, which can't switch, so it has to be turned off and on once after upgrading. Say so in the release notes.
- After it ships, check that the `v0.5.3` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.5.3 --target main --title "speck 0.5.3" --notes-file docs/releases/v0.5.3.md`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Built from main at `speck(0247): Switch speck run to its new code once it's idle`: 231 shipped, 16 cancelled, 14 minutes median, 1 round median, 116 approved in the first round.
- 0243's checks that named 0.5.2 as the current version now check the current version, and its figures check the README as 0.5.2 shipped it, as 0243 did for 0226.
- Self-check: no changes

## In plain words
speck is ready to go out as version 0.5.3. Anyone who follows the README's setup prompt once it ships gets the one change made since 0.5.2: `speck run` now picks up new versions of speck by itself once nothing it's building or shipping is still running, instead of needing to be turned off and on. The changelog, the release notes and the README's figures (231 tickets shipped) are up to date.

To see it, read the new 0.5.3 section at the top of the changelog. Worth keeping an eye on: a `speck run` already on when you upgrade is still on the old version, so it needs turning off and on once; the release notes say so. After it ships, check that the v0.5.3 release page appeared on GitHub; if it didn't, the ticket's Notes say how to publish it by hand.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 186,712
- Elapsed since build started: 3 min
- Changed lines: 46 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none.

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
    "reviewed_sha": "5929c0347c710d9ce0de96b2470e190b40dce9b3",
    "thread_id": "01a14430-1148-7a00-b777-4bcfcbf48727",
    "seconds": 39,
    "usage": {
      "input_tokens": 185469,
      "cached_input_tokens": 141184,
      "cache_write_input_tokens": 0,
      "output_tokens": 1243,
      "reasoning_output_tokens": 21
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T10:10:02.099Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.5.3. The passing test '0248 AC1: speck init prints speck 0.5.3' runs the actual CLI and checks its output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md puts 0.5.3 first and describes shipped ticket 0247, the only implementation ticket shipped since v0.5.2. Passing AC2 tests check ordering, coverage and unchanged hashes for 0.5.2 and 0.5.1."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md name 0.5.3 as a public preview; the setup prompt uses v0.5.3. Passing AC3 tests cover these changes. Reading the README against ticket 0247 revealed no newly false workflow claims."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.5.3.md covers the patch's purpose, idle switching, fallback, paused builds, installation and the required one-time restart when upgrading. Claims match shipped ticket 0247; no person's name appears. Passing AC4 tests check structure, commands, upgrade guidance and changelog link."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independent calculation from the current done tickets confirms 231 shipped, 16 cancelled, 14 minutes median, 1 review round median and 116 first-round approvals. The recorded run passed all 50 tests across the four reported files, including release consistency. Historical 0243 checks remain meaningful for that release."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Ready for the owner's merge decision. The version, setup prompt and release notes consistently describe 0.5.3 and explain the one-time restart needed when upgrading. The published figures match the ticket records, and all 50 reported tests passed. No blocking issues found."
  }
}
```

</details>
