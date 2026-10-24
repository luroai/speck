---
id: "0445"
title: "Set a document task's document out like the full ticket"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-set-a-document-task-s-document-out-the-same-way.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0442"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T08:46:32.853Z"
approved: "2026-10-24T08:51:10.590Z"

---
# 0445 · Set a document task's document out like the full ticket

**Status:** 👍 approved

## Problem
0424 set the full ticket and the review pack out as a document, but a document task's document, in its own pop-up, kept the old sizes, so the three read differently.

## Outcome
A document task's document is set out like the full ticket.

## Acceptance criteria
1. In a document task's pop-up, the document's first heading is its title, in the full ticket's title size. Its other headings, text (at least 15 px with a line height of at least 1.5) and lists (numbers hanging to the left) use the full ticket's sizes from 0424.
2. The pop-up's top line still shows the document's file path, as today.

## Out of scope
- The full ticket and the review pack (0424).

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- From the builder's note on 0424, which kept the pop-up's rules apart to stay in scope. Open question answered: the document's first heading is its title.
- Waits for 0442: both change `templates/panel.css`.
- Failing before this build: none
- Self-check: no changes. Checked a document with text before its first heading, one starting at ##, one with no heading, and the loading and error states (no heading, so no title). 0424's test that the pop-up kept its old 14 px table now expects 15 px, as this ticket changes it.

## In plain words
A document that a document task writes now reads like the full ticket when you open it from the review pack. Its first heading is shown large as its title, its other headings stand out as section headings, the text is bigger with more room between lines, and numbered lists hang their numbers to the left. The line at the top still shows where the file is. To see it, open an approved document task's review pack and press its document. Worth a look: a document whose first heading is a smaller one, or that has text before it, still has that heading shown as its title.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 169,535
- Elapsed since build started: 5 min
- Changed lines: 25 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (tidy-ups and known limits, no inbox notes):
- The document's headings repeat the section heading rule's values in a rule of their own, because 0427's test pins that rule's selector list. They could share it if that test were loosened.
- A title that comes after some text has no room above it beyond the paragraph's gap.

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
    "reviewed_sha": "614ad2b2016c01f1b60da13536e8a5788403e1b2",
    "session": "fresh",
    "thread_id": "01a16d1a-c394-7be0-8da1-ebbbbafaea43",
    "builder_response": "- Tests run: test/panel-0445.test.mjs test/panel-0424.test.mjs test/pack-0362.test.mjs test/pack-0363.test.mjs test/panel-0368.test.mjs test/panel-0366.test.mjs test/panel-0379.test.mjs test/panel-0417.test.mjs test/panel-0426.test.mjs test/panel-0427.test.mjs test/panel-0428.test.mjs, with --related (which added every test file naming templates/panel.css or templates/panel.js), and the checks.\n- The document's first heading (h5/h6, any level, wherever it is in the document) gets the class doc-title in drawDoc; CSS gives it the full ticket title's 26px / 1.25 / 600. Its other headings get the section heading's values in a rule of their own (0427's test pins the exact selector list of the 0424 heading rule, so I didn't add to it). Text, paragraph gaps, tables, code and lists join the 0424 rules.\n- test/panel-0424.test.mjs line 143 asserted the pop-up's table stayed at 14px (\"left as it was\"): this ticket changes that on purpose, so it now expects 15px.\n- Pictures of the pop-up in light and dark are kept with the pack; the headless browser had no interface font, so text falls back.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 168948,
      "cached_input_tokens": 128896,
      "cache_write_input_tokens": 0,
      "output_tokens": 587,
      "reasoning_output_tokens": 47
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T08:51:02.190Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js drawDoc marks the first rendered heading as doc-title. templates/panel.css gives it the full ticket’s 26px title size, other headings its 19px section size, body text 15px/1.6, and outside list markers. Six passing AC1 tests in test/panel-0445.test.mjs exercise title selection and verify these styles."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "drawDoc retains docOpen.path in the top line. The passing AC2 test in test/panel-0445.test.mjs opens the document and checks that line’s path and existing typography."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The document pop-up now uses the full ticket’s title, heading, text and list sizes while keeping the file path at the top. The tests exercise the rendering and relevant styles, and the reported run has no failures. No blocking concerns found."
  }
}
```

</details>
