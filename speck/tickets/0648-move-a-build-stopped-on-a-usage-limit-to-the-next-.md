---
id: "0648"
title: "Move a build stopped on a usage limit to the next builder"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0647"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T15:26:16.065Z"

---
# 0648 · Move a build stopped on a usage limit to the next builder

**Status:** 🔨 building

## Problem
A build that stops partway on its agent's usage limit waits for the reset, even when it's hours away and another builder on the bench is free.

## Outcome
A build stopped on a usage limit more than an hour from resetting is carried on by the next builder on the bench, from its branch and ticket.

## Acceptance criteria
1. When a build stops on its agent's usage limit and the reset is more than 60 minutes away, or unknown, `speck run` starts the ticket again on the first agent on `builder_bench` that's ready and not limited, in the same worktree and on the same branch, with a message saying it carries on another agent's build and to read the ticket's Notes and the branch's commits first.
2. When the reset is 60 minutes away or less, or no bench agent is free, it waits and carries on the build's own session after the reset, as 0622 does.
3. The ticket's Notes say which agent took over, why and when, and the ticket's `builder` records the new agent.
4. The reviewer still has to come from a different family than the agent that finishes the build.
5. No test that passed before this change fails.

## Out of scope
- Moving a build back to its first agent after the reset.

## Notes
- 0622 and 0623 carry builds on after the reset (`carryOn` in `scripts/usage-limit.mjs`).
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
