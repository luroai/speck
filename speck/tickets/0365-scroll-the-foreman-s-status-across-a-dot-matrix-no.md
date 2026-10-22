---
id: "0365"
title: "Scroll the Foreman's status across a dot-matrix notice board"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-a-scrolling-dot-matrix-notice-board-in-the-header.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0364"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T15:47:19.510Z"

---
# 0365 · Scroll the Foreman's status across a dot-matrix notice board

**Status:** 🔍 reviewing

## Problem
The Foreman's button in the header shows one word, such as "Building 2", so the overview of what speck run is doing is only in its detail. An old-school notice board scrolling words across a dot-matrix screen would give that overview at a glance, in the panel's LCD style.

## Outcome
The Foreman's button is a dot-matrix notice board that scrolls the Foreman's status, and what each ticket in flight is doing, from right to left.

## Acceptance criteria
1. The Foreman's button in the header is a dot-matrix screen, in the style of the panel's other LCD screens and drawn with their 5 × 7 dot font, in capitals. It keeps the button's place in the header, its tooltip, its colour for the Foreman's tone (so "Needs you" still shows in red without reading it) and what pressing it, or pressing Enter or Space on it, does.
2. The board's text is the Foreman's word, then, each after " · ": "<id> building" for each ticket building, "<id> shipping" for the ticket shipping and "<id> blocked" for each blocked ticket. For example "Building 2 · 0362 building · 0363 building · 0358 blocked". With none of those, it's the word alone. While the page is out of date, it's "Reload page", as the button says today.
3. When the text is wider than the board, it scrolls from right to left, about 30 dots a second, and loops round with a gap between its end and its start. Text that fits stays still. With `prefers-reduced-motion: reduce`, it never scrolls and shows the Foreman's word alone.
4. The button's accessible name is the board's whole text, whatever has scrolled into view. A panel refresh with the same text carries on scrolling without a jump; new text starts again from the right-hand edge.
5. At 320 px wide and wider, the board fits the header without overlapping anything, and under 700 px it's at least 44 px tall. No test that passed before this change fails, except checks of the Foreman's button's word as a text label, which are changed to check AC1 and AC2.

## Out of scope
- Opening the Foreman's detail in a pop-up: 0366. Pressing the board opens the detail where it opens today.
- The project and base branch, which stay as fixed text in the header (0364).

## Notes
- Today: the button is `#run`, drawn in `render()` with `foremanOf()`, and its detail in `renderForeman()`, in `templates/panel.html` (0285, 0303, 0317). The Foreman's words come from `scripts/foreman.mjs`.
- `templates/lcd.js` already has the 5 × 7 font (`F5`), with capitals, digits and `:`, and reads `prefers-reduced-motion`. A "·" may need a glyph of its own.
- Waits for 0364, which takes the builder character off this button and sets the header's one-row layout.
- Failing before this build: none
- Self-check: added a test that each tone's colour reads at 4.5:1 on the board's LCD background in both looks (the 0161 check doesn't cover it, the board's colour being inherited); drew the "·" in the panel rather than adding it to lcd.js, which 0308 pins.
- Tests changed under AC5 (checks of the button's word as a text label, now of the board and its text): 0127, 0140, 0144, 0150, 0163, 0285, 0303, 0364. The fake page in test/support/panel.mjs gains createElementNS for the board's SVG.

## In plain words
The Foreman's button at the top of the panel is now a small dot-matrix screen, like the panel's other LCD screens. It shows the Foreman's word, then what each ticket is doing ("0362 building", "0358 blocked"), and when that's too long to fit it scrolls from right to left and loops round. It keeps its colour, so "Needs you" is still red, and pressing it opens the same detail as before.

To see it, open the panel while speck run is building something: the board scrolls. When nothing much is happening it shows one word and stays still. If your device asks for less motion, it never scrolls and shows the Foreman's word alone. Screen readers hear the whole text.

Worth a look: on a phone the board is narrow, so even a short word like "Building 2" scrolls there.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (tidy-ups and known limits, no inbox notes):
- Tidy-up: since round 1's fix names the button with aria-label, the visually hidden text after the board is only needed as the fallback text when lcd.js doesn't load, and by tests that read it.
- Known limit: while a ticket ships, the board says it twice ("Shipping 0360 · … · 0360 shipping"), as AC2 asks.

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
    "reviewed_sha": "ee1b221627c39b1bb39f86d0be13386cc5268d1c",
    "thread_id": "01a1645e-d74f-78e1-aaa1-20cb22572061",
    "seconds": 42,
    "usage": {
      "input_tokens": 168563,
      "cached_input_tokens": 122112,
      "cache_write_input_tokens": 0,
      "output_tokens": 1130,
      "reasoning_output_tokens": 193
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T16:09:01.066Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html draws SVG paths from LCD.F5 and preserves the native button, click handler, tooltip and tone classes. The passing 0365 AC1 tests cover glyphs, colours and activation."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "boardText() assembles the word, building tickets, shipping ticket and blocked tickets in the required order. Passing 0365 AC2 tests cover these combinations and stale-page text."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "boardFrame() implements 30-dot-per-second movement and a 16-dot loop gap. Passing AC3 tests exercise scrolling, narrow boards, fitting text and reduced motion."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "Refresh continuity and new-text resets have passing tests. However, render() appends an accessible 'Fixing on' span inside the button, so its accessible name exceeds the board's whole text when fixing is enabled. The AC4 name test omits this state."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Passing browser tests cover header overlap and mobile height at 320, 375, 699, 700 and 1200 px. The reported targeted run passed 227 tests with no failures; existing test changes concern the replaced label."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:3177",
        "issue": "With Foreman fixing enabled, the button is named by both the board-text span and the appended 'Fixing on' span. This violates AC4's requirement that its accessible name be the board's whole text. A fakePage reproduction with word 'Idle' and fixing 'fix' produces button textContent 'IdleFixing on' and no aria-label.",
        "suggested_fix": "Set the button's aria-label to the complete board text while preserving the visible fixing indicator. Add an AC4 test with fixing enabled, including reduced motion.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The notice board draws and scrolls the status as requested, and the layout tests pass. One accessibility detail needs fixing: when automatic fixing is enabled, the button's spoken name includes extra text beyond the board's message."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "64f6731499b8bc19777c550b09ce7d35ecb8ce0b",
    "thread_id": "01a1645e-d74f-78e1-aaa1-20cb22572061",
    "seconds": 21,
    "usage": {
      "input_tokens": 270264,
      "cached_input_tokens": 217600,
      "cache_write_input_tokens": 0,
      "output_tokens": 1716,
      "reasoning_output_tokens": 193
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T16:09:50.893Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "boardDots() uses LCD.F5 in capitals; render() preserves the native button, tooltip, tone classes and activation behaviour. Passing AC1 tests cover glyphs, colours and pressing the button."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "boardText() assembles the required status and ticket messages in order, returning 'Reload page' when stale. Passing AC2 tests exercise these states."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "boardFrame() scrolls overflowing text at 30 dots per second with a 16-dot gap. Passing AC3 tests cover looping, fitting text, narrow boards and reduced motion."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "render() now sets aria-label to the complete boardText() result. Passing AC4 tests cover fixing enabled, reduced motion, stale pages, refresh continuity and resetting changed text."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Passing browser tests check overlap and mobile button height from 320 px upwards. The reported targeted run has 238 passes, no failures and three skips; existing label checks were updated for the board."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:3178",
        "issue": "The visible 'Fixing on' indicator previously added extra words to the button's accessible name.",
        "suggested_fix": "Implemented: aria-label explicitly supplies the board's complete text, with regression coverage for fixing enabled, reduced motion and stale pages.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The notice board meets all five criteria. The accessibility issue is fixed, the targeted tests pass, and no blocking concerns remain."
  }
}
```

</details>
