---
id: "0577"
title: "Set the panel's new design tokens"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-09

---
# 0577 · Set the panel's new design tokens

**Status:** 📋 ready

## Problem
The panel's look was built around the LCD screen: grey-green screen colours, the Doto dot-matrix font on titles, and borders round every card. The redesign needs a calm, grown-up base for every view: neutral greys, one blue accent, orange only for what needs you, and speck's red kept for its eye alone.

## Outcome
The panel uses the redesign's colours and fonts in both looks, and every view picks them up.

## Acceptance criteria
1. `templates/panel-base.css` defines the redesign's colour tokens for the light and the dark look, with the values in Notes: background, surface, border, text, muted text, accent, needs-you, needs-you text, speck's eye, and the black bar's background, ink, muted ink and line.
2. Inter (weights 400, 500 and 600) and JetBrains Mono (400 and 500) are kept as woff2 files in `templates/fonts/` with their licence files, loaded with `@font-face` from addresses relative to the page as 0543 requires, and used for the panel's text and for ids, times and figures respectively. Lane titles and the Pipeline log's title no longer use Doto.
3. Muted text, accent text and needs-you text each have a contrast of at least 4.5:1 against the background and the surface, in both looks.
4. The panel fetches no font or style from anywhere but itself, so it looks the same with no network.
5. Tests that checked the old look of what this changes are updated to the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Changing any view's layout, which the tickets after this do.
- The LCD screen, which keeps its own colours until 0580 replaces it.

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Light: background #FFFFFF, surface #F4F5F7, border #E4E6EA, text #15171A, muted #5F6670, accent #2F55D4, needs-you #D9822B with its text #A84F06, speck's eye #D63F28. Dark: background #111214, surface #1B1D20, border #2A2D31, text #ECEDEF, muted #9AA0A8, accent #86A2FF, needs-you #F0A35A (text too), speck's eye #FF6A4D. The black bar, the same in both looks: #1C1D19, ink #E8E7E1, muted ink #A5A69E, line #34352F, its eye #E24A2F.
- `test/panel-0472.test.mjs` AC3 compared every element's computed style with the look before 0472's split; it can't hold through a redesign, so it's updated to check what it still can, or replaced, and the Delivery log says which.
- Unverified here: Inter and JetBrains Mono are both under the SIL Open Font License 1.1, which allows bundling them. The builder confirms it from each font's own licence file and keeps that file beside it, as Doto's `OFL.txt` is.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
