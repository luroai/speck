---
id: "0503"
title: "Give speck small habits while it watches"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0502"]                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T21:49:17.209Z"
approved: "2026-10-25T22:14:51.240Z"

---
# 0503 · Give speck small habits while it watches

**Status:** 👍 approved

## Problem
After 0502, speck has three things to do while it watches. Over a long build it would still repeat itself often.

## Outcome
speck has eight small habits to mix in while it watches.

## Acceptance criteria
1. While watching, speck also plays these beats, as the prototype does them (checked by review): popcorn from a bucket in its free hand, tossed up into the gap at the top of its head; checking the clock in the top right of its own screen, with a `!`; a yo-yo on a string from its free hand; humming along with notes drifting up; following a speck of dust that lands on its ear; a sneeze, with `ACHOO`, a burst of dust and flapping ears; nodding off, until a build finishing makes it jump; and three hiccups, each with `HIC`, then a sheepish look round.
2. Each is picked at random with 0502's beats, by weight, never the same twice running, and blends in and out of the resting pose as they do. No arm reaches beyond its usual length, and nothing a beat draws goes outside the scene.
3. A step finishing makes speck hop and look, as 0502 has it, except while it's nodding off, sneezing or hiccupping, which have their own reactions. With reduced motion nothing changes from 0502. No test that passed before this change fails.

## Out of scope
- 0504's comic moments and 0505's TV tricks.

## Notes
- The prototype is `docs/design/lcd/watching.html` (open it from that folder; it loads `templates/lcd.js`, and `?beat=<name>` plays one beat on repeat). Agreed with the user on 2026-10-25, also at https://claude.ai/artifact/FsG1NCryHWmFYfP9871Adx. Its timings, sizes and wording are the reference; the builder may tidy its code. Its beats here are `popcorn`, `clock`, `yoyo`, `hum`, `mote`, `sneeze`, `doze` and `hiccup`.
- Waits for 0502, which adds the beats these join, in the same code.
- Failing before this build: none
- Self-check: the beats' writing and notes sit a little lower than the prototype's (HIC, z, the hummed notes) and the sneeze no longer sinks below the floor, so nothing a beat draws goes outside the scene; no other changes.

## In plain words
While builds run, speck now has eight more little things it does between watching its TVs: eating popcorn, checking the clock, playing with a yo-yo, humming, following a speck of dust, sneezing, nodding off and getting the hiccups. They come up at random, mixed in with what it did before, so a long build repeats itself much less.

To see it, open the panel while speck run is building and watch the screen for a minute or two. With reduced motion on, nothing changes: it still shows one still picture of speck beside the TVs.

Worth knowing: when speck wakes with a jump from nodding off, that's part of the act, not a sign that a real build just finished.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 217,793
- Elapsed since build started: 26 min
- Changed lines: 89 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (Delivery log only, none to the inbox):
- Nodding off ends with a jump at a fixed point in the beat, as in the prototype, rather than when one of the TVs actually shows a tick. It could be timed to the next tick, if that matters.
- The writing and notes the habits draw sit a few units lower than in the prototype, so they stay inside the scene; the prototype could be updated to match.

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
    "reviewed_sha": "00e0b9fc4e0d53804964fbd8f76b9d947ccfbe06",
    "session": "fresh",
    "thread_id": "01a17520-df42-75d0-808d-f0803e88d60b",
    "builder_response": "- Tests run: test/panel-0503.test.mjs, test/panel-0502.test.mjs, plus what `speck test --related` brought in (test/panel-0433, test/panel-0473, test/panel-0474) and the checks.\n- Round 1. The eight habits (popcorn, clock, yoyo, hum, mote, sneeze, doze, hiccup) join 0502's beats in `watchPose` in templates/panel-header.js, from docs/design/lcd/watching.html, with its weights, durations and wording. Doze, sneeze and hiccup are marked `own` (with read), so a step finishing doesn't make speck hop during them. The free hand reaches out from the left shoulder for the popcorn bucket and the yo-yo, blended in with the beat.\n- Tidied from the prototype, so nothing a beat draws goes outside the scene (the panel clips it, but AC2 asks for it not to be drawn there): the HIC, the doze's z and the hummed notes sit a few units lower, and the sneeze no longer pushes speck 1 unit below the floor. The prototype's unused handWorld path is left out.\n- AC1 is checked by review: pictures in the review pack, from a real panel in Chromium at 390 px, one of each habit (light) and popcorn in the dark look. The live Foreman was shipping while I took them, so they show one TV; the mote picture shows three.\n- Two of 0502's tests named only 0502's three beats, and fail once more beats exist: the beat-set check now asks that scan, read and lean are each among the beats seen (0503's own test checks the full set), and the hop test skips every `own` beat, not only read (0503's own test checks the hop and its exceptions for the new beats). Neither change loosens what 0502 checks about its own beats. AC3's \"no test that passed before fails\" is otherwise left to `speck ship`'s full run.\n",
    "seconds": 30,
    "usage": {
      "input_tokens": 217003,
      "cached_input_tokens": 134656,
      "cache_write_input_tokens": 0,
      "output_tokens": 790,
      "reasoning_output_tokens": 43
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-25T22:14:41.055Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Reviewed the eight habit branches in templates/panel-header.js watchPose.pose against docs/design/lcd/watching.html. They preserve the prototype's actions, timings, props and wording, with the documented positioning adjustments to keep drawings inside the scene."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "watchPose.BEATS and beatAt provide weighted random selection without consecutive repeats. Three passing AC2 tests in test/panel-0503.test.mjs exercise selection, blending, arm lengths and rendered bounds without the scene clip."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "watchPose.pose retains the finishing-step hop and look, excluding beats marked own. Both AC3 tests pass, covering the new habits' exceptions and reduced-motion stillness. Verified the recorded run: 138 passed, zero failed, three skipped. The changes to test/panel-0502.test.mjs accommodate additional beats while preserving checks for the original behaviours."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Speck now mixes eight small habits into its watching animation, matching the agreed prototype. The tests cover transitions, scene boundaries, step reactions and reduced motion, and the recorded run has no failures. No blocking concerns found."
  }
}
```

</details>
