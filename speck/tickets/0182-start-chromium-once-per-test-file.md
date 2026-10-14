---
id: "0182"
title: "Start Chromium once per test file"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0175"]                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T21:44:02.138Z"
blocked_at: ""
waited_seconds: 411
approved: "2026-10-14T23:07:50.965Z"

---
# 0182 · Start Chromium once per test file

**Status:** 👍 approved

## Problem
Each of the 50 real-browser tests starts a Chromium of its own, about half a second and a few hundred MB each time. On 2026-10-14 these tests took 178 of the suite's 1,229 seconds of test time (14%), and every new panel ticket tends to add more. Each build runs the full suite three or four times, so this cost is paid on every build.

## Outcome
A test file's real-browser tests share one Chromium, so the browser tests take noticeably less time and memory, and check exactly what they did before.

## Acceptance criteria
1. A test file starts Chromium at most once, however many of its tests use a real browser.
2. Each test still starts with a fresh page that keeps nothing from the test before it: no storage, cookies, open dialogs, selection, scroll position or window size.
3. Chromium has closed within 10 seconds of the test file finishing, whether its tests passed, failed or timed out.
4. On the same machine, the real-browser tests' total time across a full run is measurably lower than before this change. The ticket's Notes give both figures.
5. No test that passed before this change fails.

## Out of scope
- Tests that use the fake page (`fakePage()`), which start no browser.
- Ending processes left behind by other tests (0175).
- Running the browser tests less often.

## Notes
- `browserPage()` in `test/support/panel.mjs` starts Chromium with a new profile for every call. It's used 49 times across 41 test files.
- Builds after 0175, which changes how test files clean up what they start.
- Failing before this build: 0173 AC2: no test in test/ checks once that a process it stopped has gone (it flags test/panel-0177.test.mjs:159)
- Real-browser tests here means the 207 tests skipped when no Chromium is found (run with an empty HOME), timed by summing their `duration_ms` in a full `speck test` run's output. The ticket's figure of 50 counted only the places that call `browserPage()`; many more tests open a browser through helpers.
- Browser test time: before 546.1 s (547.4 s and 544.8 s in two full runs), after 492.1 s (491.7 s and 492.4 s in two full runs): 10% lower. A page now costs about 28 ms to open and close rather than 74 ms (ten in a row, on the same machine), so Chromium's start was never half a second here: the browser tests' time is almost all their own waits (polls, timers, animations). The machine had other sessions running (load average 7 to 15) for all four runs.
- AC4 has no automated test: tests mustn't read this repo's `speck/` folder (0122), and a timing would be flaky anyway. Check it from the figures above.
- The 0159 check that "b.close() ends Chrome through ended()" now reads the shared Chromium's own close, which is what ends Chrome; a page's close ends only its browser context.
- Answer 2026-10-14 (blocked on AC4's 30% target, reached only 10%): the user chose to change AC4 to "measurably lower, with both figures in the Notes" and ship this as it is.
- Self-check: made a page's close safe to call twice, made a DevTools call fail at once once Chromium has gone rather than waiting out its time limit, and had a file stopped by a signal (as `--test-timeout` stops one) still end its Chromium.
- tmp.mjs now keeps folders named `speck-keep-*` between tests, since it empties the run's temporary folder after every test and the shared Chromium's profile has to outlive one test.

## In plain words
Speck's own browser tests now open one browser per test file and give each test a clean page in it, instead of starting a new browser for every test. A full test run spends about 10% less time in these tests (about 492 seconds instead of 546), which every build feels a little. A browser test that fails or runs out of time no longer leaves a browser running in the background. To see it, run the test suite and watch the list of running programs: each browser test file has just one browser, and it goes away when the file is done. Keep an eye on any new test that closes the browser itself: later tests in the same file then can't open a page, so such a test needs a file of its own.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 sharedChromium() deliberately starts another Chromium after the shared process dies.
Round 2 (codex): approve.
Round 3 (codex, merge round): approve.

## Delivery log
- Review rounds: 3, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 619,451
- Elapsed since build started: 84 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Shorten the existing browser tests' waits, where most of their time goes: speck/ideas/2026-10-14-shorten-the-slowest-browser-tests-waits.md
- Fix the 0173 AC2 check failing before this build (it flags test/panel-0177.test.mjs:159): speck/ideas/2026-10-14-fix-the-0173-check-failing-on-main.md

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
    "reviewed_sha": "61961afdcbd9138ce90180e077016d35dc21e6ca",
    "thread_id": "01a13c7e-1159-7053-a014-0a13dea5bfec",
    "seconds": 32,
    "usage": {
      "input_tokens": 102937,
      "cached_input_tokens": 61312,
      "cache_write_input_tokens": 0,
      "output_tokens": 960,
      "reasoning_output_tokens": 255
    },
    "saved_at": "2026-10-14T22:18:08.451Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "test/support/panel.mjs sharedChromium() relaunches Chromium after it exits. The passing test '0182 AC1: a test whose Chromium was killed gets a new one' explicitly verifies two Chromium processes start in one test file, contrary to 'at most once'."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "browserPage() creates a separate browser context for each page. Passing 0182 AC2 tests change and then check storage, cookies, dialogs, selection, scrolling and dimensions, and verify closed pages do not accumulate."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The after hook and process exit/signal handlers close Chromium. Four passing 0182 AC3 subprocess tests check process disappearance within 10 seconds after success, failure, test timeout and file timeout."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Ticket Notes record two full runs before and after on the same machine: averages of 546.1 s and 492.1 s, approximately 10% lower. This meets the revised manual measurement criterion."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0182-tests.txt: 1,682 passed, three skipped, and only the explicitly documented pre-existing 0173 AC2 failure. Existing tests were not edited."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/support/panel.mjs",
        "issue": "sharedChromium() deliberately starts another Chromium after the shared process dies. The new recovery test proves that one file starts Chromium twice, so the implementation and its test contradict AC1's unconditional maximum of one launch per file.",
        "suggested_fix": "Align the implementation with AC1, or obtain and record an explicit owner-approved exception allowing replacement after Chromium is killed or crashes. Update the criterion and recovery test consistently if that exception is approved.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change isolates pages correctly, cleans up Chromium in the tested failure cases and records a 10% browser-test speed improvement. The suite has no new failures. One requirement remains inconsistent: the ticket permits only one Chromium launch per file, while the implementation explicitly launches a replacement if it dies."
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
    "reviewed_sha": "04c0c9e57fbfcdc674c3a056ffbf350e354ca7a9",
    "thread_id": "01a13c7e-1159-7053-a014-0a13dea5bfec",
    "seconds": 17,
    "usage": {
      "input_tokens": 196060,
      "cached_input_tokens": 147328,
      "cache_write_input_tokens": 0,
      "output_tokens": 1505,
      "reasoning_output_tokens": 255
    },
    "saved_at": "2026-10-14T22:22:53.003Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/panel.mjs sharedChromium() retains the single launch promise and rejects requests after Chromium exits. Both passing 0182 AC1 tests cover sequential/concurrent sharing and rejection after Chromium is killed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "browserPage() creates a separate browser context per page. Both 0182 AC2 tests pass, checking storage, cookies, dialogs, selection, scrolling, dimensions and removal of closed pages."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The after hook and exit/signal handlers close Chromium. All four 0182 AC3 subprocess tests pass, checking disappearance within 10 seconds after success, failure, test timeout and file timeout."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Ticket Notes record same-machine full-run measurements averaging 546.1 seconds before and 492.1 seconds after, approximately 10% lower, meeting the revised measurement criterion."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0182-tests.txt: 1,682 passed, three skipped and only the documented pre-existing 0173 AC2 failure. No existing tests were edited."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/support/panel.mjs",
        "issue": "The previous implementation relaunched Chromium after it exited, contradicting the one-launch limit. sharedChromium() now retains its original launch promise and rejects subsequent page requests after Chromium exits.",
        "suggested_fix": "Implemented and covered by the revised passing 0182 AC1 test.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Each test file now shares one Chromium while keeping pages isolated. Cleanup checks pass, recorded browser-test time is about 10% lower, and the suite has no new failures. The one-launch issue is resolved; no blocking concerns remain."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "2d5244f2f0121f617d06581c2868a0e0fa6e367a",
    "merge": true,
    "thread_id": "01a13c7e-1159-7053-a014-0a13dea5bfec",
    "seconds": 16,
    "usage": {
      "input_tokens": 315896,
      "cached_input_tokens": 254208,
      "cache_write_input_tokens": 0,
      "output_tokens": 2093,
      "reasoning_output_tokens": 255
    },
    "saved_at": "2026-10-14T23:07:45.832Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/panel.mjs sharedChromium() retains one launch promise and rejects requests after Chromium exits. Both 0182 AC1 tests pass after the merge, covering sequential/concurrent sharing and no replacement after termination."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "browserPage() creates a separate browser context per page. Both 0182 AC2 tests pass, checking storage, cookies, dialogs, selection, scrolling, dimensions and removal of closed pages."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The after hook and exit/signal handlers retain the approved cleanup behaviour. All four 0182 AC3 subprocess tests pass after the merge, covering success, failure, test timeout and file timeout."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Ticket Notes retain same-machine full-run measurements averaging 546.1 seconds before and 492.1 seconds after, approximately 10% lower. The measured browser implementation is unchanged by the merge."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0182-tests.txt: 1,685 passed, zero failed and three skipped. The 0191 fix is already in merged main; its test files have no differences against fb4283b4."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/support/panel.mjs",
        "issue": "The original relaunch behaviour contradicted the one-launch limit. The corrected sharedChromium() still retains its original launch promise and rejects requests after Chromium exits.",
        "suggested_fix": "Already implemented and verified by the passing 0182 AC1 tests after the merge.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The merge preserves the approved browser sharing, page isolation and cleanup behaviour. Browser-test time was measured about 10% lower. The full suite now passes, with the previous failure fixed separately on main. No blocking concerns remain."
  }
}
```

</details>
