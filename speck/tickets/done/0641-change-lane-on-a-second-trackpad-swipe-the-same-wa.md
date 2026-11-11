---
id: "0641"
title: "Change lane on a second trackpad swipe the same way while the first still glides"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T13:27:21.806Z"
blocked_at: ""
waited_seconds: 30
approved: "2026-11-11T13:37:36.468Z"
finished: "2026-11-11T14:18:35.513Z"

---
# 0641 · Change lane on a second trackpad swipe the same way while the first still glides

**Status:** ✅ done

## Problem
In the panel in Cursor, a sideways trackpad swipe changes lane once, and a second swipe the same way does nothing until you wait. The panel takes every sideways scroll the same way as the first swipe's glide until scrolling has paused for 50 ms (0514), and Cursor's pane sends the next swipe straight on from the glide with no pause, so swiping from Capture to Build or Plan to Shipped takes two swipes with a wait between.

## Outcome
Two trackpad swipes the same way, one straight after the other, change lane twice, and one swipe with its glide still changes lane only once.

## Acceptance criteria
1. A sideways scroll whose steps shrink as a glide does, followed with no pause (steps 16 ms apart) by a second swipe the same way whose steps grow again past 20 px, changes lane twice: once for each swipe.
2. A single swipe whose steps speed up, slow down and speed up again before its glide, as fingers do, changes lane only once, unless its steps shrink two in a row, then grow three in a row from under 10 px to past 20 px, which counts as a new swipe; and a glide on its own, however long, never changes lane a second time.
3. A pause of 50 ms or more between two sideways scrolls still lets the second change lane, and a scroll the other way still changes lane after any pause or none, as 0514 made them.
4. No test that passed before this change fails.

## Out of scope
- Touch swipes on a phone and the arrow keys, which already change lane straight away.

## Notes
- Reported 2026-11-11 in Cursor's browser pane: "it's moving once and then it seems like it needs to have a delay before I can scroll again."
- The handler is the `wheel` listener at the end of the lanes code in `templates/panel-header.js`: a step the same way as the last change (`wheel.way`) resets `sum` and is ignored until a 50 ms pause. It hasn't changed since 0517 (2026-10-26), so a change in how Cursor sends the glide is the likely reason it shows now.
- Checked 2026-11-11 against the running panel in headless Chromium: a lane change takes 1–12 ms of script and frames stay at 17 ms, so drawing isn't the delay. A real trackpad glide can't be replayed there, so the criteria give the scroll steps to test with the fake page.
- Web pages get no flag that marks a glide, so a new swipe has to be told from the glide by its steps.
- Failing before this build: none
- Went with the recommendation: Change the 0514 check to expect a lane change (chosen by speck, as watch is decide, 2026-11-11 13:28 UTC).
- A new swipe during a glide is told by its steps: two shrinking in a row since the change (the glide), then three growing in a row from under 10 px, with the last over 20 px. A swipe that nearly stops for two frames and speeds up hard over three before its glide changes lane twice: no step pattern tells that from a glide and a new swipe. AC2 reworded to say so (the second answer above).
- Self-check: no changes
- Pictures: none, because nothing changes in how the panel looks
- Went with the recommendation: Accept the limit, with the speed-up starting under 10 px a step, and reword AC2 (chosen by speck, as watch is decide, 2026-11-11 13:33 UTC).

## In plain words
On a trackpad, two quick sideways swipes the same way now move two lanes, one per swipe, without waiting for the first swipe's glide to die down. That fixes the panel in Cursor, where you had to pause between swipes. To see it, open the panel in Cursor and swipe twice quickly from Capture towards Build: you land on Build. One swipe still moves one lane, however long it glides. Keep an eye out for one swipe that slows almost to a stop and then speeds up hard: the panel can take that for two swipes and move two lanes.

## Blocked question
The page can't see a trackpad's fingers, only how far each step scrolls, so a swipe that slows down and speeds up again can look exactly like a glide followed by a new swipe. AC1 and AC2 can't both hold for every swipe. As built, a second lane change needs the steps to shrink twice in a row and then grow three times in a row past 20 px a step; the reviewer found that a single swipe going 20, 30, 24, 18, 19, 22, 26 then gliding changes lane twice. Should I accept that limit, and narrow it further so the speed-up has to start from under 10 px a step, as a new swipe's fingers do when they land, with AC2 reworded to say which swipes count as one? Or should I keep AC2 as it is and drop the second change during a glide (the bug stays)? I recommend accepting the limit with the under-10-px start: it fixes the reported bug, and only a swipe that nearly stops and then speeds up hard is taken as two.
Recommended: Accept the limit, with the speed-up starting under 10 px a step, and reword AC2
Other options: Accept the limit as built now; Keep AC2 as it is and drop the fix (the bug stays)
Changes what you'd notice: yes
Clear winner: no

## Review log
Round 1 (codex): escalate: F1 The new heuristic violates AC2: a single swipe that slows down and speeds up again can skip a lane.
Round 2 (codex): changes requested: F2 The review run fails the existing first-frame timing test, so AC4 is not satisfied.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 259,967
- Elapsed since build started: 10 min
- Changed lines: 29 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Known limit: a swipe whose steps shrink two in a row and then grow three in a row from under 10 px to past 20 px changes lane twice, as AC2 now says. Only the steps can tell a new swipe from the glide.
- Skipped, as a duplicate: the 0517 AC3 real-browser frame-time test failed once under load during round 2 (59 ms against 50 ms) and passed on reruns. Matches speck/ideas/2026-11-08-steady-the-0517-ac3-frame-time-test-under-load.md.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · escalate</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "be968247d4b504443b189db4877bfee149c289d3",
    "session": "fresh",
    "thread_id": "01a1cace-e565-77c2-a1a6-913d42fc7dee",
    "builder_response": "- Tests run: test/panel-0641.test.mjs test/panel-0514.test.mjs test/panel-0517.test.mjs test/panel-0060.test.mjs test/panel-0161.test.mjs test/panel-0476.test.mjs, plus the related tests speck test --related chose (the files naming templates/panel-header.js) and the commands.checks files.\n- Changed one existing check in test/panel-0514.test.mjs (\"on the same way after only … ms\"), and the expected lane of the line after it, which now starts from Plan. The user's chosen answer to the blocked question (see the ticket's Notes) allows this: that check pinned the very behaviour AC1 changes.\n- Rule: after a change, a same-way step counts as a new swipe once two steps in a row have shrunk since the change and then three in a row have grown, the last over 20 px. Known limit, in the Notes: a single swipe that slows over two frames and speeds up over three before its glide would change lane twice.\n",
    "seconds": 40,
    "usage": {
      "input_tokens": 128295,
      "cached_input_tokens": 92032,
      "cache_write_input_tokens": 0,
      "output_tokens": 845,
      "reasoning_output_tokens": 60
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 36263,
      "cached": 92032,
      "write": 0,
      "output": 845
    },
    "cost_usd": 0.0901792,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T13:32:39.170Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "escalate",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/panel-0641.test.mjs AC1 tests exercise consecutive swipes at 16 ms intervals, in both directions and with several glide lengths; both passed."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The wheel listener in templates/panel-header.js counts a single swipe slowing twice then accelerating three times as two swipes. Independently reproduced with pad(): [20,30,24,18,19,22,26,...glide()] moving left from Build lands on Capture instead of Plan. Existing AC2 tests omit this pattern."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The two AC3 tests in test/panel-0641.test.mjs cover pauses of at least 50 ms and immediate direction changes. Both passed; the handler retains the pause reset and reverse-direction accumulation."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Reported run: 214 passed, 3 skipped, zero failures. The changed 0514 expectation matches the explicitly recorded decision to permit the second same-direction swipe."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-header.js",
        "issue": "The new heuristic violates AC2: a single swipe that slows down and speeds up again can skip a lane. The ticket Notes acknowledge this limitation, but the acceptance criterion still promises that such a swipe changes lane only once. The added tests avoid the acknowledged failing pattern.",
        "suggested_fix": "Obtain an explicit product decision on accepting this limitation. If accepted, revise AC2 to specify the supported distinction and add a test recording the chosen behaviour; otherwise revise the implementation to meet AC2.",
        "state": "open"
      }
    ],
    "escalation_question": "May a single swipe that slows for two frames and then accelerates for three frames past 20 px change lane twice, as the proposed heuristic does, or must AC2's promise of one lane change remain?",
    "summary": "Consecutive swipes now change lanes without waiting, and the tested pause and direction-change behaviour still works. However, one swipe can also skip a lane when its speed falls and rises. I reproduced this; accepting that trade-off needs a product decision."
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
    "reviewed_sha": "633d1da3705bbe6e3c8b8172d267d5da777175fe",
    "session": "continued",
    "thread_id": "01a1cace-e565-77c2-a1a6-913d42fc7dee",
    "builder_response": "- Tests run: test/panel-0641.test.mjs test/panel-0514.test.mjs test/panel-0517.test.mjs test/panel-0060.test.mjs test/panel-0161.test.mjs test/panel-0476.test.mjs, plus the related tests speck test --related chose and the commands.checks files.\n- F1: fixed, by the product decision recorded in the ticket's Notes (\"Accept the limit, with the speed-up starting under 10 px a step, and reword AC2\"). AC2 now says which swipes count as one. templates/panel-header.js: the three growing steps must now grow from a step under 10 px (`wheel.from`), as a new swipe's fingers do when they land, so your reproduction [20,30,24,18,19,22,26,...glide()] changes lane once (its rise starts at 18). test/panel-0641.test.mjs: added it and a swipe slowing to exactly 10 px to the AC2 single-swipe cases, plus a test recording the accepted limit: a swipe whose steps shrink two in a row, then grow three in a row from under 10 px to past 20 px, changes lane twice.\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 212903,
      "cached_input_tokens": 168448,
      "cache_write_input_tokens": 0,
      "output_tokens": 1464,
      "reasoning_output_tokens": 86
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 8192,
      "cached": 76416,
      "write": 0,
      "output": 619
    },
    "cost_usd": 0.0302156,
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-11-11T13:35:12.795Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The wheel listener in templates/panel-header.js detects renewed acceleration from under 10 px. Both AC1 tests in test/panel-0641.test.mjs passed, covering consecutive swipes at 16 ms intervals."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The revised criterion explicitly accepts the ambiguous swipe pattern. The handler checks wheel.from < 10; passing AC2 tests cover the previous reproduction, the 10 px boundary, the accepted exception and long glides."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The pause reset and reverse-direction accumulation remain intact in templates/panel-header.js. Both AC3 tests passed."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "The supplied run has one failure: test/panel-0517.test.mjs:133, the first-frame timing test, recorded 69 ms against its 50 ms limit. No failures were listed before this build."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-header.js",
        "issue": "The original single-swipe counterexample is now prevented, and the remaining ambiguous pattern is explicitly accepted by the recorded decision and revised AC2.",
        "suggested_fix": "No further change required for this finding.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/panel-0517.test.mjs:133",
        "issue": "The review run fails the existing first-frame timing test, so AC4 is not satisfied. This test uses clicks and arrow keys rather than the changed wheel handler, making timing variability plausible, but the failing result remains unresolved.",
        "suggested_fix": "Rerun the failing test file without weakening its assertions, and provide a fresh passing review run. If the failure persists, investigate whether it is a regression or demonstrate that it also occurs on the base branch.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The swipe change now matches the agreed trade-off, including protection against the earlier counterexample. Its behaviour tests pass. Approval is held only by an unresolved existing animation timing test failure, which may be timing variability."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "633d1da3705bbe6e3c8b8172d267d5da777175fe",
    "session": "continued",
    "thread_id": "01a1cace-e565-77c2-a1a6-913d42fc7dee",
    "builder_response": "- Tests run: test/panel-0641.test.mjs test/panel-0514.test.mjs test/panel-0517.test.mjs test/panel-0060.test.mjs test/panel-0161.test.mjs test/panel-0476.test.mjs, plus the related tests speck test --related chose and the commands.checks files. Fresh run attached: 215 passed, 0 failed, 3 skipped.\n- F2: fixed (a timing flake, not a regression). I reran test/panel-0517.test.mjs on its own three times, with no change to code or tests: it failed once (one click at 59 ms: \"46, 39, 35, 59, 17, 22 ms\") and passed twice. The machine's load average was 26 at the time, because other builds were running. The test changes lane only by clicking a lane's name and pressing the arrow keys. It sends no wheel event, and the wheel listener is the only code this ticket changes, so the change can't affect its timing. The full round run above, rerun, passes it.\n",
    "seconds": 17,
    "usage": {
      "input_tokens": 258112,
      "cached_input_tokens": 212352,
      "cache_write_input_tokens": 0,
      "output_tokens": 1855,
      "reasoning_output_tokens": 86
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 1305,
      "cached": 43904,
      "write": 0,
      "output": 391
    },
    "cost_usd": 0.0109104,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T13:37:22.043Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-header.js detects renewed same-direction acceleration during a glide. Both AC1 tests passed, covering consecutive swipes at 16 ms intervals and three successive swipes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The handler implements the agreed under-10-px exception. All AC2 tests passed, covering single-swipe variations, the previous counterexample, the threshold boundary, the accepted exception and long glides."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The handler retains the 50 ms pause reset and reverse-direction accumulation. Both AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The fresh run reports 215 passed, zero failed and three skipped. The previously failing 0517 timing test now passes without code changes or weakened assertions."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-header.js",
        "issue": "The original counterexample is prevented; the remaining ambiguous swipe pattern is explicitly accepted in the revised AC2 and covered by tests.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/panel-0517.test.mjs:133",
        "issue": "The animation timing failure is resolved by a fresh passing run with unchanged code and assertions. The test exercises clicks and arrow keys, outside the changed wheel handler.",
        "suggested_fix": "No further change required for this ticket.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Consecutive trackpad swipes now change lanes without waiting, while the tested glide, pause and reverse-direction behaviour remains intact. A single swipe that nearly stops and accelerates sharply can count as two, as explicitly agreed. All review tests now pass."
  }
}
```

</details>
