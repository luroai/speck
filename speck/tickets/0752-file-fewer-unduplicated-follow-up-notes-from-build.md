---
id: "0752"
title: "File fewer, unduplicated follow-up notes from builds"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24

---
# 0752 · File fewer, unduplicated follow-up notes from builds

**Status:** 📋 ready

## Problem
On 2026-11-24, 31 tickets left 15 inbox notes, five of them the same problem, because builds running side by side can't see each other's notes until they ship, and builds save a note for every small thing they notice. The user had cleared Capture down to 8 and it went back to 23.

## Outcome
Builds save an inbox note only for a follow-up worth its own ticket that no other note or ticket covers, including those of builds still running.

## Acceptance criteria
1. The speck-build skill tells the builder, before saving a follow-up as an inbox note, to check it also against the notes on the base branch and in the worktrees of tickets being built, reviewed or approved, and to skip one that duplicates any of them, listing the match in the Delivery log. (checked by review)
2. The skill says to save as an inbox note only a follow-up someone using speck would notice (a behaviour change or a bug), or a test that fails or is unsteady on the base branch; everything else stays in the Delivery log only. (checked by review)
3. A test that already fails on the base branch and that another note or open ticket already names is never saved again. (checked by review)
4. No test that passed before this change fails.

## Out of scope
- Triage, and notes the user captures.

## Notes
- Asked for by the user on 2026-11-24 after the Capture list grew from 8 to 23.
- The follow-up steps are in `skills/speck-build/SKILL.md`, section 5 step 1. Other open tickets' worktrees are under `<repo>.worktrees/`, and `speck status --json` lists them.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
