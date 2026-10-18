---
id: "0285"
title: "Show the Foreman's status in the panel's header"                # one outcome, no "and"
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
after: ["0283"]               # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T12:34:13.900Z"

---
# 0285 · Show the Foreman's status in the panel's header

**Status:** 🔨 building

## Problem
When nothing is building or shipping, the panel doesn't say why: the reason is in `speck/.cache/runs/run.log`. On 2026-10-17 it took a conversation with an agent to find out each time: `main` had diverged from GitHub, shipping was on hold, speck run was waiting to switch to new code, and the panel page was too old to show a new setting.

## Outcome
The panel's header shows the Foreman, speck run's single status for the whole pipeline, and its detail says what's moving, what's waiting and why. The speck run switch moves into Settings.

## Acceptance criteria
1. The header shows one Foreman status in place of the speck run switch, in one or two words and a colour: Off, Idle, Building <n>, Shipping <id>, Waiting (with the reason in a word or two, such as "on hold" or "new code"), or Needs you <n>, for blocked tickets.
2. Pressing it opens its detail: each ready ticket that isn't building, with why (waiting for <ids>, all build slots in use, speck run off, speck run switching to new code once <builds> end); shipping's state (on hold until main has a new commit, or a refusal waiting for a new commit, with its message); and blocked tickets, with their questions.
3. The Settings view has a "Foreman" group, first, with the speck run on/off switch that today's header button has, working as it does today.
4. When the panel's server is running newer code than the page shows, the status says so and offers to reload the page.
5. Every reason in criterion 2 comes from what speck run itself records as it works, not from the panel working it out separately, so `speck status` can show the same.

## Out of scope
- The Foreman acting on anything: 0286 and 0287.

## Notes
- From `speck/ideas/2026-10-17-a-foreman-that-keeps-the-work-moving.md`, step 1. The switch is `.run-state` in `templates/panel.html` and `panelRunOn` in `scripts/panel.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
