---
id: "0079"
title: "Make the panel's ticket writes use the same code as speck set"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 4              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0018"]                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T12:12:28.556Z"

---
# 0079 · Make the panel's ticket writes use the same code as speck set

**Status:** 👍 approved

## Problem
The panel's Ready and priority buttons (0042, 0077) each have their own copy of the checks and the field write that `speck set` does, while pause, play and stop already call the same code as the CLI. Two copies drift: a rule added to `speck set` wouldn't apply in the panel, and an out-of-range priority already gets different wording in each.

## Outcome
The panel sets a ticket's status and priority through the same code as `speck set`, keeping its own extra rules, so the two can't drift.

## Acceptance criteria
1. The panel's Ready and priority writes use the same code as `speck set` to check the value and write the field. No second copy of those checks or that write is left in the panel's code.
2. A ticket that fails the size rules is refused by the panel's Ready with exactly the `Not ready:` text that `speck set <id> status ready` prints, and nothing is changed or committed.
3. A priority outside 1 to 5 is refused by the panel with exactly the message `speck set <id> priority <value>` prints for that value, and nothing is changed or committed.
4. The panel's own rules are unchanged: only drafts, only on the base branch, only that ticket committed, the same commit messages (`speck(<id>): ready`, `speck(<id>): priority <n>`) and the same responses on success.
5. After a successful panel write, the ticket file is byte for byte what `speck set` writes for the same change.

## Out of scope
- New panel writes.
- Changing `speck set`'s behaviour, messages or the fact that it doesn't commit.

## Notes
- From the rule "the panel writes to the repo only through CLI functions" in `speck/ideas/2026-10-10-more-human-gate-actions-in-the-panel.md`. Pause, play and stop already follow it (`panelPausePlay`, `panelStop` call `pauseBuild`, `playBuild`, `stopBuild`).
- Assumption: AC3 changes the panel's wording to the CLI's. Today the panel says `Priority must be a whole number from 1 to 5, not "<value>".` and `speck set` says `priority must be a whole number from 1 to 5, or "" to clear it (got "<value>").`
- After 0018, so the change lands in the panel's own module.
- AC2, AC4 and AC5 tests passed before the change: the panel's Not ready text, its own rules and its writes already matched `speck set`. They stay as guards on the refactor. AC1 and AC3 failed first.
- The panel takes the priority from the URL without decoding it (0077), so AC3 compares with `speck set`'s message for the value the panel receives (for example `%201`).
- `speck set` clears a priority with `""`; the panel still refuses `""` (its own rule, as before), now with `Pick a priority from 1 to 5: the panel can't clear one.`
- Self-check: the shared write also moves a ticket to its status's folder, so a draft filed in `speck/tickets/done/` would have been moved by the panel's Ready but only half committed. The panel now refuses that draft before writing and names the `speck set` command instead (test added).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 333,079
- Elapsed since build started: 9 min
- Changed lines: 59 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox. Known limit: `commitTicketOnly` commits one path, so a panel write that moves a ticket between folders can't be committed in one go; the panel refuses the one case that would (a draft filed in `speck/tickets/done/`).

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
    "reviewed_sha": "2cbdcfa35f12fe474b2cf5c681d6fa10e21d1834",
    "thread_id": "01a125c2-0198-76c2-80cc-47cb501be125",
    "seconds": 29,
    "usage": {
      "input_tokens": 332353,
      "cached_input_tokens": 237312,
      "cache_write_input_tokens": 0,
      "output_tokens": 726,
      "reasoning_output_tokens": 28
    },
    "saved_at": "2026-10-10T12:21:03.121Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/panel.mjs uses checkSetValue, checkSetTicket and setTicketField, as does cmdSet in scripts/speck.mjs. The two AC1 tests check removal of duplicate logic and exercise injected shared rules through real panel requests; both passed in the supplied output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelSetReady returns the shared checkSetTicket error before writing. The AC2 integration test compares the exact CLI refusal text and verifies unchanged files and commit history; it passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelSetPriority uses checkSetValue for invalid priorities. The AC3 integration test compares exact CLI messages for nine invalid values and verifies no file or commit changes; it passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Both panel functions retain draft and base-branch checks, commitTicketOnly, commit messages and success responses. The AC4 integration test exercises these safeguards; existing 0042 and 0077 tests cover commit rollback and staged changes. All passed in the supplied output."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Both panel functions and cmdSet use setTicketField. The two AC5 integration tests compare complete file contents after Ready and priority writes against actual CLI writes; both passed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel now shares the CLI’s validation and ticket-writing code, including its error messages, while retaining its commit safeguards. The tests exercise real CLI and panel behaviour and cover every criterion. No blocking issues found. I inspected the code and tests; I did not rerun tests because this review is read-only and they create temporary repositories."
  }
}
```

</details>
