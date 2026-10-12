---
id: "0132"
title: "Read a ticket's review pack in the panel"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0129"]              # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-12T19:17:19.746Z"

---
# 0132 · Read a ticket's review pack in the panel

**Status:** 🔍 reviewing

## Problem
The review pack, the summary to read before shipping, is only available by running `speck pack <id>` in a terminal. A user working from the panel can see that a ticket is approved or shipped but can't read what the reviewer found.

## Outcome
From the panel, the user can open the review pack of any approved ticket in the queue and of any ticket in the Shipped table.

## Acceptance criteria
1. Each approved ticket in the queue, and each row in the Shipped table, has a button that opens that ticket's review pack in the panel.
2. The review pack in the panel has the same content as `speck pack <id>` prints for that ticket, from the same checkout at the same moment: the verdict, the acceptance criteria table, risk, review history, findings and actuals. Its headings, tables and lists are formatted, not shown as raw Markdown.
3. For a ticket with no review rounds recorded, the panel says there's no review pack for it, and shows no error from the server.
4. Opening a review pack changes no file in the repo.
5. No test that passed before this change fails.

## Out of scope
- Shipping from the review pack: that's 0133.
- The plain-English review pack (0131), which stays a draft.
- Changing what's in the review pack.

## Notes
- Comes after 0129, so a shipped ticket's pack doesn't show "Changed lines: 0".
- The pack is built from the ticket each time, as `speck pack` builds it (`reviewPack` in `scripts/pack.mjs`). Nothing new is saved.
- The panel already formats a ticket's Markdown in its side pane (`markdown()` in `templates/panel.html`). Text goes in as text, never as HTML, as it does there.
- Failing before this build: none
- In the queue, the Review pack button shows once an approved ticket's row is opened, beside Full ticket, since 0069 keeps a closed in-flight row to its top row and bar.
- Self-check: added a test that a pack answering after its pane was closed, or after Full ticket replaced it, isn't shown (it passed as built).

## In plain words
The panel can now show the review pack, the reviewer's summary to read before shipping, without a terminal. Open an approved ticket in the queue, or look along any row in the Shipped table, and press Review pack: the pack opens in the side pane with its headings, table and lists laid out, and the findings folded away until you open them. A ticket that hasn't been reviewed says plainly that it has no review pack yet. Worth knowing: the pack is put together when you press the button, so if a review finishes while it's open, close it and open it again to see the latest.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox. Known limits: the pack is fetched once when it's opened, not on each refresh; tables in the full ticket pane are still shown as written, since 0061 keeps them that way.

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
    "reviewed_sha": "51c400ccb402dbcfd35ce4d886d4244bb9af1110",
    "thread_id": "01a13192-6116-7ca1-9b17-906e4c235c77",
    "seconds": 26,
    "usage": {
      "input_tokens": 110471,
      "cached_input_tokens": 65024,
      "cache_write_input_tokens": 0,
      "output_tokens": 736,
      "reasoning_output_tokens": 23
    },
    "saved_at": "2026-10-12T19:24:25.014Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html queueItem() adds Review pack to opened approved rows; render() adds it to every Shipped row. Both AC1 tests in test/panel-0132.test.mjs passed and exercise button visibility, ticket-specific requests and pane opening."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/panel.mjs panelPack() calls the same reviewPack() used by the CLI. The passing AC2/AC4 integration test compares server output with CLI output for approved and shipped tickets. The passing formatting test exercises headings, tables, lists, findings, inline formatting and safe handling of HTML text through packBlocks() and mdBlocks()."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelPack() returns HTTP 200 with pack:null for NO_ROUNDS; packPane() displays a no-review-pack message. Both server and pane AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The endpoint only reads through reviewPack(). The passing AC2/AC4 integration test checks repository snapshots and git status for an approved ticket, and git status and HEAD for a shipped ticket."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0132-tests.txt: 1188 tests, 1185 passed, 3 skipped, zero failures or cancellations. Existing tests were not modified."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Approved and shipped tickets now offer a formatted review pack in the panel, using the same content as the terminal command. Tickets without reviews show a clear message. Opening a pack leaves the repository unchanged, and late responses cannot replace a closed pane or the full ticket. The recorded full suite passes; no blocking concerns found."
  }
}
```

</details>
