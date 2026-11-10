---
id: "0623"
title: "Carry a build on by itself once the reviewer's usage limit resets"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0622"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T23:16:26.656Z"

---
# 0623 · Carry a build on by itself once the reviewer's usage limit resets

**Status:** 🔨 building

## Problem
When the reviewer's usage limit is reached, such as Codex's, a review round fails, and the build stops or blocks with nothing to carry it on once the limit resets. Earlier builds blocked on "wait for Codex after 3:41 AM", which you then had to answer by hand.

## Outcome
When a review round fails on the reviewer's usage limit, speck waits until it resets, then carries the build on by itself.

## Acceptance criteria
1. When the reviewer refuses a review round because its usage limit is reached, `speck review` exits with a code of its own and says when the limit resets, from the reviewer's own message, and `speck run` records it as it does a builder's limit (0622).
2. The build skill tells the builder, on that exit, to end its session saying it's waiting for the reviewer's limit, leaving the ticket reviewing, rather than blocking it with a question.
3. From a minute after the reset time, `speck run` resumes that build in its own session, telling it to run the review round again; until then it starts no review on that reviewer.
4. When the reset time can't be read, `speck run` tries again after 30 minutes, and every 30 minutes after.
5. A review round that fails for any other reason is handled as today, and no test that passed before this change fails.

## Out of scope
- The builder's own limit (0622).

## Notes
- Asked for 2026-11-10: "when the usage comes back into play, I would really like it if the builds just started them by themselves again … I've just wasted half a day there of not moving forwards because a usage limit was hit."
- Earlier blocked questions recorded in tickets' Notes went with "wait for Codex's limit to reset" and "wait for Codex after 3:41 AM".
- 0554 made `speck review` show Codex's own reason when it fails, from its JSON events (`turn.failed` or `error`).
- Checked 2026-11-10: Codex 0.159.0's limit message, from its saved sessions and the installed program, is "You've hit your usage limit. Upgrade to Pro (…), visit … to purchase more credits or try again at 3:41 AM.", with a curly or straight apostrophe, or other plan wording before it ("Try again at …"). A reset on another day reads "Oct 28th, 2026 3:41 AM". The time is in the machine's local time zone. With no reset known it ends "Try again later."; `codex exec --json` gives only the message, in `turn.failed` or `error`.
- Waits for 0622, which adds the waiting and resuming.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
