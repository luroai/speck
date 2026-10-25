---
id: "0510"
title: "Open the panel when setup finishes"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-20-start-and-open-the-panel-when-setup-finishes.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0509"]                # ticket ids that must be done first
created: 2026-10-25

---
# 0510 · Open the panel when setup finishes

**Status:** 📋 ready

## Problem
Setup ends by running `speck doctor` and saying what to do next, but the panel isn't on screen, and someone new has to find out how to start it. In Cursor on 2026-10-20, the agent opened the panel in Cursor's own browser after setup by itself, and the user found that "awesome". Speck's own setup doesn't do it, so other agents and setups end without it.

## Outcome
Setup finishes with the panel running and open in front of the user, in the agent's own browser where it has one, and `speck run` on.

## Acceptance criteria
1. Once `speck doctor` passes, setup's Finish step starts the panel with `speck panel --background`, telling the user it's doing so, before it says what to do next.
2. It then opens the panel: in the agent's own built-in browser when it has one, such as Cursor's browser or Claude Code desktop's browser pane; otherwise in the machine's own browser when it has a desktop; otherwise it gives the address and says how to open it from another machine, pointing to the README's private tunnel section (checked by review).
3. It turns `speck run` on, as the switch at the top of Settings does, so a ticket starts building as soon as the user sets it ready, and tells the user so and that the same switch turns it off (checked by review). If `speck run` won't start, setup says why and finishes anyway.
4. If the panel doesn't start, setup says why and how to start it later with `speck panel`, and finishes anyway (checked by review).
5. The steps for what to do next mention setting a ticket ready from the panel as well as with `speck set` (checked by review). No test that passed before this change fails.

## Out of scope
- `speck panel --background` itself (0509).
- The panel's font under a proxied path (`speck/ideas/2026-10-19-load-the-panel-s-font-and-icons-from-relative-addresses.md`).

## Notes
- From the idea, ticketed with the user on 2026-10-25. Its open questions, decided with the user: setup turns `speck run` on ("Speck run should be on I think"), which builds nothing until a ticket is set ready; and in a plain terminal it opens the machine's browser when there is one, else gives the address.
- Today: section 8, "Finish", in `skills/speck-setup/SKILL.md`.
- Waits for 0509, the command this uses.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
