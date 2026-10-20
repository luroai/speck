---
id: "0344"
title: "Leave the time a machine was asleep out of a build's time"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0342"]                # ticket ids that must be done first
created: 2026-10-20

---
# 0344 · Leave the time a machine was asleep out of a build's time

**Status:** 📋 ready

## Problem
When a laptop's lid is closed during a build, every process sleeps with it, but the wall clock carries on, so the build's time counts the hours asleep. The user saw build timers of 300 minutes after closing their laptop during Cursor builds (2026-10-20). That skews the panel's Shipped figures and the README's "Built with speck" figures, which are speck's proof of how fast it is.

## Outcome
Time the machine spent asleep during a build doesn't count towards the build's time, in the panel or in speck's figures.

## Acceptance criteria
1. When the machine sleeps while speck run is on and a ticket is building or reviewing, speck run adds the time it was asleep to that ticket's `waited_seconds` once, at its first check after waking.
2. A check that comes late while the machine stayed awake, for example on a busy machine, adds nothing.
3. A ticket that was paused or blocked while the machine slept doesn't get that time added twice.
4. The README's "Built with speck" figures leave each ticket's `waited_seconds` out of its time, as the panel's Shipped median already does.
5. No test that passed before this change fails.

## Out of scope
- Tickets already recorded with time asleep in them: speck has no record of when they slept.
- Builds started by hand, with speck run off.
- The review pack's and delivery log's "Elapsed since build started", which is wall-clock time by its name.

## Notes
- `waited_seconds` already leaves blocked, paused and stopped time out (0166, `addWaited` in `scripts/core.mjs`, `scripts/stop-wait.mjs`, and pausing in `scripts/run.mjs`). The panel's timer and Shipped median subtract it (`waited` in `templates/panel.html`). The README figures come from `builtWithSpeckFigures` in `test/support/figures.mjs`, which uses `finished` minus `started`.
- Unverified: that Node's monotonic clock (`process.hrtime`, `performance.now()`) stops while the machine sleeps, on both Linux (`CLOCK_MONOTONIC`) and macOS, so the gap between it and the wall clock is the time asleep. It can't be checked here, as this machine can't be put to sleep from a session. If the builder can't confirm it, it should say so in a blocked question rather than guess.
- After 0342, which also changes `scripts/run.mjs`.
- The Foreman (2026-10-20 21:24 UTC) asked you: Node's clock keeps counting through sleep on macOS, so the planned clock gap only catches sleep on Linux: should 0344 use the gap on Linux plus macOS's recorded sleep and wake times (unverified here), go Linux only, or keep just the README figures change? I recommend Linux plus macOS, with the macOS part marked unverified in Notes.. Why: The build found that the ticket's untested assumption about the clock holds on Linux but not on macOS, so it stopped before starting and needs you to choose how the ticket should change.
- The Foreman (2026-10-20 21:25 UTC) asked you: 0344 can't be built until you pick how it should handle macOS, where Node's clock keeps counting through sleep: Linux plus macOS's recorded sleep and wake times (macOS part unverified), Linux only, or just the README figures change? I recommend Linux plus macOS, with the macOS part marked unverified in Notes.. Why: The build stopped before starting because my earlier question about how the ticket should handle macOS sleep is still unanswered, and only you can choose the ticket's scope.
- The Foreman (2026-10-20 21:26 UTC) asked you: How should 0344 handle macOS, where Node's clock keeps counting through sleep: Linux clock gap plus macOS's recorded sleep and wake times (macOS part unverified), Linux only, or just the README figures change? I recommend Linux plus macOS, with the macOS part marked unverified in Notes.. Why: The build stopped before starting for a third time because the macOS question is still unanswered; speck run keeps restarting it because each note I add to the ticket counts as setting it ready again, so it will keep looping until you answer or move the ticket back to draft.
- The Foreman (2026-10-20 21:27 UTC) made draft fix ticket 0349: Don't restart a ticket's build while a Foreman question on it is waiting. Why: speck run has now restarted 0344's build four times, because each note the Foreman adds while asking counts as setting the ticket ready again, even though the user still hasn't answered the macOS question; that needs its own fix, and asking the same question a fourth time wouldn't stop it.
- The Foreman (2026-10-20 21:28 UTC) asked you: 0344 is waiting on your macOS choice and speck run keeps restarting it: pick Linux plus macOS's recorded sleep and wake times (macOS part unverified), Linux only, or just the README figures, or move 0344 back to draft until you decide. I recommend Linux plus macOS.. Why: The build stopped before starting for the fifth time because the macOS question is still unanswered; draft fix 0349 already covers the restart loop, so only your answer, or moving the ticket to draft, will stop it.
- The Foreman (2026-10-20 21:29 UTC) asked you: 0344 is still waiting on your macOS choice (Linux plus macOS's recorded sleep and wake times, Linux only, or just the README figures; I recommend Linux plus macOS), and fix 0349 for the restart loop is still a draft, not shipped: will you answer, or move 0344 to draft and set 0349 ready to stop the loop?. Why: The build stopped before starting for the sixth time because the macOS question is still unanswered, and it wrongly thought fix 0349 had shipped when it's still a draft, so speck run will keep restarting 0344 until you answer or move it to draft.
- The Foreman (2026-10-20 21:30 UTC) asked you: Which way for 0344's macOS sleep: Linux clock gap plus macOS's recorded sleep and wake times (macOS part unverified; my recommendation), Linux only, or just the README figures? Until you answer, moving 0344 to draft is the only thing that stops speck run restarting it.. Why: The build stopped before starting for the seventh time because the macOS question is still unanswered, and draft fix 0349 for the restart loop isn't ready yet, so only your choice or moving 0344 to draft will stop it.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
