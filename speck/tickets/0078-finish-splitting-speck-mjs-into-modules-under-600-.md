---
id: "0078"
title: "Finish splitting speck.mjs into modules under 600 lines"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 4              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0018", "0079", "0080"]                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T12:22:51.299Z"

---
# 0078 · Finish splitting speck.mjs into modules under 600 lines

**Status:** 👍 approved

## Problem
After 0018, `scripts/speck.mjs` still holds about 2,000 lines: ticket parsing, the review loop and review pack, install and doctor, start, ship and status. Reviewers still read large parts of it every round, and an edit in one area risks breaking another.

## Outcome
speck's code is split into files by area under `scripts/`, none over 600 lines, and speck works exactly as before.

## Acceptance criteria
1. The review code (`review`, `record`, `prompt`, `diff`, `next`, `close` and `reviewer-settings`), the review pack, the install and doctor code, and the ship code (including `--auto`) each live outside `scripts/speck.mjs`, which keeps the commands' entry point.
2. No file under `scripts/` is over 600 lines. If `speck.mjs` or a moved area still is, it's split further.
3. Every name `scripts/speck.mjs` exports today can still be imported from it.
4. Every CLI command gives the same output and exit code as before, and the test suite passes with no test changed.
5. A project set up with `speck init` runs `review`, `record`, `pack`, `doctor` and `ship` from `.speck/scripts/speck.mjs`, and re-running `init` there still updates `.speck/`.

## Out of scope
- Changing any behaviour, message or output.
- The panel and the build controls: 0018.
- The test file (0020, cancelled).

## Notes
- This is a pure move. It takes over 0018's original scope, which already included 0019 ("Finish splitting speck.mjs into modules", cancelled when it was merged into 0018).
- The review code is about 720 lines with its commands, so it can't be one file under the cap.
- Rough size: about 1,400–1,500 lines move, so about 3,000 counted against `max_changed_lines`.
- Checked 2026-10-10: `speck init` copies the whole `scripts/` folder into `.speck/` (`installTooling`).
- Built 2026-10-10: the modules are `core.mjs` (utilities, config, tickets and their rounds section, lint, diff size, and helpers several commands share), `review.mjs`, `reviewers.mjs` (the prompt and command reviewers), `pack.mjs`, `close.mjs`, `install.mjs` and `ship.mjs`. `core.mjs` imports none of them, so it is always ready before the rest. Every moved line is unchanged apart from an added `export`. `speck set`'s checks stay in `speck.mjs`, where the 0079 tests read them.
- AC4's test runs the same commands through a whole build with the CLI from the branch's merge base with `main` and with this one, and compares output, exit codes, the ticket and the git log. Once the split is on `main` there's no single-file CLI to compare with, so that test (and the "no existing test changed" check) skips itself.
- Self-check: no changes. Each module loads on its own whichever is imported first (no top-level use of an import across a cycle), a word-level scan finds no name used without being imported, and changing one message in `ship.mjs` makes the AC4 test fail.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 531,069
- Elapsed since build started: 14 min
- Changed lines: 3115 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - `speck record` (and `speck prompt --tests=`) crash with a stack trace on a missing file: `speck/ideas/2026-10-10-say-plainly-when-a-file-given-to-speck-is-missing.md`.
  - Tidy-up: `panel.mjs` and `run.mjs` still import from `speck.mjs`, which re-exports from the new modules. Pointing them at `core.mjs` and the rest directly would drop that cycle, but the panel and build controls were out of scope (0018).

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
    "reviewed_sha": "0d17537d0b53ae8c2e79d5c1246672557b73ac5d",
    "thread_id": "01a125d0-1e13-7762-b8ca-ff5e97edb7da",
    "seconds": 33,
    "usage": {
      "input_tokens": 530206,
      "cached_input_tokens": 393472,
      "cache_write_input_tokens": 0,
      "output_tokens": 863,
      "reasoning_output_tokens": 63
    },
    "saved_at": "2026-10-10T12:36:31.063Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Review commands are in review.mjs, reviewers.mjs and close.mjs; pack, installation/doctor and shipping are in their respective modules. speck.mjs retains COMMANDS and the CLI entry point. The 0078 AC1 test checks these locations."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Independent line count confirms all ten files under scripts/ are below 600 lines; speck.mjs is largest at 526. The 0078 AC2 test checks every file recursively."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Successfully imported scripts/speck.mjs and inspected its exports. Explicit re-exports preserve the previous API; the two 0078 AC3 tests check availability and completeness against the original CLI."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Independent comparison found every moved implementation line unchanged apart from exports. Existing tests are unchanged. The 0078 AC4 test compares CLI transcripts against the merge-base implementation; supplied suite output reports 648 passing tests with no skips."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "install.mjs installTooling still copies the entire scripts directory. The 0078 AC5 tests exercise installed review, record, pack, doctor and ship, then verify that re-running source init refreshes the installed modules."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The CLI has been split into smaller modules while preserving its commands and exported functions. All script files meet the 600-line limit, and the tests cover installed projects and updates. No blocking problems found. I independently checked the code and imports; the full test result is the builder’s supplied run."
  }
}
```

</details>
