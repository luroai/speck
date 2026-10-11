---
id: "0125"
title: "Describe speck the same way everywhere"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T14:27:44.427Z"

---
# 0125 · Describe speck the same way everywhere

**Status:** 🔨 building

## Problem
speck describes itself in different words in different places. `package.json` and `speck help` say "small tickets, independent review, you merge", where the README says "You ship". `speck help` says `speck doctor` checks GitHub, which speck no longer needs. And `speck init`'s next steps describe an older way of working: typing `/speck-capture` and shipping each ticket by hand, with no mention of `speck run` or the panel. A first-time user gets a different picture from each.

## Outcome
`package.json`, `speck help` and `speck init` describe speck the same way the README does.

## Acceptance criteria
1. `package.json`'s description and the first line of `speck help` use the README's tagline, "Small tickets. Independent review. You ship.", and nothing in either says "you merge".
2. `speck help` describes `speck doctor` by what it checks today (git, the builder and the reviewer), without saying GitHub is needed.
3. `speck init`'s next steps describe today's workflow in plain words: shape tickets with `/speck-ticket`, set them ready, start `speck run` to build them one at a time, and follow along in `speck panel`. Approved tickets ship with `/speck-ship`, or by themselves when `auto_ship` is on.
4. No test that passed before this change fails, apart from tests that check the old wording, which check the new wording instead.

## Out of scope
- The README and the brief, already up to date.
- The setup skill's own wording.

## Notes
- Failing before this build: none
- Self-check: narrowed init's auto_ship line to tickets whose risk is in auto_ship_risk (the default covers only low risk), and tested it

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
