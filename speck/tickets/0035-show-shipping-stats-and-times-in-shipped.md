---
id: "0035"
title: Show shipping performance in Shipped                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0033"]                # ticket ids that must be done first
created: 2026-10-09

---
# 0035 · Show shipping performance in Shipped

**Status:** 📋 ready

## Problem
Shipped lists the latest tickets, but not when each one shipped or how the pipeline is performing overall, which is the proof data speck is meant to collect.

## Outcome
Shipped shows overall stats above the list, and each row shows when its ticket shipped.

## Acceptance criteria
1. Above the list, Shipped shows: tickets shipped today (`finished` on today's date in the browser's time zone), and the median minutes from `started` to `finished`, median review rounds and median tokens. The medians cover every `done` ticket that has the data each needs, and the stats row says how many tickets they cover.
2. Each row shows when its ticket shipped, from `finished` in the browser's time zone: `HH:MM` if it's today, otherwise `D Mon HH:MM` (for example `8 Oct 14:02`). A ticket with no `finished` time shows a dash.
3. With no `done` tickets, Shipped says nothing has shipped yet and shows no stats.

## Out of scope
- Shaping (0033) and the queue (0034).
- Charts, or stats over any other period.

## Notes
- `finished` is set when a ticket becomes `done`, which `speck ship` does as it merges, so it's the ship time.
- Builds after 0033, which changes the same page. It touches a different part of the page from 0034, so the two can run side by side.
- No external facts: everything comes from files speck already reads.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
