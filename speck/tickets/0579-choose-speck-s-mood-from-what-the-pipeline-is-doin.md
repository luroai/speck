---
id: "0579"
title: "Choose speck's mood from what the pipeline is doing"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0578"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T18:54:00.698Z"

---
# 0579 · Choose speck's mood from what the pipeline is doing

**Status:** 🔍 reviewing

## Problem
speck's face should say what the pipeline is doing at a glance, as the LCD's speck did, but with the new character's six moods.

## Outcome
speck's mood follows the pipeline wherever its face appears for the whole pipeline.

## Acceptance criteria
1. A function gives speck's mood from the board: asleep while speck run is off, asking while anything needs you, focused while a build is building, reviewing or shipping, and watching while it's idle or waiting.
2. For 10 seconds after speck takes a recommendation or a ticket ships, the mood is pleased, then returns to the one above.
3. Wherever speck's face is shown beside one ticket whose criteria changed (0565), that face is sheepish.
4. When the mood changes, the visor eases from one shape to the next rather than jumping.
5. No test that passed before this change fails.

## Out of scope
- Where the faces are shown, which the tickets for the bar, Decided for you and the log decide.

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today the status word comes from `foremanView` in `scripts/foreman.mjs` and `foremanOf` in `templates/panel.js`.
- Relies on nothing outside this repo.
- Failing before this build: none
- `test/speck-face-0578.test.mjs` requires that `speck-face.js` runs no timers or animation frames, and AC5 keeps that test as it is, so the frame-by-frame easing and the 10-second timer are in a new `templates/speck-mood.js`.
- Self-check: no changes

## In plain words
Nothing looks different yet. speck can now work out its mood from what the pipeline is doing: asleep when Auto-build is off, asking when something needs you, focused while work is building, in review or shipping, and watching otherwise. It looks pleased for 10 seconds after a ticket ships or it takes a recommendation, looks sheepish beside a ticket whose criteria changed, and its red light glides from one mood to the next. You'll see this once the black bar and the other new views put speck's face on the page.

Worth keeping an eye on: pleased only shows for things that happen while the panel is open, so a ticket that shipped before you opened it won't set it off.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
Follow-ups:
- 0580 and the other tickets that show the face need to load `speck-mood.js` after `speck-face.js` in `templates/panel.html`, and use `SpeckMood.watcher`, `SpeckMood.change` and `SpeckMood.beside`. No idea note: skipped as covered by ticket 0580 (criterion 1, speck in its current mood).

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
    "reviewed_sha": "a32c8c9512f7e7deb88621ec0651e5e3807076b7",
    "session": "fresh",
    "thread_id": "01a1c1af-7708-7923-ba11-d4f76667f309",
    "builder_response": "- Tests run: test/speck-mood-0579.test.mjs, test/speck-face-0578.test.mjs and every related test file `speck test --related` chose (19 files, listed at the top of the output).\n- AC5: the whole suite runs in `speck ship`, not during the build. The related run has no failures.\n- Where the code lives: `test/speck-face-0578.test.mjs` requires that `templates/speck-face.js` has no requestAnimationFrame, setTimeout or setInterval. AC5 keeps that test unchanged, so `speck-face.js` has only a plain `setMood` (with an optional ease callback), and the easing and the 10-second timer are in the new `templates/speck-mood.js`. Easing respects prefers-reduced-motion.\n- Scope: the ticket puts where faces are shown out of scope, so nothing on the page calls these yet and panel.html loads neither script. The panel serves `/speck-mood.js` and sends `mood` in /api/state, ready for 0580 and the later tickets.\n- \"Needs you\" uses projectSummary's count (questions, the manager's questions and tickets waiting at Ship), the one 0580's bar and the bridge use, which is wider than the status word's count.\n- Pleased is worked out from what's new between states, because a taken recommendation's recorded time is only to the minute, so a time-based 10-second window can't be exact.\n",
    "seconds": 31,
    "usage": {
      "input_tokens": 150602,
      "cached_input_tokens": 106496,
      "cache_write_input_tokens": 0,
      "output_tokens": 735,
      "reasoning_output_tokens": 60
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 44106,
      "cached": 106496,
      "write": 0,
      "output": 735
    },
    "cost_usd": 0.1062116,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T19:01:35.040Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/panel-summary.mjs speckMood implements the priority order. AC1 tests exercise off, attention, building, reviewing, shipping and waiting states using foremanView; the panel endpoint test verifies mood delivery."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/speck-mood.js watcher detects newly observed shipments and taken recommendations, resets the 10-second timer and returns to the latest base mood. AC2 tests cover both events, timer replacement and ongoing shipping."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "SpeckMood.beside returns sheepish for criteria_changed === true. The AC3 test exercises changed and unchanged tickets. Face placement is explicitly outside this ticket."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "SpeckMood.change and ease interpolate visor geometry through SpeckFace.setMood. AC4 tests verify intermediate shapes, completion, interrupted transitions and reduced motion."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The supplied test log records 296 passes, zero failures and three skips across 19 related files, including the unchanged 0578 face tests. No regression is evident in the reviewed change."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The mood logic matches pipeline activity, adds a ten-second pleased reaction and supports smooth visor changes. The related tests pass. These functions are ready for the later tickets that place the face on the page."
  }
}
```

</details>
