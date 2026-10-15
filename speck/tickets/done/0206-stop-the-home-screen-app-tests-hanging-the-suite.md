---
id: "0206"
title: "Stop the home-screen app tests hanging the suite"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-13-stop-the-home-screen-app-test-hanging-the-suite.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0198"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T14:47:21.062Z"
approved: "2026-10-15T15:01:03.408Z"
finished: "2026-10-15T15:06:15.322Z"

---
# 0206 · Stop the home-screen app tests hanging the suite

**Status:** ✅ done

## Problem
The panel's home-screen app tests (0149) drive headless Chrome, and each call to it waits for an answer with no time limit. When Chrome doesn't answer, the whole suite hangs until speck's stall limit ends it after 5 minutes, and the run fails, so a build or ship fails at random and loses those minutes.

## Outcome
A call to the test browser that's never answered fails its own test within a time limit, and the rest of the suite carries on.

## Acceptance criteria
1. Every call the test helpers make to the browser (`browserPage()` and its `send` in `test/support/panel.mjs`) fails with an error naming the call if it isn't answered within 30 seconds, and the test that made it fails.
2. When that happens, the browser and the panel that test started are ended, and the other tests in the file and the suite still run.
3. A call that's answered in time works exactly as before.
4. No test that passed before this change fails.

## Out of scope
- Making the browser tests quicker (0198).
- Why Chrome sometimes doesn't answer.

## Notes
- Asked for 2026-10-15, for release 0.4.0.
- From 0152's build: about one full run in three hung at test 714, with a panel server and Chrome open under `test/panel-0149.test.mjs`.
- Builds after 0198, which may change the same browser test helpers.
- Failing before this build: none
- Found while building: 0159 (shipped 2026-10-13, after the idea was captured) had already given every DevTools call a 15-second limit, and the test setup (`tmp.mjs`, 0175) already ends every process a test file left running once its tests are done. So a call that's never answered already failed its own test, and the suite carried on. This build keeps the 15-second limit, which is within AC1's 30 seconds and leaves answered calls exactly as they were (AC3), and adds tests that show all of it with a stand-in browser that can leave chosen calls unanswered.
- The gap it fixes: when opening the page itself went unanswered, the 0149 browser test failed before its `try`, so its panel ran on until the whole file finished. It now stops its panel, and closes its page, as soon as the test ends, even if closing the page fails.
- `SPECK_TEST_DEVTOOLS_MS` shortens the default limit, for 0206's own tests only; nothing else sets it.
- Self-check: a zero, negative or non-numeric `SPECK_TEST_DEVTOOLS_MS` now falls back to 15 seconds rather than failing every call at once.

## In plain words
Nothing changes in speck itself: this is about its own test suite. It turned out an earlier fix had already put a time limit on every question the tests ask the browser, so an unanswered one fails its own test and the rest of the run carries on. This change closes the one gap left: if the browser never opened the home-screen app test's page, that test's panel kept running until the whole test file finished. It now stops as soon as the test ends. New tests use a pretend browser that ignores chosen questions, to show that the test fails quickly, names the question, and leaves nothing running.

To see it, run the full test suite: it should finish in its usual few minutes every time. Keep an eye on whether a run still ever stops as stalled. If one does, the cause is somewhere else.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 96,943
- Elapsed since build started: 14 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (tidy-up only, no inbox note): about 20 other browser test files still start a panel, then open the page outside their `try`, so a page that can't be opened leaves that panel running until the file's tests are done, when the test setup ends it. It can't hang the suite, so it's left as is.

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
    "reviewed_sha": "3fb33d0f4e7149bde7a537a44d8c8a5cac8cfccd",
    "thread_id": "01a14014-2765-7823-a22a-ec55187935a4",
    "seconds": 22,
    "usage": {
      "input_tokens": 96321,
      "cached_input_tokens": 56320,
      "cache_write_input_tokens": 0,
      "output_tokens": 622,
      "reasoning_output_tokens": 68
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T15:00:46.837Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/panel.mjs devtools().send applies a 15-second default timeout naming the unanswered method. Passing 0206 tests exercise unanswered page, browser and page-opening calls."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel-0149.test.mjs now opens browserPage() inside try and always stops the panel through nested finally blocks. Both passing 0206 subprocess tests verify the browser test fails, subsequent tests pass, the browser context is disposed and no processes remain after the file exits."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing 0206 AC3 test exercises successful send(), js(), until(), move() and browser() calls through the stand-in browser. The default timeout remains unchanged."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0206-tests.txt: 1,929 tests, 1,926 passed, three skipped, zero failures or cancellations. Existing 0149 assertions remain intact."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The home-screen test now stops its panel even when opening the browser page fails. Tests demonstrate that unanswered browser calls fail promptly, later tests continue and processes are cleaned up. The full suite reports no failures."
  }
}
```

</details>
