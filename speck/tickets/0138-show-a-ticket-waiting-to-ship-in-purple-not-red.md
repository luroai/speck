---
id: "0138"
title: "Show a ticket waiting to ship in purple, not red"                # one outcome, no "and"
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
after: []                # ticket ids that must be done first
created: 2026-10-12
started: "2026-10-12T21:31:42.291Z"

---
# 0138 · Show a ticket waiting to ship in purple, not red

**Status:** 🔍 reviewing

## Problem
When an approved ticket's build has finished and the ticket is waiting for the user to ship it, the panel's queue shows its row in red, the colour it uses for blocked and broken builds. Nothing is wrong: the ticket is just waiting for the user's shipping decision, so the red sends a false alarm.

## Outcome
In the queue, an approved ticket waiting to ship is highlighted in purple, and red is kept for tickets that are blocked or whose build stopped before finishing.

## Acceptance criteria
1. In the queue, an approved ticket whose build has exited is shown in purple everywhere it is red today: the row's left border, the open row's background tint, the current step in its progress bar and its "Build finished without shipping" line. None of these is red.
2. The purple reads clearly against the background in both light and dark mode, and is visibly different from the panel's red and from its amber warning colour.
3. A blocked ticket, a ticket whose build stopped before finishing and a ticket whose build stopped unexpectedly look exactly as they do today, in red.
4. An approved ticket's Full ticket and Review pack buttons, and the Ship button in its review pack, work as before.
5. No test that passed before this change fails, except checks that an approved ticket with an exited build is shown in red, which are changed to check for purple.

## Out of scope
- Changing the "Build finished without shipping" wording.
- Colours anywhere other than the queue row of an approved ticket waiting to ship.
- How or when a ticket ships.

## Notes
- Today the red comes from `red: t.status === 'blocked' || exit_label !== null` in `templates/panel.html`, which includes an approved ticket's "Build finished without shipping".
- The panel already uses a purple for ideas (`--idea`). Reusing it or picking a new purple is the builder's call, as long as criterion 2 holds.
- Failing before this build: none
- Reuses the ideas purple (`--idea`, `--idea-bg` for the open tint), so no new colours.
- Self-check: no changes

## In plain words
In the panel's queue, a ticket that the reviewer has approved and that is just waiting for you to ship it is now marked in purple instead of red, so it no longer looks like something has gone wrong. Red is now only for tickets that are stuck: blocked on a question, or whose build stopped early.

To see it, let a build finish without shipping (for example a high-risk ticket), then look at its row in the queue: the edge, the Ship step and the "Build finished without shipping" line are purple, in both light and dark mode. The purple is the same one the panel already uses for ideas.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "c4a7920c55850f6d0fc834e5b64d6f5d9e8fdad0",
    "thread_id": "01a1320b-16cf-7723-b13c-04f586bb8c01",
    "seconds": 35,
    "usage": {
      "input_tokens": 145412,
      "cached_input_tokens": 100096,
      "cache_write_input_tokens": 0,
      "output_tokens": 727,
      "reasoning_output_tokens": 33
    },
    "saved_at": "2026-10-12T21:36:24.892Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: panelModel and queueItem apply to-ship only to approved tickets with an exited build. CSS colours the border, open tint, current step, exit label and message edge purple. Passing 0138 AC1 tests cover these elements."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0138 AC2 test checks the actual light and dark CSS variables for contrast against backgrounds and hue separation from red and amber. Existing theme colours are reused."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelModel preserves red for blocked and unfinished or unexpectedly stopped builds. Passing 0138 AC3 test exercises all three cases; their red CSS rules are unchanged."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0138 AC4 test opens Review pack and exercises its Ship request. Existing passing 0063 and 0133 tests exercise Full ticket and approved-ticket shipping controls. Button handlers are unchanged."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0138-tests.txt records the full npm test run: 1234 tests, 1231 passed, 3 skipped, zero failures. Existing test changes replace only the superseded red expectations."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Approved tickets waiting to ship now use purple throughout their queue row in both themes. Blocked and interrupted builds remain red, and ticket viewing and shipping controls retain their behaviour. The recorded full test suite has no failures. No blocking concerns found."
  }
}
```

</details>
