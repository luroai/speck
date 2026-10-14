---
id: "0156"
title: "Show a running build's progress with the speck"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0155"]                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-14T06:28:34.965Z"

---
# 0156 · Show a running build's progress with the speck

**Status:** 🔨 building

## Problem
A running build's progress is a thin five-part bar with small uppercase stage labels ("SELF-CHECK", "REVIEW 1") squeezed under it. On a phone the moving part is too small to notice, and the labels make the bar look cramped. The bar was designed for several builds running side by side; speck now builds one ticket at a time, so the running build can have more room.

## Outcome
Each in-flight ticket in the Build queue shows its progress as speck's ensō: the red speck circles it while an agent is at work and rests while the ticket waits for the user, with the stage written in plain words and a row of stage dots.

## Acceptance criteria
1. Each building, reviewing, blocked or approved ticket in the Build queue shows an open ensō circle (about 112 px across, the circle drawn in a thin neutral line, open at the top left) with the build's elapsed time inside it, beside the ticket's id and title. The five-part progress bar and its labels are no longer shown for these tickets, and ready tickets show no progress at all.
2. While an agent is at work on the ticket (building, reviewing or shipping, and not paused), a red speck dot travels round the ensō, one lap about every 7 seconds. While the ticket waits for the user (approved and not shipping, or blocked), the build is paused, or its build has stopped, the dot rests at the top and doesn't move.
3. Under the title, one plain sentence says what's happening: "Writing tests and code", "Checking its own work", "<reviewer> is reviewing · round <n>", "Approved · waiting for you to ship it", "Shipping", "Paused", "Blocked · it has a question for you" or "The build stopped". It is in the card's state colour when the ticket is waiting, blocked or stopped (purple, red, red), and in the normal text colour otherwise.
4. Under the sentence, five dots for Build, Self-check, Review, Approve and Ship, then the current stage's name: dots for finished stages are green, the current stage's dot is in the state colour with a soft halo, later stages' dots are grey. While an agent is at work, the current stage's dot pulses gently; otherwise it is still. With `prefers-reduced-motion: reduce`, neither the speck nor the dot moves.
5. It fits a 375 px wide screen without overflow and looks the same at desktop width, in light and dark mode, and no test that passed before this change fails, except checks of the old progress bar, which are changed to check AC1 to AC4.

## Out of scope
- The card's border and coloured left edge (0155).
- Knowing that a ship is in progress (0153); until it ships, "Shipping" shows only for a ship the panel itself started.
- Animating anything for ready tickets.

## Notes
- Chosen on 2026-10-13 from a mockup of three options (option A1).
- Failing before this build: none
- Old tests changed (AC5): the shared helpers `stagesOf`, `stepText`, `stepState` and `nowStep` now read the stage dots, whose titles are the old labels; 0034, 0045, 0055, 0069, 0053, 0138 and 0153's bar checks follow them (shapes lose `stages`, which is now in the top row). Beyond the bar itself: 0050 and 0058's selection from the title across the timer now crosses the sentence and stage name, which come before the timer; 0140 compares two page snapshots with reduced motion on, as the speck would otherwise move between them; 0154 taps the ready card's Queued line (it has no bar now) and brings the mouse onto it from off the card; 0155 checks an in-flight card's timer in the ensō at the right padding instead of at the end of the id's row, and lets its tags wrap beside the ensō, clear of it, as the column beside it is narrow at 700 px.
- Self-check: the timer is pinned to the ensō's 112 px box, so it stays inside the circle when a long title makes the card taller; a reviewer given as a non-string or blank falls back to "The reviewer".
- Stages come from `progress()` in `templates/panel.html`; the bar is `.stages`, and its moving dot is the `sweep` animation.
- The speck dot is the accent red (`--accent`), as in the ensō on the landing site; the circle itself stays neutral so the speck is the only red thing that moves.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
