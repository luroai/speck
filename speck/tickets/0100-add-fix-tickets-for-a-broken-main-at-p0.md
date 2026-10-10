---
id: "0100"
title: "Add fix tickets for a broken main at P0"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-a-shipping-agent-that-heals-the-build.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T18:38:18.271Z"

---
# 0100 · Add fix tickets for a broken main at P0

**Status:** 🔍 reviewing

## Problem
When `main` breaks, every ship stops until it's fixed, so the fix must come before everything else. speck's tickets have only one type besides the default (`bug`) and priorities 1 to 5, so a fix can't be marked or ordered ahead of everything else.

## Outcome
Fix tickets are a ticket type of their own, for a broken `main`, at priority 0 (P0), ahead of everything.

## Acceptance criteria
1. `speck new "<title>" --type=fix` creates a fix ticket with priority 0. `speck lint` accepts `type: fix`.
2. Priority 0 is valid only on a fix ticket: `speck lint` reports it as an error on any other ticket, and `speck set <id> priority 0` refuses on one.
3. Fix tickets sort first wherever tickets are ordered by priority, including the order `speck run` starts them.
4. `speck status` and the panel mark fix tickets (as `fix`), as they mark bug tickets.

## Out of scope
- Creating fix tickets automatically (0101).

## Notes
- Bug tickets (0049) are the model for the type and its mark.
- A fix ticket sorts ahead of every other ticket whatever its priority, so a fix ticket set to P3 still comes before a P1. A priority that's invalid for its ticket (0 on a non-fix ticket, or a negative one) now sorts with the tickets that have none, as the existing comment on `byPriority` already said.
- Self-check: no changes

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - `speck set <id> type …` can leave P0 on a ticket that's no longer a fix ticket: speck/ideas/2026-10-10-refuse-a-type-change-that-strands-p0.md.
  - The panel highlights P1 but not P0: speck/ideas/2026-10-10-highlight-p0-in-the-panel.md.
  - Tidy-up: `speck help` lists `speck new <title> [--source=path]` without `--type=bug|fix`.
  - Tests ran with `--test-concurrency=2` (the same files as `npm test`), after five suites running at once ran the machine out of memory.

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
    "reviewed_sha": "c6f9f58032fafa169f6ebd6df098cb21073de0e2",
    "thread_id": "01a12758-9447-7b81-b81c-f13ce83678ea",
    "seconds": 29,
    "usage": {
      "input_tokens": 481013,
      "cached_input_tokens": 377344,
      "cache_write_input_tokens": 0,
      "output_tokens": 869,
      "reasoning_output_tokens": 56
    },
    "saved_at": "2026-10-10T19:45:08.164Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs cmdNew creates type fix at P0; scripts/core.mjs lintTicket accepts it. test/fix-0100.test.mjs AC1 exercises creation and lint acceptance; supplied output passes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "lintTicket restricts P0 to fix tickets; checkSetTicket refuses P0 on other types before writing. AC2 tests exercise lint errors, CLI refusal with unchanged contents, and successful P0 assignment to a fix ticket; supplied output passes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "core.mjs byPriority ranks fix tickets first regardless of priority. cmdStatus and statusData use it; run.mjs tick launches tickets in statusData order. AC3 tests exercise plain status, JSON order and actual runner launches; supplied output passes. Independent read-only ordering check also passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "cmdStatus prints the fix mark; panel.html typeTag renders fix tags in Shaping, queue and Shipped. AC4 tests exercise CLI output and panel rendering in all three areas; supplied output passes."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Fix tickets start at P0, take precedence over other tickets, and display a fix label in status and the panel. P0 is rejected for other ticket types. The tests exercise the required behaviour, and I found no blocking issues. I inspected the tests and supplied passing results; the read-only environment prevented rerunning tests that create temporary files."
  }
}
```

</details>
