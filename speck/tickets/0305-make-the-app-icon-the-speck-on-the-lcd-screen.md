---
id: "0305"
title: "Make the app icon the speck on the LCD screen"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0305 · Make the app icon the speck on the LCD screen

**Status:** 🔨 building

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
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
The speck mark is 13 dots wide and 15 tall, so with square dots it can't have the same gap on all four sides of a square icon. The new icon centres it, with equal gaps above and below (about 13% of the icon) and slightly wider equal gaps left and right (about 18%). Is that fine, or should all four gaps match, by making the dots a little wider than tall so the mark becomes square? I recommend keeping it centred as it is: the dots stay square like the header's mark and the screen, and the extra space at the sides is barely noticeable.
Recommended: keep it centred, with square dots
Changes what you'd notice: yes
Clear winner: yes

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
