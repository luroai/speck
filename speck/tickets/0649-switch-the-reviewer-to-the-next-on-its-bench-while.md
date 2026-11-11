---
id: "0649"
title: "Switch the reviewer to the next on its bench while it's limited"                # one outcome, no "and"
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
after: ["0645"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T14:39:24.694Z"

---
# 0649 · Switch the reviewer to the next on its bench while it's limited

**Status:** 🔨 building

## Problem
When the reviewer's agent is limited, every build waits at its next review round until the reset (0623), even with another reviewer on its bench ready.

## Outcome
While the reviewer's agent is limited, review rounds run on the first reviewer on its bench that's ready, not limited and not the builder's own family.

## Acceptance criteria
1. When `speck review` finds the reviewer's agent held by a recorded usage limit, it runs the round on the first agent on `reviewer_bench` that's installed, signed in, not limited and allowed to review this build under the same-model rule, in a fresh session with the full history, and records which reviewer ran it.
2. The review pack and the round's summary line say the round ran on a stand-in and why.
3. With no such agent free, it ends as 0623 does, and the build waits for the reset.
4. Once the limit has reset, rounds go back to the reviewer's own agent, in a fresh session with the full history.
5. No test that passed before this change fails.

## Out of scope
- Changing the reviewer setting itself.

## Notes
- Failing before this build: none
- Reviewer limits: `scripts/reviewer-limit.mjs` (0623); same-model rule: `scripts/same-model.mjs`; a round whose reviewer differs from the last already starts a fresh session with the full history.
- Self-check: a stand-in is no longer refused when the bench names the ticket's own reviewer (only the settings' reviewer is checked by loadConfig); a bench that can't be read when choosing a stand-in now keeps the reviewer's own limit message; added a test of a stand-in taking over from round 2.
- A round the reviewer refuses for its limit, in a build `speck run` started, is recorded as before and then runs on the stand-in straight away. A stand-in that is itself refused ends the round as 0623 does, under its own name: there's one stand-in try per round.
- Changed an existing test's setup: 0623's tests of a refused or held round now give their repo an empty list of your agents, so no agent of this machine's (such as a signed-in Claude Code) stands in for them; they still check exit 18 and that the reviewer isn't started. With that list empty, no agent is asked whether it's ready.
- Pictures: none, because the visible change is only words added to the review pack's lines, and no ticket in this repo has a round run on a stand-in to show.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
