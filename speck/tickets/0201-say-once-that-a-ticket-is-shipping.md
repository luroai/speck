---
id: "0201"
title: "Say once that a ticket is shipping"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0200"]              # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T14:32:01.715Z"

---
# 0201 · Say once that a ticket is shipping

**Status:** 🔍 reviewing

## Problem
While a ticket ships, its card in the Build list says so three times: "Shipping" beside the builder badge, the step name "Ship" under it, and a separate "Shipping… · 00:04" line below. Seen on 0197 on 2026-10-15.

## Outcome
A shipping ticket's card says it is shipping once, with how long the ship has been running.

## Acceptance criteria
1. While a ticket is shipping, by `speck run`'s queue, by auto-ship or by the user, its card shows "Shipping" once, beside the builder badge, followed on the same line by how long the ship has been running (for example "Shipping · 00:04"), counting up as today.
2. While it's shipping, the card shows no step name under that line and no separate "Shipping…" line.
3. A ship started from the review pack's Ship button that the server hasn't answered yet also shows "Shipping" only once.
4. Cards at every other stage look as they do today, and the build time on the right of the card is unchanged.
5. No test that passed before this change fails, except checks of the separate "Shipping…" line, which change to check AC1 and AC2.

## Out of scope
- The shipping animation (0172).
- The header button (0199).

## Notes
- Asked for 2026-10-15: "when a ticket is shipping, it says it 3 times.... not needed."
- In `templates/panel.html`: `doing()` gives "Shipping"; the step name comes from the card's step line (0168); the separate line is the `act shipping` element with `ship_counter`.
- Failing before this build: none
- AC2 and AC5: AC2 removes the step name under a shipping card, so the checks of that step name on shipping cards in the 0156 and 0168 tests change with it, as do the checks of the "Shipping…" line in the 0153 and 0196 tests. The 0156 and 0168 real-browser checks now look for the ship's time on the same line as "Shipping" (AC1) instead.
- Self-check: README and the brief still described the "Shipping…" line; both now say "Shipping" with how long. A test's exact " · 00:05" could miss by a second, so it matches any time.

## In plain words
While a ticket is being shipped, its card in the Build list now says "Shipping" just once, beside the builder, with a clock on the same line showing how long the ship has been running. The step name under it and the separate "Shipping…" line below are gone. To see it, ship an approved ticket from its review pack, or let `speck run` ship one, and watch its card. Right after you press Ship, before the ship has properly started, the card says "Shipping" without a clock for a moment. Cards at every other stage, and the build time on the right, are unchanged.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (tidy-up only, no inbox note): the 0133 test's check that the card no longer says "Shipping…" once a ship ends now always passes, since that line is gone; it could check for "Shipping" instead.

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
    "reviewed_sha": "ba6b638ce224761bd2d53ff4e6467910262d85a5",
    "thread_id": "01a14000-3738-7da1-bad5-2b00632afc3d",
    "seconds": 32,
    "usage": {
      "input_tokens": 154674,
      "cached_input_tokens": 107392,
      "cache_write_input_tokens": 0,
      "output_tokens": 831,
      "reasoning_output_tokens": 14
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T14:39:10.033Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html progressOf() places Shipping and ship_counter beside the badge; shipTime(), queueUpdate() and startCounters() update the relocated timer. Both 0201 AC1 tests passed. Passing 0156 and 0168 browser tests verify the same-line layout at mobile and desktop widths in both themes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "progressOf() omits the stage while shipping, and queueItem() no longer adds the separate Shipping line. The 0201 AC2 test checks both absences and passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "queueItem() passes the pending shippingId state to doing(). The passing 0201 AC3 test clicks Ship and holds the server response pending, verifying exactly one Shipping label and no stage."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The non-shipping branch of progressOf() retains the sentence and stage. The build counter rendering is unchanged. Both 0201 AC4 tests and the existing 0156/0168 layout tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0201-tests.txt: 1914 tests, 1911 passed, 3 skipped, zero failures. Changes to existing assertions follow the ticket's specified removal of shipping stages and the separate Shipping line."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Shipping cards now say “Shipping” once beside the builder badge, with the ship’s elapsed time counting up on the same line. The duplicate lines are removed, including while a Ship button request is pending. Other stages and build timers retain their behaviour. The full test run passed, and I found no blocking concerns."
  }
}
```

</details>
