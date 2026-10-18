---
id: "0316"
title: "Tell setup and shipping about pull request mode"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0315"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T22:47:16.757Z"

---
# 0316 · Tell setup and shipping about pull request mode

**Status:** 🔨 building

## Problem
Pull request mode has shipped (0295, 0296), but the skills don't know about it: setup still warns that speck can't work with a base branch that requires pull requests, and `/speck-ship` describes only merging locally.

## Outcome
Setup offers pull request mode where it fits, and the shipping skill describes how shipping works in it.

## Acceptance criteria
1. When setup finds that the base branch requires pull requests, or the user says their team works through pull requests, it explains pull request mode and offers to turn it on with `speck config set ship_mode pr`, instead of warning that speck can't work there. (checked by review)
2. Setup asks whether to use pull request mode, recommending `local` for someone working alone. (checked by review)
3. `/speck-ship` says that with `ship_mode: pr`, shipping merges the ticket's pull request on GitHub, and what to do when GitHub can't merge it. (checked by review)
4. The brief describes `ship_mode` with the other settings. (checked by review)

## Out of scope
- How pull request mode works: 0295, 0296 and 0315.

## Notes
- From `speck/ideas/2026-10-18-tell-the-skills-about-pull-request-mode.md` (inbox, from 0296). Skills are in `skills/speck-setup/` and `skills/speck-ship/`.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
