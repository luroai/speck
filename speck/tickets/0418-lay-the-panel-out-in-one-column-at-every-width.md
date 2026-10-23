---
id: "0418"
title: "Lay the panel out in one column at every width"                # one outcome, no "and"
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0417"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T16:07:18.865Z"
approved: "2026-10-23T16:17:31.512Z"

---
# 0418 · Lay the panel out in one column at every width

**Status:** 👍 approved

## Problem
The panel keeps a separate layout for wide windows, with its own rules, but it's used mostly in a narrow side pane, and since 0410 the lanes are tabs showing one list at a time. Each lane also has a border of its own round its tickets' boxes, which takes width in a narrow pane and makes the tickets harder to pick out.

## Outcome
The panel has one layout, a single column, at every width, and a lane has no border of its own round its tickets.

## Acceptance criteria
1. At every window width from 320 px up, the panel shows one column: the screen at the top, the tabs, then the open lane's list. Nothing moves into a second column on a wide window.
2. On a window wider than 720 px, the column is 720 px wide and centred. At 720 px or less, it fills the width.
3. A lane has no border round it: its tickets sit directly under the tabs. Each ticket keeps its own full border, as today, and its tint or edge for its state (needs you, waiting for you, being built) still shows as today.

## Out of scope
- How tall each ticket is (0419, 0420).
- Settings, the full ticket and other pop-ups.

## Notes
- Asked for by the user on 2026-10-23: the panel is used mostly in a thin side pane, and its tickets are too tall there. A separate desktop layout isn't needed any more. Each ticket keeps its full box (the user, 2026-10-23).
- Waits for 0417: both change `templates/panel.html`.
- Failing before this build: none
- Self-check: Settings and the full ticket share the class names `.sh`, `.detail`, `.ready` and `.resume` with the lanes, so the one-column rules for those apply only inside the lanes (`main …`), and their rules for narrow windows stay as they were for Settings and the full ticket.
- Older tests changed to match: 0060, 0135, 0157, 0160, 0161, 0167, 0281 and 0417 checked the separate wide layout or the lane's border, which this ticket removes.

## In plain words
The panel now looks the same in a narrow side pane and in a wide window. Speck's screen, the tabs and the open lane's tickets sit in one column. On a window wider than 720 px, that column stays 720 px wide in the middle of the window. The lanes no longer have a line round them, so the tickets start right under the tabs and use more of a narrow pane's width. Each ticket keeps its own border and its colours for needing you, waiting for you or being built.

To see it, open the panel and make the window wider and narrower: nothing moves into a second column. In Plan, an open ticket's readiness checks now sit under its details in a wide window too. Settings and the full ticket haven't changed.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 124,414
- Elapsed since build started: 10 min
- Changed lines: 57 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox. Known limit: tables inside an open Plan item still turn into labelled blocks only below 700 px, as the full ticket's do. In the 720 px column they show as ordinary tables, as they did before in a wide window.

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
    "reviewed_sha": "b7aba333a8f5dc9a2b91bed767fa5b6dd90314ae",
    "session": "fresh",
    "thread_id": "01a1698d-1cee-7fb1-82ba-feb9f80ab879",
    "builder_response": "- Tests run: test/panel-0418.test.mjs, the panel test files whose layout checks this ticket touches (every test/panel-0*.test.mjs, test/logo-0320.test.mjs, test/foreman-0285.test.mjs, test/foreman-0299.test.mjs), and the commands.checks files.\n- One layout: the header, banners, tabs and main share one rule, 720 px wide at most and centred. The lane layout that was for narrow windows only (header padding, tabs, main, list padding, tab with its count under its name, the Shipped stats' padding) is now the base rule. Main has no padding of its own: each lane's list pads its tickets 16 px each side, in line with the screen and the first tab.\n- No lane border: `main > section` has `border: 0`. It keeps its fill, so the open tab still opens onto it. Ticket borders and state rules are untouched.\n- Settings and the full ticket share `.sh`, `.detail`, `.ready` and `.resume` with the lanes, so the lane-only versions are scoped to `main …` and the narrow rules for those class names stay, unchanged, for Settings and the full ticket (out of scope).\n- Older tests changed because they checked the separate wide layout or the lane's border, which the criteria remove: 0060 (the click \"outside\" point moved into the 720 px column), 0135 (a tab's count is now under its name at every width), 0157/0167/0281 (the lane has no border now), 0160 (header padding at every width; points across the header's own box; bottom padding is the inset alone), 0161 (a lane no longer counts as a card with an edge), 0417 (only Settings' and shared-name rules are left for narrow windows).\n- Pictures: Build at 1280 px and Plan at 375 px, light and dark, are in the review pack.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 123809,
      "cached_input_tokens": 70656,
      "cache_write_input_tokens": 0,
      "output_tokens": 605,
      "reasoning_output_tokens": 36
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T16:17:22.136Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html uses vertical flex layouts for body, main and lane lists, with lane detail rules scoped to main. The nine passing AC1 browser tests in test/panel-0418.test.mjs check ordering and single-column ticket layouts at widths from 320 to 1920 px."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html gives header, banners, tabs and main width: 100%, max-width: 720px and automatic horizontal margins. Nine passing AC2 browser tests measure full width below the limit and a centred 720 px column above it, including 720 and 721 px."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html removes borders only from main > section; ticket border and state-colour rules remain intact. Passing AC3 browser tests check all lane borders, full ticket borders at narrow and wide widths, and blocked, awaiting shipment, building and waiting state treatments."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel now uses one centred column, filling narrow windows and stopping at 720 px on wider ones. Lane borders are removed while ticket borders and state colours remain. The tests exercise the rendered layout, and the recorded run has no failures. I found no blocking issues or unrelated changes."
  }
}
```

</details>
