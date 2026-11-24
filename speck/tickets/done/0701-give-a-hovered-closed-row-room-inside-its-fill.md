---
id: "0701"
title: "Give a hovered closed row room inside its fill"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-give-a-hovered-closed-row-room-inside-its-fill.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T11:55:01.303Z"
approved: "2026-11-24T12:17:02.848Z"
finished: "2026-11-24T12:27:36.462Z"

---
# 0701 · Give a hovered closed row room inside its fill

**Status:** ✅ done

## Problem
On a computer with a mouse, a closed Plan or Capture row under the pointer gets the raised fill, but its text runs right to the fill's edges. Since 0614 an open row's fill reaches past its text, so a hovered closed row looks cramped beside it.

## Outcome
A hovered closed row's fill reaches 12 px past its text on each side, as an open row's does.

## Acceptance criteria
1. On a device with hover, a closed Plan or Capture row under the pointer shows its raised fill reaching 12 px beyond the left and right edges of its text, as an open row's does.
2. Hovering a closed row doesn't move its title or any of its text: their positions are the same with and without the pointer over it.
3. On a touch screen (no hover), closed rows look as they do today.
4. No test that passed before this change fails.

## Out of scope
- Open rows, which 0614 already changed.
- How linked tickets are lit: 0728 replaces the ring with this fill.

## Notes
- The fill comes from `.item:hover` in `templates/panel-cards.css`. 0614 gave `.item.row.open` a pair of side shadows, and an `::after` ring because `.item.hl`'s box-shadow replaces any side shadows.

- Failing before this build: none
- Self-check: no changes
- Pictures: none, because the change is a hover fill and the pictures are skipped for this quick build

## In plain words
On a computer, a closed Plan or Capture row under the pointer now has its raised background reach a little past its text on each side, as an open row's does. Hover over a closed row to see it. Touch screens look as before.


## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Closed Plan rows with linked tickets receive .hl when hovered, which excludes them from the new side fill.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 237,487
- Elapsed since build started: 22 min
- Changed lines: 2 (limit 5000)
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
    "reviewed_sha": "b9378443e847383be4f28bd99d742876feabfc24",
    "session": "fresh",
    "thread_id": "01a20d78-e1ca-7be1-b7c3-48b1a80d8c44",
    "builder_response": "Round 1: added a hover rule for closed rows (side box-shadows of 12px in --raise, inside the hover media query). Ran test/panel-0701.test.mjs plus the related files; panel start-up timeouts under load passed when re-run alone.\n",
    "seconds": 32,
    "usage": {
      "input_tokens": 116957,
      "cached_input_tokens": 81152,
      "cache_write_input_tokens": 0,
      "output_tokens": 796,
      "reasoning_output_tokens": 53
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 35805,
      "cached": 81152,
      "write": 0,
      "output": 796
    },
    "cost_usd": 0.0876852,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T12:13:06.862Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "templates/panel-cards.css excludes .hl rows from the new hover rule. templates/panel.js lightUp() adds .hl to the hovered Plan ticket itself when it has linked tickets, so those closed rows retain the cramped fill. The AC1 test permits this exclusion and misses the case."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The new rule changes only box-shadow, which does not affect text layout. test/panel-0701.test.mjs AC2 checks that the rule adds no layout-changing declarations."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The new side shadows are inside @media (hover: hover). test/panel-0701.test.mjs AC3 checks that the closed-row hover rule does not appear outside that query."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The supplied test results report 243 passes, zero failures and three skips. The change leaves existing tests and open-row rules unchanged."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-cards.css",
        "issue": "Closed Plan rows with linked tickets receive .hl when hovered, which excludes them from the new side fill. The requested spacing therefore works only for some Plan rows.",
        "suggested_fix": "Extend the hovered closed-row fill to .hl rows while preserving their existing linked-ticket ring and lighting behaviour. Add coverage for a hovered closed Plan row with linked tickets; the current selector regex accepts the exclusion that causes this bug.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change gives Capture rows and unlinked Plan rows the extra space without moving text or changing touch behaviour. Plan rows with linked tickets still have the cramped fill when hovered. Fix that case while preserving the existing linked-ticket ring."
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
    "reviewed_sha": "58abfa53bdab01d2e3b1b894b3c4297730329757",
    "session": "continued",
    "thread_id": "01a20d78-e1ca-7be1-b7c3-48b1a80d8c44",
    "builder_response": "Round 2: hovered closed rows lit by a link (.hl) now get the side fill plus their existing inset ring; test added. Ran test/panel-0701.test.mjs and the checks.\n",
    "seconds": 112,
    "usage": {
      "input_tokens": 236132,
      "cached_input_tokens": 195328,
      "cache_write_input_tokens": 0,
      "output_tokens": 1355,
      "reasoning_output_tokens": 58
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 4999,
      "cached": 114176,
      "write": 0,
      "output": 559
    },
    "cost_usd": 0.0270056,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T12:16:59.557Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-cards.css now gives all hovered closed rows 12 px side shadows, including .hl rows while retaining their inset ring. Both AC1 tests in test/panel-0701.test.mjs passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Both hover rules change only box-shadow, which leaves text positions unchanged. The AC2 test checks for layout-changing declarations and passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Both new rules remain inside @media (hover: hover), leaving devices without hover unchanged. The AC3 test passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The supplied round-two results report 147 passes, zero failures and three skips. The CSS change preserves existing open-row and linked-ring behaviour."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-cards.css",
        "issue": "Hovered closed Plan rows with linked tickets previously missed the extended fill.",
        "suggested_fix": "Addressed: highlighted closed rows now receive the side fill together with their existing inset ring, with a regression test.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Hovered closed Plan and Capture rows now have the extra space around their text, including rows with linked tickets. Text stays put, touch behaviour is unchanged, and the reported checks pass. The previous blocking issue is resolved."
  }
}
```

</details>
