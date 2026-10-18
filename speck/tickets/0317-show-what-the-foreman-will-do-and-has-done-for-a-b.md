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
- Failing before this build: none
- 0305 (the report in Problem): its question said "Changes what you'd notice: yes", so the Foreman couldn't take it, and its run record has no `by`, so the choice came from the panel's button, and its Notes were right. goWith already recorded the Foreman's choices as the Foreman's (0286); this build makes the panel pass `by: 'user'` itself and has goWith refuse any other `by`, so a choice is never put down to you by default.
- "Until the ticket moves on": the card shows who went with the recommendation while the ticket is building or reviewing and hasn't been approved since the choice. The Notes give the time to the minute, so a choice made in the same minute as an approval counts as before it.
- The Foreman will take a recommendation only when speck run could resume the build too (goWith refuses otherwise), so the card says it's waiting for you then. A blocked ticket the Foreman will take isn't counted under Needs you.
- Two earlier tests (0053 AC4, 0069 AC2) expected the blocked card's line as "Answer the question, then run /speck-build <id>"; it now starts "Waiting for you. ", and their expected text is updated to match.
- Self-check: the header passed null to replaceChildren when Fixing wasn't fix, which a browser shows as the word "null": fixed. The blocked card's progress line said "it has a question for you" on a ticket the Foreman will take: it now says the Foreman will take its recommendation.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
