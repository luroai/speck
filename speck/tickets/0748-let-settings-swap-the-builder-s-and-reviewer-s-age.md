---
id: "0748"
title: "Swap the builder's agent with the reviewer's in Settings"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
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
source: "speck/ideas/done/2026-11-24-let-settings-swap-the-builder-and-reviewer-families.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24

---
# 0748 · Swap the builder's agent with the reviewer's in Settings

**Status:** 📋 ready

## Problem
Now that each setting saves by itself, swapping the builder and reviewer between agents, such as a Claude Code builder with a Codex reviewer to the other way round, can't be done: each half is refused on its own, as for a moment both would be the same family. The refusal doesn't say how to get there.

## Outcome
A change to the builder or reviewer that clashes with the other offers to swap the other one in the same step.

## Acceptance criteria
1. When you pick a builder agent that is the reviewer's family, and so would be refused, Settings asks whether to also set the reviewer to the builder's old agent, and on yes saves both at once; on no, nothing is saved and the row goes back.
2. The same works the other way round, picking a reviewer that is the builder's family.
3. A change that clashes in a way a swap doesn't fix (such as same-model review with `allow_same_model_review` off and only one agent) is refused as today, saying why.
4. No test that passed before this change fails.

## Out of scope
- Models and efforts within one agent.

## Notes
- From 0731's own note: its refusal used to say "pick it as the reviewer in the same Save", which 0731 removed.
- Decision: offer the swap in one step, rather than only explaining the way round.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
