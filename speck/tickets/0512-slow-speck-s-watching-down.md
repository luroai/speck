---
id: "0512"
title: "Slow speck's watching down"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: []                # ticket ids that must be done first
created: 2026-10-26
started: "2026-10-26T10:29:20.829Z"
approved: "2026-10-26T10:47:30.506Z"

---
# 0512 · Slow speck's watching down

**Status:** 👍 approved

## Problem
While builds run, speck plays one watching beat straight after another, each 3.5 to 7 seconds long, with no plain watching in between. It hops whenever any TV's bar fills, and each bar fills every 10 to 18 seconds, so with three builds it hops every few seconds. The user, watching 0.16.0: "The cycling of the animations happens too quickly. It makes it look like Speck has ADHD."

## Outcome
speck mostly sits and watches, calmly, and its beats and comic moments come now and then, so each one still surprises.

## Acceptance criteria
1. Between one beat and the next, speck spends a quiet spell of plain watching, picked at random between 15 and 35 seconds: it breathes, blinks and watches one build's TV at a time, moving on to the next about every 6 seconds. Beats keep their own lengths.
2. The comic moments and TV tricks (bubble, spider, balance, dance, tune, mirror, pong, vhold, peek and drumroll) come at most once every 2 minutes, and the other beats fill the rest. No beat comes again until at least 5 others have played.
3. Each TV's bar takes between 20 and 40 seconds to fill. When one fills, speck turns its eye to that TV, and hops only if it hasn't hopped in the last 30 seconds.
4. The 2-minute watch and 1-minute pastime rhythm (0436), what each beat does, and reduced motion are unchanged. No test that passed before this change fails.

## Out of scope
- New beats, or changing what any beat does.

## Notes
- Asked for by the user on 2026-10-26.
- Today: `BEATS` and `beatAt` in `templates/panel-header.js` (0502 to 0505) pick beats back to back, never the same twice running; `period` there sets each TV's bar at 10 to 18 seconds; the step-finished hop is under "a bar filling".
- Failing before this build: none
- The numbers are a first setting, to tune by watching it: the prototype `docs/design/lcd/watching.html` shows the beats themselves.
- Old tests: the tests of 0502 to 0505 check the old rhythm as well as what each beat does (bars of 10 to 18 seconds, beats back to back, a hop at every bar, comic moments as common as habits, and windows sized for that). Their `watching()` helpers now set the rhythm from before 0512 (`test/support/watch-rhythm.mjs`), so they still check what each beat does, unchanged; this ticket's tests check the new rhythm. No assertion in them was changed.
- Self-check: a frame now says which TV speck hops at (`hop`), as a beat's own wide eye looked like a hop to the test; hop decisions are made when a bar filling is seen, so a beat with its own reaction ending just as a bar fills still lets it hop.
- Pictures: none, because the change is to timing only: any one frame looks as it did before.

## In plain words
While builds run, speck now mostly sits and watches. After each little thing it does, it spends 15 to 35 seconds just watching, breathing and blinking, and moves its gaze from one TV to the next about every 6 seconds. The comic moments and TV tricks come at most once every two minutes, and nothing comes round again until five other things have played, even after a cup of tea or a game of chess. Each TV's bar now takes 20 to 40 seconds to fill, and speck hops at most once every 30 seconds; otherwise it just looks over at that TV.

To see it, open the panel while a build runs and watch speck for a few minutes. The numbers are a first setting: if it now feels too still, or still too busy, they're easy to tune.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Returning from a pastime clears the recent-beat history, so scan can repeat before five other beats have played.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 621,637
- Elapsed since build started: 18 min
- Changed lines: 83 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - With three builds, speck's eye looks the same at the two TVs furthest from it, so its turn from one to the other at rest doesn't show. Inbox: `speck/ideas/2026-10-26-let-speck-s-eye-tell-the-two-far-tvs-apart.md`.
  - Tidy-up: the prototype `docs/design/lcd/watching.html` still plays beats back to back with 10 to 18 second bars; worth bringing in line when it's next used to tune the rhythm.
  - The changelog's 0.16.0 section describes the old rhythm ("does something different every few seconds"); the next release's notes should say speck now mostly sits and watches.

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
    "reviewed_sha": "078f7ceaf0662bb094799a1fcab0ff5a21c021a6",
    "session": "fresh",
    "thread_id": "01a177cd-9554-7443-85df-0eb501783208",
    "builder_response": "- Tests run: test/panel-0512.test.mjs test/panel-0502.test.mjs test/panel-0503.test.mjs test/panel-0504.test.mjs test/panel-0505.test.mjs, with --related (which added panel-0433, 0473 and 0474) and the commands.checks files.\n- Round 1. The rhythm is one object (`rhythm` in watchPose, defaults in `RHYTHM`). The tests of 0502 to 0505 asserted the old rhythm itself (bars of 10 to 18 s, beats back to back, a hop at every bar, comic moments as frequent as habits, sampling windows sized for that), which AC1 to AC3 replace. Their `watching()` helpers now call `parts.setRhythm(BEFORE_0512)` (test/support/watch-rhythm.mjs), so every one of their assertions is unchanged and still checks what each beat does (AC4). The new tests check the new rhythm. Their reduced-motion test (0502 AC4) runs at the new default rhythm, unchanged.\n- The quiet spell is a `watch` entry in the plan, not in BEATS, so BEATS's keys are as before.\n",
    "seconds": 50,
    "usage": {
      "input_tokens": 255439,
      "cached_input_tokens": 206336,
      "cache_write_input_tokens": 0,
      "output_tokens": 1379,
      "reasoning_output_tokens": 102
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-26T10:42:53.496Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "watchPose.beatAt inserts random 15–35 second watch entries; the two passing 0512 AC1 tests cover quiet durations, breathing, TV focus and unchanged beat lengths. Blinking remains in templates/lcd.js."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "templates/panel-header.js beatAt resets all history when pose time goes backwards. LCD.Cast restarts pose time after each pastime. With Math.random fixed at 0.5, the first watch plays scan, doze, hiccup and sneeze; returning from the pastime repeats scan after only three other beats. The passing AC2 test samples an uninterrupted pose and misses this."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "watchPose.period and hopsAt implement the new bar periods and hop cooldown. Three passing 0512 AC3 tests exercise bar filling, attention and allowed/suppressed hops."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "speckRests retains the 120-second watch/60-second pastime cycle. Beat implementations are unchanged; existing 0502–0505 assertions exercise them with the previous timing. The new reduced-motion test passes. Reported validation: 159 passed, zero failed, three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-header.js",
        "issue": "Returning from a pastime clears the recent-beat history, so scan can repeat before five other beats have played. The same reset also clears the comic cooldown, allowing comic moments less than two minutes apart across watch sessions. Current timing tests bypass the actual watch/pastime transitions.",
        "suggested_fix": "Keep recent-beat history and comic cooldown across watch/pastime transitions, using elapsed time that survives pose restarts. Add a test exercising multiple real watch/pastime cycles and checking the five-beat exclusion and two-minute comic spacing across their boundaries.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The slower timing works during uninterrupted watching, and the reported tests pass. However, each return from a pastime forgets which beats just played and resets the comic cooldown. Preserve that history across pauses before merging."
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
    "reviewed_sha": "915d4cd087e38cdea8720cb2ed5e67cd4ab5e7a3",
    "session": "continued",
    "thread_id": "01a177cd-9554-7443-85df-0eb501783208",
    "builder_response": "- Tests run: test/panel-0512.test.mjs test/panel-0502.test.mjs test/panel-0503.test.mjs test/panel-0504.test.mjs test/panel-0505.test.mjs, with the commands.checks files.\n- F1: fixed. `fresh(was, t)` in templates/panel-header.js: when the watch pose starts again (its time going back, as when the cast comes back from a pastime), the new plan keeps the last `again` beats played (`before`, used with the plan's own beats for the five-beat rule), and its last comic moment and last hop, shifted so that only time spent watching counts (from the time it starts again at, so the cast's 200 ms start isn't lost). A plan started again begins with a quiet spell rather than scan, as scan may be among the last five. A first watch, or the pre-0512 rhythm the old tests use, starts as before. New test \"0512 AC2: across speck's pastimes too…\" drives the real LCD.Cast through 40 two-minute watches and one-minute pastimes (including the frames that fade the watch pose out) and checks the five-beat rule and two minutes of watching between comic moments across them; it fails with the old reset.\n",
    "seconds": 19,
    "usage": {
      "input_tokens": 362899,
      "cached_input_tokens": 307584,
      "cache_write_input_tokens": 0,
      "output_tokens": 1920,
      "reasoning_output_tokens": 132
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-26T10:47:05.805Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-header.js: RHYTHM, beatAt and pose provide random 15–35 second quiet spells, six-second TV focus and breathing, while retaining beat durations. Blinking remains in templates/lcd.js. Both 0512 AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "watchPose.fresh now carries recent beats and comic cooldown across pose restarts; beatAt excludes the last five beats and enforces comic spacing. Both AC2 tests passed, including 40 watch/pastime cycles through LCD.Cast with transition frames."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "watchPose.period sets 20–40 second bar periods; pose directs attention at filled bars, and hopsAt enforces the 30-second hop cooldown. All three AC3 tests passed. fresh also preserves the hop cooldown across restarts."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "speckRests retains the two-minute watch/one-minute pastime cycle, and beat implementations remain unchanged. Existing 0502–0505 tests retain their assertions using the previous rhythm. The reduced-motion test passed. Reported validation: 145 passed, zero failed, three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-header.js",
        "issue": "Watch/pastime transitions previously cleared recent-beat history and comic cooldown.",
        "suggested_fix": "Implemented: preserve recent beats and cooldowns across pose restarts, with a regression test covering repeated LCD.Cast transitions.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The slower watching rhythm now preserves its memory across pastime breaks, preventing early beat repeats and overly frequent comic moments. All criteria pass, and the reported tests have no failures. Ready for the product owner to consider merging."
  }
}
```

</details>
