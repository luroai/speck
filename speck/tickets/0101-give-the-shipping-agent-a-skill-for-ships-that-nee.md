---
id: "0101"
title: "Give the shipping agent a skill for ships that need help"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-a-shipping-agent-that-heals-the-build.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0097", "0098", "0099", "0100"]                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-11T08:18:17.251Z"

---
# 0101 · Give the shipping agent a skill for ships that need help

**Status:** 🔨 building

## Problem
When a ship can't go through cleanly, someone has to merge the base branch in, resolve conflicts, get the merge re-reviewed and ship again, or notice that `main` is broken. Today that's the builder improvising or the user stepping in. Speck needs one agent whose only job is this, which only asks the user about real decisions.

## Outcome
A `speck-integrate` skill tells the shipping agent how to get one approved ticket shipped when the plain ship couldn't, and when to stop and ask.

## Acceptance criteria
1. `speck init` installs a `speck-integrate` skill in both skill folders. It's agent-only: its frontmatter has `user-invocable: false`, so it isn't in Claude Code's `/` menu, and its description says only the ship queue starts it, never a person or another skill.
2. For a conflict, it merges the base branch in and uses `speck merge-check` (0098): `added-lines` conflicts in lists, tables or imports keep both sides, and lockfiles are rebuilt with the project's own install command. If the tests then pass, it ships with no extra review. Any `logic` resolution keeps the intent of both sides and gets a merge round (0097) before it ships.
3. When `speck ship` exits 14 (0099), it changes no code. It creates one fix ticket (0100) describing the failure in plain words, unless an open fix ticket already covers it. It sets that ticket ready only when `auto_fix_main` is true in `speck/config.yml`, then stops.
4. It asks the user only when two tickets contradict each other, or when `speck next` blocks a merge round. It blocks the ticket with a question in plain words, without git terms, giving the options and its recommendation.
5. It never changes a file the merge doesn't need, never merges or pushes except through `speck ship`, and never edits a ticket's Review rounds.

## Out of scope
- Starting the agent and the order of ships (0102).

## Notes
- `auto_fix_main` is off by default (0102 adds the setting).
- Decided 2026-10-10: new skills are agent-only; only Capture, Ticket, Build and Ship (plus the existing review and status) are for people.
- Checked 2026-10-10: `user-invocable: false` in a skill's frontmatter hides it from the `/` menu while Claude can still load it (Claude Code skills docs).
- A skill is text: tests can check AC1 and that each step is named; the reviewer checks the rest by reading it.
- Failing before this build: none

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
