---
id: "0378"
title: "Check Cursor's CLI in doctor for a Cursor reviewer"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-20-check-cursor-s-cli-in-doctor-for-a-cursor-reviewer.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0375"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T23:50:26.264Z"

---
# 0378 · Check Cursor's CLI in doctor for a Cursor reviewer

**Status:** 🔨 building

## Problem
With `reviewer: cursor` and no reviewer command of your own, `speck doctor` checks nothing for the reviewer. A missing Cursor CLI only shows up when the first review fails.

## Outcome
`speck doctor` checks that Cursor's CLI is installed when Cursor reviews and no reviewer command is set.

## Acceptance criteria
1. With `reviewer: cursor` and no command under `reviewer_options.cursor`, `speck doctor` checks that `agent` or `cursor-agent` is on the PATH. When neither is, the check fails and says how to install the Cursor CLI.
2. When a command is set under `reviewer_options.cursor`, doctor checks that command's first word, as it does for any reviewer command, and does not also require `agent` or `cursor-agent`.
3. A `reviewer` of `codex` or `claude` is checked as it is today. A `builder` of `cursor` is still checked as it is today.
4. No test that passed before this change fails.

## Out of scope
- Checking that Cursor is signed in.
- The builder's check, which already looks for `agent` or `cursor-agent`.

## Notes
- Checked 2026-10-22: `doctorChecks` in `scripts/install.mjs` checks `claude` on the PATH for `reviewer: claude` with no command, and the Codex CLI for `reviewer: codex`. It has no branch for `reviewer: cursor`. `CURSOR_CLIS` is `agent` and `cursor-agent`, which the builder check already uses.
- Waits for 0375 so it ships in 0.13.1, not in 0.13.0. It changes `scripts/install.mjs`.
- Failing before this build: none
- Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
