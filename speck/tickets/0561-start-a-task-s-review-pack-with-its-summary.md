---
id: "0561"
title: "Start a task's review pack with its summary"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-29
started: "2026-10-29T14:21:47.485Z"
approved: "2026-10-29T14:32:06.403Z"

---
# 0561 · Start a task's review pack with its summary

**Status:** 👍 approved

## Problem
A task that leaves many files, such as a research run with dozens of logs, shows each one as a button at the top of its review pack, above Ship, with nothing to say which to read first. A task always waits for you to ship it, so you scroll past every file each time, especially on a phone, and have no starting point for checking the work.

## Outcome
A task's build writes a summary of its result at the top of its output folder, and the task's review pack opens with that summary, then Ship, then the rest of its files.

## Acceptance criteria
1. The `speck-build` skill's section on tasks tells the build to write `summary.md` at the top of the ticket's output folder, and to keep it up to date in later rounds. It says the summary gives what the task found or made, which files to read and which are only supporting material (checked by review).
2. In the panel's review pack for a task whose output folder has a file named `summary.md` (in any case) at its top, that file's button comes first, labelled "Start here", and pressing it shows it formatted, as other Markdown files are. The Ship part (Ship, or what stands in its place) comes straight after it, and the task's other files after that.
3. A task with no `summary.md` at the top of its output folder shows its files as today, above the Ship part. A `summary.md` inside a subfolder isn't taken as the summary.
4. `speck pack <id>` lists the summary first under Result when the task has one, and otherwise lists the files as today. A code ticket's pack is unchanged.
5. No test that passed before this change fails.

## Out of scope
- Folding subfolders and shortening the files' labels (0562).
- Writing summaries for tasks built before this ships.
- Making a summary required: a task without one still ships.

## Notes
- Asked for 2026-10-29, for the 0.21.1 patch release: a research task's review pack listed dozens of log files, each as its own button above Ship, so the user had to scroll past all of them to ship it.
- Decided with the user: the Ship part sits under the summary and above the other files, so the list never stands between the summary and Ship.
- Today: `documentsPart` in `templates/panel-popups.js` puts every file above `shipPart`; the files come from `panelDocuments` and `documentLines` in `scripts/output.mjs`. The skill is `skills/speck-build/SKILL.md`, section 2's paragraph on a task. If `docs/brief.md` describes a task's review pack, it's updated to match.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes

## In plain words
A task's build now writes a short summary of what it found or made, naming which files to read and which are only supporting material. When you open that task's review pack in the panel, the summary comes first as a "Start here" button, with Ship straight under it, so you no longer scroll past a long list of files to ship. The rest of the files follow below Ship. To see it, open the review pack of a task built after this ships and press Start here. Tasks built before this have no summary, so their packs look as they did, with every file above Ship.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 142,343
- Elapsed since build started: 10 min
- Changed lines: 32 (limit 5000)
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
    "reviewed_sha": "37cec90e6ce4057c0e3ef7978d20ecf01381241a",
    "session": "fresh",
    "thread_id": "01a18812-9bf5-7ac2-b07e-e0e62c8ea162",
    "builder_response": "- Tests run: speck test --related test/pack-0561.test.mjs (136 files: the ticket's own test/pack-0561.test.mjs plus every test file naming a changed file, including test/pack-0354, 0359, 0362, 0363, kind-0492 and the commands.checks files). 1417 pass, 0 fail, 3 skipped.\n- Pictures: four, of the task's review pack and the summary's pop-up, in the light and dark looks.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 141692,
      "cached_input_tokens": 102144,
      "cache_write_input_tokens": 0,
      "output_tokens": 651,
      "reasoning_output_tokens": 51
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 39548,
      "cached": 102144,
      "write": 0,
      "output": 651
    },
    "cost_usd": 0.0958204,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-29T14:31:55.637Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md section 2 instructs tasks to write top-level summary.md, keep it current in later rounds, and describe results, files to read and supporting material."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/output.mjs outputFiles and panelDocuments identify a top-level summary case-insensitively. templates/panel-popups.js documentsPart and packPane place Start here before shipPart and remaining files. Three passing AC2 tests cover detection, ordering and formatted Markdown opening."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "outputFiles matches only the complete relative filename summary.md; packPane preserves the previous layout without a summary. Both passing AC3 tests cover absent and nested summaries."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "documentLines uses the summary-first list from outputFiles, which returns null for code tickets. Passing AC4 tests verify summary-first Result entries, unchanged ordering without one and code-ticket behaviour."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified the saved test output: 1,417 passed, zero failed and three skipped across 1,420 tests. The scoped implementation and existing-test coverage give no indication of a regression."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Tasks now put a clearly labelled “Start here” summary before Ship, with supporting files below it. Tasks without a summary retain their existing layout, and command-line packs list summaries first. The tests exercise the intended behaviour and all reported checks passed. No blocking concerns found."
  }
}
```

</details>
