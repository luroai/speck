---
id: "0153"
title: "Show a ticket's ship in progress in the panel"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-13T23:42:21.427Z"
approved: "2026-10-14T00:02:21.102Z"

---
# 0153 · Show a ticket's ship in progress in the panel

**Status:** 👍 approved

## Problem
When a build's own ship (`speck ship <id> --auto`) is running, or has stopped without shipping, the panel shows the ticket as plainly approved, the same as a ticket waiting for the user. On 2026-10-13, 0149's auto-ship hung for nine minutes and the user only found out by clicking Ship.

## Outcome
The panel shows when a ticket is being shipped, by anyone, for how long, and says so plainly when an auto-ship ends without shipping.

## Acceptance criteria
1. While `speck ship <id>` is running for a ticket, started by a build, the panel's Ship button or `/speck-ship`, that ticket's Build queue row shows "Shipping…" and how long it has been running, and this survives a reload of the page.
2. While a ship is running, the ticket's Ship button can't be clicked, and a second `speck ship` for the same ticket refuses with a message saying a ship is already running, changing nothing.
3. When an auto-ship ends without shipping (it failed, was refused or was killed), the row says "Auto-ship didn't finish", followed by speck ship's own message when there is one, and "Ship it from its review pack, or run /speck-ship <id>".
4. A ticket waiting for the user to ship it because auto-ship doesn't cover it (for example a high-risk ticket) doesn't show any of these messages.
5. No test that passed before this change fails.

## Out of scope
- Why a ship fails (0152 covers stalled tests).
- Retrying a failed auto-ship automatically.

## Notes
- The panel only knows about a ship it started itself today (`shipping` in `scripts/panel.mjs`); a ship started elsewhere leaves no record it can read.
- Related idea: `speck/ideas/2026-10-12-show-a-panel-ship-in-progress-after-a-reload.md`.
- 0138 colours an approved ticket waiting to ship in purple; these messages sit with that, not in red unless the ship failed.
- Failing before this build: none
- Design: `speck ship` keeps a record, `speck/.cache/runs/<id>.ship.json` in the main checkout, while it runs, so the panel sees a ship started by a build, the Ship button or `/speck-ship` alike, and `speck status --json` gives it as each ticket's `ship`. An auto-ship that ends without shipping leaves the record with its message; a killed one leaves it with a pid that has gone.
- "Not in red unless the ship failed": "Auto-ship didn't finish" is red, as the ship failed; "Shipping…" is neither red nor purple. An auto-ship failure from before the ticket's latest approval isn't shown.
- Self-check: a record whose pid now belongs to another program (or another ticket's ship) no longer holds the ticket; a record folder that can't be written gives a plain error instead of a stack trace.

## In plain words
While a ticket is being shipped, its row in the panel's Build list now says "Shipping…" with a timer, whether the ship was started by a build, by the Ship button or by /speck-ship, and it still says so after you reload the page. While that runs, the Ship button is greyed out, and a second ship of the same ticket is turned away without changing anything. If a build's automatic ship stops without shipping, the row turns red and says "Auto-ship didn't finish", with the reason and how to ship it yourself. To see it, click Ship on an approved ticket and reload the page while it runs. Worth watching: if a ship is killed, a ticket you shipped yourself simply goes back to waiting, with no message.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Shipping visibility disappears before the ship finishes.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 709,869
- Elapsed since build started: 20 min
- Changed lines: 153 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - Show when a ship merged but couldn't push: the ticket is done before the push, so a failed push shows as shipped. Saved to the inbox as `speck/ideas/2026-10-14-show-when-a-ship-merged-but-couldn-t-push.md`.
  - Tidy-up: the panel server's own one-ship-at-a-time guard (`shipping` in `scripts/panel.mjs`) now overlaps with speck ship's record; it could go.
  - `speck status` (text) doesn't show a ship in progress; only `--json` and the panel do.
  - The idea `speck/ideas/2026-10-12-show-a-panel-ship-in-progress-after-a-reload.md` is covered by this ticket.

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
    "reviewed_sha": "5c9c85a3376539b227aa24b5923d4874996b565a",
    "thread_id": "01a137b3-1c08-7601-8dab-4b2d49e69556",
    "seconds": 39,
    "usage": {
      "input_tokens": 249635,
      "cached_input_tokens": 188928,
      "cache_write_input_tokens": 0,
      "output_tokens": 1136,
      "reasoning_output_tokens": 188
    },
    "saved_at": "2026-10-13T23:58:05.810Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "templates/panel.html panelModel excludes done tickets from the Build queue. scripts/ship.mjs shipTicket marks the ticket done and merges before pushing, so a running push loses its Shipping… row. A read-only panelModel reproduction returned an empty queue for a done ticket with ship.running=true. The passing AC1 tests only cover approved tickets."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "takeShip refuses an existing running ship; shipPart disables the button. Passing tests exercise CLI refusal across checkouts, unchanged state and disabled button clicks."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "endShip retains auto-ship failures and shipState recognises killed processes. Passing ship and panel AC3 tests cover failures, refusals, killed ships, messages and recovery instructions on approved tickets."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "cmdShip checks autoShipBlocker before creating a record. Passing AC4 tests cover excluded risk/configuration and ordinary approved tickets without ship messages."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0153-tests.txt: 1380 tests, 1377 passed, zero failures, three skipped. No existing tests were changed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Shipping visibility disappears before the ship finishes. shipTicket marks and merges the ticket as done before running git push and remote cleanup, but panelModel only computes shipping for unfinished queue tickets. During a stalled push, the ticket appears shipped with no Shipping… timer, including after reload.",
        "suggested_fix": "Keep tickets with a running ship record in the Build queue and compute their shipping state regardless of ticket status. Add coverage for a ship held during the push after its ticket becomes done, including reload and the disabled Ship button.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Shipping progress and auto-ship failure messages work while a ticket remains approved, and the existing suite passes. However, progress disappears while the final push is still running, making a stalled ship look completed. Fix that gap before merge."
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
    "reviewed_sha": "1d0d353ca134d836a1d10ada82a10501f6494857",
    "thread_id": "01a137b3-1c08-7601-8dab-4b2d49e69556",
    "seconds": 26,
    "usage": {
      "input_tokens": 457120,
      "cached_input_tokens": 384512,
      "cache_write_input_tokens": 0,
      "output_tokens": 1978,
      "reasoning_output_tokens": 226
    },
    "saved_at": "2026-10-14T00:02:02.879Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "shipState and statusData expose the shared ship record. panelModel now keeps done tickets with running ships in the Build queue. Passing AC1 tests cover elapsed time, reload, all entry points and a real push held by a pre-receive hook. Independently verified the model keeps shipping visible until the record clears."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "takeShip refuses another running ship; shipPart disables the Ship button. Passing AC2 tests verify refusal without changes and disabled buttons for both approved tickets and done tickets still pushing."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "endShip retains auto-ship failure messages; shipState recognises killed ships. Passing AC3 tests exercise failures, refusals, killed processes, message ordering, recovery instructions and suppression of failures preceding the latest approval."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "cmdShip checks autoShipBlocker before taking a record. Passing AC4 tests verify excluded configuration/risk produces no shipping messages and waiting tickets retain their purple presentation."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified full output at /tmp/speck-0153-tests.txt: 1382 tests, 1379 passed, zero failures and three skipped. Existing tests were not weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Shipping visibility previously disappeared when the ticket became done before the push finished.",
        "suggested_fix": "Keep tickets with running ship records in the Build queue through the push, with reload and disabled-button coverage.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Shipping progress now remains visible through the final push and survives reloads. Duplicate ships are refused, and unsuccessful auto-ships show their message and next steps. The earlier gap is fixed, all tests pass, and the change is ready for owner review."
  }
}
```

</details>
