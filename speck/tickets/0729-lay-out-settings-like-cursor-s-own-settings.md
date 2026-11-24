---
id: "0729"
title: "Lay out Settings like Cursor's own settings"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "deep"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T11:55:19.985Z"
approved: "2026-11-24T16:17:27.122Z"

---
# 0729 · Lay out Settings like Cursor's own settings

**Status:** 👍 approved

## Problem
The panel mostly runs inside Cursor's browser pane, and its Settings view looks out of place there: raw config keys in a mono font as labels, explanations hidden behind ⓘ buttons, and bordered cards with dividers. Cursor's own settings show a plain name with a muted line under it, rows grouped on soft filled blocks under small section labels, and each control on the right.

## Outcome
Settings reads like a page of Cursor's settings: plain names, a muted line each, and rows grouped on filled blocks under small section labels.

## Acceptance criteria
1. Each setting row shows a plain name in the interface font (such as "Name", "Watch", "Bench"), with a short muted line under it saying what it does, and its control on the right of the row, as in Cursor's settings. No row shows a config key as its label; the key is in the row's tooltip.
2. Rows are grouped on rounded blocks filled with the raised background (`--raise`), with no borders round the blocks and no lines between their rows, each group under a small muted section label (such as "Startup" in Cursor). A team member's group opens with a row holding its character, name and one-line job.
3. No row has an ⓘ button. A setting's full explanation, with its default and where a change is saved, is still reachable from its row in one press, and a machine's own value and its clear option still show as today.
4. At 375 px wide every row fits with no sideways scroll, its name and muted line wrapping and its control staying on the right or going under it, and every control still has a 44 px target.
5. No test that passed before this change fails, except tests that pin the old layout (labels as keys, ⓘ buttons, card borders and dividers), which are changed to check the new one.

## Out of scope
- How controls look (switches, menus, boxes and buttons): a ticket of its own.
- When changes are saved: the Save button stays.
- Which settings Settings shows.

## Notes
- Raised by the user on 2026-11-24 with a screenshot of Cursor's General settings: "It needs to look like it's part of the existing Cursor app."
- Cursor's look in that screenshot: the page heading ("General"); each group a rounded block a shade off the page with no border; small muted labels above groups; a row is a name (about 13 px, regular) over a muted description, with the control right-aligned; generous padding, no dividers.
- The view is `templates/panel-settings.js` and `templates/panel-settings.css`; explanations come from `explainFully` in `scripts/settings.mjs`. The short muted line can be each explanation's first sentence, or a new short line per setting.
- Keep to the panel's own colour tokens in both looks, so the dark look matches Cursor's dark theme the same way.
- Failing before this build: none
- Builder: each setting's plain name and short line come from speck panel with its explanation (`label` and `summary`, beside `explain` in `scripts/settings.mjs` and `scripts/team.mjs`). A setting it gives no name for is named in words made from its key, never the key itself. Appearance and Auto-build, which have no key, have theirs in the view, under a "General" label.
- Builder: the name is a button that shows the full explanation, and its target reaches over the short line under it. A press shows it, the next hides it, and Enter or Space does the same from the keyboard. Nothing shows from the pointer resting on a row or from focus any more, as the name is a far bigger target than the info button was. A model drawn in its agent's row (without a list of your agents' models) is explained with its agent, as a role's effort already was (0405), since it has no name of its own.
- Builder: AC4's 44 px target for every control. Settings' menus and text and number boxes were about 22 px tall, and its switches and Appearance's buttons 26 px, so not every control had one. A menu can't be given a bigger target without being drawn bigger, so menus and boxes are now drawn at least 44 px tall. The switches, a risk's tick box with its word, a level's Remove and Appearance's buttons got invisible 44 px targets, which change nothing in their look. 0730 restyles the controls next and keeps the targets.
- Self-check: a setting named for the engineering manager with no short line would have thrown in speck panel and broken the Settings view, so that's guarded, with a test. Fixed a comment.
- speck (2026-11-24 12:28 UTC) told you: Nothing is stuck. About 19 minutes went on reading the large Settings code and its many older layout tests before writing any code, and about 9 more on proving the new tests fail on the old code, where each failing run sat for 85 to 90 seconds waiting for parts of the page that don't exist yet. On the new code the same tests pass in seconds, and the build is now checking what its browser test measures. Why: The build log's timestamps show where the time went, the slow runs were only the expected failures on the old code, and the machine's load of 85 to 154 slowed everything further.

## In plain words
Settings now looks like a page of Cursor's own settings. Each setting shows a plain name, such as Name, Watch or Bench, with a short grey line under it saying what it does, and its control on the right, or under the name on a narrow screen. Resting the pointer on a row shows the setting's technical name. Settings are grouped on soft grey rounded blocks under small grey labels, with no borders or dividing lines, and each member of Your team has a block of its own that starts with its picture, name and job. The ⓘ buttons are gone: press a setting's name or its short line to read its full explanation, and press again to hide it.

To see it, open Settings in the panel, in the light and the dark look. Worth knowing: the menus and text boxes are taller for now, so every control is easy to tap. The next ticket, 0730, restyles them to look like Cursor's.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,769,439
- Elapsed since build started: 262 min
- Changed lines: 291 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up ideas:
  - Each control in Settings is still named by its setting's key for screen readers (the Name box is read out as `speck_name`), while it shows a plain name. Saved to the inbox: `speck/ideas/2026-11-24-name-each-settings-control-by-its-setting-s-plain-name.md`.
- Known limits:
  - Menus and text and number boxes are drawn at least 44 px tall so that each has a 44 px target, which makes them look bigger until 0730 restyles the controls, keeping the targets.
  - A setting's short line is part of its name's press target, so its words can't be selected with the pointer. The full explanation's can.

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
    "reviewed_sha": "d6c58c2cf637ca8283e94af966c76497f4414e91",
    "session": "fresh",
    "thread_id": "01a20dd0-d8e8-7aa1-aa68-3ed8ab0fade9",
    "builder_response": "- Tests run: test/settings-layout-0729.test.mjs test/panel-0257.test.mjs test/panel-0268.test.mjs test/panel-0273.test.mjs test/panel-0275.test.mjs test/panel-0277.test.mjs test/panel-0281.test.mjs test/panel-0371.test.mjs test/panel-0385.test.mjs test/panel-0395.test.mjs test/panel-0417.test.mjs test/panel-0427.test.mjs test/panel-0428.test.mjs test/panel-0472.test.mjs test/panel-0593.test.mjs test/panel-0612.test.mjs test/settings-0381.test.mjs test/settings-0396.test.mjs test/settings-0397.test.mjs test/settings-0412.test.mjs test/settings-info-0405.test.mjs test/panel-0379.test.mjs test/panel-0432.test.mjs test/settings-levels-0666.test.mjs (with `commands.checks`), all passing.\n\nRound 1. Before it, `speck test --related` ran 487 test files (every one naming a file this branch changes, through test/support/panel.mjs for most): 4 failed, and the files above are the run its last line asked for once they were fixed. 0379 AC2 still pressed an info button, and 0432 AC1 looked for `max_parallel_builds` in the view's text: both pinned the old layout, so they now press the setting's name and look for its name in words. 0666 AC4's style check found my new 44 px rule first, as its pattern matches any selector list ending in `#settings .levels .ltextbtn`, so that rule lists it earlier. 0666 AC4 at 375 px was a real fault: the 44 px minimum width I gave a level's Remove replaced the flex row's automatic minimum, so beside a long level name the row squeezed Remove narrower than its word and the build levels box scrolled sideways by under a pixel. Remove, a risk's tick box with its word and Appearance's buttons, which have the same minimum, now never shrink (`flex: none`).\n\nWhat the change does, by criterion:\n\n- AC1: speck panel sends each setting's plain name and short line with its explanation (`label` and `summary` beside `explain` in `SETTING_GROUPS` in `scripts/settings.mjs`, and in `TEAM_GROUP` in `scripts/team.mjs` for the benches and QA's settings). The engineering manager's are called by `speck_name`, as their explanations are. `settingRow` and `settingInfo` in `templates/panel-settings.js` draw each row as its name (14 px, the interface font) over its short line (12 px, `--muted`) on the left and its control on the right. The key is the row's `title`, its tooltip. For a role's one list, which sets its model too (0400), that's `builder and builder_model`. A setting the server gives no name for is named in words made from its key (`keyWords`), never the key. Appearance and Auto-build have their names and lines in the view.\n- AC2: each group is a `section` with a small muted label (`.sh h4`, 12 px, `--muted`) over its `.block`s, each filled with `--raise`, with 12 px corners and no border. Rows have no borders, and the divider under each heading and the line above the build levels are gone. Each member's card in Your team is a block (`member block`) that opens with its `.mhead` row of character, name and job. Appearance and Auto-build had no heading; AC2 asks for every group to have a label, so they're under \"General\".\n- AC3: there are no info buttons. A setting's name is a button (`button.name`, with `aria-expanded`, and `aria-controls` and `aria-describedby` pointing at the explanation), and its `::after` covers the short line too, so one press on either shows the full explanation: the server's `explainFully` text, with its default and where a change is saved. The next press, Escape or a press elsewhere hides it. Nothing shows from the pointer resting on a row or from focus any more, as the name is a far bigger target than the info button was; Enter or Space works as a press. This machine's own value and its Clear button are in the explanation as before (`ownLine`). A model drawn in its agent's row, when there's no list of your agents' models, has no name of its own, so it's explained with its agent, as a role's effort already was (0405).\n- AC4: rows wrap (`flex-wrap`), the name taking at least 40% of the row, so a control too wide to sit beside the name goes under it, still on the right. Every control has a 44 px target. Settings' menus and text and number boxes were about 22 px tall, and its switches and Appearance's buttons 26 px, so not all had one. A menu can't be given a bigger target without being drawn bigger, so menus and boxes are now drawn at least 44 px tall. The switches, a risk's tick box with its word, a level's Remove and Appearance's buttons got invisible 44 px targets. These rules are in `panel-cards.css`, where 0417's test wants every 44 px rule for every pointer. The browser test in test/settings-layout-0729.test.mjs checks each control's target by hit-testing a 44 px cross round it at 375 px.\n- AC5: each existing test I changed pinned the old layout:\n  - Keys as labels: 0257 (row names, and a key followed by its value in the view's text), 0273 (a key breaking only at `_` or `.`), 0381 and the support module's `rowOf` (rows found by the key in their label, now by `data-key`), 0427 (its self-check named the rule that kept key labels in the monospace), 0432.\n  - Info buttons: 0268, 0275, 0281, 0371, 0379, 0385, 0395, 0397, 0405, 0412, 0417, 0428, 0472, 0593 and 0612. Each now presses the setting's name. Those that checked the button's hover pause and focus now check that nothing shows until a press.\n  - Dividers, groups with no label and one-line rows: 0277, whose check that the info buttons line up now checks that names and controls line up on the block's edges. 0396 (\"no heading over them\", and a one-line switch row), 0412 (a one-line Appearance row) and 0593 (a divider under each heading).\n\nThe brief's sentence on the Settings view now describes this layout. The review pack has pictures in both looks, at a desktop width and on a phone, and with an explanation open.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 367049,
      "cached_input_tokens": 267136,
      "cache_write_input_tokens": 0,
      "output_tokens": 800,
      "reasoning_output_tokens": 136
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 99913,
      "cached": 267136,
      "write": 0,
      "output": 800
    },
    "cost_usd": 0.2345396,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T13:49:06.414Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/settings.mjs and scripts/team.mjs supply plain labels and summaries; settingRow and settingInfo render them with key tooltips. AC1 tests in test/settings-layout-0729.test.mjs passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "settingGroup and memberCard create labelled blocks and team headers. panel-settings.css uses --raise, rounded corners and no borders or dividers. Structural and real-browser AC2 tests passed in both themes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "settingInfo replaces info buttons with pressable names; paired explanations retain defaults, save locations and ownLine clear options. AC3 tests and updated settings-info-0405 and settings-0397 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Wrapping rows and target sizing are implemented in panel-settings.css and panel-cards.css. The real-browser AC4 test passed at 375 px in both themes, checking placement, overflow and control hit targets."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0729-tests.txt: 304 passed, zero failed, three unrelated legacy skips. Updated tests replace assertions tied to the previous layout while retaining behavioural checks."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Settings now uses plain names, muted descriptions and rounded filled groups. Explanations and machine-specific clear options remain accessible. Browser tests confirm the layout fits a phone-width screen in both themes. No blocking issues found."
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
    "reviewed_sha": "3d0151f3113ce01d8971eb56e7d79e2951d85dec",
    "merge": true,
    "session": "continued",
    "thread_id": "01a20dd0-d8e8-7aa1-aa68-3ed8ab0fade9",
    "builder_response": "- Tests run: test/settings-layout-0729.test.mjs test/panel-0257.test.mjs test/panel-0268.test.mjs test/panel-0273.test.mjs test/panel-0275.test.mjs test/panel-0277.test.mjs test/panel-0281.test.mjs test/panel-0371.test.mjs test/panel-0385.test.mjs test/panel-0395.test.mjs test/panel-0417.test.mjs test/panel-0427.test.mjs test/panel-0428.test.mjs test/panel-0472.test.mjs test/panel-0593.test.mjs test/panel-0612.test.mjs test/settings-0381.test.mjs test/settings-0396.test.mjs test/settings-0397.test.mjs test/settings-0412.test.mjs test/settings-info-0405.test.mjs test/panel-0379.test.mjs test/panel-0432.test.mjs test/settings-levels-0666.test.mjs (with `commands.checks`), on the merged code: 304 passed, none failed.\n\nMerge round: `speck ship` hit a conflict merging this branch into main, so I merged main into it (`git merge main`, commit \"speck(0729): merge main\").\n\n- docs/brief.md (class `logic`, one conflict, the `speck panel` row of the commands table). Both sides had changed that one long line. main added a clause on an approved ticket built on one that hasn't shipped waiting under Building, and replaced the sentence on counting each session once with two newer ones. This branch replaced the sentence on the Settings view's layout (\"the rest in plain sections, each with a heading and a divider…\") with the new layout's. I took main's line whole and put this ticket's Settings sentences in place of the old one, so the merged line keeps both sides' changes. Against main, the only difference in the file is that sentence.\n- templates/panel-cards.css and templates/panel.js were changed on both sides and merged cleanly: main's changes there are to the Shipped figures' grid, a Plan card's chain and a cancelled `after:` ticket, and touch no rule or code of Settings'. Nothing else was changed in the merge.\n- I also checked what main brought in that could affect this change: its new more-contrast block (0708) has no Settings rules, and none of the tests main added or changed relies on the old Settings layout (0161's, 0476's and 0292's changes are about the contrast block's tokens, tab timing and Claude's output format).\n",
    "seconds": 84,
    "usage": {
      "input_tokens": 1767376,
      "cached_input_tokens": 1637888,
      "cache_write_input_tokens": 0,
      "output_tokens": 2063,
      "reasoning_output_tokens": 225
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 29575,
      "cached": 1370752,
      "write": 0,
      "output": 1263
    },
    "cost_usd": 0.2088552,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T16:17:21.511Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "SETTING_GROUPS, TEAM_GROUP, settingRow and settingInfo retain the approved plain names, summaries and key tooltips. The AC1 tests in test/settings-layout-0729.test.mjs passed on the merged code."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "settingGroup, memberCard and panel-settings.css retain rounded --raise blocks, muted section labels and team headers without dividers. Structural and browser AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "settingInfo and ownLine retain press-to-open explanations and machine-value clear options. AC3 tests and the paired-explanation regression tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Settings wrapping and target-size rules survived the merge unchanged. The real-browser test passed at 375 px in both themes, checking overflow, control placement and 44 px targets."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified the latest /tmp/speck-0729-tests.txt: 304 passed, zero failed and three legacy skips. The documentation conflict resolution preserves both sides; changes against merged main remain within this ticket's scope."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The merge preserves the approved Settings layout and main’s newer changes. All targeted tests still pass, including phone-width checks in both themes. No new blocking issues found."
  }
}
```

</details>
