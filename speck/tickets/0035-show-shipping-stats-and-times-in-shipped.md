---
id: "0035"
title: Show shipping performance in Shipped                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-10-09T14:49:25.220Z"

---
# 0035 · Show shipping performance in Shipped

**Status:** 🔍 reviewing

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
- Self-check: no changes. Each median covers its own tickets (both times; at least one review round; tokens above 0, since 0 means not recorded), so each stat names its own count. An even count takes the mean of the middle two (rounds to one decimal place, minutes and tokens whole).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up idea: a ticket whose `finished` is earlier than `started` gives negative minutes, both on its row and in the median. Consider leaving such tickets out.
- Follow-up idea: ship times from an earlier year show no year (`D Mon HH:MM` as the ticket asks), so they could be mistaken for this year's.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "a70be013c2bb862fae72ad0b521d7f0889d518b4",
    "thread_id": "01a12129-0a94-7fe0-b702-fd94015959b5",
    "seconds": 52,
    "usage": {
      "input_tokens": 308512,
      "cached_input_tokens": 242304,
      "cache_write_input_tokens": 0,
      "output_tokens": 1362,
      "reasoning_output_tokens": 52
    },
    "saved_at": "2026-10-09T14:55:52.242Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: panelModel computes separate median populations from all done tickets; render displays counts above the list. The two 0035 AC1 tests exercise calculations and rendering. Independent read-only checks passed for more than five tickets, even medians and today's count across local midnight."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html: shippedAt uses local date getters and render adds the shipping time to each row. The 0035 AC2 rendering test and time-zone test cover both formats and missing timestamps; independent local-midnight checks passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html: render hides and clears stats when shippedTotal is zero. The 0035 AC3 test exercises the empty message, hidden stats and CSS override."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "The updated Shipped description matches the implementation, including separate populations, missing-data dashes, local shipping times and the empty state."
    },
    "escalation_question": "",
    "summary": "Shipped now shows overall shipping performance and a local shipping time on each row. All three criteria are met, and the tests exercise the actual page code. Additional read-only checks passed; no blocking concerns found."
  }
}
```

</details>
