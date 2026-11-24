---
id: "0725"
title: "Try an approved ticket's app from its review pack"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: cursor              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-10-more-human-gate-actions-in-the-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T15:09:09.757Z"

---
# 0725 · Try an approved ticket's app from its review pack

**Status:** 🔍 reviewing

## Problem
`speck app <id>` starts a ticket's copy of the app (0634), but only from a terminal. Using the change before shipping is stronger evidence than the review pack, and the panel is where you decide to ship.

## Outcome
An approved code ticket's review pack has a Try it button that starts its app and gives you the address.

## Acceptance criteria
1. An approved code ticket's review pack in the panel has a Try it button that starts the app from that ticket's copy of the code, as `speck app <id>` does, then shows the app's address as a link.
2. While that app is running, the button offers Stop, which stops that app only, as `speck app <id> --stop` does. Opening the review pack again while it runs shows the address and Stop.
3. When the app can't start, the panel says why, in `speck app`'s words.
4. Task tickets, and tickets that aren't approved, show no Try it button.
5. No test that passed before this change fails.

## Out of scope
- Reaching the app from a phone through the private tunnel: the address is on this machine.
- Undo a ship and notifications, which stay in the idea.

## Notes
- `speck app` is `scripts/app.mjs` (0634); it reads `commands.start` or works one out (0638). Panel actions run through `scripts/panel-run.mjs`.
- Failing before this build: none
- Self-check: hide Try it in the document pop-up so its border is styled (0453)

## In plain words
When a code ticket is approved, its review pack now has a Try it button. That starts the app from that ticket's copy of the code and shows you the address as a link, so you can try the change before you ship. While it's running, the button becomes Stop, and opening the pack again still shows the address and Stop. If the app can't start, the pack says why in the same words as the terminal command. Task tickets and anything that isn't approved don't get the button.

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
    "reviewed_sha": "5587358effcbe37a2805929f0170c2c68052eeeb",
    "session": "fresh",
    "thread_id": "01a20e41-5251-7a03-8d5c-15149ef302ef",
    "builder_response": "- Tests run: test/panel-0725.test.mjs test/panel-0453.test.mjs (and commands.checks via speck test --files). Related run also covered scripts/app.mjs, pack.mjs, panel.mjs and panel-popups; 0453 failed once when Try it appeared unstyled in the document pop-up — fixed by hiding Try it there. tmp-cleanup AC1 fails on main too (expects TAP `# fail 2`, Node's default reporter prints `ℹ fail 2`); not from this change.\n",
    "seconds": 35,
    "usage": {
      "input_tokens": 233156,
      "cached_input_tokens": 190720,
      "cache_write_input_tokens": 0,
      "output_tokens": 1067,
      "reasoning_output_tokens": 189
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 42436,
      "cached": 190720,
      "write": 0,
      "output": 1067
    },
    "cost_usd": 0.114614,
    "saved_at": "2026-11-24T15:52:06.334Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panelAppStart in scripts/panel-run.mjs delegates to startApp, which selects the ticket checkout. tryAppPart displays the returned address as a link. Passing panel-0725 AC1 tests cover the page, real app startup and authenticated HTTP route."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelAppStop delegates to the existing ticket-specific stopApp. runningApp and panelPack restore the running address on reopening. Passing panel-0725 AC2 tests exercise Stop and restored state; existing app-0634 tests cover isolation between tickets."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelAppStart returns SpeckError.message unchanged, and startTicketApp displays it. Both server and page AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "tryAppPart excludes tasks and requires approved status for Try it; panelAppStart also enforces both restrictions. Page and server AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied results show the ticket tests and related checks passing. The tmp-cleanup failure concerns an unchanged assertion expecting TAP output when Node prints its alternative reporter format; this change does not affect that behaviour. Whole-suite verification remains the shipping gate."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Approved. Approved code tickets now offer Try it, show the app’s address and let you stop it. Reopening the review pack restores the running app controls, and startup errors retain the existing command’s explanation. The tests exercise both the interface and real app processes."
  }
}
```

</details>
