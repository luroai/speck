---
id: "0628"
title: "Let the owner-name check skip the price list"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T20:31:22.124Z"

---
# 0628 · Let the owner-name check skip the price list

**Status:** 🔨 building

## Problem
On a machine whose private words include a word that's also part of a model's name, the check that no tracked file names the owner (0082 AC2, in `test/luro-0082.test.mjs`) fails on `scripts/prices.json`, which holds model names copied from LiteLLM's public price list. On 2026-11-10 a word added to the private words matched Google model names there, so the check fails on `main` on this machine, and every ship's test run with it.

## Outcome
The owner-name check skips the copied price list, and still catches a private word in any other tracked file.

## Acceptance criteria
1. `filesNaming` in `test/support/private-words.mjs` leaves out `scripts/prices.json`, the model names copied from LiteLLM's price list, as 0627 leaves it out of the commit check.
2. 0082 AC2 passes on a machine whose private words match a model name in the price list, and still fails when a private word is in any other tracked file outside `speck/`: the Delivery log says how this was checked, without writing the private word down.
3. No test that passed before this change fails.

## Out of scope
- What counts as a private word.
- The commit check (0627).

## Notes
- Found on 2026-11-10 while rewriting the repo's history to take a private name out: `node --test test/luro-0082.test.mjs` failed on `scripts/prices.json` before and after the rewrite, once the word was in `~/.config/speck/private-words`.
- Today: `filesNaming` runs `git grep -l -i -F … -- . ':!speck/'`; adding `':!scripts/prices.json'` is the likely change.
- Relies on nothing outside this repo.
- Failing before this build: not checked
- Self-check: the AC2 test also checks that a file named prices.json anywhere else, or a near-namesake such as scripts/prices.json.bak, is still caught; no code changes.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
