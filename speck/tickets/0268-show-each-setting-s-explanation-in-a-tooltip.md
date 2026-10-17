---
id: "0268"
title: "Show each setting's explanation in a tooltip"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0258"]               # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T09:22:08.221Z"

---
# 0268 · Show each setting's explanation in a tooltip

**Status:** 🔨 building

## Problem
The panel's Settings view (0257) shows a one- or two-sentence explanation under every setting, so the view is long and the values are hard to scan.

## Outcome
Each setting's explanation sits behind a small info button beside its name, so the view shows names and values at a glance and the explanation is one hover, focus or tap away.

## Acceptance criteria
1. In the Settings view, no setting's explanation shows until it's asked for. Each setting has an info button beside its name, whose accessible name includes the setting's name (for example "About auto_ship").
2. The explanation shows while the pointer is over the info button, and while the info button has keyboard focus. Tapping or clicking it shows it until it's tapped or clicked again, or another setting's explanation is opened.
3. Escape hides an open explanation and leaves the Settings view open. With no explanation open, Escape closes the view, as it does today.
4. The info button is linked to its explanation (`aria-describedby`), so a screen reader reads the explanation with the button. The explanation stays inside the Settings view at the panel's narrowest width.

## Out of scope
- Changing the explanations' wording.
- Changing settings from the panel: 0258.

## Notes
- The view is in `templates/panel.html` (search for "0257"). The explanations come from `scripts/settings.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
