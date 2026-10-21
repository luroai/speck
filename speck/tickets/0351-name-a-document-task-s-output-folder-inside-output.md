---
id: "0351"
title: "Name a document task's output folder inside outputs"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-17-review-documents-an-agentic-task-writes.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0350"]                # ticket ids that must be done first
created: 2026-10-21
started: "2026-10-21T09:58:05.735Z"

---
# 0351 · Name a document task's output folder inside outputs

**Status:** 🔍 reviewing

## Problem
A document task's result goes in `outputs/`, which isn't in git. The user expects it to grow into a tree of its own projects (an emails folder, a strategy-2027 folder and so on), so each document ticket has to say where in that tree its document goes.

## Outcome
A document task names its folder inside `outputs/`, and `outputs/` is kept out of git.

## Acceptance criteria
1. `speck lint` errors on a ticket with `task: document` whose `output` is missing or blank, naming the field. A code ticket needs no `output`.
2. `speck lint` errors on a document task whose `output` is an absolute path or leads outside `outputs/` (for example `/tmp/x`, `../x` or `a/../../x`), and accepts nested folders such as `strategy-2027/pricing/` and a single name such as `emails`. `output` is relative to `outputs/` at the project root.
3. `speck init` adds `/outputs/` to the project's root `.gitignore`, making the file if there isn't one. Running `speck init` again doesn't add a second line, and leaves an existing `/outputs/` or `outputs/` line as it is.
4. The `/speck-ticket` skill tells the agent to give a document ticket `task: document` and an `output` folder inside `outputs/`. (checked by review)
5. No test that passed before this change fails.

## Out of scope
- Writing anything into the folder (0352).
- Checking whether the folder exists yet: the build makes it.

## Notes
- Agreed with the user 2026-10-21: outputs stay out of git (as decided 15 October), and each document ticket names its own folder inside `outputs/`, nested as deep as it likes.
- `lintTicket` in `scripts/lint.mjs`; `cmdInit` in `scripts/install.mjs`; `.claude/skills/speck-ticket/SKILL.md`.
- Checked 2026-10-21: a root `.gitignore` line `/outputs/` ignores `outputs/strategy-2027/pricing/a.md` but not `sub/outputs/b.md` (`git check-ignore -v`, git 2.53.0).
- Failing before this build: none
- Self-check: no changes (tested unusual values: numbers, lists, `{}`, `constructor`, `__proto__`, Windows paths, `.` and `a/..`; a CRLF `.gitignore` and one with no final newline).
- Pictures: none, because nothing anyone sees in the panel changes.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "738b5fe04bb1a44797735c06c2d2fa9549478346",
    "thread_id": "01a15de7-bc9e-7352-ae10-232aa2f72e0a",
    "seconds": 43,
    "usage": {
      "input_tokens": 168519,
      "cached_input_tokens": 130304,
      "cache_write_input_tokens": 0,
      "output_tokens": 1150,
      "reasoning_output_tokens": 220
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-21T10:01:13.750Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/lint.mjs lintTicket/outputProblem require output for document tasks only. The two AC1 tests exercise missing and blank values and code tickets; both passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/lint.mjs outputProblem rejects absolute paths and normalised parent traversal. Both AC2 tests passed, covering nested folders, single names and invalid paths."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The AC3 tests passed for ordinary entries and repeated init, but scripts/install.mjs:261 trims leading whitespace before recognising existing rules. This can skip adding /outputs/ when the existing rule does not ignore that folder."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "skills/speck-ticket/SKILL.md:24 explicitly requires task: document and an output folder relative to outputs/, with single-name and nested examples."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded test run reports 117 passing, 3 skipped and no failures. Existing tests were not changed, and the diff contains no unrelated fixes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/install.mjs:261",
        "issue": "ignoreOutputs treats an indented line such as \"  /outputs/  \" as an existing ignore rule. Git preserves leading spaces in patterns, so that line does not ignore the root outputs directory. Init then returns without adding /outputs/, leaving document outputs eligible for commit. The new whitespace test asserts preservation without checking whether Git ignores the files.",
        "suggested_fix": "Do not strip significant leading whitespace when recognising existing rules. Preserve the existing text but append /outputs/ when its only apparent outputs rule is indented. Add a regression test that checks Git actually ignores an output file in this case.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Document tickets now require a valid output folder, and the ticket-writing instructions explain it clearly. The tests pass, but init can leave outputs exposed to git when an existing ignore entry has leading spaces. Fix that case before merge."
  }
}
```

</details>
