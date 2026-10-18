---
id: "0303"
title: "Put the header's mark and the Foreman's builder on the LCD screen"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0302"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T21:51:29.988Z"
approved: "2026-10-18T22:06:11.263Z"

---
# 0303 · Put the header's mark and the Foreman's builder on the LCD screen

**Status:** 👍 approved

## Problem
After 0302, the badges are drawn on the LCD screen, but the header's mark and the Foreman's button still use the old drawing. The design (`docs/design/lcd/panel-mock.html`) puts both on the same screen.

## Outcome
The header's mark and the builder on the Foreman's button are drawn on the LCD screen, as the design shows them.

## Acceptance criteria
1. The header's mark is drawn with the renderer's `tile(canvas, PANEL, 'still', { cols: 16, rows: 16, k: .3, ox: 8, oy: 15, still: true })` at 19 px, with the screen and unlit dots transparent, the ink the page's text colour and the speck the panel's `--dot`, as in `docs/design/lcd/panel-mock.html`.
2. The Foreman's button shows the renderer's `mini(canvas)` builder at 28 px before its status. It hops while builds are running and is still otherwise, through the mini builder's own `set(true)` and `set(false)`.
3. Both follow the panel's light and dark looks.
4. Nothing else in the header changes. (checked by review)

## Out of scope
- The badges: 0302.

## Notes
- See 0302's Notes for where the design and its renderer are.
- Failing before this build: none
- Self-check: the Foreman's builder was made before its canvas was in the button, so it took the light look's screen colours when the panel opened dark; it's made once the canvas is in place now, with a test, and the browser test opens the panel in each look. The old drawing's tests are retired (0163's drawing test, 0170's and 0184's checks of the header's SVG mark, test/support/badge.mjs), and the browser tests that spotted a refresh by a new canvas in the button now look for a new label, as the builder's canvas stays. On a phone the mark is 19 px too, as AC1 gives, in place of 0.9 em.

## In plain words
The little speck logo before "speck" at the top of the panel, and the builder in the Foreman's button, are now drawn in the same dot-matrix LCD style as the ticket badges. The logo is drawn in dots in the text colour with the red speck and nothing behind it. The builder sits on its own small LCD screen. It hops while builds are running and stands still otherwise. Switch between light and dark with the header's button and both change with it. On a phone the logo is a touch larger than before (19 px), as the design shows it. With reduced motion turned on, the builder doesn't move.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 373,886
- Elapsed since build started: 15 min
- Changed lines: 124 (limit 5000)
- Follow-ups: none.

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
    "reviewed_sha": "818d6bb6896e91d0a3adc6372e473f4472c49dca",
    "thread_id": "01a15108-1e07-7782-8a62-96e1ba801760",
    "seconds": 18,
    "usage": {
      "input_tokens": 129816,
      "cached_input_tokens": 79488,
      "cache_write_input_tokens": 0,
      "output_tokens": 643,
      "reasoning_output_tokens": 25
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T22:01:07.000Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html creates headerMark with the exact tile arguments and applies 19 px sizing and transparent screen tokens. panel-0303.test.mjs checks the renderer call, styling and actual browser pixels; all passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "builderFor() and startBuilder() retain a 28 px mini canvas before the status and call its set(true/false) on activity changes. Passing 0303 tests check these transitions; retained 0163 browser tests verify actual movement and stillness."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/lcd.js Screen.look() and relook() read canvas colour tokens and respond to theme changes. The passing 0303 browser test checks both canvases when opened in each theme and after switching."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Reviewed the templates/panel.html diff: header changes are confined to the mark, mini builder and their rendering lifecycle. Existing labels, controls and layout rules remain intact apart from the mark's required 19 px sizing."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The header mark and Foreman's builder now use the LCD renderer, with correct colours in both themes. The builder moves during builds and stays still otherwise, respecting reduced motion. The reported tests passed, including browser checks. No blocking concerns found."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "d7692e67631c1d58ac3dc3f5b76e61c2e7659399",
    "merge": true,
    "thread_id": "01a15108-1e07-7782-8a62-96e1ba801760",
    "seconds": 15,
    "usage": {
      "input_tokens": 242259,
      "cached_input_tokens": 183936,
      "cache_write_input_tokens": 0,
      "output_tokens": 1168,
      "reasoning_output_tokens": 25
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T22:06:07.937Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html headerMark uses the exact tile arguments; .logo .mark sets 19 px dimensions and the required transparent and colour tokens. All corresponding panel-0303 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "builderFor() calls the mini renderer's set(true/false) when activity changes; render() places its retained canvas before the status. CSS sets 28 px dimensions. Passing 0303 tests exercise creation and transitions; previously passing 0163 browser tests check actual motion and stillness."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The renderer's Screen.look() and relook() apply theme tokens to both canvases. The 0303 browser test passed for opening in each theme and switching between them."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Reviewed the current implementation and changes since round 1: header changes remain confined to the mark and builder. This round changes only related tests and ticket records."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The LCD mark and builder still meet every criterion. The two updated tests appropriately accommodate the new renderer and retained canvas without removing their intended checks. This round passed with no failures; no blocking concerns remain."
  }
}
```

</details>
