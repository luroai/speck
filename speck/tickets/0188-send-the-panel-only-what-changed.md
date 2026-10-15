---
id: "0188"
title: "Send the panel only what changed"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0187"]                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-15T11:27:10.204Z"

---
# 0188 · Send the panel only what changed

**Status:** 🔍 reviewing

## Problem
Since 0187, each change pushed to the panel sends the whole board, 1.19 MB on 2026-10-14, to every open page, including a phone over its data connection, even when one ticket changed.

## Outcome
Each update to an open page carries only what changed, however many tickets there are.

## Acceptance criteria
1. After the full board a page gets when it connects, each update carries only the tickets, ideas and speck run state that changed. The size of an update for one changed ticket doesn't depend on how many other tickets there are: with 150 other tickets and with 300, it's the same size to within 1 KB.
2. After any sequence of updates, the page shows exactly what it would show if it loaded the board afresh at that moment.
3. A page that may have missed updates, for example after reconnecting, gets the full board again.
4. `speck status --json` prints the same as before.
5. No test that passed before this change fails.

## Out of scope
- Making the full board smaller (0178).

## Notes
- 0187 (shipped) pushes the whole board on each change, through `scripts/board-feed.mjs`.
- Ticket files run up to about 36 KB (0008), so an update's size limit is relative, not fixed.
- Failing before this build: none
- Self-check: the page builds the board it applies an update to with Object.fromEntries, so no part's name can set its prototype, and refuses an update missing its parts; added a test for a malformed update and for one from a board the panel no longer keeps.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "d63b3a912f5628e6c7cca273820c0b871020635f",
    "thread_id": "01a13f5e-8ff5-7560-aab2-c8469633c038",
    "seconds": 40,
    "usage": {
      "input_tokens": 190201,
      "cached_input_tokens": 146688,
      "cache_write_input_tokens": 0,
      "output_tokens": 1231,
      "reasoning_output_tokens": 90
    },
    "saved_at": "2026-10-15T11:42:43.735Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/board-feed.mjs boardDelta sends every ticket key when order changes. Changing one ticket's priority can reorder statusData's priority-sorted tickets. A direct reproduction produced 1,207 bytes with 150 other tickets and 2,257 bytes with 300: a 1,050-byte difference, exceeding 1 KB. The AC1 size test never reorders tickets."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html applyDelta reconstructs the board; the AC2 sequence test compares rendered results against fresh loads across changes, additions, removals and reordering."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "connect clears the page's board identifier on reconnect; boardVersions.answer returns full boards for unknown or expired identifiers. AC3 tests cover reconnects, mismatched updates and expired snapshots."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "statusData and the status command are unchanged. The AC4 test checks CLI output against statusData and verifies snapshot serialisation."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "/tmp/speck-0188-tests.txt records 1,777 tests, with one failure and three skips; the failing file then passes all 13 tests on the protocol's automatic retry and is recorded as flaky."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/board-feed.mjs",
        "issue": "A priority change to one ticket can send the entire ticket order, so update size grows with the board. With 150 versus 300 other tickets, the reproduced difference is 1,050 bytes, violating AC1's 1 KB tolerance.",
        "suggested_fix": "Encode ordering changes compactly, such as individual moves, and add a size regression test that changes one ticket's priority and applies the resulting priority sort at both board sizes.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The panel correctly applies incremental updates and reloads the full board after reconnecting. However, changing one ticket's priority still sends the order of every ticket, so updates grow with the board and fail the ticket's size requirement. The suite passed under its automatic retry policy."
  }
}
```

</details>
