---
id: "0008"
title: "Cancel a ticket with a recorded reason"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | done
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-08
started: "2026-10-08T20:00:31.803Z"

---
# 0008 · Cancel a ticket with a recorded reason

**Status:** 👍 approved

## Problem
Once you decide not to build a ticket, the only options are to delete it or leave it as a draft. Either way, there's no lasting record that the idea was considered and turned down, or why, so it can come back later as new work.

## Outcome
A ticket you decide against can be cancelled with a reason. It's filed away with finished work and stays visible as cancelled, with that reason, so later ideas and tickets can be checked against it.

## Acceptance criteria
1. `speck cancel <id> "<reason>"` sets the ticket's status to `cancelled`, stores the reason and the date it was cancelled in the ticket, moves the file into `speck/tickets/done/` and rewrites the header as `**Status:** ❌ cancelled`. It works from any status except `done`.
2. `speck cancel` refuses and changes nothing when the reason is missing or blank, when the ticket is already `done` (delivered work can't be cancelled) or when it's already `cancelled`.
3. `speck set <id> status cancelled` refuses and points to `speck cancel`. Setting a cancelled ticket to any other status moves it back to `speck/tickets/` and keeps the recorded reason.
4. `speck status` lists cancelled tickets in a `CANCELLED` group after `DONE`, with each ticket's reason on the line below it. `speck new` never reuses a cancelled ticket's number.

## Out of scope
- Updating the source idea when its tickets are cancelled (0009 records which tickets an idea became).
- Checking new ideas or tickets against cancelled ones (0010).
- Cleaning up branches or review rounds for a ticket cancelled mid-build.

## Notes
- Cancelled tickets sit in `speck/tickets/done/` with finished ones, so `speck/tickets/` holds only live work. That folder now means "closed" rather than strictly "delivered".
- `speck ship` already refuses anything that isn't `approved`, so it needs no change.
- Update `speck/product.md`, `docs/brief.md`, the status comment in `templates/ticket.md` and the `/speck-status` skill to cover the new status.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->
Round 1 (codex, model gpt-6.1-sol, effort default): approved. Four criteria pass and no blocking findings, so `speck next` said ship. Caveat: the Codex sandbox failed to start, so it reviewed the diff and the supplied `npm test` output without inspecting the repo or re-running the tests itself (see the Delivery log).

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Build: one sitting, one implementation commit plus the ticket commits. 64 tests pass (56 before, 8 new). 49 changed lines excluding tests, lockfiles and `speck/` (limit 1000).
- Review rounds: 1 of 3. Reviewer tokens: 64,849. Elapsed since build started: 4 min.
- Follow-ups, not done here:
  - The round-1 reviewer reported "repository inspection and independent test execution were unavailable because the sandbox failed to start". It still read the diff and the test output, but a reviewer that can't run anything can't check a claim beyond what the builder hands it. That is ticket 0001, and this round is a live example.
  - `speck status` prints a cancelled ticket's reason but not the date it was cancelled, though `speck cancel` records both. Worth adding if the date ever matters at a glance.
  - A ticket cancelled mid-build keeps its branch and any review rounds, as the ticket's Out of scope says. Nothing cleans those up.

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
    "reviewed_sha": "64686a158fac7da068ba4ac9726baba8a55c9bd8",
    "thread_id": "01a11d1d-7b01-79c0-824c-838385429dfb",
    "seconds": 34,
    "usage": {
      "input_tokens": 64050,
      "cached_input_tokens": 31744,
      "cache_write_input_tokens": 0,
      "output_tokens": 799,
      "reasoning_output_tokens": 240
    },
    "saved_at": "2026-10-08T20:04:27.750Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs: cmdCancel records cancel_reason and the cancellation date, synchronises the cancelled header, and calls placeTicket to archive the file. The two AC1 integration tests cover the stored fields, move, header and all eligible statuses; both passed in the supplied output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdCancel checks the missing or blank reason, done status and cancelled status before writing. Both AC2 integration tests assert refusal and unchanged ticket contents; they passed in the supplied output."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdSet rejects status cancelled with a speck cancel instruction. placeTicket returns reopened tickets to the live folder, while field updates preserve cancel_reason. The AC3 integration tests exercise rejection and reopening to ready; both passed in the supplied output. Setting done continues to archive delivered work, consistent with the ticket's closed-folder definition."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "cmdStatus places CANCELLED after DONE and prints cancel_reason below each ticket. The AC4 integration tests verify output order and that new allocates 0002 after cancelling 0001; both passed in the supplied output."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "The living spec covers cancellation, recorded reasons, reopening, archived tickets and the new header. The requested brief, template and status skill updates are included."
    },
    "escalation_question": "",
    "summary": "Cancellation records why a ticket was declined, files it with closed work and shows the reason on the status board. The added tests exercise the actual CLI and cover the acceptance criteria. No blocking issue found in the supplied diff. Repository inspection and independent test execution were unavailable because the sandbox failed to start, so this review relies on the supplied diff and test output."
  }
}
```

</details>
