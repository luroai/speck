---
id: "0163"
title: "Show the running build in the Auto-build button"                # one outcome, no "and"
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
after: ["0161","0168"]                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T16:25:26.868Z"
approved: "2026-10-14T16:47:31.616Z"

---
# 0163 · Show the running build in the Auto-build button

**Status:** 👍 approved

## Problem
The header is the only part of the panel that's always on screen, but the Auto-build button only says "Auto-build on" or "off". To see what's being built and where it's got to, the user has to scroll to the Build section, which on a phone is below the whole Plan section.

## Outcome
While a build is running, the Auto-build button says which ticket and which stage, with the speck pulsing, so progress is visible from anywhere on the page.

## Acceptance criteria
1. While Auto-build is on and a ticket is building or reviewing, the button reads "Building <id> · <stage>" (for example "Building 0151 · Review"), with the stage named as in the Build card (Build, Self-check, Review, Approve, Ship).
2. While Auto-build is on and nothing is in flight, it reads "Auto-build on"; while it's off, "Auto-build off", as today. When the build waits for the user (approved and not covered by auto-ship, or blocked), it reads "<id> needs you" in the state's colour (purple or red).
3. In place of the square, the button shows the builder from 0168's badge at about 28 px, without its tile: bouncing gently while a build is running, still and facing front otherwise. With `prefers-reduced-motion: reduce` it never moves.
4. Clicking the button still pauses or starts Auto-build exactly as today, and its tooltip still says what a click will do. The label never wraps or overflows at a viewport 375 px wide; a long label is shortened with "…" and given in full in the tooltip.
5. No test that passed before this change fails.

## Out of scope
- Showing more than one in-flight ticket in the header: it names the first one in the Build queue's order.
- Notifications.

## Notes
- Builds after 0161, as both change the header's styles, and after 0168, which draws the builder.
- Failing before this build: none
- Self-check: no changes. The stage drops the review round's number ("Review", not "Review 2"), as the criterion lists the five names. A stopped build and a failed auto-ship also read "<id> needs you" in red, as their cards are red. A paused build reads "Building <id> · <stage>" with the builder still.
- The Build card's stage names come from `progress()` in `templates/panel.html`; the speck pulse should match the one 0156 added.

## In plain words
The Auto-build button at the top of the panel now says what's happening. While a ticket is being built it reads, for example, "Building 0151 · Review", with speck's little builder hopping beside it. When a ticket is waiting for you it reads "0158 needs you", in purple if it's ready to ship and in red if it's blocked or its build stopped. With nothing going on it still says "Auto-build on" or "off", and clicking it still pauses or starts Auto-build.

To see it, turn Auto-build on and let a ticket build: the button follows it from anywhere on the page, on a phone too. Hover over the button to see the full label and what a click will do. On a narrow screen, a long label ends in "…".

Worth keeping an eye on: when more than one ticket is in flight, the button names only the first in the Build list. If your device asks for reduced motion, the builder stays still.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 111,491
- Elapsed since build started: 22 min
- Changed lines: 68 (limit 5000)
- Follow-ups:
  - Skipped as a duplicate: during this build, two server-side tests (0128 AC3 and 0148 AC2) each failed once in a full-suite run with "speck run has stopped" and passed when run again. This matches speck/ideas/2026-10-13-stop-tests-checking-speck-run-stopped-too-soon.md.
  - Tidy-up: the old tests for 0140, 0144 and 0150 now check for the builder where they checked for the green or red square. 0163 AC3 replaces the square.

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
    "reviewed_sha": "788f92947d9ef880499aa4351103c9042991583b",
    "thread_id": "01a13b4f-4078-7be2-9cb4-898ae0d3b595",
    "seconds": 27,
    "usage": {
      "input_tokens": 110849,
      "cached_input_tokens": 67200,
      "cache_write_input_tokens": 0,
      "output_tokens": 642,
      "reasoning_output_tokens": 42
    },
    "saved_at": "2026-10-14T16:47:19.010Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html runLabel() uses the Build queue and progress() stage labels, removing review round numbers. Passing panel-0163 tests exercise Build, Self-check, Review, paused builds, Ship and queue ordering."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "runLabel() and render() preserve idle/on/off labels and show waiting tickets in purple or red. Passing panel-0163 AC2 tests exercise idle, off, approved, blocked and stopped states."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "BADGE.bare(), paintBadge() and drawBadges() draw the existing builder without its tile at 28 px. Passing drawing and real-browser tests verify gentle movement, front-facing stillness and reduced-motion behaviour."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "render() preserves the button and click handler, supplies the full label and click action in its tooltip, and applies ellipsis styling. Passing interaction and real-browser tests verify toggling and both header layouts at 375 px."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0163-tests.txt: 1608 tests, 1605 passed, zero failed and three skipped. All 13 ticket-specific tests passed, including browser tests. Existing square assertions were updated to reflect the explicitly requested builder replacement."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The Auto-build button now shows the current ticket and stage, highlights tickets needing your attention, and displays an animated builder. Phone layouts and reduced-motion settings are covered by passing tests. No blocking issues found."
  }
}
```

</details>
