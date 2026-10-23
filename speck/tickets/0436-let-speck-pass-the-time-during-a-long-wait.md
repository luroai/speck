---
id: "0436"
title: "Let speck pass the time during a long wait"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0435"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T21:11:03.198Z"

---
# 0436 · Let speck pass the time during a long wait

**Status:** 🔍 reviewing

## Problem
Since 0414, speck plays an event's animation, then shows the pipeline's state and holds it until the state changes. On a long build that's 40 minutes of watching with the clipboard, so the screen looks stuck.

## Outcome
Between events, speck shows the pipeline's state, and during a long wait it passes the time now and then at a calm pace.

## Acceptance criteria
1. While the Foreman's status word stays `Building <n>` or `Shipping <id>`, speck watches with its clipboard for 2 minutes, then plays a pastime for 1 minute, then watches for 2 minutes, and so on. The pastime is tea, chess, sweeping or messy, picked at random and never the same as the one before, with its caption from a fixed set. The top row keeps showing the status word throughout.
2. While the word stays `Waiting`, speck is grumpy for 2 minutes, then follows the same rhythm of 1-minute pastimes and 2 minutes grumpy.
3. While the word stays `Idle`, speck changes to another pastime every 3 minutes, never the same as the one before. After 15 minutes of `Idle`, it falls asleep and stays asleep until the word changes or an event plays, as 0414 set.
4. While the word is `Needs you <n>`, speck keeps the question mark with no pastimes, and while it's `Off`, speck stays asleep.
5. An event interrupts at once, as 0414 set. After it, and whenever the status word changes, the rhythm starts again from the state's own animation.

## Out of scope
- The events and their animations (0414).
- Captions written by a model.

## Notes
- The user asked for this on 2026-10-23: on a long build, speck only watched the build. Agreed: 2 minutes watching, 1-minute pastimes, and Needs you stays as the question mark.
- Changes 0414's criterion 3 for `Building`, `Shipping`, `Waiting` and `Idle`. 0414's tests for those change to match.
- Waits for 0435: both change `templates/panel.html`. 0430 waits for it too, as the split moves the screen's code.
- Failing before this build: none
- Self-check: removed a no-op step and a meaningless assertion from the new tests; checked that a clock going back, a hidden tab skipping turns and a draft being written during a build keep the rhythm sane (the elapsed time is clamped, a skipped turn picks one new pastime, writing restarts the rhythm like an event).
- Pictures: none, because the change is only when existing poses show (a pastime appears 2 minutes into a build), which a panel started here shows as Off; every pose and caption it uses is already drawn by 0414.

## In plain words
During a long build or ship, speck no longer just stands there with its clipboard. It watches for 2 minutes, then takes a 1-minute break (tea, chess, a sweep or a messy moment), then watches again. While the pipeline is waiting, it's grumpy instead of watching, with the same breaks. When nothing is happening, it changes pastime every 3 minutes and dozes off after 15. When it needs you, it keeps the question mark, and when speck run is off, it sleeps. The top row still shows the pipeline's word throughout, and anything that happens interrupts at once.

To see it, leave the panel open during a build for a few minutes. Worth a look: whether the break captions read well to you.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
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
    "reviewed_sha": "186161749061510c0b426824c24210cc26e92d4c",
    "session": "fresh",
    "thread_id": "01a16a9d-0599-73a2-bbf7-c056e8679f8e",
    "builder_response": "- Tests run: test/panel-0436.test.mjs test/panel-0414.test.mjs (and the commands.checks files, which speck test --files adds)\n- Round 1. The rhythm lives in speckRests in templates/panel.html; the pastime picker is pickPastime. 0414's tests for Building, Shipping, Waiting and Idle are changed to match, as the ticket's Notes say, and the shared screen helpers moved from test/panel-0414.test.mjs to test/support/screen-speck.mjs.\n- Captions: Idle keeps 0414's four captions; while Building, Shipping or Waiting the pastimes use a second fixed set (PASTIMES), as 0414's Idle captions (\"NOTHING READY. CHESS?\") read wrong during a build.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 145930,
      "cached_input_tokens": 102656,
      "cache_write_input_tokens": 0,
      "output_tokens": 771,
      "reasoning_output_tokens": 52
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T21:14:20.955Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: speckRests implements the 2-minute watch/1-minute pastime cycle; pickPastime excludes the previous choice. PASTIMES supplies fixed captions. Passing 0436 AC1 tests exercise Building and Shipping timing, random choices, captions and the unchanged top row."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "speckRests uses the same cycle for Waiting with grumpy as its own pose. Passing '0436 AC2' tests exercise both grumpy intervals and successive pastimes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "speckRests changes Idle pastimes every 3 minutes and sleeps at 15 minutes. Passing 0436 AC3 tests check the boundaries, non-repetition, continued sleep and waking on a status change; updated 0414 tests check waking after an event."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "speckRests returns ask for Needs you and sleeping for Off before applying pastime logic. Passing 0436 AC4 tests check both states repeatedly over 20 minutes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "speckNow prioritises events and marks the rhythm for restart; noteBoard resets it on a changed status word. Passing 0436 AC5 tests exercise event interruption, restarting watch intervals, status changes and restarting Idle's nap timer."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change adds the requested calm pastime rhythm while preserving status visibility and event interruptions. The tests exercise the timing and state changes, and the recorded run has 150 passes, no failures and three skips. No blocking concerns found."
  }
}
```

</details>
