---
id: "0645"
title: "Give each team member a bench of agents to switch to"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: []                # ticket ids that must be done first
created: 2026-11-11

---
# 0645 · Give each team member a bench of agents to switch to

**Status:** 📋 ready

## Problem
When an agent is limited, speck can only wait or, for the watch agent, take your agents in a fixed order (0637). You can't say who should take over for each job, such as Codex for the builder but Cursor for the reviewer.

## Outcome
Each team member has a bench: the agents, in order, that speck switches it to while its own agent is limited.

## Acceptance criteria
1. `builder_bench`, `reviewer_bench` and `watch_bench` are settings of your own, each a list of agents in order (`claude`, `codex`, `cursor` or a model provider's name), set with `speck config set` and checked as speck reads them: an agent speck doesn't know, or the member's own agent, is refused.
2. A bench left blank is your agents in the order `speck agents` lists them, leaving out the member's own agent and any model provider on an API key, as those bill per token.
3. 0637's watch agent takes its stand-in from `watch_bench` in order, skipping agents not ready or held by a limit.
4. `speck config show` shows each bench with what it does, and that blank means your agents in order.
5. No test that passed before this change fails.

## Out of scope
- Switching the builder or reviewer: 0647 to 0649. Editing benches in the panel: 0652.

## Notes
- From `speck/ideas/2026-11-10-set-up-your-team-instead-of-settings.md` (a bench order per member) and stage 2 of `speck/ideas/2026-11-10-keep-speck-working-when-an-agent-hits-its-usage-limit.md`.
- 0637's stand-in is `scripts/watch-stand-in.mjs`. Settings of your own are listed in `scripts/machine.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
