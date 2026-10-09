---
id: "0050"
title: Keep unchanged rows outside Shaping through the panel refresh                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T17:29:40.760Z"

---
# 0050 · Keep unchanged rows outside Shaping through the panel refresh

**Status:** 👍 approved

## Problem
The panel still rebuilds every queue row and Shipped row on each 2-second refresh, so text you select there, such as a blocked ticket's question or a stopped build's last message, is lost within 2 seconds. A long build message scrolls in its own box, and that box jumps back to the top on every refresh, so you can't read or copy the end of it. 0040 fixed this only for open items in Shaping.

## Outcome
Text selected in a queue or Shipped row, and the scroll position of a build message box, stay put through refreshes until that row's own content changes.

## Acceptance criteria
1. With text selected in a queue row (its title, blocked question or build message), the selection is still there after a refresh in which that ticket's data in `/api/state` is unchanged, even when other tickets change in that refresh. Those other changes still show in the same refresh.
2. With a build message box scrolled away from the top, it keeps the same scroll position after a refresh in which that ticket's data is unchanged.
3. With text selected in a Shipped row, the selection is still there after a refresh in which that ticket's data is unchanged and no ticket is added to or removed from Shipped.
4. An in-flight ticket's whole minutes since `started`, and a Shipped row's time when it changes from the time alone to date and time after midnight, keep updating while text in that row is selected, and the selection stays.
5. When a row's own ticket data changes, the row shows the new content in that refresh, even if its selection or scroll position is lost.

## Out of scope
- Selections in the Shaping section (0040).
- Selections in the header, the Shipped stats row and the connection status.

## Notes
- The page is `templates/panel.html`. No CLI or JSON change.
- Found after 0040 shipped: the live panel keeps Shaping nodes across polls but replaces every `#queue` and `#shipped` child each poll, including the `.question.exit` box (max-height 16em, scrolls).
- "Data unchanged" means the same field values in `/api/state` for that ticket (matched by `id`), whatever order the fields come in. Changes to the hover highlight, chain icon or "unlocks"/"waiting on" text that come only from other tickets aren't the row's own data.
- No external facts: everything is in this repo.
- Real-browser tests can use the helpers in `test/support/panel.mjs`.
- Self-check: no changes (duplicate and built-in ids, reordered fields and failed refreshes were already covered by the tests).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Clock updates discard selection when the selected text includes the minutes or shipped-time field.
Round 2 (codex): approve.
Round 3 (codex): changes requested: F2 The Copy-label interaction fix rebuilds the entire blocked row when feedback expires after two seconds.
Round 4 (codex): approve.

## Delivery log
- Review rounds: 4
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 3,729,847
- Elapsed since build started: 81 min
- Changed lines: 81 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "782af10eb91a83170c6b5dd2f7ca40a9d7882c11",
    "thread_id": "01a121bb-3369-72f3-a50f-ae0b405c2d7b",
    "seconds": 62,
    "usage": {
      "input_tokens": 365417,
      "cached_input_tokens": 285568,
      "cache_write_input_tokens": 0,
      "output_tokens": 1600,
      "reasoning_output_tokens": 326
    },
    "saved_at": "2026-10-09T17:35:40.926Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: keptItems and queueUpdate retain unchanged queue content. test/panel-0050.test.mjs covers titles, questions, messages, other-ticket changes and reordered fields; the supplied browser test passes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The browser test in test/panel-0050.test.mjs sets a real build message box's scrollTop and verifies it remains unchanged through refreshes and another ticket's addition."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "keptItems retains unchanged Shipped rows. The AC3 test checks another shipped ticket changing, and the browser test verifies an actual Shipped title selection survives."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "queueUpdate replaces the minutes span's textContent, and render's Shipped update replaces the time cell's textContent. Selection inside those text nodes is lost when the clock changes. The AC4 test only checks retained title nodes, and the browser test does not exercise clock changes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "keptItems rebuilds rows when their own signature changes. The AC5 test exercises changed questions, messages, titles, review rounds and status; the supplied browser test verifies changed queue and Shipped titles appear."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Clock updates discard selection when the selected text includes the minutes or shipped-time field. Assigning textContent removes the selected text node, despite the ticket requiring the selection to stay while these values update. The AC4 test's retained-title check misses this case.",
        "suggested_fix": "Preserve and restore selection boundaries when updating clock text, including selections spanning neighbouring content. Add real-browser tests selecting the minutes and shipped time, advance the clock across a minute boundary and midnight, and verify both updated content and preserved selection.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The new unconditional selection-preservation claim is too broad until selections involving clock text also survive its updates."
    },
    "escalation_question": "",
    "summary": "Unchanged titles, questions and build messages now stay available to read and copy, and message scrolling is preserved. One required case remains: selecting the elapsed minutes or shipped time loses that selection when the displayed time updates. The tests currently miss this case."
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
    "reviewed_sha": "adc4fbfef490168cbb951792e4261714d2a91364",
    "thread_id": "01a121bb-3369-72f3-a50f-ae0b405c2d7b",
    "seconds": 32,
    "usage": {
      "input_tokens": 584637,
      "cached_input_tokens": 393088,
      "cache_write_input_tokens": 0,
      "output_tokens": 2263,
      "reasoning_output_tokens": 365
    },
    "saved_at": "2026-10-09T17:40:46.701Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: keptItems retains unchanged queue rows; queueUpdate changes derived content separately. AC1 tests cover selected titles, questions and messages, other-ticket changes and reordered fields. Supplied browser tests pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Unchanged build message nodes remain attached. The real-browser test sets scrollTop and verifies it survives refreshes while another ticket changes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "render uses keptItems for Shipped rows. AC3 tests cover another Shipped row changing; the browser test verifies actual selected Shipped text survives refreshes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "queueUpdate and the Shipped updater now use setText to edit existing text nodes and retain selection endpoints. The new real-browser AC4 test verifies selected minute numbers, selected shipped time across midnight, and selection spanning a title and minutes. Supplied results show it passes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "keptItems rebuilds rows when their own data signature changes. AC5 tests cover changed questions, build messages, titles, review rounds and status; browser tests verify changed queue and Shipped titles appear."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Clock updates previously discarded selections involving minutes or shipped-time text.",
        "suggested_fix": "Completed: setText edits the existing text node and adjusts affected selection endpoints, with real-browser regression coverage.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The updated description matches row retention, clock updates and selection preservation covered by the tests."
    },
    "escalation_question": "",
    "summary": "Selected text and build-message scrolling now survive unchanged-row refreshes, including selections involving updating times. Changed tickets still update promptly. The previous issue is fixed, and all five criteria pass."
  }
}
```

</details>

<details><summary>Round 3 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "6342198b5cbe0ae2a6deb6235fb63775b98d8b63",
    "thread_id": "01a121bb-3369-72f3-a50f-ae0b405c2d7b",
    "seconds": 47,
    "usage": {
      "input_tokens": 1196556,
      "cached_input_tokens": 960768,
      "cache_write_input_tokens": 0,
      "output_tokens": 3456,
      "reasoning_output_tokens": 433
    },
    "saved_at": "2026-10-09T18:33:36.568Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "Ordinary refresh coverage in test/panel-0050.test.mjs still passes, but render now includes the Copy label in the row signature. copy's two-second reset replaces an unchanged blocked row, removing any selection made after clicking Copy. A read-only reproduction using fakePage confirmed the previous row is detached."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Unchanged build-message boxes remain attached through polling. The AC2 test and real-browser scrollTop assertions pass on the supplied merged-suite results."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Shipped retention is unaffected by the merge. The AC3 test and actual browser selection checks pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "queueUpdate and the Shipped updater retain setText. The real-browser AC4 test covers selected minutes, midnight and selection spanning title and minutes; it passes in the merged-suite results."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "keptItems still rebuilds rows when ticket data changes. AC5 tests cover questions, messages, titles, rounds and status; browser checks pass."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Clock updates previously discarded selections involving minutes or shipped-time text.",
        "suggested_fix": "Completed: the merged code retains setText and its real-browser regression coverage.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "The Copy-label interaction fix rebuilds the entire blocked row when feedback expires after two seconds. Someone who selects the question or resume command during that interval loses their selection although the ticket data is unchanged. This is particularly problematic after clipboard failure, when the button explicitly tells them to select the command instead. Existing Copy tests check labels and text, but not retained selection.",
        "suggested_fix": "Update the Copy button label in place on the retained row rather than adding it to the rebuild signature. Add a browser regression test that selects the question or command after clipboard failure, expires the feedback and refreshes, and verifies selection survives while the label resets.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The unchanged-row selection guarantee is contradicted by the Copy feedback timer rebuilding a blocked row."
    },
    "escalation_question": "",
    "summary": "The merge preserves the time and scrolling fixes and keeps the Copy button working. However, resetting its feedback now removes the whole blocked row and loses text selected there. Update only the button before merging."
  }
}
```

</details>

<details><summary>Round 4 · codex · approve</summary>

```json
{
  "meta": {
    "round": 4,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "9d8dc4d79a55a8a98511cc0cd02ce9be04423cc7",
    "thread_id": "01a121bb-3369-72f3-a50f-ae0b405c2d7b",
    "seconds": 30,
    "usage": {
      "input_tokens": 1571484,
      "cached_input_tokens": 1301632,
      "cache_write_input_tokens": 0,
      "output_tokens": 4434,
      "reasoning_output_tokens": 433
    },
    "saved_at": "2026-10-09T18:50:29.369Z"
  },
  "verdict": {
    "round": 4,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "keptItems retains unchanged queue rows. AC1 tests cover titles, questions, messages, other-ticket changes and reordered fields. copyLabel now updates only the button; an independent fakePage reproduction confirmed the row remains attached through clipboard failure, feedback reset and a successful refresh."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Unchanged message boxes retain their nodes. test/panel-0050.test.mjs includes real-browser scrollTop checks through refreshes and another ticket changing; supplied results pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "render retains unchanged Shipped rows using keptItems. AC3 node-retention and real-browser selection tests pass in the supplied results."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "queueUpdate and the Shipped updater still use setText. The real-browser AC4 test exercises selected minute numbers, midnight and selection spanning title and minutes; supplied results pass."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Changed ticket signatures rebuild their rows. AC5 tests cover questions, messages, titles, rounds and status, with browser checks for changed queue and Shipped content."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Clock updates previously discarded selections involving minutes or shipped-time text.",
        "suggested_fix": "Completed: setText preserves the text node and adjusts affected selection endpoints, with browser regression coverage.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Copy feedback previously rebuilt an unchanged blocked row and discarded its selection.",
        "suggested_fix": "Completed: copyLabel changes only the button. The regression test verifies retained row and command nodes through feedback changes and reset; independent reproduction also confirms retention through a successful refresh.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The selection, scrolling and clock-update description matches the implementation. The temporary review-limit increase is excluded from the requested review scope."
    },
    "escalation_question": "",
    "summary": "Both reported issues are fixed. Selected text and message scrolling survive unchanged-row refreshes, times continue updating, and Copy feedback now preserves the row. All five criteria pass."
  }
}
```

</details>
