---
id: "0641"
title: "Change lane on a second trackpad swipe the same way while the first still glides"                # one outcome, no "and"
status: blocked            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
blocked_at: "2026-11-11T13:32:56.968Z"
waited_seconds: 13

---
# 0641 · Change lane on a second trackpad swipe the same way while the first still glides

**Status:** ⛔ blocked

## Problem
In the panel in Cursor, a sideways trackpad swipe changes lane once, and a second swipe the same way does nothing until you wait. The panel takes every sideways scroll the same way as the first swipe's glide until scrolling has paused for 50 ms (0514), and Cursor's pane sends the next swipe straight on from the glide with no pause, so swiping from Capture to Build or Plan to Shipped takes two swipes with a wait between.

## Outcome
Two trackpad swipes the same way, one straight after the other, change lane twice, and one swipe with its glide still changes lane only once.

## Acceptance criteria
1. A sideways scroll whose steps shrink as a glide does, followed with no pause (steps 16 ms apart) by a second swipe the same way whose steps grow again past 20 px, changes lane twice: once for each swipe.
2. A single swipe whose steps speed up, slow down and speed up again before its glide, as fingers do, changes lane only once, and a glide on its own, however long, never changes lane a second time.
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
- A new swipe during a glide is told by its steps: two shrinking in a row since the change (the glide), then three growing in a row with the last over 20 px. A swipe that slows down over two frames and speeds up over three before its glide would change lane twice; no step pattern tells that from a glide and a new swipe.
- Self-check: no changes
- Pictures: none, because nothing changes in how the panel looks

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
The page can't see a trackpad's fingers, only how far each step scrolls, so a swipe that slows down and speeds up again can look exactly like a glide followed by a new swipe. AC1 and AC2 can't both hold for every swipe. As built, a second lane change needs the steps to shrink twice in a row and then grow three times in a row past 20 px a step; the reviewer found that a single swipe going 20, 30, 24, 18, 19, 22, 26 then gliding changes lane twice. Should I accept that limit, and narrow it further so the speed-up has to start from under 10 px a step, as a new swipe's fingers do when they land, with AC2 reworded to say which swipes count as one? Or should I keep AC2 as it is and drop the second change during a glide (the bug stays)? I recommend accepting the limit with the under-10-px start: it fixes the reported bug, and only a swipe that nearly stops and then speeds up hard is taken as two.
Recommended: Accept the limit, with the speed-up starting under 10 px a step, and reword AC2
Other options: Accept the limit as built now; Keep AC2 as it is and drop the fix (the bug stays)
Changes what you'd notice: yes
Clear winner: no

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
