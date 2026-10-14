---
id: "0182"
title: "Start Chromium once per test file"                # one outcome, no "and"
status: blocked            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
blocked_at: "2026-10-14T22:05:44.861Z"

---
# 0182 · Start Chromium once per test file

**Status:** ⛔ blocked

## Problem
Each of the 50 real-browser tests starts a Chromium of its own, about half a second and a few hundred MB each time. On 2026-10-14 these tests took 178 of the suite's 1,229 seconds of test time (14%), and every new panel ticket tends to add more. Each build runs the full suite three or four times, so this cost is paid on every build.

## Outcome
A test file's real-browser tests share one Chromium, so the browser tests take noticeably less time and memory, and check exactly what they did before.

## Acceptance criteria
1. A test file starts Chromium at most once, however many of its tests use a real browser.
2. Each test still starts with a fresh page that keeps nothing from the test before it: no storage, cookies, open dialogs, selection, scroll position or window size.
3. Chromium has closed within 10 seconds of the test file finishing, whether its tests passed, failed or timed out.
4. On the same quiet machine, the real-browser tests' total time across a full run is at least 30% lower than before this change. The ticket's Notes give both figures.
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
- Browser test time: before 546.1 s (547.4 s and 544.8 s in two full runs), after 492.1 s (491.7 s and 492.4 s in two full runs): 10% lower, short of AC4's 30%. A page now costs about 28 ms to open and close rather than 74 ms (ten in a row, on the same machine), so Chromium's start was never half a second here: the browser tests' time is almost all their own waits (polls, timers, animations). The machine had other sessions running (load average 7 to 15) for all four runs.
- AC4 has no automated test: tests mustn't read this repo's `speck/` folder (0122), and a timing would be flaky anyway. Check it from the figures above.
- The 0159 check that "b.close() ends Chrome through ended()" now reads the shared Chromium's own close, which is what ends Chrome; a page's close ends only its browser context.
- Self-check: made a page's close safe to call twice, made a DevTools call fail at once once Chromium has gone rather than waiting out its time limit, and had a file stopped by a signal (as `--test-timeout` stops one) still end its Chromium.
- tmp.mjs now keeps folders named `speck-keep-*` between tests, since it empties the run's temporary folder after every test and the shared Chromium's profile has to outlive one test.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
Sharing one Chromium per test file works (every other criterion is met: AC1 to AC3 have tests, and the full suite fails only the test that failed before this build), but it makes the browser tests only about 10% faster (546 s down to 492 s), not the 30% AC4 asks for: starting Chromium costs about 46 ms per page here, not half a second, and the rest of the time is the tests' own waiting. Should I (a) change AC4 to "measurably lower, with both figures in the Notes" and ship this as it is, or (b) cancel the ticket and drop the change? I recommend (a): it also stops failed or timed-out browser tests leaving Chromium running (one of the ticket's tests found they did), with no change to what the tests check.

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
