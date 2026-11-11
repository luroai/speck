---
id: "0647"
title: "Start new builds on the next builder while the builder is limited"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0644","0645"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T15:08:13.514Z"

---
# 0647 · Start new builds on the next builder while the builder is limited

**Status:** 🔨 building

## Problem
When the builder's agent is limited, `speck run` starts no builds until the reset, even with another agent on the builder's bench ready and idle. On 2026-11-10 that cost half a day.

## Outcome
While the builder's agent is limited, `speck run` starts each new build on the first agent on the builder's bench that's ready and not limited.

## Acceptance criteria
1. While the builder's agent is held by a recorded usage limit, `speck run` starts each ready ticket on the first agent on `builder_bench` that's installed, signed in and not limited, with that agent's own build command, and the ticket's `builder` records it.
2. `builder_model` and `builder_effort` aren't passed to a bench agent, as they're in the builder's own format, and the review still refuses a reviewer from the same family as the agent that built it, as config does today.
3. `speck run`'s log and the Pipeline log say once per limit which agent builds instead and why, and once more when the limit resets and new builds go back to the builder.
4. When no agent on the bench is ready and free, builds wait for the reset as they do today.
5. No test that passed before this change fails.

## Out of scope
- A build that already stopped on the limit: 0648.

## Notes
- Each ticket's own builder is already supported (`scripts/ticket-builder.mjs`), and `holds` in `scripts/usage-limit.mjs` says which agent is limited.
- Failing before this build: none
- The stand-in is recorded by committing `builder: <agent>` to the ticket on the base branch in the main checkout (as the panel commits Set ready), before its build starts, so `speck start`'s ready check and every review round see the agent that builds it. When the main checkout isn't on the base branch, or the commit fails, the ticket waits for the reset, said once.
- AC2: a bench agent of the same family as the ticket's reviewer is skipped (unless allow_same_model_review), since the ready check would refuse the ticket with it, so it takes the next one on the bench rather than starting a build that can't be reviewed.
- Only a ticket built on the builder's own agent moves: one whose own builder is another agent that's held waits for that agent, as today.
- Self-check: 0344's test reads run.mjs for `launch(t)`, so the plain launch keeps that call and the stand-in launches on its own branch; run.mjs stays at 600 lines by folding the new lines into existing ones.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
