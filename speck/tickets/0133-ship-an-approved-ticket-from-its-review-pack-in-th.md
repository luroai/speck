---
id: "0133"
title: "Ship an approved ticket from its review pack in the panel"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0132"]              # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-12T19:26:03.382Z"

---
# 0133 · Ship an approved ticket from its review pack in the panel

**Status:** 👍 approved

## Problem
With `auto_ship` off, an approved ticket waits until the user runs `/speck-ship <id>` in their agent. A user reading the review pack in the panel has to leave it to ship.

## Outcome
The review pack of an approved ticket, opened in the panel, has a Ship button that ships the ticket as `/speck-ship` does.

## Acceptance criteria
1. The review pack of an `approved` ticket, opened in the panel, has a Ship button. A ticket in any other status has no Ship button, and the panel has no Ship button anywhere outside a review pack.
2. Clicking Ship asks the user to confirm. On confirming, it runs `speck ship <id>` for that ticket, and the panel shows that the ticket is shipping until it finishes. Cancelling changes nothing.
3. When the ship succeeds, the ticket shows in the Shipped table as done, as a ticket shipped with `/speck-ship` does.
4. When `speck ship` refuses (for example, failing tests, a merge conflict or uncommitted changes), the panel shows its message, and the ticket stays `approved`.
5. A request to ship without the panel's token, or from another origin, is refused with 403 and changes nothing, as the panel's other writes are.

## Out of scope
- Resolving a merge conflict from the panel. On a conflict, `speck ship` leaves everything as it was and the user follows its message.
- Shipping several tickets at once.
- Undoing a ship.

## Notes
- Decided 2026-10-11 by the user: clicking Ship in the panel is the user shipping (Gate 2), like running `/speck-ship`. Update `docs/brief.md` (principle 4 and the command table), `AGENTS.md`, the README and the speck-ship skill wording so they say shipping happens through `/speck-ship` or the panel's Ship button, and agents still never ship on their own.
- Risk is high: a click in the browser merges into the base branch and pushes. It must use the same token and Origin checks as the panel's other writes.
- `speck ship` already runs the tests, merges, pushes and tidies up, and refuses with a message (exit 13 on a conflict, 14 when the base branch's own tests fail), changing nothing (`scripts/ship.mjs`).
- From the idea `speck/ideas/2026-10-10-more-human-gate-actions-in-the-panel.md` ("Ship from the review pack").
- Failing before this build: none
- Self-check: the server's ship handler is async, so an unexpected error finding the ticket can't leave it stuck as shipping; added a test that a second ship while one runs is refused and the first still ships.

## In plain words
An approved ticket's review pack in the panel now has a Ship button, so you can read the pack and ship the ticket in one place, without going back to your agent. It does exactly what `/speck-ship` does. To see it, open the panel, open an approved ticket in the queue, click Review pack, then Ship: it asks you to confirm, says it's shipping while the tests run and it merges and pushes, then the ticket moves to the Shipped table. If shipping is refused, for example because the tests fail, the reason shows in the pack and nothing changes. Worth knowing: a ship can take a few minutes, and if you reload the page meanwhile it won't show that it's still shipping (a follow-up is in the inbox).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 shipPart returns immediately for non-approved tickets before rendering pending state or errors.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 581,320
- Elapsed since build started: 9 min
- Changed lines: 118 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Inbox: `speck/ideas/2026-10-12-show-a-panel-ship-in-progress-after-a-reload.md` (a reloaded page doesn't know a ship is running, or a failed push's message).
- Known limit: while a ship runs, the panel holds off restarting on new code (shipping can change that code by merging), and restarts once it ends. No automated test covers the hold-off.
- Known limit: the server ships one ticket at a time; a second Ship while one runs is refused with a message.

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
    "reviewed_sha": "205175110620a6f48a47d32792514f2a1d322998",
    "thread_id": "01a13199-21f8-79b2-b3a5-31b3cd25ccf2",
    "seconds": 43,
    "usage": {
      "input_tokens": 229077,
      "cached_input_tokens": 174080,
      "cache_write_input_tokens": 0,
      "output_tokens": 1054,
      "reasoning_output_tokens": 120
    },
    "saved_at": "2026-10-12T19:32:04.594Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html packPane/shipPart restrict the button to approved review packs. Passing 0133 AC1 tests cover visibility and status changes."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "Confirmation, cancellation and command execution have passing tests. However, shipPart hides the shipping indicator when polling changes the ticket to done, before scripts/ship.mjs finishes pushing."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing '0133 AC2 AC3' integration test invokes the real ship command and verifies the merge, branch/worktree removal and done ticket in the Shipped model."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0133 AC4 tests verify real refusals for uncommitted changes and failing tests, unchanged repository snapshots, approved status and displayed messages. Conflict rollback is covered by existing ship tests."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "scripts/panel.mjs ship route uses the existing Origin and constant-time token checks. Passing 0133 AC5 integration test verifies 403 and unchanged repository state."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "shipPart returns immediately for non-approved tickets before rendering pending state or errors. The real ship command marks the ticket done and merges locally before pushing. A poll during a slow push therefore removes all shipping indicators. If the push fails, the recovery message is also hidden once the ticket is done, leaving the user unaware that remote delivery failed. Existing test/ship.test.mjs explicitly demonstrates that failed pushes leave the ticket done.",
        "suggested_fix": "Render pending state and command errors independently of ticket status; restrict only the actionable Ship button to approved tickets. Add a page test that polls a done status while the ship response remains pending, then returns a push failure and verifies its recovery message stays visible.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The button, confirmation, real shipping command and access protections are implemented with meaningful tests. One important gap remains: a slow or failed push can make the panel hide progress and the message explaining how to recover. Fix that before merge. The recorded suite reports 1,195 passes and no failures; I inspected it without rerunning tests in the read-only environment."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "d50a345b0723064872e9c949dc6cc699ac3c105c",
    "thread_id": "01a13199-21f8-79b2-b3a5-31b3cd25ccf2",
    "seconds": 26,
    "usage": {
      "input_tokens": 349531,
      "cached_input_tokens": 286336,
      "cache_write_input_tokens": 0,
      "output_tokens": 1658,
      "reasoning_output_tokens": 120
    },
    "saved_at": "2026-10-12T19:34:19.305Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html packPane and shipPart restrict the actionable Ship button to an approved ticket's loaded review pack. Both 0133 AC1 tests pass and cover other statuses and locations."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "shipTicket confirms before sending the request; panelShip invokes the real speck ship command. Passing AC2 tests cover confirmation, cancellation and duplicate requests. The new passing F1 regression test verifies shipping remains visible when polling reports done before the command finishes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing '0133 AC2 AC3' integration test verifies the real merge, branch and worktree removal, and the done ticket appearing in the Shipped model."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests verify command refusal messages, unchanged repository snapshots and approved status for uncommitted changes and failing tests. Existing ship tests cover conflict rollback. The new F1 test also verifies push-failure recovery text remains visible after polling."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "scripts/panel.mjs applies the existing Origin and constant-time token checks before shipping. Passing AC5 integration tests verify missing or incorrect tokens and foreign or absent origins receive 403 without repository changes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Shipping progress and push-failure messages were hidden when polling changed the ticket's status to done.",
        "suggested_fix": "Render pending state and command errors independently of ticket status, with regression coverage for polling during a push and a subsequent push failure.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The previous issue is fixed: shipping progress and recovery messages remain visible even after the local merge marks the ticket done. All five criteria pass, with meaningful tests and no open blocking findings. The inspected test log records 1,196 passes, no failures and three skips; tests were not rerun in this read-only review."
  }
}
```

</details>
