---
id: "0363"
title: "Ship a document task from its document's pop-up"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-22-open-a-document-in-a-pop-up-over-the-whole-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0362"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T15:18:23.341Z"

---
# 0363 · Ship a document task from its document's pop-up

**Status:** 🔍 reviewing

## Problem
To ship a document task you read its document, then go back to the review pack in the side pane to find Ship. Reading and deciding should happen in one place.

## Outcome
An approved document task's document pop-up has the review pack's Ship and Ask for changes controls, so you can read the document and ship it, or ask for changes, without leaving it.

## Acceptance criteria
1. When the ticket is `approved`, its document's pop-up (0362) shows the Ship button, and the box and button for Ask for changes, above the document, as the review pack shows them above the pack.
2. Pressing Ship in the pop-up ships the ticket exactly as the pack's Ship button does. The pop-up then shows that it's shipping and what speck ship said, or why it refused, with the same wording as the pack. While any ship is running, the button can't be pressed, as in the pack.
3. Ask for changes in the pop-up sends the note exactly as the pack's does, and what it said, or why it refused, shows in the pop-up.
4. A ticket that isn't `approved` and isn't shipping shows no Ship or Ask for changes in the pop-up, and the review pack's own Ship and Ask for changes work as before.
5. No test that passed before this change fails.

## Out of scope
- Shipping a document task by itself (`auto_ship`): a document task waits for you, as reading it is its review.
- A Ship button on the queue row (0361 gives the row a Review pack button only).

## Notes
- Today: `shipPart` and `changesPart` in `templates/panel.html` (0133, 0357) draw the pack's controls. Shipping a document task files it as done (0355).
- Ask for changes is included because it's the other answer to reading the document: ship it, or send it back.
- Failing before this build: none
- Self-check: a note typed in the pop-up's box now shows in the pack's box too (and the other way), so the pack never sends a note other than the one it shows; the pop-up's controls are redrawn only when what they show changes, so typing doesn't redraw the document.

## In plain words
When you open an approved document task's document from its review pack, the pop-up now has Ship, and a box with Ask for changes, above the document. You can read it and decide there, without going back to the review pack. They work exactly as the pack's do, with the same messages, and a note you start typing in one shows in the other. To see it, open an approved document task's review pack in the panel and press its document. Worth a look: a long document puts the buttons at the top, so you scroll back up to ship.

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
    "reviewed_sha": "d85cafe3c1d00f42e959ffb8e6a53bb228403acb",
    "thread_id": "01a16435-4573-70f2-a61d-f943904c935c",
    "seconds": 31,
    "usage": {
      "input_tokens": 145302,
      "cached_input_tokens": 101120,
      "cache_write_input_tokens": 0,
      "output_tokens": 753,
      "reasoning_output_tokens": 44
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T15:23:26.065Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: drawDoc and drawDocActs place shared shipPart controls above the document. Both AC1 tests in test/pack-0363.test.mjs pass, checking placement, controls and shared styling."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "drawDocActs reuses shipPart and shipTicket, including confirmation, request, disabled state and result wording. Passing AC2 tests cover success, refusal, network failure, cancellation and an externally running ship."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "changesPart and askForChanges are shared with the pack; the input handler synchronises both note boxes. Passing AC3 tests verify the submitted note, authentication header, sending state, success, refusal, retained note and synchronisation."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "shipPart gates controls on approval or shipping state. Passing AC4 tests verify their removal after a status change and exercise the pack's existing Ship and Ask for changes actions."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0363-tests.txt: 162 tests, 159 passed, 3 skipped, no failures. The targeted run covers existing document pop-up, document buttons, shipping and changes tests alongside the new tests and repository checks. No existing tests were weakened."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Approved document pop-ups now let you ship or ask for changes directly above the document. They reuse the review pack's actions and messages, and both note boxes stay in sync. The targeted tests pass, and I found no blocking issues."
  }
}
```

</details>
