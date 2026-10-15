---
id: "0203"
title: "Say when an approved ticket waits for Auto-build to ship it"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-15-say-an-auto-ship-ticket-waits-for-speck-run-when-it-s-off.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0201"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T14:44:29.016Z"
approved: "2026-10-15T14:54:33.222Z"

---
# 0203 · Say when an approved ticket waits for Auto-build to ship it

**Status:** 👍 approved

## Problem
Since 0194 only `speck run`'s ship queue ships approved tickets that `auto_ship` covers. When `speck run` is off, nothing will ship them, yet the panel says "Approved · waiting to ship" with the builder badge at work, so the user waits for a ship that never starts.

## Outcome
When Auto-build is off, an approved ticket that only `speck run` would ship says it's waiting for Auto-build, in purple, as something waiting for the user.

## Acceptance criteria
1. While `speck run` is off, an approved ticket that `auto_ship` covers, with no ship running, says "Approved · turn on Auto-build to ship it", in purple like other tickets waiting for the user, and its builder badge stands still.
2. Once `speck run` is on again, the same ticket says "Approved · waiting to ship" in the normal text colour, with its badge moving, as 0196 set out.
3. A ticket that's shipping, by anyone, shows as shipping whether `speck run` is on or off.
4. An approved ticket that `auto_ship` doesn't cover looks as it does today.
5. No test that passed before this change fails.

## Out of scope
- Starting `speck run` from the ticket.
- The header button (0199).

## Notes
- Asked for 2026-10-15, for release 0.4.0.
- Failing before this build: none
- Self-check: no changes
- Decided 2026-10-15: purple, because the user needs to act (turn Auto-build on). This settles the note's open question.
- `doing()` and `ship_waiting` in `templates/panel.html` (0196); `state.run.on` says whether `speck run` is on.
- Builds after 0201: all three change the Build list's cards in `templates/panel.html`.

## In plain words
When Auto-build is off, an approved ticket that only Auto-build would ship now says "Approved · turn on Auto-build to ship it", in purple, with its builder waiting, so you know it's waiting for you rather than about to ship. Turn Auto-build on and the same card goes back to "Approved · waiting to ship", with its builder at work. To see it, approve a ticket that auto-ship covers while Auto-build is off, then switch Auto-build on and off. Tickets being shipped, and tickets that auto-ship doesn't cover, look as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 137,226
- Elapsed since build started: 10 min
- Changed lines: 13 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Five older panel tests (0167, 0168, 0171, 0172, 0196) now give their board Auto-build on, since they describe tickets the ship queue will ship; their assertions are unchanged.
- Follow-ups: none new. The 0128 AC4 test failed once and passed on its retry during this build: already covered by ticket 0207 and speck/ideas/done/2026-10-15-fix-the-0128-ac4-test-that-fails-by-chance.md.

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
    "reviewed_sha": "efd984220454a7bb7712fe96c760fb64a45d36d3",
    "thread_id": "01a1400e-2560-7f02-95fa-7ab2f31d8d12",
    "seconds": 29,
    "usage": {
      "input_tokens": 136484,
      "cached_input_tokens": 94336,
      "cache_write_input_tokens": 0,
      "output_tokens": 742,
      "reasoning_output_tokens": 69
    },
    "tests": {
      "failing": 0,
      "second_try": [
        "0128 AC4: off the base branch, or with speck run already on, the panel gets speck run's own error"
      ]
    },
    "saved_at": "2026-10-15T14:54:20.025Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html panelModel() sets run_waiting and to_ship when Auto-build is off; doing() supplies the requested sentence and stationary waiting state. Passing 0203 AC1 tests check the rendered sentence, purple classes and waiting badge."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelModel() restores ship_waiting when state.run.on is true. Passing 0203 AC2 tests check normal colour, moving shipping badge and the live transition from off to on."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "doing() gives shipping precedence. Passing 0203 AC3 test exercises manual and automatic shipping with Auto-build both on and off."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "run_waiting requires auto_ship === true. Passing 0203 AC4 test compares rendered cards for uncovered tickets and older records with Auto-build on and off."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0203-tests.txt: 1,916 passed, three skipped, one initial failure; the failed 0128 test passed on the recorded rerun. All six 0203 tests passed. Existing test changes add the explicit Auto-build-on fixture without weakening assertions."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Approved tickets now clearly ask the user to turn on Auto-build, using purple and a waiting badge. Turning it on restores the shipping queue display. Active shipping and tickets requiring manual shipping retain their behaviour. No blocking issues found; one unrelated test passed on retry."
  }
}
```

</details>
