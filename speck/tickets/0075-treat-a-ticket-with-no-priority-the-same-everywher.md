---
id: "0075"
title: "Treat a ticket with no priority the same everywhere"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T22:28:44.275Z"

---
# 0075 · Treat a ticket with no priority the same everywhere

**Status:** 👍 approved

## Problem
speck doesn't handle a ticket with no priority consistently. `speck status` lists `priority: ""` as `P` above P1 tickets and a bare `priority:` as `P[object Object]`, while `status --json` (and so `speck run` and the panel) puts both last. Nothing checks the value either: `speck set <id> priority high` is accepted, and there's no way to clear a priority with `speck set`. It still matters for tickets edited by hand.

## Outcome
A ticket's priority is always a whole number from 1 to 5 or none, and a ticket with none is shown and ordered the same way everywhere.

## Acceptance criteria
1. A ticket whose `priority` line is missing, `priority:` with nothing after it, or `priority: ""` has no priority. `speck status` shows it as `P-` and lists it after every ticket in its status group that has one, then by id. `speck status --json` gives it `priority: null` and lists it after every ticket with one, so `speck run` launches it after ready tickets with a priority.
2. `speck lint` gives an error (✗) for a priority that is neither none nor a whole number from 1 to 5, such as `0`, `6`, `2.5` or `high`, and `speck set <id> priority <value>` refuses such a value with a plain message and a non-zero exit, changing nothing.
3. `speck set <id> priority ""` clears the priority, leaving `priority: ""` with the line's trailing comment kept, and the ticket then has no priority as in criterion 1.
4. The panel shows no priority tag for a ticket with no priority, in each of the three forms in criterion 1.

## Out of scope
- Changing what priority new tickets get: they start at P3.
- Setting priority from the panel (0077).

## Notes
- Reproduced 2026-10-09 in a fresh `speck init` repo: `speck status` printed `0002  P  S/low  b` above a P1 ticket for `priority: ""`, and `P[object Object]` for a bare `priority:`, while `status --json` gave `""` and `{}` and put both last.
- `speck set` refuses every blank value today (`Usage: speck set <id> <field> <value>`); only `priority` changes here.
- The text sort is in `cmdStatus` (`a.fm.priority ?? 9`), and the JSON sort is `rank` in `statusData`.
- Self-check: no changes. Checked `priority: []`, `{}`, `"3"`, `null` and `3.0` (all lint errors, ranked with no priority), `speck set` with a padded or extra value (refused) and that other fields still refuse a blank value. The run-order test and the missing-line text test passed before the change; they stay as guards.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 386,483
- Elapsed since build started: 7 min
- Changed lines: 38 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (Delivery log only, no inbox notes):
- Known limit: a draft with no priority shows no tag in the panel, so it can't be given one there. 0077 puts that out of scope on purpose (new tickets start at P3), so no idea note.
- Tidy-up: the panel's `t.priority !== ''` check in `tags()` is now redundant, since `status --json` gives `null` for every form of no priority.

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
    "reviewed_sha": "11849b0e1f380026caf9bd0270a38f0f003f2c5e",
    "thread_id": "01a122cd-dc8f-7a53-ace9-cbaa9876f94f",
    "seconds": 29,
    "usage": {
      "input_tokens": 385542,
      "cached_input_tokens": 301568,
      "cache_write_input_tokens": 0,
      "output_tokens": 941,
      "reasoning_output_tokens": 53
    },
    "saved_at": "2026-10-09T22:35:08.466Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs: fieldValue/ticketPriority normalise all three empty forms to null; cmdStatus and statusData share byPriority. test/priority-0075.test.mjs exercises text output, JSON values and ordering for every form, plus runner launch order."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "lintTicket validates priorities with validPriority; cmdSet refuses invalid input before writes. AC2 tests exercise invalid values, unchanged file contents, plain errors and valid priorities. Independent read-only checks confirmed lint rejects the specified invalid values."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdSet accepts an explicit empty priority; writeField/setField writes priority: \"\" and preserves its comment. The AC3 test checks the resulting line, lint, JSON and text ordering, and continued rejection of empty titles. Independent setField verification confirmed comment preservation."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "statusData supplies null to the panel; templates/panel.html omits priority tags for null. The AC4 test feeds actual CLI JSON into the real panel script and checks all three forms in draft and ready rows, with a P2 positive control."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Tickets without a priority now display and sort consistently. Invalid priorities are rejected, and clearing a priority preserves its comment. All four criteria have meaningful tests, reported passing by the builder. Read-only checks confirmed validation and comment preservation; I found no blocking issues. The full suite was not rerun in the read-only environment."
  }
}
```

</details>
