---
id: "0722"
title: "Test the README's terminal install command"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-24-test-the-readme-s-terminal-install-command.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24

---
# 0722 · Test the README's terminal install command

**Status:** 📝 draft

## Problem
The README's command to run in a terminal (under Without an agent) isn't tested, since 0491 kept only four README facts under test. A wrong command there breaks installs for anyone who skips the setup prompt.

## Outcome
The README's terminal install command is one of the tested README facts.

## Acceptance criteria
1. A test fails if any `npx` command for speck in the README, the terminal one under Without an agent included, differs from the one in the README's setup prompt.
2. The brief's "Criteria about documents", the speck-ticket skill and the reviewer prompt each list the README's terminal install command among the README facts that are tested.
3. No test that passed before this change fails.

## Out of scope
- Testing other README facts.

## Notes
- The rule text is in `docs/brief.md` (Criteria about documents), `skills/speck-ticket/SKILL.md`, `templates/reviewer-prompt.md`, and `test/docs-0491.test.mjs` (`TESTED`, `ALLOWED`). The setup prompt's command is tested in `test/install-0253.test.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
