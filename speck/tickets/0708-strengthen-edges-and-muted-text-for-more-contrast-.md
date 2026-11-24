---
id: "0708"
title: "Meet 0161's contrast limits when more contrast is asked for"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-09-check-the-redesign-for-low-vision-readers.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T12:49:08.363Z"

---
# 0708 · Meet 0161's contrast limits when more contrast is asked for

**Status:** 🔨 building

## Problem
0161 made the panel readable for low vision, with edges at 3:1 and small muted text at 7:1. The redesign's chosen look relaxes both, to about 1.25:1 and 5.8:1, so someone who needs more contrast may find cards and controls harder to see.

## Outcome
With the system's more-contrast setting on, the panel's edges and muted text meet 0161's limits, and the chosen look is unchanged for everyone else.

## Acceptance criteria
1. With `prefers-contrast: more`, in both the light and dark looks, the lines and borders around cards and controls reach at least 3:1 against the panel background and the raised background.
2. With `prefers-contrast: more`, small muted text reaches at least 7:1 against the panel background and the raised background, in both looks.
3. Without `prefers-contrast: more`, every colour is as it is today.
4. No test that passed before this change fails.

## Out of scope
- Changing the default look, which the user chose.

## Notes
- Tokens are in `templates/panel-base.css` (`--line`, `--line-soft`, `--border`, `--muted`, `--faint`, `--raise`, `--panel`), light and dark. No `prefers-contrast` rule exists yet.
- Decision: keep the look as designed and serve low-vision readers through the system setting, rather than adding stronger edges for everyone.

- Failing before this build: none
- Pictures: none, because the change only applies with the system's more-contrast setting, which the panel's look settings can't switch on.
- Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
