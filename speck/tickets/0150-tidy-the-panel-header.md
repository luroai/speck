---
id: "0150"
title: "Tidy the panel header"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-10-13T21:28:21.538Z"
approved: "2026-10-13T21:53:12.273Z"

---
# 0150 · Tidy the panel header

**Status:** 👍 approved

## Problem
The panel header looks untidy, worst on a phone: the Auto-build indicator and its Pause or Start button are two separate boxes, the "live · Ns ago" indicator takes room without telling the user anything useful, and the light/dark button sits on a line of its own, at a different height from the rest. The project name sits in the middle.

## Outcome
The header is tidy on phone and desktop: the Auto-build indicator is itself the button, the "live" indicator has gone, the project name is on the right, and the Auto-build and light/dark buttons are the same height and line up.

## Acceptance criteria
1. The header no longer shows the "live · Ns ago", "connecting…" or "disconnected" indicator. When the panel can't reach its server, the banner under the header still says so, as it does today.
2. Auto-build is one button showing its square (green when on, red when off) and "Auto-build on" or "Auto-build off". Clicking it, or pressing Enter or Space on it, pauses or starts speck run exactly as the Pause and Start buttons do today; there is no separate Pause or Start button. It has a tooltip saying what a click will do ("Pause Auto-build: ready tickets wait" or "Start Auto-build: build ready tickets one at a time"), `aria-pressed` matching whether it's on, and while a request is pending it reads "Starting…" or "Pausing…" and can't be clicked. If starting or pausing fails, the reason still shows under the header.
3. At 700 px wide and over, the header is one row with everything centred vertically: "speck control panel" on the left; the project name and base branch, then the Auto-build button, then the light/dark button on the right.
4. At a viewport 375 px wide, the header is two rows: "speck control panel" on the left and the project name and base branch on the right of the first, then the Auto-build button on the left and the light/dark button on the right of the second. Nothing wraps within a label or overflows the screen, and every button is at least 44 px tall.
5. At every width, the Auto-build and light/dark buttons are the same height and their tops line up. No test that passed before this change fails, except checks of the removed live indicator and the separate Pause and Start button, which are changed to check AC1 and AC2.

## Out of scope
- The banners under the header (disconnected, restart error, Auto-build error) beyond keeping them working.
- Colours, other than the Auto-build square's green and red, which stay as they are.
- The "ready tickets wait" small print beside Auto-build: its meaning moves into the button's tooltip.

## Notes
- Header markup is in `templates/panel.html`: `.logo`, `.repo`, `#run`, `#run-switch`, `#pills`; the phone rules are in the `max-width: 699.98px` media query (0140). The disconnected banner is `#offline`, set by `setConnected()`.
- The Auto-build switch requests are the same as today (`POST /api/run/on` and `/off`), with the token and Origin checks unchanged.
- Reported 2026-10-13 from a phone screenshot: the light/dark button sat alone on a second line, taller than Auto-build and lower than it.
- Failing before this build: none
- Existing tests changed (AC5): the checks of the live pill and the separate Pause/Start button in 0033, 0040, 0127, 0128, 0134, 0136, 0140 and 0144 now check AC1 and AC2. The browser tests in 0040, 0050, 0051, 0054, 0055, 0060 and 0061 watched the live pill being replaced to know a refresh had happened; they now watch the Auto-build button's square, which is replaced on every refresh in the same way.
- Self-check: a long project name at 700 px and over wrapped and pushed the buttons; it's now cut short with an ellipsis on one line, as on a phone (test added).

## In plain words
The panel's header is tidier. The Auto-build indicator is now the button itself: click it (or press Enter or Space on it) to pause or start Auto-build, and hover over it to see what a click will do. The "live · Ns ago" indicator has gone; if the panel loses its server, the red message under the header still says so. The project name now sits on the right, next to the two buttons, which are the same height and line up.

To see it, open the panel on a computer and on a phone. On a computer everything is on one row. On a phone it's two rows: the speck name and the project on top, Auto-build and the light/dark button below. A very long project name is cut short with "…" rather than squashing the buttons.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 186,978
- Elapsed since build started: 25 min
- Changed lines: 73 (limit 5000)
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
    "reviewed_sha": "da0960df5e2def76e42754c14abe430294b8fdba",
    "thread_id": "01a13740-e30d-7f50-a0f2-ef4e2eb4daaf",
    "seconds": 23,
    "usage": {
      "input_tokens": 186231,
      "cached_input_tokens": 132608,
      "cache_write_input_tokens": 0,
      "output_tokens": 747,
      "reasoning_output_tokens": 56
    },
    "saved_at": "2026-10-13T21:53:04.379Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html removes #pills and preserves setConnected() and #offline. Passing 0150 AC1 tests exercise disconnection and recovery."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "render() updates the single native #run button; switchRun() retains the existing requests and error handling. Passing 0150 AC2 tests cover labels, colours, tooltips, aria-pressed, pending requests, errors, clicks and browser Enter/Space activation."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Header flex styles position the project and buttons on the right. Passing browser tests verify order and vertical alignment at 700 and 1280 px, including a long project name."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The phone media query uses a two-column grid and 44 px buttons. Passing browser tests at 375 px verify both Auto-build states, two-row placement, single-line labels and no overflow."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Passing browser tests verify equal button heights and aligned tops at 375, 699, 700, 1000 and 1280 px. The full test log confirms 1328 passed, zero failed and three skipped. Existing test changes preserve their behavioural checks while replacing the removed controls."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The header meets the requested phone and desktop layouts. Auto-build is one accessible button, connection and action errors remain visible below the header, and long project names stay contained. The tests cover the requested behaviour and report no regressions. Ready for merge."
  }
}
```

</details>
