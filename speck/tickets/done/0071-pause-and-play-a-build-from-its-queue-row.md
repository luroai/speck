---
id: "0071"
title: Toggle a build between paused and playing from its queue row                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0069", "0070"]                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T22:30:17.959Z"
finished: "2026-10-09T22:39:17.030Z"

---
# 0071 · Toggle a build between paused and playing from its queue row

**Status:** ✅ done

## Problem
Pausing and playing a build from the CLI (0070) means leaving the panel, where the user is watching the build, for a terminal.

## Outcome
Each running build in the queue has a pause icon on the left of its row, which turns into a play icon while it's paused.

## Acceptance criteria
1. A `building` or `reviewing` ticket in the queue whose build `speck run` launched and is running shows a pause icon in the space on the left of its top row, and one that's paused shows a play icon there instead. Other queue tickets show no icon there. Each icon's hover text says what it does ("Pause build" or "Play build").
2. Clicking the pause icon pauses the build exactly as `speck pause <id>` does, and clicking the play icon plays it exactly as `speck play <id>` does. Clicking either opens or closes nothing.
3. The server accepts the pause and play requests only with the same `Origin` and `X-Speck-Token` checks as Set ready; anything else gets 403 and changes nothing. When the server refuses, the reason shows under the row's top row until the next click on the icon.
4. A paused ticket's dot of light stops moving and its row shows "Paused" beside the counter, until it's played.

## Out of scope
- The stop button (0073).

## Notes
- After 0069, which changes the same row, and after 0070, which does the pausing and playing.
- The space on the left is the empty `rank` span in `queueItem` in `templates/panel.html`.
- product.md's Queue description needs updating.
- product.md was removed in 0068, so the README's `speck pause` row says what the panel's icon does instead.
- `speck status --json` gains `build_running` for each ticket, so the page knows which builds speck run launched are running, as `speck pause` sees them.
- Self-check: no changes to the code; added a test that a second click on the icon before the first is answered sends nothing more.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 330,540
- Elapsed since build started: 7 min
- Changed lines: 121 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (no inbox notes: each is a known limit):
- Known limit: a refusal stays under the row until the next click on the icon, as criterion 3 asks, so once the build has ended and the icon has gone it stays until the page is reloaded.
- Known limit: after a click works, the icon changes at once; a state poll already on its way when the click was answered can show the old icon until the next poll, up to 2 seconds later.

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
    "reviewed_sha": "ed8364eb50a626e49a61bfef394529e624a457b5",
    "thread_id": "01a122d0-33b1-7df2-a396-ce856c3420e2",
    "seconds": 26,
    "usage": {
      "input_tokens": 329772,
      "cached_input_tokens": 237568,
      "cache_write_input_tokens": 0,
      "output_tokens": 768,
      "reasoning_output_tokens": 70
    },
    "saved_at": "2026-10-09T22:37:37.781Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs buildRunning/statusData identify live process-group leaders with no recorded exit. templates/panel.html panelModel and toggleIcon restrict icons to building/reviewing tickets and supply the correct hover text. test/panel-0071.test.mjs AC1 tests exercise icon eligibility and actual CLI JSON."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelPausePlay calls pauseBuild/playBuild, the same functions used by cmdPause/cmdPlay. toggleIcon stops click propagation; toggleBuild prevents duplicate pending requests. AC2 tests check real process stopping/resuming, CLI interoperability, refusal messages, duplicate clicks and open/closed row preservation."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelServer applies the identical Origin and sameToken checks used by Set ready before invoking pause/play. toggleRefused persists errors beneath the top row until another icon click. AC3 tests exercise invalid/missing credentials, unchanged process and marker state, and error persistence across refreshes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "queueItem removes the moving class while paused; queueCounter and tickCounters preserve the Paused label beside the counter. AC4 tests exercise paused motion, timer updates and playing again."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The queue icons use the same pause and play controls as the CLI, preserve whether the row is open, and show refusals and paused state correctly. Meaningful tests cover all four criteria, including real process signals and request security. I found no blocking issues. The builder reports all 559 tests passing; I inspected the code and tests but did not rerun tests because they write temporary files in this read-only environment."
  }
}
```

</details>
