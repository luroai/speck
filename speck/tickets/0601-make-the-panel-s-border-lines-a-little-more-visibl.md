---
id: "0601"
title: "Make the panel's border lines a little more visible"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0600"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T08:31:49.058Z"

---
# 0601 · Make the panel's border lines a little more visible

**Status:** 🔍 reviewing

## Problem
The panel's border lines, between rows, round boxes and under headings, are hard to see: they're a very pale grey (#E4E6EA in the light look, #2A2D31 in the dark) and most are drawn half a pixel wide, which a standard-density screen draws fainter still. The user asked for them to be a tiny bit more visible.

## Outcome
The panel's border lines are a little more visible, alike on every screen, in both looks.

## Acceptance criteria
1. The line colours `--line` and `--line-soft` are #D9DCE1 in the light look and #383B41 in the dark look.
2. Every border, divider and row separator drawn in those colours is 1 px wide instead of half a pixel, so it shows the same on a standard and a high-density screen.
3. Nothing else changes colour or size: the black bar, text, buttons' fills and the spacing between rows stay as they are.
4. Tests that checked those colours or widths are changed to the new ones, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Adding borders where there are none.

## Notes
- Asked for 2026-11-10: "Can we make the border lines a tiny bit more visible?"
- Decided: one step darker and a full pixel, rather than a lot darker, as the user asked for "a tiny bit". The new colours stay well below the text's contrast: about 1.37:1 against the light background (from 1.25:1) and 1.67:1 against the dark (from 1.35:1).
- Today: the tokens are in `templates/panel-base.css` (light at about line 13, dark at about line 122); `.5px solid var(--line…)` appears about 70 times across `panel-base.css`, `panel-cards.css`, `panel-popups.css`, `panel-settings.css` and `panel-header.css`.
- Waits for 0600, which changes the lanes' row separators.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes. Borders that start in a line colour and are recoloured on hover or when picked (tags, priority buttons, Close) take the new 1 px with them. The disabled Set ready and Save all buttons keep their half-pixel outline, as it is the enabled button's own width only recoloured, so the button doesn't change size when it is disabled.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Tests changed to the new line colours or widths:
- `test/support/panel.mjs`: the agreed colour block (`PALETTE`) has the new `--line` and `--line-soft`.
- `test/mockup-0126.test.mjs` (0126 AC2), `test/panel-0134.test.mjs` (0134), `test/panel-0136.test.mjs` (0136) and `test/panel-0147.test.mjs` (0147 AC1): the new light and dark line colours.
- `test/panel-0426.test.mjs` (0426 AC2) and `test/panel-0577.test.mjs` (0577 AC1): `--line` no longer equals the design's `--border`, which stays as it was; they now check the new colours.
- `test/panel-0160.test.mjs` (the sticky header's bottom line) and `test/panel-0600.test.mjs` (0600 AC1, the rows' hairline): 1 px instead of half a pixel.

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
    "reviewed_sha": "5ec5a4150bf6ee21418595d7ae21df63453bdba3",
    "session": "fresh",
    "thread_id": "01a1c49c-6d0c-7823-81f9-26a244b5fcdd",
    "builder_response": "- Tests run: `speck test --related` with test/panel-0601.test.mjs (this ticket's own), the changed test files test/panel-0134, 0136, 0147, 0160, 0426, 0577, 0600, test/mockup-0126 and test/support/panel.mjs, and test/panel-0517.test.mjs (its 0517 AC3 timing check failed once in the first related run, under the load of 375 files, at 63 ms against 50 ms; it passed on its own and in this run). The changed support module brought in every test file that imports it: 375 files, all passing.\n- AC1: the light and dark `--line` and `--line-soft` values in templates/panel-base.css. The design's own `--border` (used only for the 4 px track steps) is unchanged, per AC3.\n- AC2: every `.5px solid var(--line…)` in the five panel stylesheets is now `1px`. Borders set in a line colour and recoloured on hover or when picked share the element's width, so they are 1 px too. The disabled Set ready and Save all buttons only recolour their enabled outline (`.5px solid var(--text)` / `var(--blue)`) to `--line`; they keep that half-pixel width so the button doesn't change size when disabled (AC3).\n- AC4: the changed tests are listed in the ticket's Delivery log.\n- Pictures: Build lane and Settings, in the light and dark looks.\n",
    "seconds": 25,
    "usage": {
      "input_tokens": 161825,
      "cached_input_tokens": 100480,
      "cache_write_input_tokens": 0,
      "output_tokens": 617,
      "reasoning_output_tokens": 10
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 61345,
      "cached": 100480,
      "write": 0,
      "output": 617
    },
    "cost_usd": 0.138908,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T08:39:32.746Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-base.css defines both line tokens as #D9DCE1 for light and #383B41 for dark. The passing 0601 AC1 test checks both."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "templates/panel-cards.css:182 leaves .stats at gap: .5px over background: var(--line), drawing half-pixel dividers between tiles. The 0601 AC2 test scans border and outline declarations only, so misses these dividers."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The CSS diff changes only the requested line tokens and border widths; other colours, padding and spacing declarations remain unchanged. Passing 0601 AC3 checks representative colours, button outlines and row padding."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Existing colour and width assertions were updated and listed in the ticket's Delivery log. /tmp/speck-0601-tests.txt confirms 3451 passes, zero failures and three skips."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-cards.css:182",
        "issue": "The statistics tiles still draw half-pixel dividers: their .5px grid gap exposes the --line background. This misses AC2 despite its test passing.",
        "suggested_fix": "Change the statistics grid gap to 1px and extend the AC2 test to check this background-drawn divider.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The requested darker colours and most thicker lines are implemented, and the reported tests pass. One divider was missed: the lines between statistics tiles remain half a pixel wide. Fix that divider and add coverage before approval."
  }
}
```

</details>
