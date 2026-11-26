---
id: "0763"
title: "Review again after an answered escalation at the review limit"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-26
started: "2026-11-26T11:39:35.777Z"

---
# 0763 · Review again after an answered escalation at the review limit

**Status:** 🔨 building

## Problem
When a ticket has used its review rounds and the last round escalated a question, answering it (Go with the recommendation, `speck answer` or the panel) allows 2 more rounds, but `speck review` still refuses the next round: the escalation is checked before the rounds you allowed. 0758 is stuck on this on 2026-11-26, holding up 0762 and the 1.7.0 release.

## Outcome
An answered escalation at the review limit is followed by the review rounds the answer allowed.

## Acceptance criteria
1. When a ticket's ordinary rounds have reached `max_review_rounds`, its last round escalated, and its Notes allow more rounds than it has used, `speck review` runs the next round as an allowed round rather than refusing.
2. In that case the builder's next step, as speck works it out after the round, is to act on the answer and review again, not to block.
3. An escalation at the limit with no allowed rounds left, or with all of them used, still blocks as today, and so does an escalation before the limit that no one has answered.
4. With 5 ordinary rounds, the 5th escalated, and one "Review limit: … allowed 2 more review rounds" line in the Notes, a 6th and a 7th round can run, and an 8th is refused.
5. No test that passed before this change fails.

## Out of scope
- How many rounds an answer allows (0680).

## Notes
- Found on 2026-11-26 when 0758 blocked asking for this ticket; after it ships, 0758's question is answered saying so and its build carries on.
- `extraRound` and `nextAction` in `scripts/review-limit.mjs`: `nextAction` returns `block` for a last verdict of `escalate` before it counts the rounds `allowedRounds` allows, so `extraRound` throws.
- Failing before this build: none
- An escalation counts as answered when at least 2 allowed rounds (one answer's worth) are left unused: an escalation in an allowed round with only 1 left over from an earlier answer still blocks until it's answered again.
- Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
