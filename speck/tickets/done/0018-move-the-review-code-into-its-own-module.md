---
id: "0018"
title: Move the panel and build-control code into their own modules                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 4              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-10T11:56:49.356Z"
finished: "2026-10-10T12:12:19.516Z"

---
# 0018 · Move the panel and build-control code into their own modules

**Status:** ✅ done

## Problem
`scripts/speck.mjs` is 2,769 lines in one file, about twice its size when this ticket was first written. Reviewers read large parts of it every round, which is a big share of the reviewer tokens a ticket costs, and an edit in one area risks breaking another. The panel's server and the build controls (`run`, `pause`, `play`, `stop`) are about 750 of those lines and are where it has grown fastest.

## Outcome
The panel's server and the build controls live in their own files under `scripts/`, not in `speck.mjs`, and speck works exactly as before.

## Acceptance criteria
1. The code for `speck panel` (its server, requests and writes) is in one file under `scripts/`, and the code for `speck run`, `pause`, `play` and `stop` is in another. Neither is left in `scripts/speck.mjs`, which keeps the commands' entry point and is at least 600 lines shorter than before.
2. Every name `scripts/speck.mjs` exports today can still be imported from it.
3. Every CLI command gives the same output and exit code as before. The test suite passes with no test changed, except the helpers in `test/support/` that copy the CLI, which may copy the whole `scripts/` folder instead of `speck.mjs` alone.
4. While `speck panel` runs, a change to any `.mjs` file under `scripts/`, the new ones included, makes it hand over to a server on the new code, as a change to `speck.mjs` does today (0067).
5. In a project set up with `speck init`, the new files are in `.speck/scripts/`, and `speck panel` started from `.speck/scripts/speck.mjs` serves its page.

## Out of scope
- Changing any behaviour, message or output.
- The rest of the split (review, review pack, install and doctor, ship): 0078.
- Making the panel's ready and priority writes use `speck set`'s code: 0079.

## Notes
- This is a pure move. Rewritten 2026-10-10: the original scope (review, install and doctor, ship, and a 600-line cap on every file) moved to 0078. A moved line counts twice against `max_changed_lines` (deleted and added), so the whole split in one ticket would come close to 5,000.
- Decided 2026-10-10: the framework and the panel stay in one repo, with a module boundary instead (`speck/ideas/2026-10-10-more-human-gate-actions-in-the-panel.md`).
- Checked 2026-10-10: `speck init` copies the whole `scripts/` folder into `.speck/` (`installTooling`), so new module files install without changes.
- Checked 2026-10-10: the panel's restart watches every `.mjs` file in the CLI's own folder (`panelCode`), and each server process imports the module named in `SPECK_PANEL_CODE_URL`. `cliCopy` in `test/support/panel.mjs` copies only `speck.mjs` today.
- Rough size: about 750 lines move, so about 1,500 counted.
- Built so far (2026-10-10): the move is done (`scripts/panel.mjs`, `scripts/run.mjs`, `speck.mjs` down from 2,769 to 2,022 lines, 1,549 changed lines), `cliCopy` copies the whole `scripts/` folder, and the 0018 tests pass. The panel's servers still import `speck.mjs` (`SPECK_PANEL_CODE_URL`), which re-exports `panelServer`. 609 of 617 tests pass, and the 8 failures are the 0067 tests in the blocked question.
- Answered 2026-10-10 (blocked question, option a): the user agreed that `test/panel-0067.test.mjs` may change only which file its code edits target, `speck.mjs` → `panel.mjs`, since the panel's code now lives there. Nothing else in the tests changes. All 12 of its tests pass with that change.
- Self-check: no changes. The moved lines match the removed ones exactly apart from `export` keywords and imports, `SPECK_PANEL_CODE_URL` still names `speck.mjs`, and each module loads whichever is imported first (no top-level use of an import).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 532,045
- Elapsed since build started: 14 min
- Changed lines: 1547 (limit 5000)
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
    "reviewed_sha": "72c027fcc73fc729512b947d334194ed1ed9b860",
    "thread_id": "01a125b8-415f-7951-a870-e79302f730f9",
    "seconds": 47,
    "usage": {
      "input_tokens": 530552,
      "cached_input_tokens": 418944,
      "cache_write_input_tokens": 0,
      "output_tokens": 1493,
      "reasoning_output_tokens": 71
    },
    "saved_at": "2026-10-10T12:10:41.747Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/panel.mjs contains the panel implementation; scripts/run.mjs contains run, pause, play and stop. scripts/speck.mjs retains COMMANDS and the CLI entry point and shrank from 2,769 to 2,022 lines. test/split-0018.test.mjs AC1 exercises these checks."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Compared main's 25 exported names with the current module: all remain available. Independently importing scripts/speck.mjs succeeded. test/split-0018.test.mjs AC2 imports and checks every original export."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Compared the moved implementation bodies against main: identical apart from export keywords, a trailing blank line and the equivalent panel loader path. COMMANDS and error handling remain unchanged. AC3 checks output and exit codes; existing command tests exercise successful builds and controls. Supplied suite output reports 617 passes. Existing tests changed only the authorised 0067 edit targets and the copy helper. The read-only environment prevents independently rerunning tests that write fixtures."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/panel.mjs panelCode, codeStamp and codeHash still inspect every .mjs file in the scripts directory; startPanelServer imports speck.mjs, which re-exports panelServer. AC4 exercises changes to panel.mjs and run.mjs. The 12 existing 0067 tests retain their assertions and cover handover, failed restarts, token preservation and process cleanup."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "scripts/speck.mjs installTooling copies the complete scripts directory. test/split-0018.test.mjs AC5 checks installed module files and launches .speck/scripts/speck.mjs, then verifies the HTML page and state endpoint. Supplied output reports it passing."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel and build controls now live in separate modules, with existing behaviour and imports preserved. The tests exercise restart and installation behaviour without weakening existing assertions. All 617 tests reportedly pass; independent read-only checks found no blocking issues."
  }
}
```

</details>
