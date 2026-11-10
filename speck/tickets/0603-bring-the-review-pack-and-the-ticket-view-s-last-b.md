---
id: "0603"
title: "Retire the panel's last old-style parts"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0602"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T09:17:38.700Z"

---
# 0603 · Retire the panel's last old-style parts

**Status:** 🔨 building

## Problem
A few parts of a ticket still have the LCD-era look: the review pack opens with a small bordered Close button instead of a back link and marks its verdict and criteria with emoji, the full view's Chain is a bordered box with filled circles, and secondary buttons (Close, Full log, Stop build, More stats, Go to Plan) are small boxes with a faint border, unlike the redesign's buttons. The old colours (`--bezel`, `--log-*`, `--purple`) are still in the styles.

## Outcome
The review pack, the ticket's chain and the panel's secondary buttons are in the new look, and the old colours are gone.

## Acceptance criteria
1. The review pack opens with a back link to its ticket, as the other full views do, instead of the bordered Close button, and its verdict and each criterion's result are marked with the panel's own tick and cross in the accent and bad colours rather than emoji.
2. A ticket's chain in its full view is a plain section in the facts' style, naming the tickets it waits for and those waiting on it, with their state, without a bordered box or filled circles.
3. Every secondary button in the panel (such as Close, Full log, Stop build, More stats and Go to Plan) has the redesign's secondary style: a 1 px border in the line colour, 10 px corners, the text colour, and at least 44 px tall.
4. No style uses `--bezel`, `--bezel-ink`, `--bezel-muted`, `--log-bg`, `--log-text`, `--log-muted`, `--log-run`, `--log-bad`, `--log-warn` or `--purple` any more, and they're removed from `templates/panel-base.css`; the Shipped step's colour is the accent.
5. Tests that checked these old looks are changed to check the new ones, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- The build logs (0602).
- The review pack's content.

## Notes
- Asked for 2026-11-10, with a phone screenshot of a shipped ticket's build log: "It's the old branding", and "I think it will happen elsewhere too."
- Checked on 2026-11-10 in a real browser at 390 px, after 0577 to 0597 shipped: the Pipeline log, Decided for you, the Settings view and the top of a ticket's full view are in the new look; the places below aren't.
- Today: the pack is `packPane` in `templates/panel-popups.js`; the chain is `depsBox`, `withDeps`, `depChip` in `templates/panel.js`; the purple Shipped step is in `templates/panel-cards.css` (`.track .step.done.ship`).
- Relies on nothing outside this repo.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
