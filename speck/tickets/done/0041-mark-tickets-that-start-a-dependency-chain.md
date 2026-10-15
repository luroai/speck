---
id: "0041"
title: "Mark tickets that start a dependency chain"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0040"]                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T15:43:31.009Z"
finished: "2026-10-09T15:57:12.696Z"

---
# 0041 · Mark tickets that start a dependency chain

**Status:** ✅ done

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
Round 1 (codex): changes requested: F1 shapingItems now signs the derived unlocks, chain and linked fields as part of a draft's data.; F2 queueItem calls hoverable for every in-flight ticket, and lightUp highlights or dims all queue rows.
Round 2 (codex): changes requested.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,840,927
- Elapsed since build started: 12 min
- Changed lines: 117 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up idea: the fake DOM in `test/support/panel.mjs` gives every node an Array of `children`, where a browser has an HTMLCollection with no `find` or `map`, so a bug like round 2's F1 passes the fake-page tests. Make its `children` array-like only.

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

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "86911c3e26e8ec3c597247080d6ae0ac4719da52",
    "thread_id": "01a1215b-0898-7a43-a544-a64a1c6d660a",
    "seconds": 44,
    "usage": {
      "input_tokens": 626948,
      "cached_input_tokens": 525824,
      "cache_write_input_tokens": 0,
      "output_tokens": 2462,
      "reasoning_output_tokens": 119
    },
    "saved_at": "2026-10-09T15:53:26.973Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "Initial rendering is covered by the passing AC1 tests, but templates/panel.html:newHead throws when another ticket changes a draft's unlocks. Browser element.children is an HTMLCollection and has no find method, preventing the updated icon and label from rendering."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "chainIcon, ticketHead and queueItem render dimmed padlocks and waiting labels. test/panel-0041.test.mjs AC2 exercises both lists."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "chainIcon renders no icon for independent tickets and sets descriptive title attributes. The AC3 tests cover both behaviours."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panelModel recalculates waiting and chain state; the AC4 refresh test covers padlock removal, promotion to chain starter and the case with no further dependants."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "chains, hoverable and lightUp implement transitive bidirectional highlighting and pointer departure. AC5 tests cover both lists and refreshes; the new F2 test verifies traversal through in-flight tickets without changing their appearance."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "The selection-preserving approach is appropriate, but newHead calls node.children.find. In a browser, children is an HTMLCollection without find, so refreshing after a dependant finishes or changes its links throws TypeError. The new regression test misses this because the fake DOM represents children as an Array. A read-only reproduction with find unavailable reproduced the exception.",
        "suggested_fix": "Use [...node.children].find(...) or an appropriate DOM selector. Add a real-browser regression test that changes another ticket's dependencies while text is selected, checking that the labels update, selection survives and polling continues.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Resolved: queueItem attaches hover handlers only to ready tickets, and lightUp only changes rows with ticketId. In-flight tickets remain unchanged while dependency traversal still passes through them. The new F2 regression test covers this.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The scope description is now accurate, but the claim that chain indicators update in place while preserving selection is not yet true in a browser because newHead throws."
    },
    "escalation_question": "",
    "summary": "In-flight tickets are now correctly excluded from highlighting. The selection fix still needs one correction: changing a linked ticket triggers a browser error instead of updating the chain indicator. The new test passes because its simulated browser does not reproduce this browser behaviour."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "8322d3809c59daf8b7f2bafd3fbde259ec41d0ad",
    "thread_id": "01a1215b-0898-7a43-a544-a64a1c6d660a",
    "seconds": 29,
    "usage": {
      "input_tokens": 874209,
      "cached_input_tokens": 747776,
      "cache_write_input_tokens": 0,
      "output_tokens": 3176,
      "reasoning_output_tokens": 119
    },
    "saved_at": "2026-10-09T15:55:51.372Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: chains and panelModel identify chain starters and preserve JSON order; chainIcon, ticketHead and queueItem render accent icons and unlock labels. AC1 tests and the new browser refresh regression pass in the supplied results."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "chainIcon, ticketHead and queueItem render dimmed padlocks and waiting labels in both locations. The AC2 tests pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "chainIcon supplies descriptive hover titles and renders no icon for independent tickets. The AC3 tests pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panelModel recalculates dependency indicators each refresh. The AC4 test covers completion, padlock removal and promotion to chain starter, including no further dependants."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "chains computes bidirectional transitive groups; hoverable and lightUp highlight eligible rows and restore them on departure. AC5 and browser tests pass; the F2 regression confirms in-flight rows remain unchanged."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Resolved: newHead converts the HTMLCollection to an Array before finding the header. Derived dependency changes update the header while retaining the details. The new real-browser test changes a dependant's links twice and checks selection, indicators, open state and continued connectivity.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Resolved: only ready queue rows receive hover handlers or highlighting. Links still pass through in-flight tickets, as verified by the F2 regression test.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The specification accurately describes dependency indicators, highlighting scope and preservation of selected detail text when other tickets change."
    },
    "escalation_question": "",
    "summary": "The panel now shows which tickets unlock others, which are waiting and how their dependency chains connect. Both earlier problems are fixed, with meaningful browser coverage for refreshes and selected text. All acceptance criteria pass; no blocking concerns remain."
  }
}
```

</details>
