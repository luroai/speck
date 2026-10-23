---
id: "0416"
title: "Show each ticket's stage in words only"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0415"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T15:38:42.935Z"

---
# 0416 · Show each ticket's stage in words only

**Status:** 🔍 reviewing

## Problem
Each in-flight ticket's card has a 56 px tile showing speck at the laptop, with the reviewer or pushing the boat. speck is the Foreman on the screen at the top (0413), the builders and reviewers are other models, and a moving tile on every card competes with that one screen.

## Outcome
A ticket's card says its stage in words only, and speck's screen is the only part of the panel that animates.

## Acceptance criteria
1. No ticket card has a tile or any other picture or animation of its stage, at any stage. The card's text starts at its left edge where the tile was.
2. Each card still says its stage in the same words as today, such as `Writing tests and code`, `Checking its own work`, `<reviewer> is reviewing · round <n>`, `Shipping` or `Blocked · it has a question for you`, with its stage names under its title. A card waiting for you is still shown in the panel's purple, and one that needs you in its crimson.
3. Apart from speck's screen, nothing on the panel moves unless you've just done something, such as the ring that lights a ticket after "Go to ticket".

## Out of scope
- New wording for the stages.
- speck's screen and its animations (0413, 0414).

## Notes
- Removes the builder badge: `badgeOf` and its canvas in `templates/panel.html` (0168, 0169, 0172, 0302). The `PANEL` poses in `templates/lcd.js` stay, as speck's screen uses `ship`, `wait` and `bad` (0414).
- The user decided on 2026-10-23 that the status text is enough.
- Waits for 0415: both change `templates/panel.html`.
- Failing before this build: none
- Self-check: no changes to the panel; an old 0156 check expected a stage border on a ticket waiting for you to ship it, which it never had, and its "Shipping" sentence check already covers it, so that line went.

## In plain words
A ticket's card in the Build queue no longer has the small moving picture of the builder at its laptop. It says what it's doing in words, such as "Writing tests and code" or "Blocked · it has a question for you", with the stage's name under it, starting at the card's left edge. A card that waits for you is still purple, and one that needs you is still crimson. speck's screen at the top is now the only thing on the panel that moves by itself. To see it, open the panel while a ticket is building and look at its card in the Build queue.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (tidy-ups only, no inbox notes):
- `badge()` in `templates/lcd.js` is no longer called by the panel; it stays because lcd.js must match the design file (0302, 0320) and the ticket keeps lcd.js as it is.
- Test stubs of `SpeckLCD.badge` in `test/support/screen.mjs`, `test/panel-0303.test.mjs` and `test/panel-0364.test.mjs` are now unused and could go.

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
    "reviewed_sha": "9ae78da59dcdda750f03617f065d84a015a0b739",
    "session": "fresh",
    "thread_id": "01a16973-c791-7f20-852e-c38f824b19a1",
    "builder_response": "- Tests run: test/logo-0320.test.mjs test/panel-0071.test.mjs test/panel-0055.test.mjs test/panel-0138.test.mjs test/panel-0069.test.mjs test/panel-0140.test.mjs test/panel-0163.test.mjs test/panel-0156.test.mjs test/panel-0153.test.mjs test/panel-0155.test.mjs test/panel-0167.test.mjs test/panel-0196.test.mjs test/panel-0168.test.mjs test/panel-0161.test.mjs test/panel-0201.test.mjs test/panel-0361.test.mjs test/panel-0364.test.mjs test/panel-0303.test.mjs test/panel-0416.test.mjs test/panel-0203.test.mjs test/panel-0302.test.mjs test/panel-0308.test.mjs test/panel-0413.test.mjs test/panel.test.mjs test/review-running-0223.test.mjs test/panel-0416.test.mjs\n- Round 1. The badge (badgeOf, badgeFor, startBadges and its canvas and styles) is gone from templates/panel.html; the progress row (class `progress`, was `badgerow` > `badgetext`) is a single column from the card's left edge. lcd.js is untouched (out of scope: its PANEL poses stay for speck's screen; its `badge()` function is now unused by the panel).\n- Old tests that checked the badge were changed to check the words, colours and stage border instead. panel-0169 and panel-0172 tested only the badge's self-check, review and shipping poses, so those files were deleted. panel-0168 and panel-0302 keep only the tests that don't depend on the badge: 0168's words-per-stage check, and 0302's renderer copy and colour tokens. Real-browser tests in 0055 and 0155 now check that no card has a canvas and that the progress starts at the card's left padding.\n- AC3: the remaining CSS animation is the .flash ring after \"Go to ticket\" and the only transition is the Settings switch knob; both move only after you act. The timer's digits still count up each second as text, as before; that's a counter, not an animation of the stage.\n- Pictures: the Build queue in light and dark looks.\n",
    "seconds": 20,
    "usage": {
      "input_tokens": 247659,
      "cached_input_tokens": 178432,
      "cache_write_input_tokens": 0,
      "output_tokens": 518,
      "reasoning_output_tokens": 21
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T15:49:38.115Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html progressOf renders text directly in a single-column .progress row; badge creation, rendering and styles are removed. Passing panel-0416 AC1 tests check picture removal, and panel-0155 browser tests verify left alignment at five widths."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html retains doing() wording and sentence/stage colour rules. Passing panel-0416 AC2 and panel-0168 tests check stage sentences and names; panel-0156 browser tests verify layout and colours in both themes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Badge animation calls are removed. The remaining CSS motion is the user-triggered flash ring and Settings switch transition. Passing panel-0416 AC3 checks these rules; the panel-0055 browser test confirms no card canvases or active CSS animations."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Ticket cards now show their existing stage words without pictures, aligned at the left. Purple and crimson states remain, and speck’s screen retains its animations. The reported run passed 338 tests with three skipped. No blocking issues found."
  }
}
```

</details>
