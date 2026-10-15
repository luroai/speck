---
id: "0200"
title: "Keep each ticket in its place in the Build list until it ships"                # one outcome, no "and"
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
after: ["0199"]              # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T14:09:54.836Z"

---
# 0200 · Keep each ticket in its place in the Build list until it ships

**Status:** 🔍 reviewing

## Problem
The Build list orders in-flight tickets by priority, so tickets move about as others start, are handed back or ship. On 2026-10-15 the user saw a ticket drop to the bottom of the list when it started shipping, which makes the list hard to follow.

## Outcome
Each ticket keeps its place in the Build list from when its build starts until it has shipped.

## Acceptance criteria
1. In-flight tickets (building, reviewing, blocked, approved or shipping) are listed in the order their builds started, earliest first, whatever their priority. Ready tickets follow, in the order `speck run` will start them.
2. A ticket keeps its place through every stage (build, self-check, review, approved, waiting to ship, shipping, a hand-back after a failed ship) until it leaves the list once shipped. The tickets above and below it keep their order too.
3. A ticket whose build start time isn't recorded goes after those that have one, by id.
4. The order is the same after the page reloads, and on every open page.
5. No test that passed before this change fails, except checks that in-flight tickets are listed by priority, which change to check AC1.

## Out of scope
- The order of the Plan list and of Shipped.
- The order `speck run` starts ready tickets in.

## Notes
- Asked for 2026-10-15: "When a ticket joins the shipped queue, it moved to the bottom of the build panels list. The tickets need to remain in order and arguably just stay where they are."
- `speck status --json` sorts tickets by priority (`byPriority`, `scripts/core.mjs`), and `panelModel()` in `templates/panel.html` lists in-flight tickets in that order. Likely cause: a newly started ticket with a higher priority goes above the ones already in flight. Not reproduced.
- A ticket's build start is its `started` time.
- Failing before this build: none
- Self-check: no changes. Checked a missing, null or unreadable start time, two started at the same moment, a ship running on a done ticket and a hand-back; all covered by the tests.

## In plain words
Tickets in the Build list now stay in the order their builds started, earliest at the top, instead of being sorted by priority. A ticket keeps its place from when its build starts, through review, approval and shipping, until it has shipped and leaves the list, so nothing jumps about when another ticket starts, is handed back or begins to ship. Ready tickets still come after them, in the order they'll be started. To see it, watch the Build list while a ticket starts shipping: it stays where it was. A ticket with no recorded start time, which shouldn't normally happen, goes after the others.

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
    "reviewed_sha": "d4cc8db859aac3ab986f74308fc3aabf36114a04",
    "thread_id": "01a13ff2-78b7-78a2-9fbd-411f78309891",
    "seconds": 31,
    "usage": {
      "input_tokens": 128265,
      "cached_input_tokens": 88704,
      "cache_write_input_tokens": 0,
      "output_tokens": 782,
      "reasoning_output_tokens": 23
    },
    "saved_at": "2026-10-15T14:24:08.001Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html panelModel() sorts only in-flight tickets by started, earliest first, then appends ready tickets unchanged. Passing test '0200 AC1' checks differing priorities and ready order."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing test '0200 AC2' exercises stage changes, waiting to ship, shipping while done, failed-ship hand-back and removal after shipping, checking neighbouring tickets retain their order."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelModel() places invalid or absent start times last and breaks ties by id. Passing test '0200 AC3' covers missing, null and unreadable times plus identical timestamps."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing test '0200 AC4' runs the actual page script through fakePage(), checking refreshes and separate page instances with differently ordered input."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0200-tests.txt: 1884 tests, 1881 passed, 3 skipped, zero failures. The existing 0055 browser assertion changes its expected row order while retaining animation checks and adding a ticket-specific badge assertion."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The Build list now keeps in-flight tickets ordered by when their builds started, including during shipping and failed-ship hand-backs. Ready tickets retain their existing order. Tests cover the required behaviour, and the full suite reports no failures. No blocking concerns found."
  }
}
```

</details>
