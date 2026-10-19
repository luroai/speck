---
id: "0318"
title: "Answer or dismiss a question the Foreman asked"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0317"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-19T05:45:08.195Z"

---
# 0318 · Answer or dismiss a question the Foreman asked

**Status:** 🔨 building

## Problem
When the Foreman agent (0287) asks you a question about a stuck ticket, the question waits until the ticket's status changes. There's no way to answer it, or to say it doesn't matter, from the panel or the command line.

## Outcome
You can answer or dismiss a question the Foreman asked, from the panel or the command line.

## Acceptance criteria
1. A question the Foreman asked shows in its detail, and on the ticket's card, with an Answer box and a Dismiss button.
2. Answering resumes the stuck work with your answer, as the Foreman would with its own instruction (resuming the build, or re-running the ship), records your answer in the ticket's Notes and clears the question.
3. Dismissing clears the question, records that you dismissed it, and leaves the ticket as it is.
4. `speck foreman answer <id> "<text>"` and `speck foreman dismiss <id>` do the same from the command line.
5. A question can be answered or dismissed only once. A second try says it's already been dealt with.

## Out of scope
- Blocked questions from builds, which 0284's button and 0286 handle.

## Notes
- From `speck/ideas/2026-10-18-answer-or-dismiss-the-foreman-s-question.md` (inbox, from 0287). The Foreman's agent is in `scripts/foreman-fix.mjs` and the `speck-foreman` skill.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
