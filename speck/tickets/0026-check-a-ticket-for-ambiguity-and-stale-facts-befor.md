---
id: "0026"
title: "Pre-check every ticket before it goes ready"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09

---
# 0026 · Pre-check every ticket before it goes ready

**Status:** 📝 draft

## Problem
Two kinds of ticket problem cost review rounds and builder time. A criterion that can be read two ways leads to a dispute: 0012's "send the full round-1 prompt again" did. An external fact written into a ticket can be stale by build time: 0014 named Cursor's CLI `cursor-agent`, and its docs now call it `agent`.

## Outcome
Before a ticket is presented for approval, the agent checks it for criteria with more than one reading and for external facts, and records what it checked.

## Acceptance criteria
1. The ticket skill has a step before presenting the ticket. For each acceptance criterion, the agent asks whether a builder and reviewer could read it differently, and rewrites it or asks the user if so.
2. The same step lists external facts the ticket relies on (tool and command names, flags, file formats, URLs, versions), checks each against current documentation or the installed tool where possible, and records each in Notes as checked, with the date, or as unverified.
3. The build skill's pre-flight re-checks any fact marked unverified, and stops to tell the user if one turns out to be wrong.

## Out of scope
- Automated checking by the CLI.

## Notes

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
