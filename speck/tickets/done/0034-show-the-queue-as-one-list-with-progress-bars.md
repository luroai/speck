---
id: "0034"
title: "Show the queue as one list with progress bars"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0033"]                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T13:12:49.215Z"
finished: "2026-10-09T13:22:44.701Z"

---
# 0034 · Show the queue as one list with progress bars

**Status:** ✅ done

## Problem
The queue splits tickets into Needs you, Running and Up next, so a ticket jumps between groups as it moves, and nothing shows how far a build has got. A progress bar per ticket makes the pipeline readable at a glance.

## Outcome
The queue is one list in which every in-flight ticket has a progress bar, tickets that need you are red, and ready tickets show as queued.

## Acceptance criteria
1. The queue is a single list with no Needs you, Running or Up next headings: in-flight tickets (`building`, `reviewing`, `blocked`, `approved`) first, then `ready` tickets, each group in the JSON's order.
2. Every ticket in the queue has a five-step bar: Build, Self-check, Review, Approve, Ship. Build is done once `self_check` is set or the ticket has a review round. Self-check is done once the ticket has a review round, or `self_check` is set and the status is `reviewing`. Review is done when the status is `approved`. Approve is done when the status is `approved`, and Ship is then the current step. Otherwise the current step is the first one not done. While a ticket has review rounds, the Review step reads "Review <n>", where n is its latest round number.
3. A `blocked` ticket is shown in red (its row's left edge and its current step) with its blocked question under it. No other ticket is red.
4. A `ready` ticket shows "Queued" and its bar with no step done or current, plus "waiting on <ids>" when `waiting_on` isn't empty.
5. Each in-flight ticket shows its worktree path when it has one, and the whole minutes since `started` when that's set.

## Out of scope
- Shaping (0033) and Shipped (0035).
- Any write action, including reordering or answering a blocked question.
- Live agent activity.

## Notes
- Design reference: the progress bars in `docs/panel-mockup.html`.
- Uses `self_check` from 0033, so it builds after 0033.
- Approved tickets aren't red: with `auto_ship` on they ship within seconds. Their bar shows Ship as the current step.
- Self-check: a high-risk tag in the queue now uses the warning colour rather than red, so only a blocked ticket is red there (Shaping is unchanged). Also checked an empty `self_check`, a missing or `null` round number, an invalid or future `started` and a blocked ticket with no question. The 0031 tests that expected the Needs you, Running and Up next groups now expect the single list.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 An approved ticket without review rounds shows Build (or Self-check when self_check exists) as current instead of Ship.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 538,571
- Elapsed since build started: 9 min
- Changed lines: 65 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up idea: the `.group` CSS rules in `templates/panel.html` are now unused and could be removed.
- Follow-up idea: an approved ticket with no review rounds shows Ship as current with Build and Self-check not done, which can't happen through `/speck-build` but looks odd if a status is set by hand.

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
    "reviewed_sha": "85b6528e0fac5b9d26f66a00cc3342198651eff8",
    "thread_id": "01a120d0-e916-7050-a9a3-8346bdb1f250",
    "seconds": 39,
    "usage": {
      "input_tokens": 177875,
      "cached_input_tokens": 110720,
      "cache_write_input_tokens": 0,
      "output_tokens": 882,
      "reasoning_output_tokens": 51
    },
    "saved_at": "2026-10-09T13:19:23.720Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html panelModel() and render() produce one queue, preserving JSON order within in-flight and ready groups. The 0034 AC1 model and DOM test exercises this."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "progress() selects the first incomplete step even for approved tickets. Independently executing the repository model with status approved, rounds [] and self_check null returns Build current and Ship inactive. The AC2 tests cover approved tickets only with rounds."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "queueItem() applies blocked styling only to blocked tickets; CSS colours the left edge and current step red and overrides high-risk queue tags to warning colour. The 0034 AC3 test checks rendering, question text and CSS."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "progress() clears all step states for ready tickets; queueItem() renders Queued and waiting_on ids. The 0034 AC4 test exercises both cases through the page script."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "panelModel() calculates whole elapsed minutes for in-flight tickets; queueItem() renders minutes and available worktree paths. The 0034 AC5 model and DOM test covers these behaviours."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "An approved ticket without review rounds shows Build (or Self-check when self_check exists) as current instead of Ship. Criterion 2 explicitly requires Ship to be current when approved. This also contradicts product.md.",
        "suggested_fix": "Select Ship as the current step whenever status is approved. Add model and rendered-page regression coverage for approved tickets without rounds, both with and without self_check.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The queue description otherwise matches the implementation, but its claim that Ship is current for approved tickets is false when review rounds are absent."
    },
    "escalation_question": "",
    "summary": "The single queue, blocked styling, queued labels and elapsed-time details are implemented with meaningful tests. One progress-bar edge case needs fixing: approved tickets without review history appear to still be building instead of waiting to ship."
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
    "reviewed_sha": "6e6cb9e6bf39d058fd1542a5eda45ccefe88efa2",
    "thread_id": "01a120d0-e916-7050-a9a3-8346bdb1f250",
    "seconds": 33,
    "usage": {
      "input_tokens": 358185,
      "cached_input_tokens": 264832,
      "cache_write_input_tokens": 0,
      "output_tokens": 1629,
      "reasoning_output_tokens": 51
    },
    "saved_at": "2026-10-09T13:21:25.265Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html panelModel() and render() retain one queue with in-flight tickets before ready tickets, preserving JSON order. The 0034 AC1 model and DOM test passes in the supplied output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "progress() implements the five-step states and latest review label, now explicitly selecting Ship for approved tickets. Independently executed checks pass for approved tickets without rounds, with and without self_check. Both 0034 AC2 tests include model and rendered-page regression assertions and pass in the supplied output."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "queueItem() and the queue CSS restrict red row edges and current steps to blocked tickets, render their question, and use warning colour for high-risk tags. The 0034 AC3 rendering and CSS test passes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "progress() leaves ready bars inactive; queueItem() renders Queued and non-empty waiting_on ids. The 0034 AC4 rendered-page test passes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "panelModel() floors elapsed minutes for in-flight tickets, and queueItem() renders available minutes and worktree paths. The 0034 AC5 model and rendered-page test passes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Approved tickets without review rounds previously showed Build or Self-check as current instead of Ship.",
        "suggested_fix": "Implemented: approved status now selects Ship explicitly, with model and rendered-page regression coverage for both self_check cases.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The queue description matches the implementation, including Ship being current for approved tickets regardless of earlier step completion."
    },
    "escalation_question": "",
    "summary": "The queue now shows one ordered list with progress bars, blocked questions, queued dependencies and elapsed time. The approved-ticket edge case is fixed and covered by meaningful regression tests. All five criteria pass, with no blocking concerns remaining."
  }
}
```

</details>
