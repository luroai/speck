---
id: "0041"
title: "Mark tickets that start a dependency chain"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0040"]                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T15:43:31.009Z"

---
# 0041 · Mark tickets that start a dependency chain

**Status:** 🔍 reviewing

## Problem
Tickets can wait on each other through `after:`, but the panel doesn't show where a chain begins. So when choosing what to set ready or kick off first, you have to read every ticket's `after:` line to find the ones that unblock others.

## Outcome
In the panel you can see at a glance which tickets start a chain, what each one unlocks and which tickets are still waiting.

## Acceptance criteria
1. A ticket starts a chain when its `waiting_on` is empty and at least one other ticket that isn't `done` or `cancelled` lists its id in `after:`. In Shaping's Tickets list and in the queue's `ready` tickets, such a ticket shows a chain icon in the accent colour next to its id, and "unlocks <ids>" (those tickets' ids, in the JSON's order) in the line under its title.
2. In the same two places, a ticket whose `waiting_on` isn't empty shows a dimmed padlock icon next to its id. In Shaping it also shows "waiting on <ids>" in the line under its title. The queue keeps the "waiting on <ids>" text it already shows.
3. A ticket with neither shows no icon. Each icon has hover text that says what it means, for example "Starts a chain: unlocks 0040" or "Waiting on 0039".
4. When the ticket starting a chain becomes `done`, on the next refresh a ticket that was waiting only on it loses its padlock, and gains the chain icon if other unfinished tickets wait on it in turn.
5. Hovering a ticket in either place highlights it and every ticket linked to it through `after:` in either direction, following links through other tickets too, and dims the rest. Moving the pointer away undoes this.

## Out of scope
- A tree layout or lines drawn between rows.
- Reordering tickets by chain.
- Tickets being built or reviewed, and Shipped.

## Notes
- `after:` and `waiting_on` are already in `speck status --json`, so this is a change to `templates/panel.html` only.
- Builds after 0040, which changes the same item code.
- No external facts: everything is in this repo.
- Self-check: a hovered ticket that leaves the page without a mouseleave (Shaping switched to Ideas, or it shipped) now stops dimming the rest; added a test that links aren't followed through done or cancelled tickets.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
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
    "reviewed_sha": "4baa3cf43278ea6999e207a808b878f106a0b47b",
    "thread_id": "01a1215b-0898-7a43-a544-a64a1c6d660a",
    "seconds": 54,
    "usage": {
      "input_tokens": 332719,
      "cached_input_tokens": 262016,
      "cache_write_input_tokens": 0,
      "output_tokens": 1413,
      "reasoning_output_tokens": 64
    },
    "saved_at": "2026-10-09T15:50:30.871Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: chains, panelModel, chainIcon and ticketItem implement ordered unlocks and accent icons. test/panel-0041.test.mjs AC1 tests exercise both lists and exclude finished tickets."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "chainIcon, ticketItem and queueItem render padlocks and waiting labels; AC2 tests exercise both locations and check the dimmed colour."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "chainIcon supplies descriptive title attributes or no icon. AC3 tests check both behaviours."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panelModel recalculates chain state each refresh. The AC4 test exercises completion, removal of the padlock and promotion to chain starter."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "chains computes bidirectional connected groups; hoverable and lightUp apply and clear highlighting. AC5 tests exercise transitive links, both lists, pointer departure and refresh; the supplied browser test also passes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "shapingItems now signs the derived unlocks, chain and linked fields as part of a draft's data. Changing another linked ticket therefore replaces an unchanged open draft's DOM node and loses its text selection, contradicting the existing selection guarantee and product.md. A read-only reproduction with an unchanged draft and its dependent changing from ready to done returned nodeRetained:false and detached:1. Existing tests only cover refreshes with unchanged dependency groups.",
        "suggested_fix": "Keep node retention based on the ticket's own API data and view state. Update derived chain indicators in place when dependencies change, preserving detail nodes. Add a regression test selecting text while another linked ticket finishes or changes its after list.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "queueItem calls hoverable for every in-flight ticket, and lightUp highlights or dims all queue rows. This changes tickets being built or reviewed despite their explicit exclusion from scope. A read-only reproduction hovering a building ticket produced 'q hl' for it and 'q dim' for another row.",
        "suggested_fix": "Restrict hover handlers and visual highlighting to Shaping tickets and ready queue tickets. Dependency traversal can still pass through other unfinished tickets. Add tests confirming building and reviewing rows remain visually unchanged.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The new dependency descriptions match the implementation, but the retained promise that unchanged ticket data preserves selection is broken when linked tickets change."
    },
    "escalation_question": "",
    "summary": "Chain icons, waiting labels and dependency highlighting work and have meaningful tests. Two fixes are needed before merge: preserve selected text when another linked ticket changes, and keep highlighting away from tickets already being built or reviewed."
  }
}
```

</details>
