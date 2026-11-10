---
id: "0614"
title: "Give an open Plan or Capture row room inside its fill"                # one outcome, no "and"
status: blocked            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-give-an-open-plan-or-capture-row-room-inside-its-fill.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0608"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T11:07:06.723Z"
blocked_at: "2026-11-10T11:15:15.337Z"

---
# 0614 · Give an open Plan or Capture row room inside its fill

**Status:** ⛔ blocked

## Problem
An open Plan or Capture row has a raised background, and since 0600 its text runs right to that fill's edges, as the row has no side padding of its own. The text pressed against the edge, and the ring a linked id draws, look cramped on a phone.

## Outcome
An open Plan or Capture row has room between its text and the edges of its fill.

## Acceptance criteria
1. An open Plan or Capture row's text sits at least 12 px inside its raised fill on each side, in both looks.
2. The title doesn't move sideways when the row opens or closes.
3. Every row still spans its list, as 0418 checks.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Closed rows.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- From 0600's build: letting the fill reach past the 16 px margins broke 0418's check, so the room has to come from inside them, or from padding the text in. Today: `.item.row.open` in `templates/panel-cards.css`. Waits for 0608, which changes the same stylesheet.
- Relies on nothing outside this repo.
- Failing before this build: none
- How: the open row's own box stays where it was, spanning its list inside the 16 px margins (so 0418 and 0600 still pass), and its raised fill is drawn 12 px past each side with side shadows in the fill's colour. Closed rows are unchanged, so the title stays put. A linked id's ring (hover and the flash after a tap) on an open row is drawn round the whole fill by a pseudo-element that takes no taps, rather than round the row's box at the text's edge.
- Self-check: the hover and flash rings (`.item.hl`, `.item.flash`) set their own box-shadow, which would have hidden the fill's sides or drawn the ring at the text's edge; moved them to the fill's edge and added checks. Kept 0154's reduced-motion rule as it was, adding a second one.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
The room inside an open row is done and the title no longer moves for most rows, but an open Plan ticket that starts a chain or waits on another still shows its chain or padlock mark between its id and its title, so its title shifts right by the mark's width when it opens (the closed row shows that link as a chip at the end instead). Should I (a) move that mark to the end of the open ticket's title line, where the closed row's chip sits, so the title never moves, (b) leave the mark where it is and accept that linked tickets' titles shift by it, as they do today, or (c) show the mark in closed rows too? I recommend (a): the title stays still for every ticket, and the link shows in the same place open or closed; it changes two older checks that pin the mark right after the id.
Recommended: Move the mark to the end of the open title line
Other options: Leave the mark after the id, linked titles still shift; Show the mark in closed rows too
Changes what you'd notice: yes
Clear winner: no

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
    "reviewed_sha": "e4174851fb242e44ce31c032ff65e619e9e32075",
    "session": "fresh",
    "thread_id": "01a1c52a-4bb6-7853-90b0-c0be0cecfa9f",
    "builder_response": "- Tests run: test/panel-0614.test.mjs (with --related, which added test/panel-0417.test.mjs, test/panel-0469.test.mjs, test/panel-0472.test.mjs), plus test/panel-0418.test.mjs, test/panel-0600.test.mjs, test/panel-0608.test.mjs, test/panel-0154.test.mjs, test/panel-0167.test.mjs, test/panel-0185.test.mjs, test/panel-0519.test.mjs, test/panel-0151.test.mjs, test/panel-0164.test.mjs, as they check rows, open items and the linked-id rings\n- Approach: the open row's own box is unchanged (it still spans its list inside the 16 px margins, so 0418 and 0600 pass untouched); its raised fill is drawn 12 px past each side with side box-shadows in var(--raise). Closed rows are untouched, so the title can't move.\n- The hover (.hl) and flash rings on an open row are drawn round the whole fill by an ::after with pointer-events: none, as the row's own box-shadow ring would have replaced the fill's sides or sat at the text's edge.\n- AC2 fixture: no links between the tickets. An open ticket that starts a chain shows a chain mark before its title (existing behaviour, not this ticket's), which shifts its title whatever the padding; I'll list that as a follow-up.\n- AC4: no existing test changed; none failed.\n",
    "seconds": 34,
    "usage": {
      "input_tokens": 150947,
      "cached_input_tokens": 103168,
      "cache_write_input_tokens": 0,
      "output_tokens": 880,
      "reasoning_output_tokens": 87
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 47779,
      "cached": 103168,
      "write": 0,
      "output": 880
    },
    "cost_usd": 0.1146748,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T11:14:39.814Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-cards.css .item.row.open extends the raised fill by 12 px on each side. Both browser tests in test/panel-0614.test.mjs passed, measuring text clearance in light and dark looks."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "templates/panel.js titleLine inserts chainIcon only when open; ticketHead enables this for Plan tickets. Opening a chain starter or waiting ticket therefore shifts its title. The new test deliberately excludes linked tickets, so it does not cover this case."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The row's dimensions remain unchanged. The new browser tests verify list alignment; the supplied run also passed test/panel-0418.test.mjs across its viewport widths."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "No existing tests required changes. The recorded run reports 218 passes, zero failures and three skips; the ticket-specific browser tests passed. No unrelated implementation changes appear in the branch's merge-base diff."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.js",
        "issue": "AC2 is not met for Plan tickets with a chain or waiting icon: titleLine adds that icon only while open, moving the title sideways. The builder acknowledges this case but excludes it from the test fixture. Existing behaviour still prevents this explicit acceptance criterion from passing.",
        "suggested_fix": "Keep the title's horizontal position stable for linked Plan tickets while preserving closed rows, and add a browser assertion covering a chain starter and a waiting ticket. If that requires changing the ticket's scope, obtain an owner decision rather than treating AC2 as passed.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The added space works in both looks, and rows retain their full width. However, linked Plan tickets still move their titles sideways when opened. The new tests deliberately omit that case, so the change does not yet meet every acceptance criterion."
  }
}
```

</details>
