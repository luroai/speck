---
id: "0166"
title: "Leave waiting time out of a ticket's build time"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T13:53:06.479Z"

---
# 0166 · Leave waiting time out of a ticket's build time

**Status:** 🔍 reviewing

## Problem
A ticket's build time still counts time spent waiting for the user. 0139 stopped the clock at approval, but a ticket that blocks with a question keeps counting until the user answers: 0151 blocked overnight, so its time includes hours nobody was building, and the Shipped section's median minutes are skewed by it. The same goes for a build the user pauses.

## Outcome
A ticket's build time counts only the time an agent was working on it: from the start of its build to its approval, minus any time it spent blocked or paused.

## Acceptance criteria
1. When a ticket's status becomes `blocked`, speck records the time; when it leaves `blocked`, speck adds the time it spent blocked to a running total in the ticket's frontmatter (for example `waited_seconds:`), so a ticket that blocks more than once adds each stretch.
2. When a build is paused (`speck pause`) and later played (`speck play`), the time it spent paused is added to the same total.
3. The Build queue's timer for a ticket shows its build time without the waiting: it stops counting while the ticket is blocked or paused, and carries on from the same figure when it resumes.
4. The Shipped section's minutes for a ticket, and the median minutes, use start to approval minus the total waited. A ticket with no record of waiting (shipped before this change) shows its figure as today.
5. No test that passed before this change fails.

## Out of scope
- Working out the waiting for tickets already shipped, such as 0151, from their history.
- Time between Set ready and the build starting, which isn't counted today either.

## Notes
- `started` is set when status becomes `building` and `approved` when it becomes `approved` (`writeField` in `scripts/core.mjs`, 0139). The Shipped minutes come from `panelModel` in `templates/panel.html`; the queue timer from `startCounters` and `tickCounters`.
- A ticket can be resumed from blocked by `/speck-build`, by `speck run` resuming a killed build, or by hand, so the blocked time should be closed off by the status change itself, not by whatever resumed it.
- Reported 2026-10-14: "I just want that timer to be the true build time, not the total elapsed time."
- Failing before this build: none
- Self-check: an unreadable `blocked_at` is now cleared when the ticket leaves blocked, and a paused time that can't be written to the ticket no longer stops `speck play` (it plays and says the time wasn't recorded).

## In plain words
A ticket's build time now counts only the time an agent was working on it. While a ticket is blocked waiting for your answer, or its build is paused, the timer in the Build queue stops, and it carries on from the same figure once the build resumes. The minutes shown for each shipped ticket, and the median, leave that waiting out too.

To see it, block a ticket that's building (or pause its build) and watch its timer hold still, then resume it and watch it carry on. Tickets shipped before this change show the same minutes as before, since speck has no record of how long they waited. A build that stopped unexpectedly still counts its idle time until it's resumed; that's saved as a follow-up idea.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - Inbox: `speck/ideas/2026-10-14-stop-the-build-timer-while-a-stopped-build-waits.md` (a build that stopped or exited mid-build still counts its idle time).
  - Known limit: a status changed by editing the ticket file by hand, rather than through speck, records no blocked time.
  - Tidy-up: `scripts/run.mjs` is now exactly at the 600-line limit 0078 sets, so the next change to it will need to move something out first.

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
    "reviewed_sha": "8f586975c6fe739881c9cfbc73a43f6370dd19c2",
    "thread_id": "01a13aba-eb05-7c30-b9cc-42b301043522",
    "seconds": 60,
    "usage": {
      "input_tokens": 153606,
      "cached_input_tokens": 107776,
      "cache_write_input_tokens": 0,
      "output_tokens": 1051,
      "reasoning_output_tokens": 145
    },
    "saved_at": "2026-10-14T14:05:50.588Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/core.mjs waitFields and the passing AC1 tests cover repeated blocking and resumption through writeField. However, scripts/speck.mjs cmdCancel changes a blocked ticket to cancelled directly with setField, bypassing waitFields: its blocked stretch is not added and blocked_at remains."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/run.mjs countPause/playBuild add paused time through addPaused and commit the ticket. Passing AC2 tests exercise actual pause/play commands, repeated pauses, stopping while paused and write failure."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html panelModel subtracts waited_seconds and supplies held_at; render excludes held timers from startCounters. Passing AC3 tests exercise the rendered timers while building, blocked and paused, and check the resumed figure."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html panelModel subtracts waited_seconds before calculating shipped minutes and the median. Passing AC4 tests cover waiting, legacy tickets without waiting records and invalid totals."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The full /tmp/speck-0166-tests.txt reports 1509 tests, 1506 passed, zero failed and three skipped. Existing tests were not changed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "cmdCancel bypasses the new waiting bookkeeping. Cancelling a blocked ticket leaves blocked_at populated and does not add its blocked stretch to waited_seconds, contrary to criterion 1's requirement whenever a ticket leaves blocked.",
        "suggested_fix": "Apply waitFields when cmdCancel changes the status, preserving the cancellation fields. Add a command-level test that cancels a blocked ticket and verifies the accumulated waiting and cleared blocked_at.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The timers now exclude recorded blocked and paused time, and the full test suite passes. One status transition was missed: cancelling a blocked ticket does not finish recording its waiting time. Fix that path before merge."
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
    "reviewed_sha": "d1626cc4aebbbee82632ca46faf1cc6bfff4b924",
    "thread_id": "01a13aba-eb05-7c30-b9cc-42b301043522",
    "seconds": 38,
    "usage": {
      "input_tokens": 255790,
      "cached_input_tokens": 201984,
      "cache_write_input_tokens": 0,
      "output_tokens": 1716,
      "reasoning_output_tokens": 145
    },
    "saved_at": "2026-10-14T14:09:02.901Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/core.mjs writeField/waitFields record and accumulate blocked stretches. scripts/speck.mjs cmdCancel now also calls waitFields. Passing AC1 tests cover repeated blocks, resumption, cancellation and missing or invalid timestamps."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/run.mjs countPause/playBuild accumulate paused time using addPaused. Passing AC2 tests exercise pause/play commands, repeated pauses, stopping while paused and recording failure."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html panelModel subtracts accumulated waiting and freezes timers at held_at; render excludes held timers from startCounters. Passing AC3 tests verify counting, blocked and paused timers, and the resumed figure."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html panelModel subtracts waited_seconds before calculating shipped minutes and their median. Passing AC4 tests cover accumulated waiting, legacy tickets and invalid totals."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0166-tests.txt: 1510 tests, 1507 passed, zero failed and three skipped. Existing tests were not weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Cancelling a blocked ticket previously bypassed waiting bookkeeping. cmdCancel now records the blocked stretch and clears blocked_at.",
        "suggested_fix": "Completed; the passing command-level cancellation test verifies the fix and preservation of the cancellation reason.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Build timers and shipped-time statistics now exclude recorded blocked and paused time. The missed cancellation path is fixed, all acceptance criteria pass, and the full suite has no failures. Ready for the owner's merge decision."
  }
}
```

</details>
