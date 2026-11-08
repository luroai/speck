---
id: "0570"
title: "Have doctor say whether the commit check is on"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-28-have-doctor-say-whether-the-commit-check-is-on.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-08
started: "2026-11-08T23:08:44.446Z"

---
# 0570 · Have doctor say whether the commit check is on

**Status:** 🔨 building

## Problem
`speck init` says only once, as it runs, whether it installed the private-words check for commits (0550). A project set up before 0.21.0, or one whose pre-commit hook was later replaced, silently has no check, and you may think commits are protected when they aren't.

## Outcome
`speck doctor` says whether the commit check is installed, and if not, why and what to do.

## Acceptance criteria
1. `speck doctor` has a line saying the commit check is on when the repository's pre-commit hook is speck's (the one `speck init` writes).
2. When there's no pre-commit hook, the line says the check is off and to run `speck init` again to add it.
3. When the pre-commit hook isn't speck's, or `core.hooksPath` points git at another hooks folder, the line says the check is off and which of those is why, without telling you to replace your own hook.
4. The line is a warning (`!`), never a failure (`✗`), so it doesn't change `speck doctor`'s exit code.
5. No test that passed before this change fails.

## Out of scope
- Installing or repairing the hook from `speck doctor`.

## Notes
- Asked for 2026-11-08 for release 0.22.0, alongside 0563 to 0568 (speck decides and tells you): "Agree to all of that including 4. Set it all ready and get a release out".
- From 0550's builder note. Open question there, decided here: a warning, not a failure, as a user with their own hook chose that.
- Today: the hook and its marker are in `scripts/commit-check.mjs` (`HOOK`, `MARKER`, `installCommitHook`); `speck doctor`'s checks are `doctorChecks` in `scripts/install.mjs`.
- Relies on git's `core.hooksPath` setting and the default `.git/hooks/pre-commit` location, as 0550 already does.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
