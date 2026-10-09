---
id: "0055"
title: "Show motion on an in-flight ticket's progress bar"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-09-show-motion-on-queue-progress-bars.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T19:08:34.622Z"

---
# 0055 · Show motion on an in-flight ticket's progress bar

**Status:** 👍 approved

## Problem
The bars in the panel's Queue only change when a ticket moves to another step, which can take many minutes. Meanwhile the panel looks frozen, so the user can't tell a build is still working.

## Outcome
The current step of a ticket that's being built or reviewed shows a moving dot of light, so the queue looks alive while agents work.

## Acceptance criteria
1. A ticket whose status is `building` or `reviewing`, and that isn't red, shows a dot of light moving side to side, without stopping, within its bar's current step only.
2. No other ticket shows it: not `ready` (Queued), `blocked` or `approved` tickets, and not a red `building` or `reviewing` ticket (one with a `build_exit`).
3. When the browser asks for reduced motion (`prefers-reduced-motion: reduce`), no dot moves and the bars look as they do today.
4. The motion doesn't restart or jump on the 2-second refresh while the ticket's data is unchanged, and text selected in the row stays selected as it does today.

## Out of scope
- Real progress: the dot means "in flight", not how far along the step is. Live agent activity is a later idea in `speck/ideas/2026-10-08-speck-board.md`.
- Changing the steps, their labels or colours (0034).
- Motion anywhere outside the queue.

## Notes
- Builds on the five-step bars from 0034 (done); bars are drawn by `queueItem` in `templates/panel.html`.
- Which tickets move, current step only, and reduced motion respected: defaults chosen while ticketing from the idea's open questions, to confirm before ready.
- product.md's Queue description needs updating.
- Checked 2026-10-09: `prefers-reduced-motion: reduce` is the standard CSS media feature for reduced motion (MDN, Media Queries Level 5).
- Self-check: no changes

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 290,270
- Elapsed since build started: 4 min
- Changed lines: 11 (limit 5000)
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
    "reviewed_sha": "39d0f9098d50c051da5493da805e9794f315142b",
    "thread_id": "01a12214-6b1f-7d03-bc49-b13a78feaa87",
    "seconds": 29,
    "usage": {
      "input_tokens": 289565,
      "cached_input_tokens": 207360,
      "cache_write_input_tokens": 0,
      "output_tokens": 705,
      "reasoning_output_tokens": 21
    },
    "saved_at": "2026-10-09T19:12:35.066Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html queueItem adds moving only to the current step of non-red building/reviewing tickets. CSS sweep alternates infinitely within that step. test/panel-0055.test.mjs AC1 and the real-browser test exercise eligibility, movement and bounds; supplied results pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "queueItem excludes other statuses and red tickets. The AC2 test exercises ready, blocked, approved and both building/reviewing with build_exit; supplied results pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "All dot styling and animation sit within prefers-reduced-motion: no-preference. The real-browser test emulates reduce and checks zero animations, no pseudo-element content and unchanged step geometry; supplied results pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Existing keptItems and queueUpdate preserve unchanged rows and their steps. AC4 checks node identity while another ticket changes; the real-browser test checks animation identity, advancing animation time and retained text selection across two refreshes. Supplied results pass."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "The Queue description accurately documents eligibility, continuous motion, refresh preservation and reduced-motion behaviour. Changes remain within scope."
    },
    "escalation_question": "",
    "summary": "The current step now shows a moving light while a build or review is running. Stopped and other tickets remain still, reduced-motion preferences are respected, and refreshes preserve animation and selected text. Code and test coverage support all four criteria. I inspected the repository; tests were assessed from their code and supplied passing output, without rerunning tests that create temporary files."
  }
}
```

</details>
