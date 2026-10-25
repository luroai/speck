---
id: "0502"
title: "Give speck a TV for each build to watch"                # one outcome, no "and"
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
after: ["0452"]                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T21:37:40.384Z"

---
# 0502 · Give speck a TV for each build to watch

**Status:** 🔍 reviewing

## Problem
While builds run, speck spends most of its time in the watching pose, and today that pose is one 7.2-second loop: glance about, read the clipboard, tick a line. Watched for minutes at a time, it repeats, and nothing on the screen shows what speck is watching.

## Outcome
speck watches a little retro TV for each build, and does something different every few seconds while it does.

## Acceptance criteria
1. While speck watches (the screen's word is `Building <n>` or `Shipping …`), the scene shows a retro TV for each build, up to three, to speck's left, and one while shipping: a box with rounded corners, a curved screen, two dials and a speaker grille on its right, rabbit-ear aerials on top and two short legs, all three fitting beside speck at every width from 320 px. Checked in a real browser at 390 px with 1, 2 and 3 builds.
2. Each TV's screen scrolls a log, its newest line being typed, over a progress bar that fills at its own pace, between about 10 and 18 seconds. When a bar fills, the screen shows a tick, drawn in, for about a second, and starts again. Whenever that happens, speck hops and turns to look at that TV, unless the beat it's in has its own reaction.
3. speck stands to the right of the TVs with its clipboard. Between beats it breathes, blinks and watches one TV at a time, moving on every few seconds. It plays one beat after another, each 3.5 to 7 seconds long, picked at random by weight and never the same twice running, each blending in and out of that resting pose. This ticket's beats: keeping an eye on the builds, ticking a line off the checklist (the ticks add up to four, then a fresh page), and leaning in for a closer look, as the prototype does them (checked by review).
4. No arm reaches beyond its usual length, in any beat. The 2-minute watch and 1-minute pastime rhythm (0436), the captions, the other poses and the blends between them work as before. With reduced motion, the screen holds one still frame of speck watching beside the TVs.
5. No test that passed before this change fails.

## Out of scope
- The other beats (0503, 0504, 0505).
- Showing a build's real progress on its TV: the log and bar are decoration.

## Notes
- Asked for by the user on 2026-10-24 and 2026-10-25: "a new watching animation … this is the one state that you're mainly going to see Speck doing … multiple elements so it gives the impression that it isn't repetitive", the computer to "look more like a retro machine or tv box to go with the dot matrix retro theme", and "nothing with extending arms".
- The prototype is `docs/design/lcd/watching.html` (open it from that folder; it loads `templates/lcd.js`, and `?beat=<name>` plays one beat on repeat). Agreed with the user on 2026-10-25, also at https://claude.ai/artifact/FsG1NCryHWmFYfP9871Adx. Its timings, sizes and wording are the reference; the builder may tidy its code.
- Waits for 0452, so the animation goes in 0.16.0 rather than half of it in 0.15.0 (decided with the user on 2026-10-25).
- Failing before this build: none
- Self-check: a beat asked for before the pose's start (a negative time) no longer fails; the three-TV row sits 1 unit further left than the prototype's, so speck's lean never touches the nearest TV by a dot.
- Today: `watchPose` and `speckPoses` in `templates/panel-header.js` (0414), the rhythm in `speckRests`, and the screen code in `templates/lcd.js`.

## In plain words
While builds run, speck now stands beside a little retro TV for each build (up to three, or one while something ships). Each TV scrolls a pretend log over a progress bar, and shows a tick when the bar fills, at which speck hops round to look. In between, speck keeps an eye on the TVs, ticks lines off its clipboard (four, then a fresh page) and leans in for a closer look, never doing the same thing twice in a row.

To see it, open the panel while speck run is building. With reduced motion on, it shows one still picture of speck beside the TVs. The TVs are decoration: they don't show a build's real progress.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - `speck test --related` didn't bring in the screen's tests (0413, 0414, 0416, 0436, 0438, 0446, 0451, 0495), which load the header through a support file; the build ran them by hand. Skipped as a duplicate of speck/ideas/2026-10-24-bring-in-page-tests-for-a-panel-script-change.md.

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
    "reviewed_sha": "49b029740c8ca8813629e2ce995dd053e64835a7",
    "session": "fresh",
    "thread_id": "01a17505-b095-7c22-b490-fe8671925793",
    "builder_response": "- Tests run: test/panel-0502.test.mjs, test/panel-0413.test.mjs, test/panel-0414.test.mjs, test/panel-0416.test.mjs, test/panel-0436.test.mjs, test/panel-0438.test.mjs, test/panel-0446.test.mjs, test/panel-0451.test.mjs, test/panel-0495.test.mjs (the screen's tests, which load the header through a support file), plus what `speck test --related` brought in (panel-0433, panel-0473, panel-0474) and the checks.\n- Round 1. The new watch pose replaces `watchPose` in templates/panel-header.js, from docs/design/lcd/watching.html: the TVs, the resting pose and this ticket's three beats (scan, read, lean). The other beats and the TVs' effects for them (snow, Pong, mirror, roll, forced progress) are left for 0503–0505.\n- Tidied from the prototype: picks use Math.random once per beat (no retry loop), excluding the beat before; the first beat is always `scan` with a fixed 6 s, so the reduced-motion still frame is always the same; a fresh plan starts when the pose starts again. The three-TV row sits 1 scene unit further left so speck's lean never shares a dot with the nearest TV.\n- AC1's real-browser check: pictures in the review pack, taken from a real panel in Chromium at 390 px with 1, 2 and 3 builds (light), 3 builds dark at 390 and 320 px.\n",
    "seconds": 60,
    "usage": {
      "input_tokens": 571740,
      "cached_input_tokens": 516480,
      "cache_write_input_tokens": 0,
      "output_tokens": 1809,
      "reasoning_output_tokens": 178
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-25T21:45:29.558Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "watchPose's tvs, tvGeom and drawTV implement the required counts and retro details. Passing AC1 tests check counts and rendered separation. Reviewed review-pack pictures 1–3 at 390 px and picture 5 at 320 px: the TVs fit beside speck."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "tvState and drawTV implement independent cycles, moving logs, typed newest lines and drawn ticks; pose adds the hop and gaze reaction except during read. All three AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Reviewed scan, read and lean against docs/design/lcd/watching.html's newWatch: timings, movements and blending match. beatAt excludes the previous beat and selects by weight. Passing AC3 tests cover durations, resting blends and checklist accumulation; LCD.builder supplies blinking."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests check arm lengths across beats and the reduced-motion still frame. speckRests, captions, other poses and LCD.Cast's transition blending are unchanged; the existing screen and 0436 rhythm tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0502-tests.txt: 245 tests, 242 passed, three skipped, zero failures. The diff changes only the watch pose, its new tests and ticket records."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "speck now watches up to three retro TVs with animated logs and progress, alternating between scanning, checking its clipboard and leaning closer. The narrow-screen pictures and passing tests support the requested behaviour. No blocking issues found."
  }
}
```

</details>
