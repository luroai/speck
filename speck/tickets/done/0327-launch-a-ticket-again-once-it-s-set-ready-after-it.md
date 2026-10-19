---
id: "0327"
title: "Launch a ticket again once it's set ready after its build never started"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-19
started: "2026-10-19T08:42:45.847Z"
approved: "2026-10-19T08:47:34.427Z"
finished: "2026-10-19T08:50:00.976Z"

---
# 0327 · Launch a ticket again once it's set ready after its build never started

**Status:** ✅ done

## Problem
When a build ends without starting its ticket (it stopped to ask about the ticket before changing anything), speck run won't launch that ticket again until speck run itself restarts, even after the ticket is fixed and set ready again. On 2026-10-19, 0322's criterion was corrected and the ticket set ready again, but it only built after speck run was restarted by hand.

## Outcome
A ticket whose build never started is launched again as soon as it's set ready again and that's committed on the base branch, with no restart.

## Acceptance criteria
1. After a ticket's build ends with the ticket still ready, speck run doesn't launch it again while nothing about it changes, as today.
2. Once the ticket is set ready again, from the panel or with `speck set <id> status ready`, and committed on the base branch, speck run launches it on its next check, without restarting.
3. A change committed to the ticket with its status still ready, such as an edited criterion, counts as setting it ready again.
4. The Foreman's detail stops saying the ticket won't be launched again once it qualifies to be launched.
5. A ticket ended by `speck stop` is launched again only once it's set ready again and committed, as today.

## Out of scope
- Tickets whose build did start.

## Notes
- speck run keeps the tickets it has launched in `launched` in `scripts/run.mjs`, and a ticket whose build ended without starting stays there (search for "the build never started it"). Tickets ended by `speck stop` already wait for the ticket to be set ready again and committed (search for "set ready again and committed"); the same check can apply here.
- `speck set <id> status ready` on a ticket that's already ready leaves the file unchanged, so criterion 3 is what makes a fixed ticket count.
- Failing before this build: none
- Self-check: no changes
- Pictures: none, because nothing anyone sees changes apart from speck run's log lines and the Foreman's detail text.

## In plain words
When a build stops before it has started its ticket, for example to ask about the ticket, speck run no longer needs restarting to try it again. Once you set the ticket ready again, or commit a change to it such as a corrected criterion, speck run picks it up on its next check. To see it, let a build stop without starting its ticket, fix the ticket and set it ready: it starts again within a few seconds, with speck run still running. Until then speck run says it's waiting for the ticket to be set ready again and committed. A build ended with speck stop still needs speck run restarting, which is saved as a follow-up.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 136,033
- Elapsed since build started: 5 min
- Changed lines: 41 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up: a ticket ended by `speck stop` stays held in the same speck run even once set ready again and committed, as it stays in `launched`; saved to the inbox as `speck/ideas/2026-10-19-launch-a-stopped-ticket-again-without-restarting-speck-run.md`.

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
    "reviewed_sha": "96a05182526bf5e7c897819191d297f55f5a71a8",
    "thread_id": "01a15357-857c-7d20-b5cd-585a1a036e96",
    "seconds": 27,
    "usage": {
      "input_tokens": 135196,
      "cached_input_tokens": 93184,
      "cache_write_input_tokens": 0,
      "output_tokens": 837,
      "reasoning_output_tokens": 219
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-19T08:47:14.072Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/run-0327.test.mjs: passing AC1 tests check unchanged tickets, uncommitted edits and unrelated commits remain held. The integration test confirms no repeat launch across several checks."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing AC2/AC4 integration test verifies repeated launches in the same running process after manual status changes and speck set, once committed. run.mjs ownWait releases the launch hold and checks readyOnBase before launching."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing AC3 test commits a criterion edit while the ticket remains ready and verifies readyAgain returns true. ownWait uses that result to release the launch hold."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing integration test verifies the Foreman changes from unstarted to uncommitted when the original hold clears, then confirms the ticket launches after commitment."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The passing AC5 test verifies readyAgain does not release records marked as stopped. The existing heldByStop commit comparison is unchanged; test/stop-0072.test.mjs covers holding stopped tickets until a subsequent ticket commit."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Tickets whose builds ended before starting can now run again after a committed ticket change, without restarting speck run. Unchanged tickets remain held, and the existing stop safeguards remain intact. The reported tests passed; no blocking issues found."
  }
}
```

</details>
