---
id: "0287"
title: "Let the Foreman look into work that stops for no known reason"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0286"]               # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T13:16:47.539Z"

---
# 0287 · Let the Foreman look into work that stops for no known reason

**Status:** 🔨 building

## Problem
Some stops have no recipe in speck: a ship refused for a reason speck doesn't recognise, or a build that ends without being approved or blocked. Today they wait in `run.log` until the user notices and asks an agent to look.

## Outcome
With the Foreman's Fixing setting on, speck run starts a Foreman agent with a short brief when work stops for a reason speck has no recipe for, and the agent clears it or asks the user in one line.

## Acceptance criteria
1. With `foreman_fixing: fix`, speck run starts the Foreman agent when a ship is refused for a reason not handed back to the build, or a build exits without its ticket approved or blocked. Its brief names the ticket, what happened, the last lines of its log and what it may do.
2. The Foreman agent may only: resume the ticket's build with an instruction, re-run its ship once, make a draft fix ticket, or write one question for the user. It never sets a ticket ready, approves work, ships anything `auto_ship` doesn't cover, or changes code itself. (checked by review)
3. New settings `foreman`, `foreman_model` and `foreman_effort` choose the agent it runs on, its model and effort, blank for the defaults, as the reviewer's do. They're in the config template, `speck config set` accepts them, and the Settings view's Foreman group and setup offer them.
4. What the Foreman agent did, and why, is recorded in the ticket's Notes and shown in the Foreman's status detail.
5. speck run starts at most one Foreman agent at a time, and at most once for the same ticket and the same commits.

## Out of scope
- Stops that already have a recipe (hand-backs, the ship queue's hold, merging a diverged base branch).

## Notes
- From `speck/ideas/2026-10-17-a-foreman-that-keeps-the-work-moving.md`, step 3. The agent's steps go in a new skill, which is the Foreman's instructions, not a user command (only Capture, Ticket, Build and Ship are user commands).
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
