---
id: "0600"
title: "Make the lanes match the panel's other views"                # one outcome, no "and"
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0599"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T07:58:14.500Z"

---
# 0600 · Make the lanes match the panel's other views

**Status:** 🔍 reviewing

## Problem
After the redesign, the lanes still sit in the old frame: each lane is a bordered card with rounded corners and its own big 22 px title with a coloured dot, which repeats the tab above it, and its rows' titles are 17 px semibold. The Pipeline log, Decided for you and a ticket's full view are flat, edge to edge with hairlines between rows and smaller, lighter type, so moving between them feels like two different apps.

## Outcome
The lanes look like the panel's other views: flat lists in the same margins, with one type scale across rows, log lines and headings.

## Acceptance criteria
1. A lane is no longer framed as a card: it has no border or rounded corners of its own, and its list runs the panel's width inside the same side margins as the Pipeline log, Decided for you and a ticket's full view, with the same hairline between rows as the log's.
2. A lane no longer has its own title or dot, as its tab names it and gives its count; anything else on that title row, such as a lane's own figures or links, is kept, under the tabs.
3. A row's title has the size, weight and line height of the mock's rows (15 px, medium), and its details line the mock's 13 px in the muted colour, in every lane; the Pipeline log's lines, Decided for you's calls and the full view's rows use the same scale for the same kind of text.
4. The Pipeline log's, Decided for you's and a ticket's full view's headings share one size and weight, and so do their back links, at 320 px wide and in both looks.
5. Tests that checked the lane's card, its title or its rows' old type are changed to check the new look, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- How a closed row's title fits on one line (0599).
- The black bar, the tabs and the bridge.
- Showing a cut-off Pipeline log line whole.

## Notes
- Asked for 2026-11-10: "The log view also look slightly different from the main panel in terms of styles."
- Measured on 2026-11-10 in a real browser at 390 px: a lane is a card (`main > section`, `border-radius: 28px / 20px`) with `.lane-title` at 22 px, weight 600, with a dot, and its rows' titles at 17 px, weight 600; the Pipeline log's title is 20 px and its lines 14 px, weight 400, with `.5px` hairlines between them.
- The mock's rows: title 15 px, weight 500, line height about 20 px; details 13 px, muted; side margins 16 px.
- Today: `main > section`, `.lane-title`, `.lane-n` and the row title rules in `templates/panel-cards.css`; the lane title markup in `templates/panel.html`. Waits for 0599, which changes the same row title rules.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: at 13 px the mixed fonts made Build's and Plan's details lines 17 px high, so the mono parts get a 14 px line and Plan's priority box sits at the line's top, a pixel lower, keeping each line 16 px with its labels on one baseline; dropped a rule that let an open Plan row's fill reach past the margins, as rows must span their list (0418); the document view's title follows the full view's down to 20 px, as 0445 keeps them the same.
- Decided for you keeps its Close button, now styled as the back link with "‹ Close", as 0568's tests press a button named Close.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Tests changed to check the new look (AC5), each because it checked the lane's card, its title or its rows' old type:
- `test/panel-0478.test.mjs`, `test/panel-0480.test.mjs`: rewritten to check the flat lane, with no card, edge, title or dot, and its line under the tabs.
- `test/panel-0476.test.mjs`, `test/panel-0520.test.mjs`, `test/panel-0536.test.mjs`, `test/panel-0425.test.mjs`, `test/panel-0134.test.mjs`: the page's markup without the lane's own heading.
- `test/panel-0577.test.mjs`: no `.lane-title` rule left to check for Doto.
- `test/panel-0151.test.mjs`, `test/panel-0155.test.mjs`, `test/panel-0157.test.mjs`, `test/panel-0214.test.mjs`: a row's title is 15 px, not 17.
- `test/panel-0427.test.mjs`: 13 px allowed for rows' details, as the mock's; a shipped row's title is 500, not 600.
- `test/panel-0167.test.mjs`: a shipped row's hairline is the Pipeline log's `--line-soft`.
- `test/panel-0417.test.mjs`, `test/panel-0438.test.mjs`, `test/pipeline-0479.test.mjs`: the lane's 16 px side margins are its list's padding now, as the lane has none.


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
    "reviewed_sha": "7edf2612210521a717e18d5ac7bd450d301dae09",
    "session": "fresh",
    "thread_id": "01a1c48f-f3b3-7780-9177-71f382a8223f",
    "builder_response": "- Tests run: test/panel-0600.test.mjs (this ticket's own), test/panel-0134.test.mjs test/panel-0151.test.mjs test/panel-0155.test.mjs test/panel-0157.test.mjs test/panel-0165.test.mjs test/panel-0167.test.mjs test/panel-0214.test.mjs test/panel-0417.test.mjs test/panel-0418.test.mjs test/panel-0425.test.mjs test/panel-0427.test.mjs test/panel-0438.test.mjs test/panel-0443.test.mjs test/panel-0445.test.mjs test/panel-0476.test.mjs test/panel-0478.test.mjs test/panel-0480.test.mjs test/panel-0520.test.mjs test/panel-0536.test.mjs test/panel-0577.test.mjs test/pipeline-0479.test.mjs, with --related (it added every test file naming a changed file) and the repo checks.\n- Outside this round's output, I also ran the 300 test files that touch the panel's styles or a real browser (three runs of 100, by grepping for the lane classes, cssRules, browserPage and the like), as --related misses tests that read the CSS through test/support/panel.mjs: all passed after the fixes below, except 0517 AC3's frame-time test once, which passed alone on a re-run (an inbox note already asks to steady it).\n- Tests changed for AC5, each because it checked the lane's card, its title or its rows' old type: 0478 and 0480 (rewritten to check the flat lane, no title or dot, the line under the tabs); 0476, 0520, 0536, 0425, 0134 (the page markup without the lane's h2); 0577 AC2 (no .lane-title rule); 0151, 0155, 0157, 0214 (row title 15 px, not 17); 0427 AC1 (13 px allowed for rows' details, per the mock) and AC3 (a shipped row's title 500, not 600); 0167 (a shipped row's hairline is the log's --line-soft, same colour as --line in both looks); 0417, 0438, 0479 (the lane's side margins are now its list's 16 px padding, as the section has no padding).\n- Not changed, but fixed in the code so they pass: 0443 AC3 and 0165 AC1 (13 px details made Build's and Plan's details line 17 px high; the mono parts now have a 14 px line and Plan's priority box sits at the line's top, a pixel lower, so each line stays 16 px with one baseline); 0418 AC1 (I had let an open Plan row's fill reach past the margins; dropped); 0445 AC1 (the document view's title follows the full view's title down to 20 px).\n- Decided for you keeps its button named Close (0568's tests press it by that name), styled as the back link: \"‹ Close\" above the heading, in the back link's size, weight and colour.\n- Pictures of the lanes, the log and the full view in both looks are kept with the review pack.\n",
    "seconds": 35,
    "usage": {
      "input_tokens": 235526,
      "cached_input_tokens": 167552,
      "cache_write_input_tokens": 0,
      "output_tokens": 726,
      "reasoning_output_tokens": 60
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 67974,
      "cached": 167552,
      "write": 0,
      "output": 726
    },
    "cost_usd": 0.1599632,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T08:26:05.820Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel-cards.css removes the lane frame and gives lists 16 px side padding and log-matching hairlines. Passing panel-0600 browser tests check all four lanes at 320 px in both looks."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel.html removes all four lane headings while retaining Capture, Build and Shipped lane-n elements. Passing panel-0600 and panel-0478 tests check retained lines beneath the tabs."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panel-cards.css and panel-popups.css apply the requested row and details scale. Passing panel-0600 tests verify computed title sizes, weights, line heights and muted details across lanes and views."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing panel-0600 browser tests compare the three views' computed headings and back links at 320 px in light and dark looks."
      },
      {
        "id": 5,
        "status": "fail",
        "evidence": "Existing appearance tests were updated and the supplied run reports 510 passes, zero failures and three skips. However, the ticket's Delivery log remains an empty placeholder and does not list the changed tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0600-make-the-lanes-match-the-panel-s-other-views.md",
        "issue": "Criterion 5 explicitly requires the Delivery log to list the updated tests. That section currently contains only its placeholder; the list in the builder response does not fulfil this requirement.",
        "suggested_fix": "Add the updated test files and their reasons to the ticket's Delivery log, using the list already supplied in the builder response.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The visual changes meet the requested layout and typography, with passing browser checks in both looks. Before approval, record the updated tests in the ticket's Delivery log as required."
  }
}
```

</details>
