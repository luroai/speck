---
id: "0328"
title: "Say what became of a question the Foreman asked in its recent actions"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-19

---
# 0328 · Say what became of a question the Foreman asked in its recent actions

**Status:** 📝 draft

## Problem
Once you answer or dismiss a question the Foreman asked, `speck status` and the panel's Foreman detail still list it among the Foreman's recent actions as "The Foreman asked you for <id>: …", with nothing to say it's been dealt with. It reads as a question still waiting for you: 0322's question showed this way after it was dismissed and after 0322 shipped.

## Outcome
Each question the Foreman asked, in its recent actions, says what became of it: still waiting for you, answered, dismissed, or no longer waiting.

## Acceptance criteria
1. In `speck status`, a question the Foreman asked that you dismissed is listed in its recent actions as asked "about" its ticket (not "for"), followed by "You dismissed it" and the time you did (`YYYY-MM-DD HH:MM UTC`).
2. In `speck status`, a question you answered is listed the same way, followed by "You answered it", the time you did and your answer.
3. In `speck status`, a question that neither you answered nor dismissed, but that no longer waits for you because its ticket's status has changed since it was asked or the Foreman has done something else about the ticket since, is followed by "No longer waiting" and why, naming the ticket's status now in the first case.
4. A question still waiting for you is listed in its recent actions as asked "about" its ticket with nothing after it, and the "The Foreman asks you about …" line with how to answer or dismiss it is unchanged.
5. The panel's Foreman detail shows the same outcome for each question as `speck status` does in criteria 1–4, and the header's "Needs you" count is unchanged by any of it.

## Out of scope
- Changing which questions count as waiting for you (0318 decides that) or how you answer or dismiss one.
- The Foreman's other actions (resume, reship, fix), which keep their wording.

## Notes
- The recent actions come from `agentView` in `.speck/scripts/foreman-agent.mjs` (its `did` list), printed by `foremanLines` in `.speck/scripts/foreman.mjs` and drawn in `templates/panel.html`. Replies are read with `readReplies`/`dealtWith` in `.speck/scripts/foreman-answer.mjs`.
- Seen 2026-10-19: 0322's dismissed question still showed as "The Foreman asked you for 0322" in `speck status` after 0322 shipped.
- Decision: keep the question in the recent actions with its outcome rather than hiding it, so the history stays readable.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
