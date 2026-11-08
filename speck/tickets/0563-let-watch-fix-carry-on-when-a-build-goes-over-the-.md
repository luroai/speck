---
id: "0563"
title: "Let watch: fix carry on when a build goes over the size limit"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-08

---
# 0563 · Let watch: fix carry on when a build goes over the size limit

**Status:** 📋 ready

## Problem
When a build goes over `limits.max_changed_lines`, the size guard blocks it with a proposed split as its question. The builder marks that question "Changes what you'd notice: yes", because the first ticket ships without part of its scope, and "Clear winner: no", because raising the limit is the other option. So `watch: fix` always leaves it for you, even though the answer is nearly always the split, the code is already written, and nothing about what is finally delivered changes.

## Outcome
With `watch: fix`, speck takes a size-guard split itself, as it does a question that changes nothing you'd notice and has a clear winner. The build carries on with the first part, and the rest goes into a new ticket that runs straight after it.

## Acceptance criteria
1. A build blocked by the size guard says so in its question's facts, separately from its other three lines, so speck can tell a size-guard block from any other question.
2. With `watch: fix`, `speck run` takes the recommendation of a size-guard block whose recommendation is to split, once per ticket. It notes in the ticket's Notes that speck chose it, and resumes the build. Raising the limit is never taken automatically.
3. The split-off ticket is made `ready`, with `after:` naming the original, holds the scope the original gives up, and says in its Notes which ticket it came from and why.
4. With `watch: tell` or `off`, a size-guard block waits for you as it does now, and any other question is handled exactly as before.
5. The build skill's size-guard steps and `docs/brief.md` describe the new behaviour (checked by review), and no test that passed before this change fails.

## Out of scope
- Any other kind of blocked question, such as a product question.
- Changing the size limits themselves.

## Notes
- Seen in practice: a build at 1,400 changed lines against a 1,000-line limit proposed keeping about 975 lines and moving about 425 into a follow-up ticket. The user went with the recommendation, and it changed nothing about what was delivered.
- Decided by the user on 2026-11-08: the split-off ticket starts `ready`, as its scope was approved when the original was set ready, so `speck run` builds it straight after.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
