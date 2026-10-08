---
id: "0000"
title: ""                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | done
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
source: ""               # e.g. work/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first

---

## Problem
<!-- Who is affected and why it matters. 1–3 sentences. -->

## Outcome
<!-- What is true when this ships. One outcome. -->

## Acceptance criteria
<!-- 1–5 testable statements. Each one becomes a test before any code is written. -->
1.

## Out of scope
-

## Notes
<!-- Constraints, links and decisions. Optional. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost, PR link. -->
