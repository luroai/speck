---
id: "0481"
title: "Mark the open lane clearly in the strip"                # one outcome, no "and"
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
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T18:03:22.021Z"

---
# 0481 · Mark the open lane clearly in the strip

**Status:** 🔍 reviewing

## Problem
In the strip under speck's screen (0477), the open lane's name differs from the others only by a slightly darker grey, so on a phone the user can't tell whether Plan, Build or Shipped is open.

## Outcome
The open lane in the strip is plain to see at a glance, in both looks.

## Acceptance criteria
1. The open lane's name in the strip is in the text colour, with a bar under it at least 2 px tall, as wide as the name, in the text colour. The other lanes' names have no bar and stay in the muted colour. Every name keeps its weight and size, so none changes width.
2. The difference doesn't rely on colour alone (0161): with the colours removed, the bar still shows which lane is open. Checked in a real browser in the light and dark looks at 390 px.
3. The bar moves to the new lane when a swipe, a press on the strip or the ← and → keys change lane, and after the 2-second refresh it's still under the open lane. Build's needs-you number keeps its place and colour (0477).
4. The strip stays 32 px tall, each lane's button stays at least 44 px each way, and nothing in the strip shifts sideways when the open lane changes. No test that passed before this change fails.

## Out of scope
- The lanes' cards under the strip (0480).
- Adding lanes, or dots in the strip.

## Notes
- Asked for by the user on 2026-10-24: "I need the Plan / Build / Shipped tabs at the top to be more highlighted. I can't tell which is selected."
- Today: `.tab` and `.tab[aria-selected="true"]` in `templates/panel-header.css` (0477): the open lane's name is in `--text` and the others in `--muted`, both at weight 600. 0457's folder-tab look for the open tab went with 0477's strip.
- Failing before this build: none
- Self-check: no changes (the bar is drawn only from aria-selected, which every way of changing lane already sets; in forced colours the bar keeps the system text colour and the other names have no border to show)

## In plain words
The open lane in the strip under speck's screen (Plan, Build or Shipped) now has a short dark line under its name, as well as being darker than the others, so you can tell which one is open at a glance, even on a phone. Open the panel and swipe, tap a lane's name or press the arrow keys: the line moves to the lane you've opened, and nothing else in the strip shifts. It looks the same way in the light and dark looks.

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
    "reviewed_sha": "4e508c7d014d45d69614508e9367b16684e02aa2",
    "session": "fresh",
    "thread_id": "01a16f19-d514-7943-bea3-d905cc242771",
    "builder_response": "- Tests run: test/panel-0481.test.mjs, plus the related files speck test --related chose (test/panel-0417.test.mjs, test/panel-0469.test.mjs, test/panel-0472.test.mjs, test/panel-0477.test.mjs) and the commands.checks files.\n- The change is CSS only (templates/panel-header.css): a 2 px border in currentColor under the open lane's name, with the other names given 2 px more bottom padding so every name's box is the same height and nothing moves. \"With the colours removed\" (AC2) is checked as the bar's lightness against the strip's background (contrast at least 3:1), in the light and dark looks at 390 px, in a real browser.\n- AC3's \"2-second refresh\": the panel fetches the board when the server announces a change, so the test changes the board (adds a ticket) and checks the bar after the page has drawn it afresh.\n- Pictures of the strip in both looks are in the review pack.\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 89683,
      "cached_input_tokens": 66560,
      "cache_write_input_tokens": 0,
      "output_tokens": 615,
      "reasoning_output_tokens": 42
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T18:09:06.970Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-header.css adds a 2 px currentColor border only to the selected tab name, compensating with padding. Both passing 0481 tests check the bar, colours, font size and weight; the browser test checks its width."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing real-browser test in test/panel-0481.test.mjs checks all selected lanes at 390 px in light and dark themes, including the bar's luminance contrast against the strip. The border provides a visible shape independent of colour."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing browser test exercises strip clicks, both arrow keys, swipes in both directions and a board refresh. It checks the selected bar and verifies that Build's number retains its position and colour."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The browser test verifies a 32 px strip, buttons at least 44 px in both dimensions and unchanged horizontal positions throughout lane changes. /tmp/speck-0481-tests.txt confirms 130 passed, zero failed and three skipped; both 0481 tests passed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The open lane now has a clear underline in both light and dark looks. Browser checks confirm it follows lane changes and refreshes without shifting the strip or Build's number. The change stays within scope, and the tests run show no failures."
  }
}
```

</details>
