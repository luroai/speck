---
id: "0201"
title: "Say once that a ticket is shipping"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0200"]              # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T14:32:01.715Z"

---
# 0201 · Say once that a ticket is shipping

**Status:** 🔨 building

## Problem
While a ticket ships, its card in the Build list says so three times: "Shipping" beside the builder badge, the step name "Ship" under it, and a separate "Shipping… · 00:04" line below. Seen on 0197 on 2026-10-15.

## Outcome
A shipping ticket's card says it is shipping once, with how long the ship has been running.

## Acceptance criteria
1. While a ticket is shipping, by `speck run`'s queue, by auto-ship or by the user, its card shows "Shipping" once, beside the builder badge, followed on the same line by how long the ship has been running (for example "Shipping · 00:04"), counting up as today.
2. While it's shipping, the card shows no step name under that line and no separate "Shipping…" line.
3. A ship started from the review pack's Ship button that the server hasn't answered yet also shows "Shipping" only once.
4. Cards at every other stage look as they do today, and the build time on the right of the card is unchanged.
5. No test that passed before this change fails, except checks of the separate "Shipping…" line, which change to check AC1 and AC2.

## Out of scope
- The shipping animation (0172).
- The header button (0199).

## Notes
- Asked for 2026-10-15: "when a ticket is shipping, it says it 3 times.... not needed."
- In `templates/panel.html`: `doing()` gives "Shipping"; the step name comes from the card's step line (0168); the separate line is the `act shipping` element with `ship_counter`.
- Failing before this build: none
- AC2 and AC5: AC2 removes the step name under a shipping card, so the checks of that step name on shipping cards in the 0156 and 0168 tests change with it, as do the checks of the "Shipping…" line in the 0153 and 0196 tests. The 0156 and 0168 real-browser checks now look for the ship's time on the same line as "Shipping" (AC1) instead.
- Self-check: README and the brief still described the "Shipping…" line; both now say "Shipping" with how long. A test's exact " · 00:05" could miss by a second, so it matches any time.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
