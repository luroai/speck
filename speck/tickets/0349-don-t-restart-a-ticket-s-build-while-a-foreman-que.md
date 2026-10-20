---
id: "0349"
title: "Don't restart a ticket's build while a Foreman question on it is waiting"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0344"]                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T22:04:16.668Z"

---
# 0349 · Don't restart a ticket's build while a Foreman question on it is waiting

**Status:** 🔨 building

## Problem
When a build ends with its ticket still ready, speck run launches it again only once the ticket has been committed since (0327), as setting it ready again does. But a note the Foreman commits to the ticket, such as a question for you, counts as that commit too. So each question the Foreman asked about 0344 (2026-10-20) restarted its build, which stopped at the same unanswered question, and the Foreman asked again: eight times in nine minutes, each costing a build's tokens.

## Outcome
A build that ended with its ticket still ready is launched again only when someone other than the Foreman commits the ticket.

## Acceptance criteria
1. When a build has ended with its ticket still ready, a commit to the ticket by `speck foreman` (one whose message starts `speck(<id>): Foreman:`) doesn't make speck run launch it again.
2. A commit to the ticket that isn't the Foreman's, such as setting it ready again or editing it, still makes speck run launch it again, as 0327 does, including one made after a Foreman commit.
3. No test that passed before this change fails.

## Out of scope
- How often the Foreman asks, or what it does about a stop.
- Tickets whose build `speck stop` ended, which `heldByStop` decides.

## Notes
- Made by the Foreman (2026-10-20 21:27 UTC) while 0344 looped; filled in with the user 2026-10-20.
- `readyAgain` and `lastTicketCommit` in `scripts/build-records.mjs`, and `markStillReady`'s caller in `scripts/run.mjs`. The Foreman's commit subjects come from `foremanSubject` in `scripts/foreman-agent.mjs`; `codeKey` there already skips them the same way (`git log --invert-grep`).
- After 0344, which also changes `scripts/run.mjs`.
- Goes in 0.10.3 (0346).
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
