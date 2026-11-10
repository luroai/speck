---
id: "0601"
title: "Make the panel's border lines a little more visible"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
approved: "2026-11-10T08:41:56.237Z"
finished: "2026-11-10T08:45:47.434Z"

---
# 0601 · Make the panel's border lines a little more visible

**Status:** ✅ done

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
The thin lines in the panel, between rows, round boxes and under headings, are now a shade darker and a full pixel wide, so they're easier to see, in both the light and the dark look. On an ordinary screen they used to look fainter than on a sharp one; now they look the same on both. The lines between the figures at the top of the Shipped lane changed the same way. Nothing else changed colour, and rows keep their spacing.

To see it, open the panel and look at the rows in any lane, or at Settings; switch between the light and dark look in Settings to compare.

Worth knowing: a greyed-out Set ready or Save all button keeps its finer outline, so it stays the same size as when it's enabled. Small outlined parts, such as tags, are now half a pixel bigger on each side.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The statistics tiles still draw half-pixel dividers: their .5px grid gap exposes the --line background.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 292,091
- Elapsed since build started: 10 min
- Changed lines: 146 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Tests changed to the new line colours or widths:
- `test/support/panel.mjs`: the agreed colour block (`PALETTE`) has the new `--line` and `--line-soft`.
- `test/mockup-0126.test.mjs` (0126 AC2), `test/panel-0134.test.mjs` (0134), `test/panel-0136.test.mjs` (0136) and `test/panel-0147.test.mjs` (0147 AC1): the new light and dark line colours.
- `test/panel-0426.test.mjs` (0426 AC2) and `test/panel-0577.test.mjs` (0577 AC1): `--line` no longer equals the design's `--border`, which stays as it was; they now check the new colours.
- `test/panel-0160.test.mjs` (the sticky header's bottom line) and `test/panel-0600.test.mjs` (0600 AC1, the rows' hairline): 1 px instead of half a pixel.

Follow-ups (Delivery log only, no inbox note):
- Known limit: the disabled Set ready and Save all buttons still draw a half-pixel outline in the line colour, as they only recolour the enabled button's outline. Making them 1 px would need the enabled buttons to change too.
- Tidy-up: `docs/design/lcd/panel-mock.html`, the old LCD design mock, still has the half-pixel lines; it isn't the panel and was left alone.

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

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "5d085f5910d4fd8e44c898c476e3e9fe2fb42803",
    "session": "continued",
    "thread_id": "01a1c49c-6d0c-7823-81f9-26a244b5fcdd",
    "builder_response": "- Tests run: test/panel-0601.test.mjs test/panel-0134.test.mjs test/panel-0136.test.mjs test/panel-0147.test.mjs test/mockup-0126.test.mjs test/panel-0160.test.mjs test/panel-0577.test.mjs test/panel-0600.test.mjs test/panel-0426.test.mjs test/panel-0157.test.mjs test/panel-0161.test.mjs test/panel-0420.test.mjs test/panel-0428.test.mjs test/panel-0162.test.mjs test/panel-0427.test.mjs test/panel-0453.test.mjs (this ticket's own file, the existing test files it changed, and the test files about the Shipped lane's stats tiles).\n- F1: fixed. `.stats` in templates/panel-cards.css now has `gap: 1px` over its `var(--line)` background. The 0601 AC2 test now also finds every rule with a line-coloured background and fails on any `gap`, `row-gap` or `column-gap` under 1 px, and checks `.stats` directly; with the old `.5px` gap put back it fails. A search of all five stylesheets found no other line-coloured background, box-shadow or pseudo-element divider.\n- Pictures retaken, adding the Shipped lane with its stats in both looks.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 290941,
      "cached_input_tokens": 225152,
      "cache_write_input_tokens": 0,
      "output_tokens": 1150,
      "reasoning_output_tokens": 10
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 4444,
      "cached": 124672,
      "write": 0,
      "output": 533
    },
    "cost_usd": 0.0266852,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T08:41:45.963Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-base.css defines --line and --line-soft as #D9DCE1 in light and #383B41 in dark. Passing test 0601 AC1 checks both tokens in both looks."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The five panel stylesheets use 1px for the formerly half-pixel line borders. templates/panel-cards.css .stats now also uses gap: 1px. Passing test 0601 AC2 checks border widths and background-drawn statistics dividers. Disabled button outlines retain their widths as specified in the ticket's Notes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The CSS diff preserves other colour tokens, fills, padding and spacing declarations. Passing test 0601 AC3 checks representative bar and text colours, unchanged button outlines and row padding."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Existing colour and width tests are updated and listed in the ticket's Delivery log. The current test output reports 257 passes, zero failures and three skips; the previous broader run also had zero failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-cards.css:182",
        "issue": "The statistics tiles previously retained half-pixel dividers through their grid gap.",
        "suggested_fix": "Use a 1px statistics grid gap and cover the background-drawn divider in the AC2 test.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The panel's lines are slightly darker and thicker in both looks, including the previously missed statistics dividers. Other styling remains unchanged. The relevant tests pass, and no blocking concerns remain."
  }
}
```

</details>
