---
id: "0407"
title: "Open Settings before the agent lists are ready"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-open-settings-before-the-agent-lists-are-ready.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0406"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T12:25:48.528Z"

---
# 0407 · Open Settings before the agent lists are ready

**Status:** 🔨 building

## Problem
Opening Settings sits on "Loading the settings…" until speck has finished asking every agent CLI whether it is signed in and which models it offers. Cursor's model list alone often takes a few seconds, so the view feels stuck even though the config is ready at once.

## Outcome
Settings opens from this machine's and the project's config straight away, and the agent catalogues fill in afterwards.

## Acceptance criteria
1. Opening Settings shows every settings group and the values speck reads from config within about half a second on a normal machine, without waiting for Codex's or Cursor's model list, or for each agent's install and sign-in check. The whole view no longer stays on "Loading the settings…" for that wait.
2. While those catalogues are still loading, each role's model list and Your agents say they are loading in place. When a list arrives, that control updates to the real entries without closing Settings, without clearing what you have typed or picked, and without jumping the scroll or the keyboard focus.
3. If a catalogue fails or times out, that control shows why in one line, as today when models can't be read, and the rest of Settings stays usable. Saving a setting that does not need a fresh catalogue still works while a list is loading.
4. No test that passed before this change fails, except a check that Settings stays on loading until every agent answer is back, which is changed to check criteria 1 and 2.

## Out of scope
- Making the agent CLIs themselves faster.
- Changing which models each role offers once the lists have arrived: 0400 and 0403.

## Notes
- Asked for 2026-10-23 after timing the wait: on this machine Cursor's `agent models` took about 2.4s; each CLI may take up to 10s (`AGENTS_TIMEOUT_MS`, `CODEX_MODELS_TIMEOUT_MS`).
- Checked 2026-10-23: `openSettings` / `loadSettings` in `templates/panel.html` fetch `/api/settings` once and only then draw the ok view. `settingsAnswer` in `scripts/settings.mjs` awaits `findAgentsAsync` (sign-in checks) and `yourModels` (Codex and Cursor model lists for your agents) before returning.
- Prefetching when the panel starts, or caching the last lists, is fine as how, so long as criteria 1–3 hold.
- Waits for 0406: both change Settings loading and grouping (`templates/panel.html`, `scripts/settings.mjs`, `scripts/panel.mjs`).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
