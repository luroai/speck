---
id: "0185"
title: "Stop a hover making every other ticket look highlighted"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-15T13:00:03.542Z"
approved: "2026-10-15T13:15:18.316Z"

---
# 0185 · Stop a hover making every other ticket look highlighted

**Status:** 👍 approved

## Problem
On desktop, hovering any ticket in Plan or the build queue turns every other ticket grey, so they all look highlighted. Hovering lights the ticket and the tickets linked to it through `after:`, and sets the rest back. Since 0161, "set back" is the raised fill (it used to be a fade, which 0161 removed for low vision), and that's the same grey as the hover fill. A ticket with no links counts as a group of one, so it happens on every hover, and the more tickets there are, the more it shows.

## Outcome
Hovering a ticket makes it and its linked tickets stand out, and every other ticket looks exactly as it does when nothing is hovered.

## Acceptance criteria
1. While a ticket in Plan or the queue is hovered with a mouse, every ticket outside its linked group looks exactly as it does with nothing hovered: the same background, border and text colours.
2. When the hovered ticket is linked to others through `after:`, it and each linked ticket are marked in a way that differs from both the normal look and the hover fill, in the light and dark looks, and their text keeps a contrast of at least 7:1 (0161).
3. Hovering a ticket with no links changes nothing but that ticket's own hover fill.
4. 1 to 3 hold with 25 tickets in the queue and 25 in Plan.
5. No test that passed before this change fails, except checks in `test/panel-0041.test.mjs` and `test/panel-0154.test.mjs` that expect the tickets outside the group to be set back, which change to expect criteria 1 and 3.

## Out of scope
- Touch screens, which don't light tickets up on a tap (0154).
- The "waiting on" and "unlocks" notes, and tapping an id to go to its ticket (0154).

## Notes
- `lightUp()` in `templates/panel.html` gives the tickets outside the group the `dim` class, styled `.item.dim, .q.dim { background: var(--raise) }` since 0161, the same as `.item:hover`. `linked` gives a ticket with no links a group of just itself.
- Reported on 2026-10-14 from desktop: "whenever I hover over any tickets in the plan panel, they all highlight themselves", and the same in the build queue with lots of tickets.
- Failing before this build: none
- Self-check: no changes. Checked a hover on a ticket missing from the last render (lights nothing), an open or coloured queue ticket in the group (the ring shows over its own border and fill), and that no doc or skill describes the old dimming.

## In plain words
Hovering a ticket in Plan or the build queue no longer turns every other ticket grey. Only the hovered ticket and the tickets it's linked to change: each gets a thin dark ring just inside its border, and everything else looks exactly as it does with nothing hovered. A ticket with no links just gets its usual hover shade. To see it, hover a ticket that waits on another, or that another waits on, and then one with no links. Worth a glance: the ring looks like the brief ring you see after tapping a linked ticket's id, though that one fades away by itself.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 142,402
- Elapsed since build started: 15 min
- Changed lines: 17 (limit 5000)
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
    "reviewed_sha": "6254dd71e7f1d3cf2ce77e4f41b5924480743e2d",
    "thread_id": "01a13fb3-52f5-7d73-a740-4c0ce904e928",
    "seconds": 33,
    "usage": {
      "input_tokens": 141562,
      "cached_input_tokens": 97664,
      "cache_write_input_tokens": 0,
      "output_tokens": 840,
      "reasoning_output_tokens": 48
    },
    "saved_at": "2026-10-15T13:15:11.965Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html lightUp() leaves unrelated rows unchanged; the dim styling is removed. Passing panel-0185 AC1 tests verify unchanged classes and absence of dim styling."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The .item.hl and .q.hl rules add an inset ring without changing text or fill. Passing panel-0185 AC2 tests verify linked membership, distinct styling and at least 7:1 text-token contrast on ticket fills in both themes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "lightUp() applies highlighting only when group.length > 1. Passing panel-0185 AC3 exercises unlinked tickets in both Plan and the queue."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing panel-0185 AC4 exercises 25 Plan tickets and 25 queue tickets, checking linked highlighting, unchanged outsiders and unlinked hovers."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0185-tests.txt: 1840 passed, zero failed and three unrelated legacy skips. Existing test changes only replace the permitted dimming expectations."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Hovering now marks linked tickets with a clear ring while leaving unrelated tickets unchanged. Unlinked tickets no longer trigger group highlighting. Tests cover both themes and a board with 50 tickets, and the full suite has no failures. No blocking concerns found."
  }
}
```

</details>
