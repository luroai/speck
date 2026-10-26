---
id: "0514"
title: "Keep trackpad lane swipes working after each swipe"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-26-keep-trackpad-lane-swipes-working-after-each-swipe.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-26
started: "2026-10-26T10:45:32.928Z"

---
# 0514 · Keep trackpad lane swipes working after each swipe

**Status:** 🔍 reviewing

## Problem
On a laptop trackpad in Cursor's panel pane, a sideways scroll changes lane once, then further left/right swipes do nothing until you click the panel. After that click, one swipe works again, and you have to click once more for the next. Swiping between Plan, Build and Shipped should not need a click between each change.

## Outcome
A sideways trackpad scroll keeps changing lane on each gesture, without a click in between.

## Acceptance criteria
1. With the panel open (including in a narrow Cursor browser pane), a sideways trackpad scroll that changes lane from Build to Shipped (or Plan) is followed by another sideways scroll the other way that changes lane back, with no click, tap or key press between them. The same holds for a third scroll after that.
2. A pause of any length between two sideways scrolls still lets the second one change lane. Scrolling a lane's list up and down between two sideways scrolls still leaves the next sideways scroll able to change lane.
3. A single continuous trackpad glide still changes lane only once, as 0476 intended, so inertia after the fingers lift does not skip across every lane. Arrow keys and tapping the strip still change lane as they do today.
4. No test that passed before this change fails, except a check that a second trackpad scroll within the old quiet window is ignored, which is changed to check criterion 1.

## Out of scope
- Touch-screen finger swipes, which use a different path.
- Changing how far a scroll must go before the first lane change.

## Notes
- Asked for 2026-10-26 from Cursor on a laptop trackpad: after swapping lanes, left/right swiping stops until a physical click on the panel, then works once.
- Checked 2026-10-26: the wheel handler in `templates/panel-header.js` (0476) sets `wheelDone` after one lane change and only clears it after 150 ms with no `wheel` events. Each further `deltaX` event (including trackpad inertia) resets that quiet timer while `wheelDone` stays true, so a second intentional swipe is ignored for as long as events keep arriving. A click that stops those events would let the timer fire and match the "click then one swipe" symptom.
- Checked 2026-10-26: whether Cursor's pane also drops wheel delivery until a click after a lane change can't be seen on this box (only Cursor's command-line agent is installed, with no editor pane to scroll in). Nothing found says it does; criterion 1 must hold either way.
- Changes `templates/panel-header.js`. No open ticket changes that file (0512 and 0513 do not).
- Failing before this build: none
- Self-check: no changes. Checked: a scroll whose events carry no change sideways is skipped as before; jitter the other way at a glide's end is undone by the next step the same way, so it never adds up to 40 px; a discrete tilt wheel still changes lane once a notch only after a 150 ms pause, as before; nothing is kept between page loads.
- AC4: no existing test checked that a second trackpad scroll within the quiet window is ignored, so none was changed.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "d77498547e13d4f371964f1e6ae4700b8ec5c4da",
    "session": "fresh",
    "thread_id": "01a177d3-73d3-78d0-a192-c50c443e8a76",
    "builder_response": "- Tests run: test/panel-0514.test.mjs test/panel-0476.test.mjs, plus every test file `--related` chose for templates/panel-header.js (and the commands.checks files).\n- No pictures: nothing changes how the panel looks.\n- Design: the old handler cleared its \"done\" flag only after 150 ms with no wheel events, so a new swipe that started while the last one's glide was still sending events was ignored. The handler now works from each event's timeStamp rather than a timer, and after a lane change counts a new scroll three ways: after a 150 ms gap; 40 px the other way (a glide never reverses; any step the same way resets that count, so end-of-glide jitter can't add up); or a scroll the same way that speeds up again (each step at least twice the glide's slowest plus 4 px, 40 px of them) once the glide has slowed to a third of its fastest step.\n",
    "seconds": 39,
    "usage": {
      "input_tokens": 90866,
      "cached_input_tokens": 55424,
      "cache_write_input_tokens": 0,
      "output_tokens": 1177,
      "reasoning_output_tokens": 189
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-26T10:49:07.653Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/panel-0514.test.mjs: both AC1 tests exercise successive wheel gestures through the page handler without intervening input; both passed. Cursor-specific event delivery remains unverified."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The AC2 tests cover pauses from 16 ms to ten minutes and vertical scrolling between gestures; both passed."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "templates/panel-header.js: the wheel handler's low/push heuristic can trigger twice during one continuous scroll. Executing the actual handler with deltaX values [20,20,30,8,22,22,16,10,5,2,1], spaced 16 ms apart, produced two stepLane(1) calls. The passing AC3 tests miss this slowdown followed by acceleration."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The supplied related-test run reports 138 passes, zero failures and three skips. Existing tests were not changed, and the implementation stays within the wheel handler."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-header.js",
        "issue": "A continuous swipe can skip two lanes when the fingers slow down and then accelerate. With events [20,20,30,8,22,22,16,10,5,2,1] at 16 ms intervals, the first 40 px changes lane, 30 then 8 arms the slowdown detector, and the following two 22 px events trigger another change. From Plan this skips through Build to Shipped without a second gesture, violating AC3.",
        "suggested_fix": "Revise gesture detection so a temporary slowdown and acceleration within one swipe cannot trigger another lane change. Add this sequence as a regression test starting from Plan, while retaining the successive-gesture tests.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Repeated swipes work in the supplied tests, but one swipe can now skip across two lanes if its speed varies. Fix that regression before merge. Behaviour inside Cursor itself remains unverified."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "20be0b4947fb12c738eff085088efdddae571b9d",
    "session": "continued",
    "thread_id": "01a177d3-73d3-78d0-a192-c50c443e8a76",
    "builder_response": "- Tests run: test/panel-0514.test.mjs test/panel-0476.test.mjs (with the commands.checks files).\n- F1: fixed. In templates/panel-header.js's wheel handler, a scroll the same way now counts as new only once the glide has slowed steadily: five steps in a row, none faster than the one before, down to a quarter of its fastest step (which now starts from the step that changed lane). A dip and a speed-up within one swipe no longer re-arms it. Your sequence [20,20,30,8,22,22,16,10,5,2,1] is in the AC3 glides test, from Plan and from Shipped, and changes lane once. The trade-off: a same-way swipe while the last glide is still going fast is ignored, as before this ticket; the other way still always works (AC1), and a same-way swipe once the glide has nearly stopped, or after any pause, works (new AC1 test and the AC2 tests). The AC1 cut-glide test now checks reversals only.\n",
    "seconds": 36,
    "usage": {
      "input_tokens": 172420,
      "cached_input_tokens": 130176,
      "cache_write_input_tokens": 0,
      "output_tokens": 2364,
      "reasoning_output_tokens": 307
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-26T10:51:45.949Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The three AC1 tests in test/panel-0514.test.mjs passed, covering successive reversals without other input and same-direction swipes after sufficient deceleration. Cursor-specific delivery remains unverified."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The passing AC2 pause test always completes the full synthetic glide first. The current handler ignores a same-direction second swipe after a short pause if the first gesture has not armed low: [20,20,30,24], then a 100 ms gap, then [20,20] produces no second change."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The original F1 sequence now produces one change, but executing the current handler with [20,20,30,24,18,12,8,6,22,22,16,10,5,2,1] at 16 ms intervals still produces two stepLane(1) calls during a continuous slowdown and acceleration. Keyboard and strip tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The supplied run reports 124 passes, zero failures and three skips. Existing test files remain unchanged."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-header.js",
        "issue": "The fix handles the exact previous example but retains the underlying false detection. A continuous swipe with deltas [20,20,30,24,18,12,8,6,22,22,16,10,5,2,1], 16 ms apart, triggers twice. Five decreasing steps can occur while fingers remain down; they do not establish that a gesture ended.",
        "suggested_fix": "Revise the gesture boundary approach rather than only extending the deceleration threshold. Add this continuous slowdown-and-acceleration sequence to the regression tests and preserve one lane change.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel-header.js",
        "issue": "The stricter detector ignores same-direction second gestures after short pauses unless the previous gesture decelerated sufficiently. This contradicts AC2's 'pause of any length'. For example, [20,20,30,24], a 100 ms pause, then [20,20] changes lane only once. The pause test misses this because it always supplies a complete decaying glide before pausing.",
        "suggested_fix": "Cover pauses after a truncated glide, starting from Plan so a second same-direction change is observable, and make those gestures work as AC2 requires. If reliable gesture separation requires a product trade-off, explicitly escalate that decision instead of narrowing the tests.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The original example is fixed, but varying speed within one swipe can still skip two lanes. The stricter detection also ignores some second swipes after short pauses. The passing tests do not cover these cases."
  }
}
```

</details>
