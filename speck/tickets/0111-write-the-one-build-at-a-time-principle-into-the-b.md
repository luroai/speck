---
id: "0111"
title: "Write the one-build-at-a-time principle into the brief"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-one-build-at-a-time.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T09:49:24.065Z"

---
# 0111 · Write the one-build-at-a-time principle into the brief

**Status:** 🔨 building

## Problem
speck has no stated position on parallel builds. Without one, tickets keep adding machinery to make builds run side by side: about 20 since worktrees shipped (0028), with a five-ticket ship queue (0101–0105) next. That work makes speck harder to trust and to use. On 10 and 11 October parallel builds ran the machine out of memory, stopped 0097 shipping with a test port clash, had two builds fix the same test and left builds inheriting a broken `main`.

## Outcome
`docs/brief.md` states that speck runs one build at a time, and why, so later tickets can be checked against it.

## Acceptance criteria
1. The brief's Principles list has a principle that speck runs one build at a time (WIP 1), each build in its own worktree, so the user keeps shaping ideas and tickets on the base branch while builds and ships are handled. It says the user can create tickets, set them ready and walk away.
2. Beside that principle, the brief gives the reasons, at least these:
   - **Bottleneck:** speck's value is its gates, and the user's attention, not agent time, is the bottleneck.
   - **Simplicity:** one build at a time keeps order, `after:` dependencies, conflicts and a broken base branch simple, because each build starts from the latest base branch.
   - **Users:** it fits speck's users, who shape product rather than debug races.
   - **Isolation versus parallelism:** worktrees are kept for isolation; running builds side by side is a different thing.
   - **Cost:** the cost is throughput.
   - **Coming back:** parallel builds would return only as a deliberately designed feature.
3. The brief says there is no separate shipping agent: each build ships its own ticket.
4. No part of the brief, the README or the skills says or implies that builds run in parallel (for example, the `speck test` row's "Builds run in parallel"), and no test that passed before this change fails.

## Out of scope
- Removing `max_parallel_builds`, test turns (0109) or other parallel-build machinery. That comes later, in small tickets.
- Changing how `speck-integrate` is started (0116).

## Notes
- Decided 2026-10-11 with the user. Already done outside tickets: `max_parallel_builds` set to 1 in `speck/config.yml`, and 0102–0105 cancelled.
- Write it in British English, in the brief's plain style.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
