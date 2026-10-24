---
id: "0457"
title: "Join the open tab to the lane under it"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0455"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T10:08:21.543Z"

---
# 0457 · Join the open tab to the lane under it

**Status:** 🔍 reviewing

## Problem
The open tab (Plan, Build or Shipped) has a line along its bottom, from its own border and from the line under the tab row, so it looks like a separate button sitting above its lane. It should look like the tab of a file folder: one piece with the page under it.

## Outcome
The open tab and its lane read as one sheet of paper, with no line between them, while the other tabs sit behind it.

## Acceptance criteria
1. Under the open tab, whichever of Plan, Build and Shipped it is, there's no line: neither the tab's own bottom edge nor the line under the tab row shows across its width.
2. The open tab's background is the same colour as the lane directly under it, in the light and dark looks, so the two read as one piece.
3. The open tab keeps its top, left and right edges in the text colour and its rounded top corners. The other tabs keep all four edges, and the line under the tab row still shows under them. Choosing another tab moves the gap to it.
4. On a phone-sized page at a device pixel ratio of 3, in a real browser, no line shows under the open tab and the line under the other tabs shows, for each of the three tabs open in turn. No test that passed before this change fails.

## Out of scope
- The Tickets, Ideas and Inbox tabs inside Plan.

## Notes
- Asked for by the user on 2026-10-24, from a phone screenshot of the Build tab: "that tab to almost look like a filing piece of paper … that line shouldn't be underneath or at the bottom of the open tab."
- Today: `.tabs` has `border-bottom: .5px solid var(--line)`, and `.tab[aria-selected="true"]` has a full border in `var(--text)` on a `var(--panel)` background, in `templates/panel.css`. Tabs get their top corners from `.tab { border-radius: 8px 8px 0 0; }` further down the file.
- The tabs are `<button>`s, so 0453 (every button drawn on all four sides) covers them. The open tab's missing bottom edge is this ticket's deliberate exception to 0453.
- Waits for 0455, which waits for 0454 and 0453: all change `templates/panel.css`.
- Failing before this build: none
- Self-check: Chrome draws the tab row's half-pixel line a whole pixel thick, so the open tab's half-pixel overlap left half of it showing; the open tab now also has a shadow in the lane's colour just under it, which covers it in any browser (spilling only into the lane, which is the same colour). Updated 0453's and 0428's checks of the open tab's bottom edge, which this ticket deliberately makes the lane's colour.

## In plain words
The open tab (Plan, Build or Shipped) no longer has a line along its bottom. It's the same colour as the page under it and flows straight into it, like the tab on a file folder, while the other tabs keep their full outline and the line under them. Open the panel and pick each tab in turn: the gap moves with it, in the light and dark looks. On a very sharp phone screen, it's worth a glance that no thin line shows under the open tab.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none.

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
    "reviewed_sha": "6673b4f8f0d6acce759e571ec84891408b2d10e9",
    "session": "fresh",
    "thread_id": "01a16d66-d888-7283-a9e4-ce0ec5fa86fb",
    "builder_response": "- Tests run: test/panel-0457.test.mjs test/panel-0453.test.mjs test/panel-0428.test.mjs, plus the files `--related` brought in for templates/panel.css (test/panel-0281, 0416, 0430, 0444), and the checks files.\n- Change: the open tab's bottom border is var(--panel), and it has `box-shadow: 0 1px 0 var(--panel)`. Chromium draws the tab row's .5px line as 1px, so the open tab's existing -.5px overlap left half of the line showing; the shadow (not clipped by the tab's own overflow: hidden) covers it in any browser, and where a browser draws .5px it only spills into the lane, which is the same colour.\n- Changed existing tests: 0453 AC3 (the open tab edged in the text colour on all four sides) and 0428 AC3 (every button's border in a control-edge colour) now expect the open tab's bottom edge in --panel. The ticket's Notes name this as the deliberate exception to 0453. Both still check every other side as before.\n- Also ran by hand (not in the round's output): test/panel-0426, 0425, 0418, 0438, 0060, 0140, 0161, 0162, 0165, 0410, 0417, 0449 — all pass.\n- Pictures: each of the three tabs open on a phone, light and dark.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 97502,
      "cached_input_tokens": 56192,
      "cache_write_input_tokens": 0,
      "output_tokens": 643,
      "reasoning_output_tokens": 21
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T10:14:08.101Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.css:76 colours the selected tab's bottom border and shadow with --panel, covering the row line. The passing 0457 browser test checks screenshot pixels for all three selected tabs."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The selected tab and lane sections use --panel. The passing 0457 browser test compares their computed backgrounds in both light and dark themes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The CSS retains text-coloured top and side edges and rounded top corners. Passing 0453 and 0457 tests check these edges, closed-tab borders, and the moving gap when each tab is selected."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The 0457 real-browser test passed at 390px width and device pixel ratio 3, checking all three tabs in both themes. Verified /tmp/speck-0457-tests.txt: 134 passed, zero failed, three skipped; the 0457 browser test was not skipped."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The selected tab now joins visually to its lane, while the other tabs retain their borders. Real-browser pixel checks pass for all three tabs in light and dark themes on a phone-sized page. The change stays within scope, and the reviewed test run has no failures."
  }
}
```

</details>
