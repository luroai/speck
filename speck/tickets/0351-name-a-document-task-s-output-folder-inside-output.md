---
id: "0351"
title: "Name a document task's output folder inside outputs"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 🔨 building

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

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
