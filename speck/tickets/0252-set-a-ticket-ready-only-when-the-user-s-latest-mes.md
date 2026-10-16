---
id: "0252"
title: "Set a ticket ready only when the user's latest message says to"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T13:40:42.427Z"

---
# 0252 · Set a ticket ready only when the user's latest message says to

**Status:** 🔨 building

## Problem
Setting a ticket ready is the user's gate (Gate 1), but `/speck-ticket` only says to set it ready "if the user explicitly approves", without saying what counts. On 2026-10-16 an agent read the user's choice of a tagline as a yes to its own offer to "update 0251 and set it ready", and set it ready. `speck run` started building it at once, and auto-ship covered its risk, so it could have shipped without the user seeing it. Nothing breaks a user's trust in speck faster.

## Outcome
Every speck skill that can set a ticket ready says plainly that an agent does so only when the user's latest message tells it to set that ticket ready, and that nothing else counts.

## Acceptance criteria
1. Step 9 of `/speck-ticket` says an agent sets a ticket ready only when the user's latest message explicitly tells it to set that ticket ready (for example "set 0251 ready"), and lists what doesn't count: choosing an option, approving or changing wording, answering a question, agreeing to a proposal that bundles setting it ready with other steps, or something the user agreed earlier in the conversation.
2. Step 9 also says an agent never offers to set a ticket ready as part of a proposal with other steps: it asks "Shall I set <id> ready?" as a question on its own, after any other change is done.
3. The speck section that `speck init` writes to `AGENTS.md`, and `/speck-setup` where it has the user approve the first ticket, state the same rule in one sentence.
4. `/speck-build`'s fix-ticket step, which sets a priority-0 fix ticket ready without asking so it builds next, is unchanged.
5. No test that passed before this change fails, apart from tests that check wording this ticket deliberately changes, which check the new wording instead.

## Out of scope
- A hard guard in `speck set` or the panel that stops an agent setting a ticket ready: a separate decision, since users also tell their agent "set them ready".
- Gate 2 (shipping), which `/speck-ship` already reserves for the user.

## Notes
- Wording to start from: "Set a ticket ready only when the user's latest message tells you to set that ticket ready. Nothing else counts: not choosing an option, approving wording, answering a question or agreeing to a plan. When in doubt, ask." British English.
- Also update this repo's own copies installed from `skills/` (`.claude/skills/` and `.agents/skills/`) the way `speck init` does, if the tests expect them to match.
- Failing before this build: none
- `.claude/skills/` and `.agents/skills/` are symlinks to `skills/`, so they need no separate update. This repo's own AGENTS.md speck section was brought in line with what `speck init` writes.
- Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
