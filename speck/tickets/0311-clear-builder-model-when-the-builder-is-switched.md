---
id: "0311"
title: "Clear builder_model when the builder is switched"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-18

---
# 0311 · Clear builder_model when the builder is switched

**Status:** 📝 draft

## Problem
Switching the builder, in the Settings view or with `speck config set builder`, leaves `builder_model` as it was. Switching from Claude Code to Codex with `builder_model: opus` left set means every Codex build is started with a model Codex doesn't have.

## Outcome
When the builder is switched, a `builder_model` the new builder doesn't offer is cleared, and you're told.

## Acceptance criteria
1. Switching the builder in the Settings view clears `builder_model` in the same save when the new builder's models (as `speck agents` lists them) don't include it, and the view says it was cleared.
2. `speck config set builder <name>` does the same, saying in one line that `builder_model` was cleared and why.
3. A `builder_model` the new builder does offer is kept.
4. When the new builder's models can't be read, `builder_model` is cleared, since it can't be checked.

## Out of scope
- `reviewer_model` when the reviewer is switched.

## Notes
- From `speck/ideas/2026-10-18-clear-builder-model-when-the-builder-is-switched.md` (inbox, from 0293). Settings are saved in `scripts/settings.mjs` and `scripts/config.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
