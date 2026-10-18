---
id: "0305"
title: "Make the app icon the speck on the LCD screen"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0303"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T22:08:25.582Z"
blocked_at: ""
waited_seconds: 238
approved: "2026-10-18T22:19:05.140Z"

---
# 0305 · Make the app icon the speck on the LCD screen

**Status:** 🔍 reviewing

## Problem
The panel's app icon, which a phone shows when the panel is added to its home screen and a browser shows in its tab, is today's line drawing of speck. The LCD design puts speck on a dot-matrix screen everywhere.

## Outcome
The panel's app icon is speck drawn on the LCD screen, as the design draws its mark.

## Acceptance criteria
1. `templates/icons/icon.svg`, `icon-192.png`, `icon-512.png` and `apple-touch-icon.png` show the design's still mark, the same dots as the header's mark (0303) from the renderer's `tile(…, PANEL, 'still', { cols: 16, rows: 16, k: .3, ox: 8, oy: 15, still: true })`, as square dots in the light look's screen ink (`#20241d`) with the speck in its red (`#d63f28`), on the light look's screen colour (`#c3c9b1`).
2. The mark fills the icon with the same margin on every side, so a phone's rounded corners don't cut into it.
3. The PNGs are 192, 512 and 180 pixels square, as today, with sharp dot edges.
4. The manifest and the page's icon links are unchanged, apart from anything the new icons need.

## Out of scope
- The header's mark: 0303.

## Notes
- The icons are served from `templates/icons/` by `scripts/panel.mjs` (0149). The design's renderer is `docs/design/lcd/lcd.js`; the dots can be read from it once and written into the SVG, so the icon doesn't run any script.
- Failing before this build: none
- Unlit dots aren't drawn, as in the header's mark (0303): the icon is the screen colour with the ink and red dots on it, the three colours AC1 names.
- The old drawing's tests are retired, as the icons no longer show it: 0149's check that each PNG is the eared logo, 0170's AC1, AC2 and AC5 checks of the eared mark (its AC4 still checks the icons are served), and all of panel-0184.test.mjs, which only checked the eye in icon.svg and the PNGs. icons-0305.test.mjs checks the new icons; 0149's browser test still checks that icon.svg and the apple-touch-icon draw the same.
- Self-check: no changes. The PNGs use whole-pixel dots, 9 px apart at 180 and 192 and 24 px at 512, chosen so the margins match exactly on each side; icon.svg is laid out as the 180 px icon.
- Went with the recommendation: keep it centred, with square dots (chosen by the user in the panel, 2026-10-18 22:18 UTC).

## In plain words
The panel's app icon, which shows in a browser tab and on a phone's home screen when the panel is added there, is now speck on the LCD screen: the same dark dots and red speck as the mark in the panel's header, on the screen's grey-green. To see it, open the panel and look at its tab, or add it to a phone's home screen. The mark is centred, with a little more space at its sides than above and below because it's taller than it is wide. A phone or browser that kept the old icon may keep showing it until its cache is cleared.

## Blocked question
The speck mark is 13 dots wide and 15 tall, so with square dots it can't have the same gap on all four sides of a square icon. The new icon centres it, with equal gaps above and below (about 13% of the icon) and slightly wider equal gaps left and right (about 18%). Is that fine, or should all four gaps match, by making the dots a little wider than tall so the mark becomes square? I recommend keeping it centred as it is: the dots stay square like the header's mark and the screen, and the extra space at the sides is barely noticeable.
Recommended: keep it centred, with square dots
Changes what you'd notice: yes
Clear winner: yes

## Review log
Round 1 (codex): escalate: F1 Criterion 2 says equal margins on every side, but the implementation and test interpret this as equal opposite margins.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 575,277
- Elapsed since build started: 11 min
- Changed lines: 63 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · escalate</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "9036ae6012ebad721ed4c19d45fc70d6610b428a",
    "thread_id": "01a15114-044b-7802-b720-487678434536",
    "seconds": 32,
    "usage": {
      "input_tokens": 227829,
      "cached_input_tokens": 171136,
      "cache_write_input_tokens": 0,
      "output_tokens": 1350,
      "reasoning_output_tokens": 346
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T22:14:20.339Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "escalate",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/icons-0305.test.mjs AC1 tests pass: SVG and PNG dots match the actual renderer via markDots(), with the specified three colours and square dots."
      },
      {
        "id": 2,
        "status": "unclear",
        "evidence": "The mark is centred, but all four margins are not equal. Independently measured PNG margins: 180px has 32px horizontally and 23px vertically; 192px has 38px and 29px; 512px has 102px and 78px. The AC2 test checks only opposite margins."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing AC3 test checks dimensions and every pixel's colour. PNGs have the required sizes and only the three solid colours, without blended edges."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Manifest and page files are unchanged against main. The passing AC4 test verifies their icon entries and links."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/icons-0305.test.mjs",
        "issue": "Criterion 2 says equal margins on every side, but the implementation and test interpret this as equal opposite margins. Preserving the renderer's rectangular dot pattern on a uniform square grid prevents its visible bounds from having four equal margins in a square icon.",
        "suggested_fix": "Confirm whether centred artwork with equal opposite margins satisfies the intended design, then align criterion 2 and its test with that decision.",
        "state": "open"
      }
    ],
    "escalation_question": "Does criterion 2 mean centred artwork with equal opposite margins, as implemented, or must all four visible margins be equal even if that requires changing the mark's proportions or spacing?",
    "summary": "The icons correctly show the LCD mark with sharp dots, the requested colours and sizes, and unchanged icon links. Tests pass. Approval needs one design clarification: the artwork is centred, but the side margins are wider than the top and bottom margins."
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
    "reviewed_sha": "a1fc9491bd5c0c069190ff0fe9ebef77b7a5427c",
    "thread_id": "01a15114-044b-7802-b720-487678434536",
    "seconds": 13,
    "usage": {
      "input_tokens": 344265,
      "cached_input_tokens": 284160,
      "cache_write_input_tokens": 0,
      "output_tokens": 1833,
      "reasoning_output_tokens": 346
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T22:18:57.963Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The three AC1 tests in test/icons-0305.test.mjs pass, comparing SVG and PNG dots with the design renderer through markDots() and checking square dots and the specified colours. Artwork and tests are unchanged since round 1."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The ticket Notes record the user's choice to keep the mark centred with square dots. The passing AC2 test verifies equal opposite margins, corner clearance and that the mark fills the icon."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing AC3 test checks all three PNG dimensions, RGB format and every pixel's colour, confirming sharp edges without blended colours."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Manifest and page icon links remain unchanged. The passing AC4 test verifies the manifest entries and page links."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/icons-0305.test.mjs",
        "issue": "The meaning of equal margins required a product decision.",
        "suggested_fix": "The user chose centred artwork with square dots and equal opposite margins, as recorded in the ticket Notes. The existing implementation and test meet that decision.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The icons correctly show the LCD mark with sharp square dots, the requested colours and sizes, and unchanged icon links. The user resolved the margin question by choosing centred artwork. All criteria pass; no blocking concerns remain."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "97a1542b133505554ca31bad178eccca3ae233f1",
    "merge": true,
    "thread_id": "01a15114-044b-7802-b720-487678434536",
    "seconds": 14,
    "usage": {
      "input_tokens": 494119,
      "cached_input_tokens": 415872,
      "cache_write_input_tokens": 0,
      "output_tokens": 2304,
      "reasoning_output_tokens": 370
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T22:22:30.696Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The icons and renderer-based checks are unchanged from the approved round. All three AC1 tests in test/icons-0305.test.mjs pass, checking the dot pattern, square dots and specified colours."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The recorded user decision permits centred artwork with equal opposite margins. The passing AC2 test checks those margins, corner clearance and the mark's size."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing AC3 test verifies 192, 512 and 180 pixel square PNGs and checks every pixel uses one of the three solid colours, confirming sharp edges."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The manifest and page icon links remain unchanged against the merged main. The AC4 test passes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/icons-0305.test.mjs",
        "issue": "The meaning of equal margins required a product decision.",
        "suggested_fix": "The user's recorded choice of centred artwork with square dots and equal opposite margins is implemented and tested.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The merged change preserves the approved LCD icons and the user's margin choice. The test-count fix addresses a regression caused by retiring the old artwork test while preserving the browser timeout and cleanup checks. All tests run this round pass, with no blocking concerns."
  }
}
```

</details>
