---
id: "0163"
title: "Show the running build in the Auto-build button"                # one outcome, no "and"
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
after: ["0161","0168"]                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T16:25:26.868Z"

---
# 0163 · Show the running build in the Auto-build button

**Status:** 🔨 building

## Problem
The header is the only part of the panel that's always on screen, but the Auto-build button only says "Auto-build on" or "off". To see what's being built and where it's got to, the user has to scroll to the Build section, which on a phone is below the whole Plan section.

## Outcome
While a build is running, the Auto-build button says which ticket and which stage, with the speck pulsing, so progress is visible from anywhere on the page.

## Acceptance criteria
1. While Auto-build is on and a ticket is building or reviewing, the button reads "Building <id> · <stage>" (for example "Building 0151 · Review"), with the stage named as in the Build card (Build, Self-check, Review, Approve, Ship).
2. While Auto-build is on and nothing is in flight, it reads "Auto-build on"; while it's off, "Auto-build off", as today. When the build waits for the user (approved and not covered by auto-ship, or blocked), it reads "<id> needs you" in the state's colour (purple or red).
3. In place of the square, the button shows the builder from 0168's badge at about 28 px, without its tile: bouncing gently while a build is running, still and facing front otherwise. With `prefers-reduced-motion: reduce` it never moves.
4. Clicking the button still pauses or starts Auto-build exactly as today, and its tooltip still says what a click will do. The label never wraps or overflows at a viewport 375 px wide; a long label is shortened with "…" and given in full in the tooltip.
5. No test that passed before this change fails.

## Out of scope
- Showing more than one in-flight ticket in the header: it names the first one in the Build queue's order.
- Notifications.

## Notes
- Builds after 0161, as both change the header's styles, and after 0168, which draws the builder.
- Failing before this build: none
- Self-check: no changes. The stage drops the review round's number ("Review", not "Review 2"), as the criterion lists the five names. A stopped build and a failed auto-ship also read "<id> needs you" in red, as their cards are red. A paused build reads "Building <id> · <stage>" with the builder still.
- The Build card's stage names come from `progress()` in `templates/panel.html`; the speck pulse should match the one 0156 added.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
