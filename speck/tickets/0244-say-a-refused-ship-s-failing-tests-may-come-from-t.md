---
id: "0244"
title: "Say a refused ship's failing tests may come from the ticket's own change"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-say-a-ship-s-failing-tests-may-be-the-ticket-s-own.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0241","0242"]                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T08:28:55.934Z"

---
# 0244 · Say a refused ship's failing tests may come from the ticket's own change

**Status:** 🔍 reviewing

## Problem
When the tests fail on a ticket merged with a base branch that has moved on, while the base branch's own tests pass, `speck ship` says the ticket and the base branch's newer changes "fail together". Since builds run only their own tests, the ticket's own change breaking another test is just as likely, so the message, and the review pack it reaches, can point at the wrong cause.

## Outcome
A ship refused this way names both possible causes.

## Acceptance criteria
1. When the tests fail on the ticket merged with the base branch as it is now, the base branch has new commits since the ticket's branch started, and the base branch's own tests pass, `speck ship`'s message says the tests failed on the ticket as it would land, because of the ticket's own change or because of it with the base branch's newer changes. It still names the failing tests, and says to merge the base branch's newer changes into the ticket, fix the failing tests, get it reviewed, then ship again.
2. The message no longer says "fail together". Everything else is as today: the exit codes (16 with `--auto`, otherwise 1), the message when the base branch hasn't moved on, and the message when the base branch's own tests fail too (exit 14).
3. The brief's description of `speck ship` says the same as AC1. No test that passed before this change fails, except checks of the "fail together" wording, which are changed to check AC1.

## Out of scope
- Renaming the build skill's "Tests fail together" steps, or changing what `speck run` does with exit 16.
- Telling the two causes apart.

## Notes
- The message is in `scripts/ship.mjs`, where `moved` is true (`e.together`). The brief's paragraph on `speck ship` is in `docs/brief.md`.
- Seen on 0223 (2026-10-16), whose own change broke an older panel test.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes. The build skill's "Tests fail together" step name and the changelog still use the old words, both out of scope.

## In plain words
When a ship is refused because the tests fail once the ticket is combined with newer work on the main line, while the main line's own tests pass, the message no longer blames the combination alone. It now says the failure may come from the ticket's own change, or from it together with the newer work, so whoever picks it up checks both. The failing tests and the steps to take are named as before. To see it, ship a ticket that breaks an older test after the main line has moved on.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
Follow-ups: none. The build skill's "Tests fail together" steps keep their name, as the ticket puts renaming them out of scope.

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
    "reviewed_sha": "61f66be6184aa9e99a90c8abe0703674ebe52d32",
    "thread_id": "01a143d5-99d3-7072-81da-29929b388340",
    "seconds": 20,
    "usage": {
      "input_tokens": 95744,
      "cached_input_tokens": 53760,
      "cache_write_input_tokens": 0,
      "output_tokens": 564,
      "reasoning_output_tokens": 0
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T08:30:54.518Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/ship.mjs:testFailure now names both possible causes, retains failing-test names and gives the required recovery steps. The passing 0244 AC1 integration test exercises this refusal through the CLI."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0244 AC2 integration tests check removal of 'fail together', exit 16 with --auto, the unchanged unmoved-base message and exit 14 when the base also fails. AC1 checks manual exit 1. Only the moved-base message changed in production code."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "docs/brief.md describes both causes and the recovery steps, verified by the passing 0244 AC3 test. The full recorded output confirms all 35 tests passed across the three relevant files; existing test changes update wording assertions without weakening behavioural checks."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The refusal now explains that failing tests may come from the ticket itself or its interaction with newer base-branch changes. It keeps the failing-test names and recovery instructions. Exit codes and other refusal messages remain unchanged. All 35 relevant tests passed; no blocking concerns found."
  }
}
```

</details>
