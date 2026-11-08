---
id: "0566"
title: "Ask about a stop only once"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-08

---
# 0566 · Ask about a stop only once

**Status:** 📋 ready

## Problem
speck's watch agent can ask you the same question about a ticket again and again: 0344's macOS question was asked 7 times. `speck run` looks into a stop again whenever the base branch or the ticket's branch gets a new commit, and nothing checks whether it has already asked about that ticket and is waiting on you.

## Outcome
speck asks about a ticket's stop once, and looks into it again only once you've answered or dismissed the question, or the ticket's status has changed.

## Acceptance criteria
1. While the latest watch action on a ticket is a question you haven't answered or dismissed, and the ticket's status is the same as when it was asked, `speck run` doesn't start its agent for that ticket again, even after new commits on the base branch or the ticket's branch.
2. Once that question is answered or dismissed, or the ticket's status changes, `speck run` looks into the ticket again as it does today.
3. The unanswered question still counts once under Needs you, as today.
4. No test that passed before this change fails.

## Out of scope
- What the agent does when it looks into a stop (0567).

## Notes
- Asked for 2026-11-08: the user goes with speck's recommendation almost every time, so speck should decide and tell them rather than ask ("ticket up 1": the watcher deciding). In this repo 15 of 17 recommendations taken were picked by hand in the panel, and 10 of the watch agent's 13 actions were questions.
- Today: `stuck()` in `scripts/foreman-agent.mjs` (about lines 231 to 238) skips a ticket only while `codeKey` (about lines 132 to 141, the base branch's and the ticket branch's heads) is unchanged; `agentView` (about lines 172 to 196) already works out which questions are still open.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
