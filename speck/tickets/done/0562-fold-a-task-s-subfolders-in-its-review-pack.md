---
id: "0562"
title: "Fold a task's subfolders in its review pack"                # one outcome, no "and"
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
after: ["0561"]                # ticket ids that must be done first
created: 2026-10-29
started: "2026-10-29T15:22:57.227Z"
approved: "2026-10-29T15:46:25.253Z"
finished: "2026-10-29T15:50:00.523Z"

---
# 0562 · Fold a task's subfolders in its review pack

**Status:** ✅ done

## Problem
In a task's review pack, every file in its output folder, however deep, is its own button labelled with its path from the project root. A research run with dozens of files in a subfolder becomes a long wall of buttons, and on a phone the repeated `outputs/<folder>/` at the start of each label takes a line of its own.

## Outcome
A task's review pack lists the files at the top of its output folder one by one, and each subfolder as one folded row, with each file named from inside the output folder.

## Acceptance criteria
1. In the panel's review pack for a task, each file at the top of its output folder is a row labelled with its name alone, and each folder directly inside the output folder is one row, folded at first, giving its name and how many files it holds however deep, for example `imports/ · 48 files` (`1 file` for one).
2. Pressing a folder's row unfolds it to a row for each file it holds however deep, labelled with its path inside that folder, in the same order as today, and pressing it again folds it. Each file's row opens it as today's buttons do: a Markdown file formatted in the panel, any other in a new tab.
3. Each file's row shows its full path from the project root as its tooltip.
4. A folder's row can be reached and pressed with the keyboard, and tells a screen reader whether it's unfolded.
5. No test that passed before this change fails.

## Out of scope
- `speck pack`'s Result list in the terminal, which keeps listing every file.
- The summary and where the Ship part goes (0561).

## Notes
- Asked for 2026-10-29, for the 0.21.1 patch release: a research task's review pack listed dozens of log files, each as its own button above Ship, so the user had to scroll past all of them to ship it.
- Waits for 0561: both change `documentsPart` in `templates/panel-popups.js` and the `.pack-documents` styles in `templates/panel-popups.css`. The summary's "Start here" row stays first, as 0561 leaves it, and isn't counted in a folder.
- The panel is a phone-width column (keep it thin): the rows are for a narrow screen first.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes. The older tests that checked each file's button was labelled with its path from the project root (0354, 0359, 0561) now check its name, with the path as its tooltip, as AC1 and AC3 ask.

## In plain words
A task's review pack no longer lists every file it wrote as its own long button. Files at the top of its folder are named simply, such as `memo.md`, and each subfolder is a single row saying how many files it holds, such as `imports/ · 48 files`. Press that row to see its files, and press it again to fold them away. Hovering over any file shows its full path.

To see it, open the review pack of a task whose output folder has a subfolder. The rows stack one per line, so they suit a phone-width panel. A folder you unfold stays open while the pack is up, and folds again the next time you open the pack.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 314,554
- Elapsed since build started: 23 min
- Changed lines: 79 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "e635cb3be0182a0db746ec7c14e1d872c9a6055d",
    "session": "fresh",
    "thread_id": "01a18849-f9db-7280-946c-95f6c4c888de",
    "builder_response": "- Tests run: `speck test --related` with test/pack-0562.test.mjs test/pack-0354.test.mjs test/pack-0359.test.mjs test/pack-0561.test.mjs test/pack-0363.test.mjs test/panel-0361.test.mjs test/panel-0473.test.mjs (plus every related file and the checks it brought in): 1219 pass, 0 fail, 3 skipped.\n- On AC5: AC1 and AC3 change each file button's label from its path from the project root to its name inside the output folder, with the path as its tooltip. Seven older tests (0354, 0359, 0361, 0363, 0473, 0561) found or checked the buttons by the old path label. Each now checks the same thing against the new label or the tooltip (the shared `docButtons` helper in test/support/documents.mjs matches by tooltip); none was dropped or loosened beyond the label the ticket changes. All pass.\n- Pictures: four, light and dark, folded and unfolded, taken in the real panel with a sample task's files.\n",
    "seconds": 31,
    "usage": {
      "input_tokens": 175878,
      "cached_input_tokens": 123648,
      "cache_write_input_tokens": 0,
      "output_tokens": 711,
      "reasoning_output_tokens": 48
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 52230,
      "cached": 123648,
      "write": 0,
      "output": 711
    },
    "cost_usd": 0.1239348,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-29T15:32:22.580Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-popups.js documentsPart groups files by their first folder and folderRow shows recursive counts, initially folded. Passing 0562 AC1 tests cover names, counts, summary placement and files without subfolders."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "folderRow toggles its file rows and preserves their supplied order; documentButton retains Markdown pop-ups and new tabs for other files. Three passing 0562 AC2 tests exercise these behaviours and reopening the pack."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "documentButton sets title to d.path. Passing 0562 AC3 test checks every file, including unfolded files and the summary."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "folderRow creates a native button with type=button and updates aria-expanded on each toggle. Passing 0562 AC4 test verifies these semantics and that toggling keeps the same button."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0562-tests.txt reports 1219 passed, 0 failed and 3 skipped. Existing test adjustments follow the requested label and tooltip changes without removing behavioural checks."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The review pack now shows shorter file names and collapses each subfolder into a row with a file count. Expanding folders preserves file order and opening behaviour, with keyboard-accessible controls and full-path tooltips. The tests pass, and I found no blocking issues."
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
    "reviewed_sha": "e383ba41ac90f430da72cadbf61af83898ba68be",
    "merge": true,
    "session": "continued",
    "thread_id": "01a18849-f9db-7280-946c-95f6c4c888de",
    "builder_response": "- Tests run: test/panel-0453.test.mjs test/panel-0472.test.mjs test/pack-0562.test.mjs test/pack-0354.test.mjs test/pack-0359.test.mjs test/pack-0561.test.mjs test/pack-0363.test.mjs test/panel-0361.test.mjs test/panel-0473.test.mjs (plus the checks): 173 pass, 0 fail, 3 skipped.\n- Ship handed this back: `0453 AC1 AC3` (real browser: every button on whole pixels with a full border) failed on the ticket merged with main. Cause: its own change, not main's. The test checks a list of buttons by their label and expected the task file's button to be labelled `outputs/0002/plan.md`. This ticket (AC1) labels it `plan.md`, so the button was never matched and the test's \"was checked\" assertion failed.\n- Fix: merged main into the branch (no conflicts). In test/panel-0453.test.mjs, the expected label is now `plan.md`. I also added a file in a subfolder (`notes/a.md`) to its sample pack and `notes/` to the list, so the new folder button gets the same pixel and border check. It passes. No code changed.\n",
    "seconds": 18,
    "usage": {
      "input_tokens": 313434,
      "cached_input_tokens": 242304,
      "cache_write_input_tokens": 0,
      "output_tokens": 1120,
      "reasoning_output_tokens": 48
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 18900,
      "cached": 118656,
      "write": 0,
      "output": 409
    },
    "cost_usd": 0.0537556,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-29T15:46:23.187Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "documentsPart and folderRow in templates/panel-popups.js retain top-level names, folded folders and recursive file counts. Both 0562 AC1 tests pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "folderRow preserves file order and toggles rows; documentButton preserves Markdown pop-ups and other files opening in new tabs. All three 0562 AC2 tests pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "documentButton sets each file's title to its full project path. The 0562 AC3 test passes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "folderRow uses native buttons and updates aria-expanded without replacing the focused button. The 0562 AC4 test passes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified the latest test log: 173 passed, 0 failed, 3 skipped. test/panel-0453.test.mjs updates the expected file label and adds folder coverage while retaining its border and pixel-alignment assertions."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The merged change still meets all criteria. The browser test now recognises the shorter file label and also checks folder buttons, without weakening its visual checks. All tests run for this round pass; no blocking issues remain."
  }
}
```

</details>
