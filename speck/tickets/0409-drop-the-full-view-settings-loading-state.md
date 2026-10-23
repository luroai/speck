---
id: "0409"
title: "Drop the full-view Settings loading state"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-drop-the-full-view-settings-loading-state.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0408"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T13:14:24.426Z"

---
# 0409 · Drop the full-view Settings loading state

**Status:** 🔨 building

## Problem
Opening Settings still shows "Loading the settings…" over the whole view, then "Loading your agents…" once the config has arrived. 0407 was meant to end the first wait; two loading phases are left.

## Outcome
Settings never shows the full-view "Loading the settings…" message. Only the in-place agent and model loading remains.

## Acceptance criteria
1. Opening Settings never shows the words "Loading the settings…" (or any other full-view loading line that replaces the groups). The settings groups and their values from config appear as the first paint of the open view.
2. While agent checks and model lists are still loading, Your agents and each role's model list still say so in place, as 0407 does ("Loading your agents…", and loading on the role lists). When those arrive, they fill in without closing Settings, clearing edits, or jumping scroll or focus.
3. After a Save that reloads Settings, the groups stay visible with the last catalogues while they refresh; the full-view loading line does not return. No test that passed before this change fails, except a check that opens Settings into a full-view loading state, which is changed to check criterion 1.

## Out of scope
- Making the agent CLIs faster.
- Changing what Your agents or the role lists show once loaded.

## Notes
- Asked for 2026-10-23 after 0407: the quick config path works, but `openSettings` in `templates/panel.html` still sets `settingsView = { state: 'loading' }` and `renderSettings` draws "Loading the settings…" before `/api/settings?quick=1` returns.
- Prefetching the quick answer when the panel starts is fine as how, so long as criterion 1 holds.
- Waits for 0408: both change Settings in `templates/panel.html`.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
