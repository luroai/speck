---
id: "0146"
title: "Move a queued ticket back to Plan"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-13T08:35:19.411Z"
approved: "2026-10-13T08:42:11.870Z"
finished: "2026-10-13T08:43:21.778Z"

---
# 0146 · Move a queued ticket back to Plan

**Status:** ✅ done

## Problem
Once a ticket is set ready it waits in the Build queue, and the panel has no way to take it back. To change their mind, the user has to run `speck set <id> status draft` and commit it by hand, or Auto-build may build a ticket they no longer want next.

## Outcome
A ticket waiting in the Build queue has a Back to Plan button that returns it to draft, so it shows in Plan again and isn't built.

## Acceptance criteria
1. An opened ready ticket in the Build queue has a "Back to Plan" button. Building, reviewing, blocked and approved tickets don't.
2. Clicking it sets the ticket's status to `draft` and commits only that ticket's file to the base branch, as Set ready does in reverse. On the next refresh the ticket shows in Plan's drafts and not in the queue, and `speck run` doesn't start it.
3. If the ticket isn't `ready` when the request arrives (for example `speck run` has just started building it), or the checkout isn't on the base branch, nothing changes and the row shows why, in plain words.
4. A request without the panel's token, or from another origin, is refused with 403 and changes nothing, as the panel's other writes are.
5. No test that passed before this change fails.

## Out of scope
- Moving an in-flight ticket (building, reviewing, blocked or approved) back to Plan.
- Reordering the queue.

## Notes
- Set ready is handled in `scripts/panel.mjs` (`POST /api/tickets/<id>/ready`), which commits the ticket file alone with `commitTicketOnly`. This is the same in reverse.
- A ticket that waits on others (`after:`) is still `ready`, so it gets the button too.
- Failing before this build: none
- Self-check: the server read only this checkout's copy, which stays `ready` while the ticket is built in its own worktree or just launched by `speck run`, so it now refuses those too; the new button gets the 44 px touch size on small screens.

## In plain words
A ticket waiting in the Build queue can now go back to Plan. Open it in the queue and click Back to Plan: it becomes a draft again, shows under Plan's drafts after the next refresh, and won't be built. Tickets already being built, blocked or approved don't get the button.

To see it, open the panel, open a waiting ticket in the Build queue and click Back to Plan. If the ticket has just been picked up for building, or the main checkout isn't on the main branch, nothing changes and the row says why.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 197,816
- Elapsed since build started: 7 min
- Changed lines: 98 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none. The reviewer raised no findings.

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
    "reviewed_sha": "63efe8a2321921ed1b89ffdb13ca411a7426fa4e",
    "thread_id": "01a1346c-6e32-7ad1-951c-1ec948045f3a",
    "seconds": 40,
    "usage": {
      "input_tokens": 196966,
      "cached_input_tokens": 149376,
      "cache_write_input_tokens": 0,
      "output_tokens": 850,
      "reasoning_output_tokens": 30
    },
    "saved_at": "2026-10-13T08:42:03.379Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html queueItem adds backToPlanButton only to opened ready rows. Passing 0146 AC1 test covers ready tickets, dependencies, closed rows and all excluded statuses."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/panel.mjs panelBackToPlan sets draft and uses commitTicketOnly. Passing 0146 AC2 tests exercise the real server, ticket-only commit, preservation of unrelated staged and unstaged changes, refresh placement and speck run skipping the returned ticket."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelBackToPlan checks current status, worktree status, launched builds and base branch before writing. Passing 0146 AC3 tests verify unchanged files and commits on refusal; UI tests verify plain-language reasons appear in the row."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panelServer protects POST /api/tickets/<id>/draft with origin and token checks plus the shared Host check. Passing 0146 AC4 test exercises missing and invalid tokens and foreign origins, confirming 403 and unchanged files and history."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Inspected /tmp/speck-0146-tests.txt: 1280 tests, 1277 passed, three skipped, zero failures. All nine 0146 tests passed; existing tests were not modified."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Queued tickets can now return to Plan as committed drafts, and the build runner skips them. Tickets already being built and requests from the wrong branch or unauthorised pages are refused. Tests cover the interface and real server behaviour, and the full suite has no failures. No blocking concerns found."
  }
}
```

</details>
