---
id: "0500"
title: "Keep the 0484 copy test passing when the machine is busy"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-24-fix-the-0484-copy-test-that-fails-under-load.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T12:40:38.279Z"
approved: "2026-10-25T12:46:55.952Z"
finished: "2026-10-25T12:50:25.430Z"

---
# 0500 · Keep the 0484 copy test passing when the machine is busy

**Status:** ✅ done

## Problem
A test in `test/panel-0484.test.mjs` expects a blocked bug ticket's line to read `speck will answer · Review 2 · 99:5x · bug`, but the ticket starts 5,990 seconds before the file loads, so the time only reads 99:5x for 10 seconds. When several test files run at once, the real panel takes longer than that to start, the time reads 100:00 and the test fails though nothing is wrong. `speck ship` runs the whole suite, so it can hand a ticket back for no reason, the 0.15.0 release included.

## Outcome
The 0484 checks of a closed card's line pass however long the panel takes to start, and still catch a real change to the line.

## Acceptance criteria
1. The checks in `test/panel-0484.test.mjs` that read a blocked ticket's time pass when the panel takes 60 seconds longer to start than it does on its own, checked by delaying the start that much.
2. They still fail if the line's words, its stage, the form of its time (minutes and seconds past an hour, such as `99:59`) or its tag change from what 0484 left, checked by changing each in turn.
3. No test that passed before this change fails.

## Out of scope
- How the panel shows the time, and any other test.

## Notes
- From the inbox note, raised while building 0485: seen twice in 0485's related test run (`speck will answer · Review 2 · 100:00 · bug`), while the file passed on its own.
- Today: tickets 0901 and 0905 in the file's board start `ago(5990)`, and the checks match `99:5\d` (lines 131 and 191).
- Asked for by the user on 2026-10-25, before releasing 0.15.0.
- Failing before this build: not checked
- Self-check: the first related run caught that the source check of 0484's file counted `timeLine(` rather than its two checks of the line; it now checks the helper is built on `timeLine` and both checks use it. Also blanks a time of any number of minutes in the copy check, so 99:59 against 100:00 between its two reads can't fail it.
- AC1 checked for real: `SPECK_TEST_0500_DELAY=60 node --test --test-name-pattern="AC2: at 320|copies" test/panel-0484.test.mjs` waits 60 s before each panel starts; both checks of the blocked ticket's time passed.

## In plain words
Nothing changes in the panel. One of speck's own checks of a blocked ticket's card used to fail when the computer was busy, because it expected the card's timer to show a time that's only right for ten seconds. It now reads the timer against the clock, so a slow start no longer fails it, and it still fails if the card's words, stage, timer format or tag change. A ship that runs the whole suite on a busy machine should no longer be handed back for this.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 126,865
- Elapsed since build started: 6 min
- Changed lines: 0 (limit 5000)
Follow-ups: none. 0443's file also starts tickets 5,999 seconds back, but it checks only that a time shows, not which one.

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
    "reviewed_sha": "8956ee28e494c374754dce6064e9daf7fb8eeef3",
    "session": "fresh",
    "thread_id": "01a17318-e9e5-72b3-85f7-887766c2a262",
    "builder_response": "- Tests run: test/panel-0500.test.mjs test/panel-0484.test.mjs (with `--related`, which also ran the repo's checks)\n- Round 1. AC1 was also checked for real by delaying each panel start 60 s (`SPECK_TEST_0500_DELAY=60 node --test --test-name-pattern=\"AC2: at 320|copies\" test/panel-0484.test.mjs`): both checks of the blocked ticket's time passed. AC3: the related run passed; the 3 skips are 0078's own checks, skipped on main.\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 126101,
      "cached_input_tokens": 89344,
      "cache_write_input_tokens": 0,
      "output_tokens": 764,
      "reasoning_output_tokens": 72
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-25T12:46:35.940Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel-0484.test.mjs: open() supports the reported 60-second startup delay, and both bugLine() checks allow elapsed time since file load. The passing 0500 AC1 test also exercises delays of 60 seconds and longer using the panel's counter."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel-0500.test.mjs: passing AC2 mutation checks reject changed words, stage, time formats and tags. timeLine() enforces exact surrounding text, minutes past an hour, valid two-digit seconds and elapsed-time bounds; both original assertions use it."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "/tmp/speck-0500-tests.txt records 117 passes, zero failures and three skips, including all six 0484 tests. The committed change is limited to this ticket, its tests and its test helper; panel behaviour is unchanged."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The tests now allow the timer to advance beyond 99:59 when startup is slow, while still catching changes to the line's words, stage, time format and tag. The related tests passed, with no blocking concerns found."
  }
}
```

</details>
