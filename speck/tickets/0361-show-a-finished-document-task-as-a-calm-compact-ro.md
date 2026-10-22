---
id: "0361"
title: "Show a finished document task as a calm, compact row"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T14:58:32.323Z"

---
# 0361 · Show a finished document task as a calm, compact row

**Status:** 🔍 reviewing

## Problem
When a document task's build finishes, its queue row is purple and grows to show "Build finished without shipping" and the last 50 lines of the build's log, in a red-tinted box. It reads like a problem, though the task is done and its document is waiting to be read. Opening the row shows the log a second time, and four or five of these rows together look cluttered.

## Outcome
A document task whose build has finished shows as a short row that says it's finished, with a button to its review pack, where the document is.

## Acceptance criteria
1. In the queue, a ticket with `task: document` and status `approved`, whose build has exited and that isn't shipping, shows its id, title, tags and progress as now, with "Finished · read the document" as its progress sentence in place of "Approved · waiting for you to ship it". It has no "Build finished without shipping" line and no box with the build log's last lines, whether the row is open or closed.
2. That row shows a "Review pack" button while it's closed. Clicking it opens the ticket's review pack, as the Review pack button in an open row does today, with the document's files at the top, and doesn't open or close the row.
3. Opening that row shows the Full ticket and Review pack buttons and the build log, once each, and nothing else that repeats the log.
4. A code ticket, and a document task that's blocked, building, reviewing, shipping, or whose build stopped before finishing or stopped unexpectedly, look exactly as they do today.
5. No test that passed before this change fails, except checks that an approved document task with an exited build shows "Build finished without shipping" or its log's last lines, which are changed to check AC1.

## Out of scope
- Code tickets waiting for you to ship them. They keep today's line and log box.
- The row's purple, which still marks a ticket waiting for you.
- The review pack itself, and how a document task ships (0355).

## Notes
- Today's row comes from `queueItem` and the `exit_label` and `exit_message` fields in `templates/panel.html`. `exit_message` is `build_exit.message`, the log's last 50 lines (0045). The box is `.question.exit.to-ship`: a purple left edge on `.question`'s red-tinted background (0138).
- A document task never ships by itself, whatever `auto_ship` says, so every finished one ends up like this.
- Failing before this build: none
- Self-check: no changes

## In plain words
When a document task's build finishes, its row in the queue is now short and calm. It says "Finished · read the document" and has a Review pack button, which opens the pack with the document's files at the top. The "Build finished without shipping" line and the box with the end of the build's log are gone. Opening the row still shows the full log, once. To see it, let a document task's build finish and look at its row in the queue. Code tickets waiting to ship, and document tasks that are still being worked on or stopped part way, look the same as before. The row stays purple, as it's still waiting for you.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "9495210ddba5116ec5b846ecfc029e558eb69548",
    "thread_id": "01a16421-b79b-7593-afac-7e89d51e8430",
    "seconds": 35,
    "usage": {
      "input_tokens": 171186,
      "cached_input_tokens": 130048,
      "cache_write_input_tokens": 0,
      "output_tokens": 727,
      "reasoning_output_tokens": 11
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T15:02:09.027Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: panelModel suppresses exit_label and exit_message for finished document tasks; doing supplies the finished sentence. Both closed and open AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "queueItem adds the existing packButton to closed finished rows. packButton stops click propagation. Both AC2 tests passed, including document files appearing first and the row retaining its open/closed state."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "queueItem retains the open-row buttons and logBox while suppressing the exit log excerpt. AC3 passed, checking one of each button and one full log."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "doc_finished requires a document task and the approved-build exit label. AC4 tests passed for code, blocked, building, reviewing, shipping and stopped tasks. scripts/ship.mjs:autoShipWhyNot excludes document tasks from auto-ship."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Recorded test output confirms 116 passed, zero failed and three skipped. No existing tests were changed; the implementation is limited to finished document rows."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Finished document tasks now show a compact finished row with a Review pack button. Opening the row shows the full log once. Tests cover the requested behaviour and unchanged ticket states; no blocking issues found."
  }
}
```

</details>
