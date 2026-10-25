---
id: "0505"
title: "Let speck's TVs play tricks while it watches"                # one outcome, no "and"
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
after: ["0504"]                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T22:38:37.501Z"
approved: "2026-10-25T23:33:48.593Z"

---
# 0505 · Let speck's TVs play tricks while it watches

**Status:** 👍 approved

## Problem
After 0504, the TVs only scroll their logs. The user liked the beats where the TVs themselves join in, which make the scene change as well as speck.

## Outcome
speck's TVs play six tricks, and speck reacts to each.

## Acceptance criteria
1. While watching, speck also plays these beats, as the prototype does them (checked by review): the nearest TV goes to snow and speck waggles its own ear while the TV's aerials waggle with it until the picture comes back; a tiny speck on the nearest TV copies speck's every move; the nearest TV flicks over to Pong, with static either side, and speck's eye follows the ball; the nearest TV's picture rolls with a black bar sliding through, and speck tilts to follow it, then wobbles upright; too tense to watch, speck hides behind its clipboard and peeks twice as a bar nears full, then hops when the tick lands; and a drumroll with its feet and `DRRR` as a bar nears full, then `TA-DA`.
2. In the last two, that TV's bar fills and ticks when the beat says, whatever its own pace, and goes back to its own pace afterwards. Each trick happens on one TV only, and the others carry on.
3. Each is picked at random with the other beats, by weight, never the same twice running. No arm reaches beyond its usual length. A step finishing makes speck hop and look, except during these six beats. With reduced motion nothing changes from 0502. No test that passed before this change fails.

## Out of scope
- New beats beyond the prototype's.

## Notes
- The prototype is `docs/design/lcd/watching.html` (open it from that folder; it loads `templates/lcd.js`, and `?beat=<name>` plays one beat on repeat). Agreed with the user on 2026-10-25, also at https://claude.ai/artifact/FsG1NCryHWmFYfP9871Adx. Its timings, sizes and wording are the reference; the builder may tidy its code. Its beats here are `tune`, `mirror`, `pong`, `vhold`, `peek` and `drumroll`.
- Waits for 0504, in the same code.
- Failing before this build: none
- Self-check: hiding behind the clipboard holds it a unit nearer than the prototype, as its arm was 20.4 long against 20.1 in speck's other poses; DRRR and TA-DA sit four units lower, as at the prototype's height TA-DA's rise reached the dotted line at the top of the scene. Four older tests sample longer (0502's beat weights and checklist ticks, 0503's and 0504's every-beat-seen arms tests), as with six more beats each beat is rarer and they failed now and then; 0502's log-then-tick test skips a tick a trick hides.

## In plain words
While speck watches the builds, the TV nearest it now plays tricks too, and speck reacts to each: the picture turns to snow and speck waggles its ear to tune it, with the TV's aerials waggling along; a tiny speck appears on the screen and copies its every move; the TV flicks over to Pong and speck's eye follows the ball; the picture rolls and speck tilts to follow it; speck hides behind its clipboard and peeks as a bar nears full; and speck drums its feet, DRRR, then TA-DA as the tick lands.

To see them, open the panel while speck run is building and watch for a few minutes: each comes up about as often as the other small habits. Only the nearest TV plays a trick; the others carry on with their builds. With reduced motion on, nothing changes.

Worth knowing: in the peek and the drumroll, that TV's bar jumps to nearly full as the trick starts and goes back to where its build really is afterwards, as in the design.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 173,910
- Elapsed since build started: 55 min
- Changed lines: 106 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (Delivery log only, no inbox notes): in the peek and the drumroll, the nearest TV's bar jumps to the trick's near-full bar as it starts and back to its own as it ends, as the prototype does; blending it would be smoother. The watch pose's tests still draw beats with the real Math.random (noted in 0504), and with 24 beats several older tests now sample longer to see each one; seeding Math.random would make them certain and quicker.

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
    "reviewed_sha": "ae3df38a49eccb72a89f2dff90d3be97859efb75",
    "session": "fresh",
    "thread_id": "01a17569-44e6-7e70-8788-a0f88d7dfda5",
    "builder_response": "- Tests run: test/panel-0505.test.mjs, test/panel-0502.test.mjs, test/panel-0503.test.mjs, test/panel-0504.test.mjs, plus what `speck test --related` brought in (test/panel-0433, test/panel-0473, test/panel-0474) and the checks.\n- Round 1. The six TV tricks (tune, mirror, pong, vhold, peek, drumroll) join the other beats in `watchPose` in templates/panel-header.js, from docs/design/lcd/watching.html, with its weights (1 each), durations and timings. Each is `own`, so a step finishing doesn't make speck hop during them.\n- What each TV shows is now worked out per frame in `screens` (its bar `st`, `show`: log, snow, pong or mirror, `wig` for its aerials, `roll` for a rolling picture), and `drawTV` draws it. A trick changes only the nearest TV, the last; the others keep `tvState`. In peek and drumroll the nearest TV's `st` is set by the beat (bar near full, then the tick at k .76 / .7), as the prototype's `fx.force`; outside them it's `tvState` again. `screens` is returned with the frame, for the tests.\n- Tidied from the prototype: hiding behind the clipboard holds it at x 4 rather than 3, because at 3 its arm is 20.4 long against 20.1, the longest in speck's other poses (AC3). DRRR and TA-DA sit at y -56 rather than -60, since TA-DA's rise reached the scene's top dotted line in the panel (as 0503 lowered HIC).\n- AC1 is checked by review: pictures in the review pack, from a real panel in Chromium, the page's own renderer drawn at chosen moments of each trick (light, and three in the dark look). The title row says BUILDING 1 from the real board, while the TVs and caption follow the count I set for each picture.\n- Existing tests changed, without loosening what they check: 0503's two exact lists of beats leave out 0505's six, which 0505's own tests check. 0502's beat-weight and checklist-ticks tests, and 0503's and 0504's arm tests, sample longer, as with six more beats each beat is rarer and they failed now and then (seen in about 1 in 6 runs of the four files before). 0502's log-then-tick test now picks ticks where no trick is playing at the frames it compares, walking forwards so the plan isn't restarted, and checks three of them rather than one. Twelve runs in a row of the four files then passed.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 173142,
      "cached_input_tokens": 120448,
      "cache_write_input_tokens": 0,
      "output_tokens": 768,
      "reasoning_output_tokens": 37
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-25T23:33:37.769Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Compared watchPose and drawTV in templates/panel-header.js with the six corresponding branches and TV rendering in docs/design/lcd/watching.html. Timings, movements, static, Pong, rolling picture, two peeks and wording match. The clipboard and text positioning adjustments satisfy the arm-length and scene bounds constraints."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "watchPose overrides only the nearest TV's state during peek and drumroll, ticking at .76 and .7 respectively; other TVs retain tvState throughout. The two passing 0505 AC2 tests exercise forced progress, restoration of normal pace and isolation across TVs."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "BEATS gives each trick weight 1 and own:true; beatAt excludes the previous beat when choosing. Passing 0505 AC3 tests cover selection, arm lengths, scene bounds, suppressed completion reactions and reduced motion. Existing test changes accommodate the additional beats without weakening their assertions. The recorded run reports 152 passed, 3 skipped and no failures."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The six TV tricks follow the prototype, affect only the nearest TV and leave the others running normally. Progress and reactions are synchronised for the suspense beats, and reduced motion remains unchanged. The tests cover the key behaviours and report no failures. No blocking concerns found."
  }
}
```

</details>
