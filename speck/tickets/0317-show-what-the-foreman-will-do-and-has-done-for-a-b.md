---
id: "0317"
title: "Show what the Foreman will do and has done for a blocked ticket"                # one outcome, no "and"
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
after: ["0308", "0309"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T22:36:46.607Z"

---
# 0317 · Show what the Foreman will do and has done for a blocked ticket

**Status:** 🔨 building

## Problem
With the Foreman's Fixing set to `fix`, a blocked ticket looks the same as one waiting for you, though the Foreman is about to take its recommendation, and once it has, the panel doesn't say so: it's only in the ticket's Notes and speck run's log. On 2026-10-18, 0305 showed as blocked and then carried on, with nothing on the board to say why. Its Notes also said "chosen by the user in the panel", which may not be how it was chosen.

## Outcome
The panel shows whether the Foreman's Fixing is on, what it will do about each blocked ticket, and what it has done.

## Acceptance criteria
1. The Foreman's status in the header shows when Fixing is `fix`, for example "Fixing on" beside its status word, and its detail says which setting Fixing has.
2. A blocked ticket whose question the Foreman will answer (Fixing is `fix`, the question doesn't change what you'd notice, the recommendation is a clear winner, and the Foreman hasn't answered it before) says on its card that the Foreman will take its recommendation, instead of waiting for you. Any other blocked ticket says it's waiting for you.
3. When the Foreman has taken a recommendation, the ticket's card says "The Foreman went with the recommendation" with the option and the time, until the ticket moves on, and the Foreman's detail lists what it has taken in the last 24 hours. `speck status` shows the same.
4. A recommendation is recorded as chosen by the Foreman when the Foreman chose it and by you only when you pressed the button. Each is shown as such.

## Out of scope
- Answering the Foreman agent's own questions: 0318.

## Notes
- From `speck/ideas/2026-10-18-show-what-the-foreman-answered.md` (inbox, from 0286) and the user's report on 0305. Taking a recommendation is in `scripts/go-with.mjs` (`FOREMAN_CHOSE`); the status is `scripts/foreman.mjs` and `templates/panel.html`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
