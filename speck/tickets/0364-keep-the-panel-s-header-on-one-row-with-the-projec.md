---
id: "0364"
title: "Keep the panel's header on one row with the project always shown"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-keep-the-panel-s-header-compact-all-the-time.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0363"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T15:26:17.888Z"
approved: "2026-10-22T15:44:43.293Z"

---
# 0364 · Keep the panel's header on one row with the project always shown

**Status:** 👍 approved

## Problem
In a narrow window, such as the browser pane in Cursor or the Claude desktop app, the header takes two rows and drops to one as you scroll, hiding the project and base branch. It looks unsettled, and you can lose track of which repo the panel is for. It also shows speck twice: the logo mark, and the builder on the Foreman's button.

## Outcome
The header is always one compact row that shows the project and base branch, with speck's mark once.

## Acceptance criteria
1. Under 700 px wide, the header is always one row, whether or not the page is scrolled: speck's mark, the project and base branch, the Foreman's button, Settings and light/dark, in that order. Scrolling never changes its height or what it shows, and it's at most 60 px tall plus the top safe-area inset.
2. The project and base branch show at every width, as today's "<project> · base <branch>". When the row is too narrow, they're cut short at the end with an ellipsis, never hidden, and their full text shows in a tooltip. At 500 px wide, with project `speck`, base `main` and the Foreman reading "Building 1", nothing in the header is cut short.
3. Under 700 px wide, the "speck" word next to the mark is hidden, and the mark stays. At 700 px and wider, the header looks as it does today, apart from AC4.
4. At every width, the Foreman's button shows its word without the builder character, with its colours, its tooltip and what pressing it does unchanged.
5. At 320 px wide, nothing scrolls sideways or overlaps, and every header button is at least 44 px tall. Jumping to a ticket and opening the full ticket still show their target below the header. No test that passed before this change fails, except checks of the header slimming as you scroll, the builder on the Foreman's button and the "speck" word under 700 px, which are changed to check these criteria.

## Out of scope
- The scrolling notice board in place of the Foreman's button (`speck/ideas/2026-10-22-a-scrolling-dot-matrix-notice-board-in-the-header.md`).
- The builder badges on tickets in the queue, the app icon and the "control panel" label at 700 px and wider.

## Notes
- Today: the header markup and the 0160 slim-on-scroll script in `templates/panel.html`, with its layout under `@media (max-width: 699.98px)` (0150, 0160, 0163, 0309).
- The project and base branch stay fixed text in the header, not words on a future notice board: you should read where you are at a glance, without waiting for the words to scroll round.
- One logo: speck's mark stays. The builder character on the Foreman's button goes, and the "speck" word goes under 700 px, to leave room for the project.
- The Foreman's words today: "Off", "Idle", "Building <n>", "Shipping <id>", "Needs you <n>" and "Waiting: <why>" (`scripts/foreman.mjs`). A long one is cut short with an ellipsis, as now.
- Failing before this build: none
- Self-check: on a phone, "Fixing on" beside a long Foreman word could spill out of the button onto Settings at 320 px, so it now gives way inside the button too, with a test. The brief's line about the header slimming on a phone now says it's one row.
- Changed older tests, as AC5 allows: the header slimming as you scroll (0160, 0163, 0170, 0309), the builder on the Foreman's button (0127, 0140, 0144, 0150, 0163, 0199, 0203, 0303, logo-0320) and the "speck" word under 700 px (0170, 0304, 0309). Also 0140 AC3 and 0309's check that the project shows in full at 375 px: on the one row, those tests' `speck-xxxxxx` project is cut short with an ellipsis at 375 px, as AC2 allows (it's in full at 500 px with `speck`).

## In plain words
On a phone or in a narrow window, the panel's header is now always one row. It no longer changes as you scroll, and it always shows which project and base branch you're looking at. If the name doesn't fit, it ends in "…", and hovering over it shows it in full. On a narrow screen, speck's mark shows without the word "speck" beside it. At every width, the Foreman's button shows its status word without the little builder character, so speck's logo appears only once. To see it, open the panel in a narrow window and scroll. Keep an eye on the Foreman's button on a phone with Fixing on: there isn't much room, so its words are cut short.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The new brief test asserts exact prose wording with /slimmed to one row/.; F2 The long-project tooltip test expects 'speck · base main' after replacing the displayed project and branch with long values.
Round 2 (codex): approve.
Round 3 (codex, merge round): approve.

## Delivery log
- Review rounds: 3, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 908,791
- Elapsed since build started: 18 min
- Changed lines: 111 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- On a phone with Fixing on, the Foreman's button is cut down to "Bui… | Fix…" at 375 px: `speck/ideas/2026-10-22-fit-the-foreman-s-button-on-a-phone-with-fixing-on.md`.
- `lcd.js` still has `mini()`, the Foreman's builder, which the panel no longer uses. It's the design's renderer, and 0320's test fixes its code, so it was left as it is.

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
    "reviewed_sha": "e6aec1264a4adc1a984a6aa39a49e10f2de7d203",
    "thread_id": "01a16444-0c74-7430-b620-50344a771c6b",
    "seconds": 36,
    "usage": {
      "input_tokens": 166560,
      "cached_input_tokens": 105600,
      "cache_write_input_tokens": 0,
      "output_tokens": 912,
      "reasoning_output_tokens": 80
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T15:39:39.288Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html removes scroll slimming and sets the narrow header to one flex row. Passing panel-0364 tests cover 320–699 px, scrolling and safe-area insets."
      },
      {
        "id": 2,
        "status": "unclear",
        "evidence": "Passing tests cover full text at 500 px and truncation at 320 px. However, panel-0364.test.mjs:137–143 changes the visible project after initialisation and asserts the old tooltip, so it does not verify that a truncated long project's full text appears in its tooltip."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The narrow media rule hides .logo .name and retains the mark. Passing browser tests cover narrow widths and the 700 px boundary; wider layout rules remain unchanged."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "render() removes the builder while retaining tone classes, title and interaction. Passing panel-0364 AC4 tests check words, colours, tooltip and opening/closing details."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Passing browser tests cover overlap, sideways scrolling, 44 px button heights, Fixing on, ticket jumps and full-ticket access. Recorded run: 251 passed, zero failed, three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0364.test.mjs:179",
        "issue": "The new brief test asserts exact prose wording with /slimmed to one row/. The review rules explicitly prohibit tests that check a document's exact wording.",
        "suggested_fix": "Remove this prose assertion and its unused imports. Check the brief by review; retain the tests of actual header behaviour.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/panel-0364.test.mjs:137",
        "issue": "The long-project tooltip test expects 'speck · base main' after replacing the displayed project and branch with long values. Its assertion does not check the behaviour claimed by its name or fully exercise AC2.",
        "suggested_fix": "Supply the long project and branch before the page script initialises, then assert that the truncated header's tooltip equals their full text. No dynamic tooltip update is required by the ticket.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The compact header appears to work, and the reported tests pass. Before approval, remove a prohibited documentation-wording test and correct the long-name tooltip test so it verifies the full name users would see."
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
    "reviewed_sha": "3db7e0e27611a16ec8ca35c8430e9d3790ba6215",
    "thread_id": "01a16444-0c74-7430-b620-50344a771c6b",
    "seconds": 21,
    "usage": {
      "input_tokens": 297830,
      "cached_input_tokens": 230016,
      "cache_write_input_tokens": 0,
      "output_tokens": 1486,
      "reasoning_output_tokens": 80
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T15:40:29.592Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html uses one narrow header row without scroll-dependent styles or script. Passing panel-0364 browser tests cover 320–699 px, scrolling, height and safe-area insets."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The .repo styles retain visible text with ellipsis; initialisation sets its full-text tooltip. The corrected passing test supplies long project and branch names before initialisation and checks truncation and the matching full tooltip. The 500 px test verifies uncut text."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The narrow media rule hides the speck word and retains its mark. Passing browser tests verify narrow widths and the unchanged wider presentation at 700 and 1200 px."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "render() shows the Foreman's label without a builder while retaining tone classes, tooltip and interaction. Passing AC4 tests verify these behaviours."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Passing browser tests verify no sideways scrolling or overlap at 320 px, 44 px button heights, long Foreman text with Fixing on, and ticket navigation below the header. The recorded run has 250 passes, zero failures and three skips."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0364.test.mjs",
        "issue": "The documentation test checked exact prose wording.",
        "suggested_fix": "Remove the prose assertion and unused imports.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/panel-0364.test.mjs",
        "issue": "The long-project tooltip test previously asserted the old short project name.",
        "suggested_fix": "Initialise with long project and branch names and assert their full text in the tooltip.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The header stays compact while scrolling, keeps the project visible and removes the duplicate builder character. Both test issues are fixed, all acceptance criteria pass, and no blocking concerns remain."
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
    "reviewed_sha": "808cc483f8c64afeb4f1c8f37a9191eaa435c2a2",
    "merge": true,
    "thread_id": "01a16444-0c74-7430-b620-50344a771c6b",
    "seconds": 20,
    "usage": {
      "input_tokens": 439984,
      "cached_input_tokens": 367104,
      "cache_write_input_tokens": 0,
      "output_tokens": 2019,
      "reasoning_output_tokens": 80
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T15:44:41.415Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Header implementation is unchanged since approval. Passing panel-0364 browser tests verify one row at 320–699 px, stable height while scrolling and safe-area handling."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing panel-0364 tests verify full text at 500 px, visible ellipsis for long names at 320 px and the matching full-text tooltip."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing browser tests verify the mark remains and the speck word hides below 700 px; wider presentation is retained at 700 and 1200 px."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The unchanged render() implementation retains the Foreman's word, tone, tooltip and interaction without its builder. Both AC4 tests pass."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Passing tests cover 320 px overflow, overlap, button heights and ticket navigation. The revised panel-0055 assertion concerns the removed builder, as AC5 permits, and preserves the other reduced-motion checks. Latest run: 131 passed, zero failed, three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0364.test.mjs",
        "issue": "The documentation test checked exact prose wording.",
        "suggested_fix": "Remove the prose assertion and unused imports.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/panel-0364.test.mjs",
        "issue": "The long-project tooltip test previously asserted the old short project name.",
        "suggested_fix": "Initialise with long project and branch names and assert their full text in the tooltip.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The header continues to meet all five criteria. The additional test change correctly accounts for removing the builder and preserves the remaining reduced-motion checks. No blocking concerns remain."
  }
}
```

</details>
