---
id: "0205"
title: "Chain tickets that change the same files while shaping them"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15

---
# 0205 · Chain tickets that change the same files while shaping them

**Status:** 📋 ready

## Problem
The ticket skill sets `after:` only between the tickets one idea is split into. It doesn't check a new ticket against other open tickets that change the same files. With builds running side by side, two such tickets clash when the second ships and cost a merge round, as 0188 and 0189 did on 2026-10-15.

## Outcome
When the ticket skill makes tickets, any that would change the same files as another open ticket wait for it with `after:`.

## Acceptance criteria
1. The ticket skill has a step, before presenting tickets, to list the files each new ticket is likely to change and compare them with every open ticket's (draft, ready, building, reviewing, blocked or approved), read from their Notes and the code they name.
2. For each overlap, it sets the new ticket's `after:` to the other ticket, so the two are built one after the other, and never makes a loop of `after:` links.
3. When presenting the tickets, the skill shows each `after:` it set and the files that caused it, in one line per ticket.
4. The triage steps that make tickets from inbox notes follow the same step. The copies of the skill that `speck init` installs say the same as `skills/`.
5. No test that passed before this change fails.

## Out of scope
- `speck run` choosing by itself not to build overlapping tickets at once (planned with the jobs design).
- Changing tickets that already exist.

## Notes
- Asked for 2026-10-15, for release 0.4.0. Agreed with the user after 0199 to 0201 were drafted without `after:`, though they all change `templates/panel.html`.
- The skill is `skills/speck-ticket/SKILL.md`; step 3 mentions `after:` only for splitting one idea. `.claude/skills/` holds this repo's installed copies.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
