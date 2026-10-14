---
id: "0168"
title: "Show the builder badge on running tickets"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0167"]                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T14:51:40.867Z"
approved: "2026-10-14T15:15:57.324Z"

---
# 0168 · Show the builder badge on running tickets

**Status:** 👍 approved

## Problem
A running build's progress is shown by 0156's ensō, a red speck circling it and a row of stage dots. It doesn't feel like an agent is doing something, it takes a full block of each card, and on a phone it's hard to read at a glance.

## Outcome
Each in-flight ticket's Build card shows a small builder badge, speck's character, acting out what the build is doing, beside a one-line description of the stage.

## Acceptance criteria
1. Each building, reviewing, blocked or approved ticket's Build card shows a 56 × 56 px badge: a rounded tile with the builder drawn in ink (an ensō-shaped round body open at the top left, two round ears, two short legs and the speck as its one eye), as in the design reference (see Notes). It sits at the left of a row with the stage sentence (as 0156 writes it) and the stage name, below the title, which keeps the card's full width. 0156's ensō, circling speck and stage dots are no longer shown.
2. While an agent is at work on the ticket (building, self-check, reviewing or shipping, and not paused), the badge plays the laptop loop from the mockup, about 2.8 seconds long: the builder behind a laptop lid with an ensō sticker, two round paws slapping the lid's top edge in turn while code characters (`{ } < > ; / = ( ) [ ] *`) fly off both sides, a pause with its eye up and away, both paws up, one slam, and a finished block popping out of the top.
3. While the ticket waits for the user's decision (approved and not covered by auto-ship), the builder faces front waving a small purple flag, with a hop every few seconds, and the tile's edge is purple. While it's blocked or its build has stopped, the builder faces front with a crimson "?" over its head, tilting and now and then glancing side to side, and the tile's edge is crimson. A paused build shows the builder still and facing front.
4. The badge has an accessible name saying what it shows (for example "The builder is writing code" or "The builder needs you"), and ready tickets show no badge. With `prefers-reduced-motion: reduce`, it shows a still pose for each state and nothing moves.
5. The badge is drawn from the panel's colour tokens, so it reads in light and dark mode, nothing in it is clipped by the tile's edge, and no test that passed before this change fails, except checks of 0156's ensō and stage dots, which are changed to check the badge.

## Out of scope
- Self-check's and review's own loops (0169); until then they play the laptop loop.
- The badge in the header's Auto-build button (0163).
- Using the builder as the app icon.

## Notes
- The design reference is `mockups/builder-badge/index.html` in the main checkout (local only: `mockups/` isn't in git, so it isn't in a build's worktree; `git worktree list` shows the main checkout first) (the "At the laptop" building style, and the Waiting for you and Blocked states). Its drawing code and timings can be reused.
- One builder for every project: the version with ears.
- Builds after 0167, so the badge's tile colours follow the "colour only for state" rule.
- Failing before this build: none
- The badge's pose follows the card's state: at the laptop while an agent is at work, the "?" when the card is crimson (blocked, stopped, or an auto-ship that failed), the flag when it waits for your decision (`to_ship`, as 0167 sets it), and otherwise still and facing front (paused, or approved and about to be auto-shipped).
- The timer moved from the title's row to the right of the badge's row, as in the design reference, so the title keeps the card's full width.
- Tests that checked 0156's ensō and stage dots (and the earlier bar through the dot helpers) now check the badge and the stage's name: 0034, 0045, 0055, 0069, 0071, 0138, 0153, 0155, 0156, 0161 and 0167.
- Self-check: a canvas the browser won't draw on is left blank instead of stopping every badge's loop; a badge that holds still is drawn again when the screen's pixels per CSS pixel change (a zoom), so it stays sharp (new test); a stale comment about the speck updated.

## In plain words
Each ticket that's being built, reviewed, shipped, blocked or waiting for you now has a small drawing of speck's builder on its Build card, in place of the circle with the moving red dot and the row of stage dots. While an agent is working, the builder sits behind a laptop typing, with bits of code flying off, and every few seconds slams a key and a finished block pops out. When a ticket waits for you to ship it, the builder waves a purple flag and the tile has a purple edge. When it's blocked or its build has stopped, the builder has a red question mark over its head and the tile has a red edge. A paused build shows the builder standing still. The ticket's title now uses the card's full width, with the badge, a sentence saying what's happening and the timer on the row below.

To see it, open the panel while a build runs, and try it in light and dark mode and on a phone. If your device is set to reduce motion, each badge holds a still pose instead.

Worth keeping an eye on: an approved ticket that auto-ship is about to ship shows a still builder but still says "waiting for you to ship it" in purple for a moment (saved to the inbox as a follow-up).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 235,239
- Elapsed since build started: 24 min
- Changed lines: 219 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- An approved ticket that auto-ship is about to ship keeps 0156's purple "waiting for you" sentence while its card and badge aren't purple: speck/ideas/2026-10-14-keep-an-auto-shipping-ticket-s-sentence-out-of-purple.md
- The badge's zoom redraw is checked by changing the page's width and pixel density together, as a browser zoom does: headless Chromium doesn't report a change of pixel density alone, so moving the window to another screen is checked only by reading the code.

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
    "reviewed_sha": "08cfc2346dfd74242799bf9be09f21a6f97a58dc",
    "thread_id": "01a13afb-0d21-7b20-bb8e-2c605d3dd1c5",
    "seconds": 38,
    "usage": {
      "input_tokens": 234451,
      "cached_input_tokens": 169088,
      "cache_write_input_tokens": 0,
      "output_tokens": 788,
      "reasoning_output_tokens": 33
    },
    "saved_at": "2026-10-14T15:15:31.477Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html progressOf and BADGE.builder implement the badge and replace the ensō and dots. Passing 0168 AC1 browser tests verify 56 × 56 px sizing, placement and full-width titles at phone and desktop widths."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "BADGE.POSES.type matches the main checkout's mockup laptop drawing and 2800 ms timing, including alternating paws, code, pause, slam and finished block. Passing 0168 AC2 and browser motion tests exercise working-state selection and actual canvas movement."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "badgeOf selects laptop, flag, question mark or still poses from the card state. Passing 0168 AC3 tests cover waiting, blocked, stopped, paused, pending auto-ship and failed auto-ship; browser tests verify motion and state-coloured edges."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "progressOf supplies role=img and descriptive aria-labels; ready cards omit progressOf. paintBadge uses fixed poses with reduced motion. Passing 0168 AC4 and browser tests verify names, absence on ready tickets and unchanged frames under reduced motion."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "badgeColours reads panel tokens. Passing browser tests cover both themes, unclipped drawings throughout each loop, theme changes and zoom. Verified full test log: 1546 passed, zero failed, three skipped. Existing test changes replace removed progress visuals without unrelated fixes."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Running tickets now show the builder character beside their progress text, with distinct working, waiting, blocked and paused poses. The implementation follows the design reference, supports reduced motion and both colour themes, and preserves the title’s full width. All acceptance criteria pass; no blocking concerns found."
  }
}
```

</details>
