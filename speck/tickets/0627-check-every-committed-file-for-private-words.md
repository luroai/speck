---
id: "0627"
title: "Check every committed file for private words"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0626"]                # ticket ids that must be done first
created: 2026-11-10

---
# 0627 · Check every committed file for private words

**Status:** 📝 draft

## Problem
speck's commit check (0550) refuses a commit that adds a private word or the home folder's path, but only to files under `speck/`. A private name was committed in a test file and in several tickets before it was on the list, and code, tests, docs and commit messages are still unchecked.

## Outcome
speck refuses any commit that adds a private word or the home folder's path, in any file or in its message.

## Acceptance criteria
1. The commit check looks at every line the commit adds, in every file, not only those under `speck/`, and refuses the commit, saying which file and line, when one holds a private word or the home folder's path.
2. Files that hold data copied from outside the project, starting with `scripts/prices.json` (model names from LiteLLM's price list), are left out, and the brief says which and why.
3. A commit message that holds a private word or the home folder's path is refused too, saying so; `speck init` installs that check beside the existing one, and leaves a hook that isn't speck's alone, as it does today.
4. `git commit --no-verify` still skips both, as today, and `speck doctor` (0570) reports both checks.
5. No test that passed before this change fails.

## Out of scope
- Rewriting history that's already been committed.
- What counts as a private word: the user's own list.

## Notes
- Asked for 2026-11-10: remove a private name from everything and "make sure it doesn't happen again … I don't even want a mention of the user's other projects." The name itself is in the user's private words, so it isn't written here.
- Today: `scripts/commit-check.mjs` lists staged files with `git diff --cached … -- speck/` (about line 40), its hook is installed by `installCommitHook`, and `speck doctor`'s line for it is 0570's.
- Waits for 0626, so the test's names are gone before every file is checked.
- Relies on git's pre-commit and commit-msg hooks.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
