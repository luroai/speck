---
id: "0585"
title: "Show Build as compact rows grouped by what they need"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0584","0582"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T20:35:51.962Z"
approved: "2026-11-09T21:20:56.589Z"
finished: "2026-11-09T21:24:40.724Z"

---
# 0585 · Show Build as compact rows grouped by what they need

**Status:** ✅ done

## Problem
Build cards are tall and busy, with progress lights, logs and buttons on each, so on a phone you see two or three tickets at a time. The redesign shows Build as compact rows grouped by what each ticket needs, with the detail one tap away.

## Outcome
Build lists its tickets as compact rows under Needs you, Building and Queued.

## Acceptance criteria
1. Build lists its tickets in three groups, each headed with its count and left out when empty: Needs you (blocked and waiting for you, approved and waiting at Ship, or with an engineering manager's question), Building (building, reviewing or shipping) and Queued (ready).
2. Each ticket is one row: its id in the mono font, its title, and one line saying where it is with a small dot (orange for needs you, blue while it's worked on, grey while it waits), such as "Reviewing · round 2 · 18 min" or "Ready · after 0557".
3. Pressing a row opens the ticket's full view, and its live details are no longer on the row.
4. Each row is at least 44 px tall, and a long title wraps rather than being cut off at 320 px wide.
5. Tests that checked the old look of what this changes are updated to the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Capture, Plan and Shipped (0586, 0587).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: `queueItem`, `titleLine`, `queuedLine` in `templates/panel.js`, styled in `templates/panel-cards.css`. Waits for 0584, which puts the live details in the full view first.
- Relies on nothing outside this repo.
Failing before this build: none
- Self-check: moved Back to Plan into a ready ticket's full view, which is the only place it could go once the card went; added each ticket's Type and a queued one's Ready check to the full view, as the row no longer shows them and the review of the old tests found them missing; group heads are 14 px, as no text in the panel is 13 px since 0427.
- Stopped builds are listed under Building: criterion 1 names only three reasons for Needs you, and a stopped build isn't one of them. See Delivery log.
- speck (2026-11-09 21:10 UTC) told you: This build is slow because of the size of its test update, and nothing is stuck. Replacing the Build cards with rows broke 449 of the 3353 tests that checked the old look, so the builder split that work between six helper agents, which took about 7 to 19 minutes each, and it is now fixing the last few and re-running every panel test. Why: The build's log shows the 449 failures on its first full test run and later runs with only two failures left, the failures are all about the old cards with no test hanging, and the last full test run saved, on 0584 which this ticket builds on, passed; the high machine load fits the builder re-running the panel tests, though I couldn't list running processes to confirm it.

## In plain words
Build now lists each ticket as one short row instead of a tall card, so far more fit on a phone. Rows are grouped under Needs you, Building and Queued, each with its count, and a group with nothing in it doesn't show. Each row gives the ticket's number, its title and one line saying where it is, with an orange, blue or grey dot.

Press a row to open the ticket: the log, Stop, the question to answer and Back to Plan are all there now. To see it, open the panel's Build tab while something is building.

Worth keeping an eye on: a build that stopped by itself shows under Building with a grey dot rather than under Needs you, as the ticket asked. That's saved as an idea to change.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 997,167
- Elapsed since build started: 45 min
- Changed lines: 439 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Tests changed for this redesign (criterion 5), 109 files updated to the rows and the full view: blocked-0283.test.mjs, build-log-0548.test.mjs, criteria-0565.test.mjs, fix-0100.test.mjs, foreman-0317.test.mjs, foreman-answer-0318.test.mjs, go-with-0284.test.mjs, kind-0492.test.mjs, pack-0354.test.mjs, pack-0362.test.mjs, pack-0363.test.mjs, pack-0562.test.mjs, panel-0040.test.mjs, panel-0041.test.mjs, panel-0050.test.mjs, panel-0051.test.mjs, panel-0052.test.mjs, panel-0053.test.mjs, panel-0055.test.mjs, panel-0058.test.mjs, panel-0063.test.mjs, panel-0069.test.mjs, panel-0071.test.mjs, panel-0073.test.mjs, panel-0077.test.mjs, panel-0132.test.mjs, panel-0133.test.mjs, panel-0138.test.mjs, panel-0139.test.mjs, panel-0140.test.mjs, panel-0143.test.mjs, panel-0145.test.mjs, panel-0146.test.mjs, panel-0153.test.mjs, panel-0154.test.mjs, panel-0155.test.mjs, panel-0156.test.mjs, panel-0158.test.mjs, panel-0160.test.mjs, panel-0161.test.mjs, panel-0163.test.mjs, panel-0165.test.mjs, panel-0167.test.mjs, panel-0168.test.mjs, panel-0171.test.mjs, panel-0189.test.mjs, panel-0196.test.mjs, panel-0201.test.mjs, panel-0203.test.mjs, panel-0213.test.mjs, panel-0338.test.mjs, panel-0357.test.mjs, panel-0361.test.mjs, panel-0366.test.mjs, panel-0379.test.mjs, panel-0410.test.mjs, panel-0416.test.mjs, panel-0417.test.mjs, panel-0418.test.mjs, panel-0419.test.mjs, panel-0421.test.mjs, panel-0422.test.mjs, panel-0423.test.mjs, panel-0424.test.mjs, panel-0426.test.mjs, panel-0427.test.mjs, panel-0428.test.mjs, panel-0434.test.mjs, panel-0438.test.mjs, panel-0440.test.mjs, panel-0442.test.mjs, panel-0443.test.mjs, panel-0444.test.mjs, panel-0445.test.mjs, panel-0453.test.mjs, panel-0455.test.mjs, panel-0461.test.mjs, panel-0462.test.mjs, panel-0463.test.mjs, panel-0464.test.mjs, panel-0465.test.mjs, panel-0466.test.mjs, panel-0467.test.mjs, panel-0468.test.mjs, panel-0469.test.mjs, panel-0472.test.mjs, panel-0473.test.mjs, panel-0483.test.mjs, panel-0484.test.mjs, panel-0500.test.mjs, panel-0519.test.mjs, panel-0545.test.mjs, panel-0577.test.mjs, panel-0583.test.mjs, panel-0584.test.mjs, panel-focus-0326.test.mjs, panel.test.mjs, pictures-0294.test.mjs, pipeline-0458.test.mjs, resume-0044.test.mjs, review-model-0382.test.mjs, review-running-0223.test.mjs, run-provider-0391.test.mjs, speck-name-0485.test.mjs, speck-name-0576.test.mjs, stopped-wait-0217.test.mjs, task-0350.test.mjs, type-0049.test.mjs, waiting-0166.test.mjs. Shared helpers updated: test/support/panel.mjs, test/support/documents.mjs, test/support/cards-0519.mjs.

Removed, as they checked only the old look, with nothing to carry over:
- test/panel-0190.test.mjs and test/panel-0224.test.mjs (tap areas of the tags in the Queued line; a row has no tags), with their helper test/support/queue-phone.mjs
- 0171: the 2 px border by stage (3 tests)
- 0434: the grid of lights (3 tests)
- 0461: the shipping card's purple border, and the five-step track on open Build cards
- 0462: the three-column facts table on a card, and its layout at 320 and 390 px
- 0463: the track and table matching a Build card's
- 0484: a closed card's tag, stage and ellipsis (4 tests)
- 0519: padding of a card an agent is working on
- 0138: the purple tint rules; 0418: a card's tint or edge; 0361: the task tag on a closed row
- 0500: its check of 0484's source for the old time format
- 0584: closing the full view leaving an open card's log followed

Follow-ups:
- A stopped build shows under Building with a grey dot, saying Build stopped. Criterion 1 doesn't count it as needing you, though nothing moves it on by itself when the Foreman is off.
- A stopped build under Needs you: saved to the inbox as speck/ideas/2026-11-09-list-a-stopped-build-under-needs-you.md.
- test/panel-0472.test.mjs's real-browser test fails on and off on main too, unrelated to this ticket. Not saved as an idea: speck/ideas/done/2026-10-28-steady-0232-ac3-and-0472-ac3-under-a-busy-run.md already covers it.
- Tidy-up: some comments in templates/panel.js still say card where they mean the full view.

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
    "reviewed_sha": "246ae33be266d2afadf0e0983af6f55603b790c5",
    "session": "fresh",
    "thread_id": "01a1c22e-d1a0-7bc3-94b5-51f752c17fea",
    "builder_response": "- Tests run: test/panel-0585.test.mjs, every existing test file this branch changed (see the Delivery log), and every test file naming a changed file, by speck test --related\n- Note: 448 tests that asserted the old Build cards moved to the rows or the full view (criterion 5). Removed ones are listed by name in the Delivery log. Back to Plan, Type and the Ready check moved to the full view so nothing the card did is lost.\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 996426,
      "cached_input_tokens": 740224,
      "cache_write_input_tokens": 0,
      "output_tokens": 741,
      "reasoning_output_tokens": 83
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 256202,
      "cached": 740224,
      "write": 0,
      "output": 741
    },
    "cost_usd": 0.5938364,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T21:20:37.729Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel-model.js buildGroup and panel.js render group tickets, count them and omit empty groups. Passing 0585 AC1 tests cover questions, blocked tickets, approval and shipping."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel.js queueRow and whereLine render the id, title, status and minutes; panel-cards.css supplies the mono font and coloured dots. Passing 0585 AC2 tests exercise these states and clock updates."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "queueRow opens openFull by click or keyboard and contains no live details. Passing 0585 AC3 and updated 0584 tests cover opening, controls and live updates in the full view."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panel-cards.css sets a 44 px minimum and wrapping titles. The passing 0585 AC4 real-browser test measures both at 320 px."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Delivery log lists updated and removed tests. Verified /tmp/speck-0585-tests.txt reports 3375 passes, zero failures and three skips. Test changes move behaviour checks to the full view and remove checks for obsolete visuals."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Build now shows compact rows under counted groups, with status dots and full details one press away. The reviewed code and passing tests support all five criteria. No blocking issues found."
  }
}
```

</details>
