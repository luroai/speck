---
id: "0613"
title: "Show a ticket's Waits on as facts"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-show-the-full-view-s-waits-on-as-facts-too.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0612"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T11:10:35.473Z"

---
# 0613 · Show a ticket's Waits on as facts

**Status:** 🔍 reviewing

## Problem
A ticket waiting on two or more others still shows, in its full view and open Plan card, the LCD-era Waits on box: a border, a coloured bar and a grid of boxed chips. Since 0603 a chain is shown as plain facts beside it, so the two kinds of dependency look different for no reason.

## Outcome
A ticket's Waits on is shown as plain facts, as its chain is.

## Acceptance criteria
1. In a ticket's full view, the tickets it waits on are shown in the facts' style: each one's id and title with its state, as links to it, without a bordered box, coloured bar or boxed chips.
2. An open Plan card shows them the same way.
3. Pressing one opens that ticket, as today.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Which tickets a ticket waits on.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- Decided: the open Plan card changes too, so there's one look for dependencies.
- Today: `depsBox`, `withDeps`, `depChip` in `templates/panel.js` and their styles in `templates/panel-cards.css`. Waits for 0612.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: on a touch screen the link lines were 44 px tall and the plain ones 20 px, so the list was unevenly spaced; every line is now 44 px there. A link's text in a Plan card is 14 px, not the card facts' 12 px, as 0612 asks of anything in a button.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Tests changed to check the new behaviour (AC4):
- `test/panel-0467.test.mjs`: the model's Waits on items carry each ticket's title; the open card, link and full-view tests check the Waits on facts instead of the box, bar and chips (and no show/hide-shipped toggle); the real-browser test checks each Waits on line keeps inside its card on one line, and measures only the chain's circles.
- `test/panel-0154.test.mjs`: no shipped toggle to press, as shipped ones are always listed; a link's id is read from its id inside the link, which now holds the title too; the touch rule is `.deps .slot, .waits-facts button.waits-link`.
- `test/panel-0419.test.mjs`: the real-browser check counts the full view's Waits on lines instead of reading the box's header.
- `test/panel-0468.test.mjs`: the full view's Waits on is found as facts, and checked to list its 11 queued tickets.
- `test/panel-0612.test.mjs`: `chip` dropped from its list of button classes it must find, as no chip button exists now.

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
    "reviewed_sha": "fa2515f6e5eca44b6f90b15f5ed52996c945c304",
    "session": "fresh",
    "thread_id": "01a1c52d-0ecd-7a71-8093-cf68aa73942a",
    "builder_response": "- Tests run: `speck test --related` with test/panel-0613.test.mjs test/panel-0467.test.mjs test/panel-0154.test.mjs test/panel-0419.test.mjs test/panel-0468.test.mjs test/panel-0612.test.mjs (plus every test file naming a changed file, and the checks)\n- Round 1. Waits on is now one fact, `dl.facts.waits-facts`, in both the full view and an open Plan card: a line for each ticket, in id order, its id and title (a link when it's on the page) then its state. The model's Waits on items now carry each ticket's title. The box, bar, chip grid and the show/hide-shipped toggle are gone; shipped ones are always listed.\n- AC4: old tests changed to check the new behaviour: 0467 (model items carry titles; open-card, link, full-view and real-browser tests now check the facts), 0154 (no shipped toggle to press; link text holds the title; touch rule selector), 0419 (real-browser check counts the full view's lines), 0468 (full view's Waits on found as facts), 0612 (`chip` dropped from its list of button classes, as no chip button exists now).\n- Pictures of the open Plan card and full view, in both looks, are in the review pack.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 115802,
      "cached_input_tokens": 84864,
      "cache_write_input_tokens": 0,
      "output_tokens": 630,
      "reasoning_output_tokens": 12
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 30938,
      "cached": 84864,
      "write": 0,
      "output": 630
    },
    "cost_usd": 0.0766624,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T11:17:39.993Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel.js waitsFacts renders ids, titles and states using factCell; panel-0613 AC1 tests pass for full-view rendering and missing tickets."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "depsBox uses waitsFacts for open Plan cards. Passing panel-0613 AC2 tests check the facts, placement and absence of the old box, bar and chips."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "waitsFacts retains depNode navigation. Both panel-0613 AC3 navigation tests pass: Plan links select the destination tab and full-view links open the destination there."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "Existing tests were updated appropriately; recorded output confirms 264 passed, 0 failed and 3 skipped. However, the ticket's Delivery log contains only its placeholder and does not list the changed tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0613-show-a-ticket-s-waits-on-as-facts.md",
        "issue": "Acceptance criterion 4 explicitly requires the Delivery log to list the updated tests, but it is empty. The builder response lists them only outside the ticket.",
        "suggested_fix": "Add the updated test files and what they now check to the ticket's Delivery log: panel-0467, panel-0154, panel-0419, panel-0468 and panel-0612.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The new dependency facts work in both views, and navigation is covered by passing tests. The implementation looks ready, but the ticket must record the updated tests in its Delivery log before approval."
  }
}
```

</details>
