---
id: "0498"
title: Recommend agents in the README from testing so far                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0497"]                # ticket ids that must be done first
created: 2026-10-25

---
# 0498 · Recommend agents in the README from testing so far

**Status:** 📋 ready

## Problem
The README lists the agents speck works with but doesn't say which to pick, and says only that Claude Code is "the agent speck is most tested with". A new user can't tell that one agent works but two is better, or which pairing has done best in testing, and might pick Grok to review without knowing it's slow at it.

## Outcome
The README says one agent works but two different agents are best for adversarial review, and lists the best options from testing so far, with Claude Code as the best builder.

## Acceptance criteria
1. The README says speck works with one agent doing both building and reviewing, with `allow_same_model_review: true`, but that two different agents are best, because a second model reviews adversarially and catches what the builder misses. (checked by review)
2. The README lists the best options from testing so far: Claude Code as the builder, Codex with gpt-6.1-sol as the reviewer, and Grok through Cursor as fine for building but slow as a reviewer, finding the same problems as Codex in 4 to 11 minutes a round against Codex's under a minute. (checked by review)
3. The sentence "Claude Code is the agent speck is most tested with." in Get started is gone, and Claude Code is named as the best builder instead. (checked by review)
4. No test that passed before this change fails.

## Out of scope
- Changing any default in `speck/config.yml` or setup.
- Naming speck in place of "It" (0496) and the bursts paragraph (0497).
- Benchmarking more agents or models.

## Notes
- Keep it short: 0490 just cut the README down. A few lines under Under the hood's **Your agents**, plus the Get started change, is the expected size.
- Wording agreed with the user on 2026-10-25:
  > **Which to choose.** speck works with one agent building and reviewing (set `allow_same_model_review: true`), but two different agents are best: a second model reviews adversarially and catches what the builder misses. The best options from testing so far:
  > - **Builder: Claude Code.** Claude Code builds speck itself.
  > - **Reviewer: Codex, with gpt-6.1-sol.** Codex has reviewed almost every speck ticket, usually in under a minute a round.
  > - **Grok through Cursor** worked well as a builder in a short test, but is slow as a reviewer: it found the same problems as Codex but took 4 to 11 minutes a round.
- Don't start a sentence or label with "It" for speck or an agent, as 0496 sets out.
- Checked 2026-10-25: 456 done tickets record `Reviewer: codex, model gpt-6.1-sol` and 5 record Cursor with grok-4.7-high or grok-4.7-high-fast (`speck/tickets/done/` Delivery logs). `builder: claude`, `reviewer: codex`, `reviewer_model: gpt-6.1-sol` and `allow_same_model_review` are in `speck/config.yml`.
- Checked 2026-10-23 by the user: on the same review prompt, Codex gpt-6.1-sol took 30 s; grok-4.7-high-fast 313 to 417 s and grok-4.7-medium-fast 275 s, all finding the same blocking bug. Grok built a small ticket in 2 minutes in a scratch-repo test.
- Waits for 0497: this changes the agents paragraph and Get started, near the lines 0497 changes.
- Asked for by the user on 2026-10-25.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
