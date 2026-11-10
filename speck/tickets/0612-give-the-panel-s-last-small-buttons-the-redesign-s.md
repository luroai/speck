---
id: "0612"
title: "Give the panel's last small buttons the redesign's size"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-give-the-panel-s-last-small-buttons-the-redesign-s-size.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0611"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T10:15:35.422Z"

---
# 0612 · Give the panel's last small buttons the redesign's size

**Status:** 🔍 reviewing

## Problem
A few buttons are still small boxes with 8 px corners and 12 px text: a setting's own Save, the Save in Settings' unsaved-changes question, the review pack's file and folder buttons, and the pack's Ask for changes. Since 0603, Discard and Keep editing are 44 px secondary buttons beside a small Save in the same question, which looks unfinished.

## Outcome
Every button in the panel has the redesign's size and style.

## Acceptance criteria
1. The Save in Settings' unsaved-changes question is a primary button (the accent colour) of the redesign's size, beside Discard and Keep editing.
2. A setting's own Save, the review pack's file and folder buttons, and the pack's Ask for changes are secondary buttons of the redesign's size: at least 44 px tall, 10 px corners, the panel's font at the size the other buttons use.
3. No button in the panel is left with 8 px corners or 12 px text.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- What any button does.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- Decided: Save in the unsaved-changes question is primary, as the Settings view's own Save is; the rest are secondary.
- Today: `templates/panel-settings.js` (`saveBar`, the unsaved-changes question), `templates/panel-popups.js` (`documentsPart`, `changesPart`) and their stylesheets. Waits for 0611, which changes `panel-popups.js`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: the Save in the unsaved-changes question now takes only the accent's border colour, so the half-pixel border rule for screens below a pixel ratio of 2 still makes its border a whole pixel; every new 44 px height is in panel-cards.css with 0603's, as 0417 allows a 44 px size for every pointer only there.
- Every <button> the panel draws, and text inside one, now has 10 px corners and no 12 px text. The tab's counts are 13 px, not the names' 14 px, because at 14 px the four tabs' names don't fit whole at 320 px (0582's check). A priority tag, which is a tag with a button's role, keeps the tags' 8 px look. The Pipeline log's filters have 12 px sides rather than 16, so the four fit on one line at 390 px.
- The small lines inside the header bar's status button and the All projects view's cards and rows are 13 px, as the tab counts are, with their line heights unchanged, so the bar and the cards are no taller.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Tests changed to check the new look (AC4): `test/panel-0428.test.mjs`, whose 0428 AC1 now expects 10 px corners on every button, with selects, text boxes, tags and the priority menu still 8 px; and `test/panel-0453.test.mjs`, whose AC1 AC3 now expects every button's corners to be 10 px in a real browser, and whose AC2 checks the border of Discard in Settings' unsaved-changes question rather than its Save, which is now filled in the accent with no border to show.

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
    "reviewed_sha": "37564e4975a34f37b91db975f203f7ef4c385fa7",
    "session": "fresh",
    "thread_id": "01a1c506-a7e0-71e1-947f-8d1557ca04cf",
    "builder_response": "- Tests run: test/panel-0612.test.mjs test/panel-0428.test.mjs test/panel-0453.test.mjs test/panel-0417.test.mjs test/panel-0582.test.mjs, plus every related test `speck test --related` chose (its list is at the top of the output).\n- Old tests changed for the new look (AC4): test/panel-0428.test.mjs (every button 10 px corners; select, textarea, tags and the priority menu still 8 px, read from their own rules, as `button` now comes after them), test/panel-0453.test.mjs (every button's corners 10 px in the browser; AC2 checks Discard's border in the unsaved-changes question, since its Save is now filled in the accent with no border to show, like the ship bar's Ship).\n- Beyond the round's files I ran every other panel, pack, pipeline, build-log and icon test file once while building. All passed except 0517 AC3 (a 50 ms frame-timing check that came in at 53 ms under the load of 128 files at once). It passes when run on its own.\n- AC3 is read as every <button> element the panel draws, and text inside one. Notes in the ticket explain the three judgement calls: tab counts at 13 px (14 px breaks 0582's 320 px fit), the priority tag (a span with a button's role, styled as a tag) keeps the tags' 8 px, and the log filters have 12 px sides so all four fit on one line at 390 px.\n- Pictures of each changed view, light and dark, are in the review pack.\n",
    "seconds": 38,
    "usage": {
      "input_tokens": 210793,
      "cached_input_tokens": 160128,
      "cache_write_input_tokens": 0,
      "output_tokens": 969,
      "reasoning_output_tokens": 30
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 50665,
      "cached": 160128,
      "write": 0,
      "output": 969
    },
    "cost_usd": 0.1270328,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T10:35:47.714Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel-settings.css gives the unsaved-changes Save the accent background; panel-cards.css supplies 44 px height. The passing 0612 AC1 test checks its size, colours and placement."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel-settings.css and panel-popups.css apply the secondary style to the specified controls; panel-cards.css supplies 44 px height. The passing 0612 AC2 test checks these declarations."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "panel-header.js drawBridge() puts .bridge-where and .bridge-line inside actual buttons created by bridgeButton(). panel-popups.css still gives both text classes font-size: 12px."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "panel-0428.test.mjs and panel-0453.test.mjs update the old expectations, and the supplied run reports no failures. However, the ticket's Delivery log remains an empty placeholder and does not list those changed tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-popups.css",
        "issue": "The All projects view still has 12 px text inside its project and attention buttons: .bridge-line and .bridge-where. The new AC3 test misses these because it recognises button classes without following their descendant elements.",
        "suggested_fix": "Update those button text styles and extend AC3 coverage to exercise text descendants of the bridge buttons.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "speck/tickets/0612-give-the-panel-s-last-small-buttons-the-redesign-s.md",
        "issue": "AC4 explicitly requires the Delivery log to list tests updated from the old behaviour, but that section is empty.",
        "suggested_fix": "List panel-0428.test.mjs and panel-0453.test.mjs in the Delivery log, explaining their updated expectations.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The requested Save and review-pack buttons have the new size and styling, and the reported tests pass. Two gaps remain: All projects buttons still contain small text, and the required record of updated tests is missing."
  }
}
```

</details>
