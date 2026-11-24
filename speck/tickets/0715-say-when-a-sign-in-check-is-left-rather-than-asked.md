---
id: "0715"
title: "Say when a sign-in check is left rather than asked"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-15-say-when-a-sign-in-check-is-left-rather-than-asked.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24

---
# 0715 · Say when a sign-in check is left rather than asked

**Status:** 📝 draft

## Problem
The speck-watch skill says to ask the user when the agent can't sign in, while its leave action covers a check needing an account the agent can't use. The two overlap, so the agent may stop a build with a question where 0679 meant it to carry on, or the reverse.

## Outcome
The skill and the check's brief say plainly which sign-in troubles are left and which are asked.

## Acceptance criteria
1. The speck-watch skill says that with `watch: decide`, a check needing an account speck has no saved test login for is left with the leave action, and that a saved login that fails to sign in, or any other sign-in trouble, is asked about. (checked by review)
2. The brief speck gives the agent for a check in the app (`scripts/app-check.mjs`) says the same. (checked by review)
3. No test that passed before this change fails.

## Out of scope
- Changing what the leave action does.

## Notes
- Lines in `skills/speck-watch/SKILL.md` (ask on sign-in trouble; leave for an account you can't use) and the brief in `scripts/app-check.mjs`.
- Decision: a saved login that fails is asked about, not left, because with a working password the agent could make the check, and the user can fix it with `speck logins set`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
