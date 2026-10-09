---
id: "0042"
title: "Set a draft ticket to ready from the panel"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T14:00:42.783Z"

---
# 0042 · Set a draft ticket to ready from the panel

**Status:** 🔍 reviewing

## Problem
Gate 1 now happens in the panel, but setting a ticket to ready still means leaving it for a terminal, running `speck set <id> status ready` and committing the ticket. That breaks the flow from reading a ticket to approving it.

## Outcome
An open draft ticket in the panel has a Set ready button that approves it and commits the ticket, with the same lint gate as the CLI, and nothing but the panel itself can use it.

## Acceptance criteria
1. An open draft ticket in Shaping has a Set ready button. The button is disabled, with hover text saying why, while the ticket has lint errors.
2. Clicking it sets the ticket to `ready` exactly as `speck set <id> status ready` does, then commits only that ticket's file as `speck(<id>): ready`. Any other changes in the checkout, staged or not, stay as they were. By the next refresh the ticket has left Shaping and shows in the queue.
3. When the server refuses, the ticket stays a draft, nothing is committed, and the panel shows the reason under the button. It refuses a ticket that fails lint (giving the same messages as `speck lint`), a ticket that isn't a draft, an id with no ticket, and a checkout that isn't on `base_branch`.
4. The server accepts the request only with an `Origin` of `http://127.0.0.1:<port>` or `http://localhost:<port>` and a token it generates afresh each time it starts and puts into the page it serves. A missing or wrong `Origin` or token gets 403 and changes nothing. The `Host` check still applies, every other non-`GET` request still gets 405, and the `GET` routes are unchanged.
5. `speck/product.md` says the panel can now do this one write and nothing else, and describes the protection in criterion 4.

## Out of scope
- Any other write from the panel, such as editing, cancelling or reordering tickets.
- Starting the build (0043).
- A login, or reaching the panel from another machine.

## Notes
- Risk is high: this adds a write to a local server with no login. A `Host` check alone doesn't stop a web page in your browser from posting a form to `127.0.0.1`, hence the `Origin` check and token.
- `speck start` refuses a ticket with uncommitted changes, which is why the button commits the ticket.
- Builds after 0041, which changes the same page.
- Checked 2026-10-09: browsers send an `Origin` header on cross-site form posts and `fetch` POSTs (Fetch standard).
- Self-check: a token header with non-ASCII characters made the byte comparison throw and crashed the server, so tokens are now compared as bytes (test added). A failed commit left the ticket staged; it's now put back as it was (test added). Also checked: duplicate `Origin` or token headers (joined by Node, so refused), ids that aren't 1–4 digits (405), and that clicking the button doesn't toggle the row.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up idea: the Set ready request has no timeout, so if the server hangs (for example a commit waiting on a GPG signing prompt, which also blocks the whole server) the button stays on "Setting ready…" until the page is reloaded.
- Follow-up idea: a 405 always says `Allow: GET`, including for other methods on `/api/tickets/<id>/ready`, where `POST` is allowed.

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
    "reviewed_sha": "a9fa7a41023b59b8a6dc033944ff00f1b5889739",
    "thread_id": "01a12101-4958-7711-b9f1-1095e90f9440",
    "seconds": 56,
    "usage": {
      "input_tokens": 251582,
      "cached_input_tokens": 182144,
      "cache_write_input_tokens": 0,
      "output_tokens": 1098,
      "reasoning_output_tokens": 130
    },
    "saved_at": "2026-10-09T14:12:30.996Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: ticketDetail and setReadyButton render the button with disabled state and explanatory title. The 0042 AC1 test exercises both valid and lint-failing drafts."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/speck.mjs: panelSetReady uses the CLI's lintTicket and writeField helpers and a path-specific commit. The server AC2 test checks the commit message, committed path and preservation of unrelated staged and unstaged files; the page AC2 test checks movement into the queue."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The AC3 tests cover the four required validation refusals and displaying the reason. However, panelSetReady's commit-failure rollback resets the ticket's index entry to HEAD, destroying any pre-existing staged version. The failure test covers only an untracked ticket."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/speck.mjs: cmdPanel checks Host, Origin and a fresh random token before writing; sameToken safely compares bytes. AC4 tests exercise token regeneration, rejected credentials, both permitted origins, unchanged GET routes, other methods and non-ASCII tokens."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "speck/product.md describes the single write, Origin and token protection, continuing Host checks and local-program access. The AC5 test checks the documentation, and inspection confirms these protections exist."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs: panelSetReady",
        "issue": "A failed commit loses the ticket's pre-existing staged contents. The catch block restores the working file but runs git reset on its path. If the index held edits different from both HEAD and the working file, that staged version is lost. The builder's notes acknowledge this, but the regression test exercises only an untracked draft.",
        "suggested_fix": "Save the ticket's original index entry before staging and restore that exact entry on failure, preserving its original untracked state when applicable. cmdClose already uses this approach. Add a failed-commit test with distinct HEAD, staged and working versions, asserting that both index and working contents remain unchanged.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The documented capability and request protections match the implementation. The failed-commit rollback needs fixing."
    },
    "escalation_question": "",
    "summary": "The button, lint checks, ticket-only commit and browser protections are implemented with meaningful tests. One failure path needs fixing before merge: if committing fails, the panel can lose edits previously staged in the ticket. Tests were inspected; the supplied passing test run was not independently rerun in this read-only review."
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
    "reviewed_sha": "3fe3cbe3350e2527aadefb10bddd75d06137602d",
    "thread_id": "01a12101-4958-7711-b9f1-1095e90f9440",
    "seconds": 32,
    "usage": {
      "input_tokens": 433583,
      "cached_input_tokens": 339840,
      "cache_write_input_tokens": 0,
      "output_tokens": 1866,
      "reasoning_output_tokens": 130
    },
    "saved_at": "2026-10-09T14:16:02.249Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: ticketDetail and setReadyButton provide the button, disabled state and lint explanation. The 0042 AC1 test exercises valid and lint-failing drafts and passes in the supplied output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/speck.mjs: panelSetReady uses lintTicket and writeField as the CLI does; commitTicketOnly commits the ticket by path. The server AC2 test verifies the commit and preservation of unrelated changes; the page AC2 test verifies the next refresh moves it into the queue. Both pass in the supplied output."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelSetReady refuses all four specified invalid states before writing. Page tests cover displaying refusal reasons. commitTicketOnly now restores the original working file and staged contents on commit failure. The new '0042 AC3 (round 1 F1)' test uses distinct HEAD, staged and working copies and verifies their preservation; all relevant tests pass in the supplied output."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/speck.mjs: cmdPanel retains Host checks, requires an allowed Origin and fresh server token, and preserves GET routing and other-method refusals. AC4 tests cover these protections, token regeneration and non-ASCII input; they pass in the supplied output."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "speck/product.md accurately describes Set ready as the panel's single write and explains Origin, token and Host protections. The AC5 documentation test passes in the supplied output."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs: commitTicketOnly",
        "issue": "Previously, a failed commit discarded the ticket's pre-existing staged contents. The shared helper now saves and restores the original index entry, and the new regression test exercises the previously missing case.",
        "suggested_fix": "Completed: preserve the original index entry and working contents on failure, with regression coverage.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The living spec matches the implemented capability and protections."
    },
    "escalation_question": "",
    "summary": "The panel can approve and commit a draft ticket while preserving unrelated changes. The staged-edit loss on failed commits is fixed and covered by a meaningful regression test. All criteria pass with no blocking findings remaining. Code and tests were inspected; the supplied 216-test passing run was not independently rerun."
  }
}
```

</details>
