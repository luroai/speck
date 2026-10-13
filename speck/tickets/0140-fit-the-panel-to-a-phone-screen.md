---
id: "0140"
title: "Fit the panel to a phone screen"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-13T06:30:00.309Z"

---
# 0140 · Fit the panel to a phone screen

**Status:** 🔍 reviewing

## Problem
The panel is laid out for a desktop screen only. On a phone, Plan and Build are squeezed into two narrow columns side by side, the header's labels wrap one word per line and some text runs off the edge. The user checks progress and starts builds from their phone on the move, so this is a real, regular use.

## Outcome
On a phone-width screen the panel shows one readable column, with every control easy to tap, and the desktop layout is unchanged.

## Acceptance criteria
1. At a viewport 375 px wide, in light and dark mode, the page never scrolls sideways: no part of the header, the Plan, Build or Shipped sections, or the full ticket and review pack panes reaches past the right edge of the screen.
2. At viewports narrower than 700 px, Plan, Build and Shipped are stacked in one full-width column, in that order. At 700 px and wider, the layout is the same as today.
3. At a viewport 375 px wide, the header shows the speck name, the repo and base branch, speck run's state with its on/off button, the live indicator and the light/dark switch, and none of these labels wraps onto a second line.
4. At viewports narrower than 700 px, every button and clickable control in the panel (for example Set ready, the priority menu, speck run's on/off button, pause, play, Stop build, Full ticket, Review pack, Ship, the Plan tabs and the light/dark switch) has a tap area at least 44 px high and 44 px wide.
5. No test that passed before this change fails.

## Out of scope
- New features or controls for mobile only, such as swiping or a bottom tab bar.
- Changing the desktop layout.
- Installing the panel as a phone app.

## Notes
- `templates/panel.html` has no width-based media queries today: `main` is always two columns (`grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)`) and the header is one flex row. The full ticket pane is already `min(480px, 100vw)` wide.
- The panel's browser tests already run in Chromium through `test/support/panel.mjs`, so these criteria can be checked at a 375 px viewport.
- 44 px follows Apple's minimum recommended tap target (44 × 44 pt, Human Interface Guidelines).
- Reported 2026-10-13 from a screenshot on an iPhone, viewing the panel in the Claude app's browser.
- Failing before this build: none
- AC4 leaves out links inside a ticket's own Markdown text (in the full ticket and review pack panes): they're part of that text, not panel controls, and a 44 px box round each would break up the paragraph.
- A repo name too long for the screen is cut short with an ellipsis rather than wrapping or running off the edge. The test repo's name, like speck's own, shows in full.
- Self-check: step labels under a build were cut short ("Self-che…") at 375 px; they now show in normal case in columns at least as wide as their label, with a test.

## In plain words
On a phone, the panel now shows Plan, Build and Shipped one under the other in a single column, and nothing runs off the right-hand edge. The header's parts sit on one or more rows, each label on one line, and every button is big enough to tap with a thumb. On a computer screen, or any window 700 pixels wide or more, nothing has changed.

To see it, open the panel on your phone, or make your browser window narrow. Worth keeping an eye on: a very long repo name is cut short with "…" in the header rather than shown in full, and links inside a ticket's own text stay their normal size.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (known limits, no inbox note):
- A repo name too long for a phone screen is cut short with an ellipsis in the header.
- Links inside a ticket's own Markdown text keep their normal size on a phone; they aren't given 44 px tap areas.

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
    "reviewed_sha": "5926ec37c3d26b3564f9277df5e9098c4c6db20b",
    "thread_id": "01a133fa-b96e-7702-a734-e648a9a90364",
    "seconds": 51,
    "usage": {
      "input_tokens": 149499,
      "cached_input_tokens": 104320,
      "cache_write_input_tokens": 0,
      "output_tokens": 918,
      "reasoning_output_tokens": 95
    },
    "saved_at": "2026-10-13T06:38:02.346Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html mobile rules prevent overflow; both light and dark AC1 browser tests in test/panel-0140.test.mjs passed, covering open lists, menus, full tickets and review packs."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Mobile main uses one grid column. Passing AC2 browser tests verify section order and full width at 375/699 px, and unchanged computed styles and geometry at 700/1280 px."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 browser test verifies all required header parts are visible, unclipped and on one line at 375 px."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "templates/panel.html:335 gives shipped title links min-height:44px but no minimum width. fullLink() accepts short titles such as 'A', leaving their clickable width below 44 px. The passing AC4 tests only use longer shipped titles."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0140-tests.txt: 1251 tests, 1248 passed, zero failed and three skipped; all 11 ticket-specific tests passed. Existing tests were not changed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:335",
        "issue": "A shipped ticket with a short title, such as 'A', has a title link narrower than the required 44 px tap area. Its containing table cell does not handle clicks, so the surrounding space does not enlarge the control.",
        "suggested_fix": "Add min-width:44px to the mobile title-link rule and include a one-character shipped title in the AC4 browser fixture to verify its actual clickable dimensions.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The panel fits the tested phone screen in both themes, stacks sections correctly and preserves the desktop layout. The full suite has no failures. One tap-target gap needs fixing: short shipped ticket titles remain too narrow to tap reliably."
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
    "reviewed_sha": "085d87a887749d51730df51a24c8697a33ea54c2",
    "thread_id": "01a133fa-b96e-7702-a734-e648a9a90364",
    "seconds": 31,
    "usage": {
      "input_tokens": 247846,
      "cached_input_tokens": 196480,
      "cache_write_input_tokens": 0,
      "output_tokens": 1473,
      "reasoning_output_tokens": 95
    },
    "saved_at": "2026-10-13T06:40:09.524Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html mobile rules contain the header, sections and panes. Both AC1 browser tests in test/panel-0140.test.mjs passed at 375 px in light and dark mode, including open menus, full tickets and review packs."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Mobile main uses one grid column. Passing AC2 tests verify full-width sections in Plan, Build, Shipped order at 375/699 px and unchanged desktop styles and geometry at 700/1280 px."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing AC3 browser test verifies every required header component is visible and unclipped at 375 px, with labels on one line."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html:335 now sets shipped title links to a minimum 44 px width and height. The AC4 fixture includes a one-character title, and actual control dimensions pass at 375/699 px across lists, menus and panes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified the updated /tmp/speck-0140-tests.txt: 1251 tests, 1248 passed, zero failures, three skipped. All 11 ticket-specific tests passed; existing tests were not weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:335",
        "issue": "Short shipped ticket title links previously had tap areas narrower than 44 px. The mobile rule now enforces both minimum dimensions, and the browser fixture exercises a one-character title.",
        "suggested_fix": "Implemented; no further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The panel now fits a phone screen, keeps the required header labels readable and provides sufficiently large tap targets, including short shipped ticket titles. Desktop layout remains unchanged. All acceptance criteria pass, with no outstanding concerns."
  }
}
```

</details>
