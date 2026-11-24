---
id: "0717"
title: "Warn when a saved test password is a common word"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
source: "speck/ideas/done/2026-11-11-warn-when-a-saved-test-password-is-a-common-word.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T14:23:11.729Z"

---
# 0717 · Warn when a saved test password is a common word

**Status:** 🔨 building

## Problem
Every saved test password counts as a private word in every commit, in any case. A simple password like `test` would then refuse almost every commit that touches a test file, and you wouldn't know why until a commit fails.

## Outcome
`speck logins set` warns when a password is short or already appears in the project's files.

## Acceptance criteria
1. When `speck logins set <name>` saves a password shorter than 8 characters, or one that appears, in any case, in a file tracked by git, it warns that any commit holding that word anywhere, in any case, will be refused, and says how to remove the login with `speck logins remove <name>`.
2. The warning never shows the password.
3. The login is still saved, with no question asked, so piped input works as today.
4. A password of 8 or more characters that appears in no tracked file is saved without the warning.
5. No test that passed before this change fails.

## Out of scope
- Refusing short passwords.

## Notes
- `saveLogin` (`scripts/logins.mjs`) checks only for an empty password and line breaks. `privateHit` (`scripts/private-words.mjs`) matches lower-cased lines with `includes`.
- Decision: warn only, since real test apps often use simple passwords and there may be nobody to answer a prompt.

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
