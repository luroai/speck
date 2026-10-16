---
id: "0243"
title: "Prepare release 0.5.2"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-say-in-the-brief-that-releases-publish-themselves.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0241","0242","0244","0245","0246"]                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T08:40:19.936Z"

---
# 0243 · Prepare release 0.5.2

**Status:** 🔍 reviewing

## Problem
The 0.5.2 tickets cut needless stops: a re-review after an approval gets rounds of its own (0241), a ticket one finding from approval at the round limit gets one extra round by itself (0242), a refused ship names both possible causes of its failing tests (0244), `speck run`'s Claude Code builds can't run commands in the background (0245), and a test that fails by chance no longer does (0246). Anyone following the README's setup prompt still gets 0.5.1 without them.

## Outcome
speck is ready to be released as 0.5.2.

## Acceptance criteria
1. `package.json` has version `0.5.2`, and `speck init` prints `speck 0.5.2`.
2. `CHANGELOG.md` has a 0.5.2 section above the 0.5.1 one. It describes, in plain English, what someone using speck will notice is fixed or changed since the `v0.5.1` tag, from the tickets shipped since. The 0.5.1 and 0.5.0 sections are unchanged.
3. The README's setup prompt names `v0.5.2`, the README's and the brief's status lines say 0.5.2, a public preview, and the README says nothing about how speck builds, reviews or ships that the tickets shipped since `v0.5.1` have made untrue.
4. `docs/releases/v0.5.2.md` holds the notes for the GitHub release page: one short paragraph saying this is a patch release that cuts needless stops in builds and ships, each fix in it and why it matters, how to install it (the setup prompt's command), anything that changes for someone upgrading from 0.5.1, and a link to the 0.5.2 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The brief's "Releases" section says that when a release ticket lands on `main`, a workflow tags the version and publishes its GitHub release from `docs/releases/v<version>.md`, so a release ticket must add that file, and it no longer says the maintainer tags and pushes by hand.
6. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0226 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json`, the newest changelog section and the README's setup prompt match passes with 0.5.2.

## Out of scope
- Creating the `v0.5.2` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.5.2.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- New features, which wait for 0.6.0.

## Notes
- Asked for 2026-10-16, for patch release 0.5.2. Follows 0226 (0.5.1).
- Waits for every ticket planned for this release (0241, 0242, 0244, 0245, 0246), so they're in it.
- AC5 is from `speck/ideas/done/2026-10-15-say-in-the-brief-that-releases-publish-themselves.md`, folded in here since this ticket changes the brief anyway.
- After it ships, check that the `v0.5.2` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.5.2 --target main --title "speck 0.5.2" --notes-file docs/releases/v0.5.2.md`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Built from main at `speck(0245): Stop speck run's Claude Code builds running commands in the background`: 229 shipped, 16 cancelled, 14 minutes median, 1 round median, 115 approved in the first round.
- 0106's Releases check named the old "maintainer creates and pushes the tag" wording, which AC5 removes, so it now checks the workflow wording. 0226's checks that named 0.5.1 as the current version now check the current version, as 0226 did for 0236.
- Self-check: no changes

## In plain words
speck is ready to go out as version 0.5.2. Anyone who follows the README's setup prompt once it ships gets the five fixes made since 0.5.1: re-reviews after an approval get their own rounds, a ticket one problem from approval gets one extra round by itself, a refused ship names both possible causes of its failing tests, builds started by speck run can't leave commands running in the background, and a test that failed by chance no longer does. The changelog, the release notes and the README's figures (229 tickets shipped) are up to date, and the brief now says releases tag and publish themselves.

To see it, read the new 0.5.2 section at the top of the changelog. After it ships, check that the v0.5.2 release page appeared on GitHub; if it didn't, the ticket's Notes say how to publish it by hand.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
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
    "reviewed_sha": "ffb115560dd8120a78a9fb9e1a6d750d00fa3ca0",
    "thread_id": "01a143e0-dd0d-7eb1-bf8e-b3528794da59",
    "seconds": 30,
    "usage": {
      "input_tokens": 154966,
      "cached_input_tokens": 106880,
      "cache_write_input_tokens": 0,
      "output_tokens": 954,
      "reasoning_output_tokens": 20
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T08:43:22.774Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.5.2. Passing 0243 AC1 tests check the version and exercise speck init's printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md adds 0.5.2 first and describes the five shipped fixes. Passing AC2 tests check coverage, ordering and unchanged hashes for 0.5.1 and 0.5.0."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md name 0.5.2 as a public preview; the setup prompt uses v0.5.2. Passing AC3 tests cover these changes, and inspection found no README claim invalidated by the shipped tickets."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.5.2.md includes the short introduction, five fixes and their benefits, installation command, upgrade guidance and changelog link. Claims match shipped tickets and implementation, including preservation of existing environment settings. Passing AC4 tests cover structure and link; the notes contain no person's name."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The brief's Releases section describes automatic tagging and publishing from the required release notes file, consistent with .github/workflows/release.yml. Passing AC5 and updated 0106 tests check this wording."
      },
      {
        "id": 6,
        "status": "pass",
        "evidence": "Independently recalculated figures from the current done tickets: 229 shipped, 16 cancelled, 14 minutes median, one round median and 115 first-round approvals, matching README.md. All 37 targeted tests passed, including version consistency. Existing test updates preserve historical release checks while accommodating the new release."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The release preparation meets all six criteria. The version, setup prompt, changelog and release notes agree, the notes accurately describe the shipped fixes, and the README figures match the tickets. All 37 targeted tests passed. No blocking concerns found."
  }
}
```

</details>
