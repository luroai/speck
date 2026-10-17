---
id: "0276"
title: "Pick the reviewer's model and effort from what it offers"                # one outcome, no "and"
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
after: ["0275"]               # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T15:48:22.489Z"

---
# 0276 · Pick the reviewer's model and effort from what it offers

**Status:** 🔨 building

## Problem
`reviewer_model` is a text box, so you have to know the exact name of a model, and you won't hear when the reviewer's provider releases a new one. `reviewer_effort` offers a fixed list (low to max) that doesn't follow what the model supports: Codex's newest models also offer `ultra`, which speck refuses.

## Outcome
When the reviewer can say which models it offers, the Settings view lists them, so a new model shows up there as soon as the reviewer knows about it, and the efforts offered are the ones the chosen model supports.

## Acceptance criteria
1. With `reviewer: codex`, the Settings view offers `reviewer_model` as a list of the models Codex lists as available, read when the view opens, plus "(default)" for blank. Models Codex marks as hidden aren't listed.
2. With `reviewer: codex`, `reviewer_effort` offers "(default)" and the efforts the chosen model supports, as Codex lists them, and speck accepts any of them, including efforts beyond `max`.
3. A saved value that the list doesn't include, such as a model that's been withdrawn, still shows, marked as not offered, and isn't changed unless you change it.
4. When the models can't be read (Codex isn't installed, isn't signed in, or the command fails or takes more than 10 seconds), and for any other reviewer, the view offers a text box for the model and the fixed effort list, as today, and says in one line why there's no list.

## Out of scope
- Claude Code: it has no command that lists its models. Its aliases (`fable`, `opus`, `sonnet`) always mean the newest model of each kind, so they already follow new releases.
- A setting for the builder's model: `speck/ideas/2026-10-11-choose-the-builder-s-model-per-ticket.md`.

## Notes
- Checked 2026-10-17: `codex debug models` (codex-cli 0.159.0) prints the model catalogue as JSON: each model's `slug`, `visibility` (`list` or `hide`) and `supported_reasoning_levels` (each with an `effort`, including `ultra` on some models) (the installed tool).
- Checked 2026-10-17: `codex debug models` works in codex-cli 0.159.0 with the shape above; whether it stays stable between releases can't be checked ahead of time (it's under `debug`), and criterion 4's fallback covers it changing or going away.
- Checked 2026-10-17: `claude --model` takes an alias such as `fable`, `opus` or `sonnet` for the newest model of that kind, or a full model name, and Claude Code 2.1.301 has no command that lists models (`claude --help`).
- `EFFORTS` in `scripts/core.mjs` is the fixed list today.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
