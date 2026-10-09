---
id: "0040"
title: "Keep selected text through the panel refresh"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0039"]                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T15:32:10.353Z"

---
# 0040 · Keep selected text through the panel refresh

**Status:** 🔍 reviewing

## Problem
The panel rebuilds the whole page on every 2-second refresh, so any text you select in an open ticket or idea is lost within 2 seconds. You can't reliably copy a criterion or a lint message out of the panel.

## Outcome
Text you select in an open ticket or idea stays selected through refreshes until that item's own content changes.

## Acceptance criteria
1. With text selected in an open ticket's details, the selection is still there after a refresh in which that ticket's data in `/api/state` is unchanged.
2. Criterion 1 still holds when other parts of the state change in that refresh, for example another ticket's status, a queue ticket's review round or a new shipped ticket. Those changes still show on screen in the same refresh.
3. With text selected in an open idea's note text, the selection is still there after a refresh in which that idea's data is unchanged, whatever else changes.
4. When the open ticket's or idea's own data changes, the panel shows the new content in that refresh, even if the selection is lost.
5. Nothing else on the page waits on a selection: the minutes since `started` in the queue, the connection status and the disconnected message keep updating while text is selected.

## Out of scope
- Clicks inside an open item closing it (0039).
- Selections outside the open ticket and idea details, such as in the queue or Shipped.
- Keyboard access and capping the height of long details.

## Notes
- The page is `templates/panel.html`. No CLI or JSON change.
- Builds after 0039, which changes the same item code.
- "Data unchanged" means the same field values in `/api/state` for that ticket (matched by `id`) or idea (matched by `path`).
- No external facts: everything is in this repo.
- Self-check: added a test that drafts sharing an id, or with ids such as `__proto__` and `constructor`, all show and refresh; no code change.
- The browser helpers from `test/panel-0039.test.mjs` moved into `test/support/panel.mjs` so this ticket's real-browser test can use them.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up idea: the queue and Shipped lists are still rebuilt on every refresh, so text selected there is lost (out of scope here).

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
    "reviewed_sha": "96d895e987b7245b0b125f47d9051722b63ba266",
    "thread_id": "01a12151-0dfa-7ab2-9d99-08af6fd49825",
    "seconds": 67,
    "usage": {
      "input_tokens": 337609,
      "cached_input_tokens": 264448,
      "cache_write_input_tokens": 0,
      "output_tokens": 1672,
      "reasoning_output_tokens": 215
    },
    "saved_at": "2026-10-09T15:39:49.529Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "templates/panel.html shapingItems compares JSON.stringify signatures, which depend on object property order. A read-only reproduction using fakePage with identical ticket field values in reversed property order replaced and detached the open node. Existing AC1 tests only clone objects without changing property order."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/panel-0040.test.mjs AC2 exercises another draft changing status, queue review rounds, new shipped tickets and inserted drafts, asserting preserved nodes and immediate updates. The real-browser test verifies selection while other items are added."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The AC3 test exercises unchanged idea notes while other ideas and queue tickets change; the real-browser test checks actual selected note text after unrelated changes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "AC4 tests verify changed criteria, notes, idea body and status appear immediately; the real-browser test verifies rewritten criteria and notes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "AC5 uses a controlled clock and failed/recovered fetches to verify queue minutes, connection status and disconnected messages update while the selected node remains attached."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "shapingItems treats object property order as data. The ticket explicitly defines unchanged data as the same field values, but rearranging frontmatter fields can change their order in /api/state without changing values. JSON.stringify then produces a different signature and replaces the open ticket, losing its selection. The read-only fakePage reproduction confirmed this detachment.",
        "suggested_fix": "Compare field values independently of object property order, including nested objects, and add a regression test using the same values with reordered properties.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The selection guarantee currently overstates the implementation: identical field values with different property ordering can still clear a ticket selection. The wording will be accurate once F1 is fixed."
    },
    "escalation_question": "",
    "summary": "The change preserves selected text during ordinary refreshes and keeps the rest of the panel updating. One edge case needs fixing: rearranging a ticket’s fields without changing their values still clears its selection, contrary to the agreed requirement."
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
    "reviewed_sha": "d0909107825cf0caa8808c90b0fc2e623ab17dfe",
    "thread_id": "01a12151-0dfa-7ab2-9d99-08af6fd49825",
    "seconds": 32,
    "usage": {
      "input_tokens": 527128,
      "cached_input_tokens": 430592,
      "cache_write_input_tokens": 0,
      "output_tokens": 2493,
      "reasoning_output_tokens": 215
    },
    "saved_at": "2026-10-09T15:41:59.986Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html signature() sorts object keys recursively; shapingItems() preserves unchanged ticket nodes. AC1 and the new field-order regression test pass in the supplied output. Independent read-only verification confirmed reordered ticket and nested fields preserve attached nodes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/panel-0040.test.mjs AC2 verifies preserved detail nodes alongside immediate draft, queue review-round and shipped-ticket updates. The passing real-browser test confirms actual selection survives unrelated additions."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "AC3 and the passing real-browser test cover unchanged idea selections during unrelated changes. The new regression test and independent verification confirm reordered idea fields also preserve attached nodes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "AC4 tests verify updated ticket criteria and notes and updated idea body and status appear immediately. The passing real-browser test verifies changed criteria and note content."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "AC5 verifies advancing queue minutes, disconnected status and message, and recovery while the selected detail node remains attached. render() continues rebuilding queue and connection indicators independently of cached Shaping items."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Object property order previously caused unchanged ticket data to replace the selected detail node. Recursive key sorting now removes this dependency, with an honest regression test covering ticket, nested and idea fields.",
        "suggested_fix": "Completed; no further change required.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The selection-preservation and immediate-content-update descriptions now match the implementation and tests."
    },
    "escalation_question": "",
    "summary": "Selected ticket and idea text survives refreshes while its data stays unchanged, and the rest of the panel continues updating. The field-order bug is fixed and verified. All five criteria pass, with no remaining blocking findings."
  }
}
```

</details>
