---
id: "0159"
title: "Stop the 0149 panel tests hanging the full suite"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-13T22:50:12.210Z"
approved: "2026-10-13T23:40:35.606Z"

---
# 0159 · Stop the 0149 panel tests hanging the full suite

**Status:** 👍 approved

## Problem
Since 0149 shipped, the full test suite on `main` hangs in about a third to a half of runs, always just after test 714, in `test/panel-0149.test.mjs`. On its own the file passes in a few seconds every time; it hangs only when the whole suite runs side by side. Every hang costs a build or a ship 5 to 10 minutes (0150 took 26 minutes, 0152 over 45), and before 0152 it stalled 0149's own ship.

## Outcome
The full suite on `main` finishes every time in its usual time, and the 0149 browser test still checks what it did.

## Acceptance criteria
1. Ten full-suite runs in a row (`npm test`, one after another, on this machine) all finish without hanging, each within 3 minutes.
2. The 0149 AC4 browser test still checks that the page reports no manifest errors and that its icons load and match `icon.svg`.
3. Every wait in `test/panel-0149.test.mjs`, and in any helper in `test/support/` it calls that can wait on the browser or the panel, has a time limit. If the limit passes, the test fails with a message naming what it was waiting for, instead of hanging.
4. The ticket's Notes say in plain words what made the test hang under load.
5. No test that passed before this change fails.

## Out of scope
- Watching for stalled test runs in general (0152).
- Speeding up the rest of the suite.

## Notes
- Evidence: the hang stops output right after test 714 in `speck/.cache/results/run.85b8dba7-….out` (0149's ship, 20:42) and in 0150's and 0152's builds. 0152's builder found 3 hangs in 6 runs through speck, and one hang in a direct piped `node --test` run, so it isn't caused by speck's watchdog.
- The browser test (line 173) opens Chrome through `browserPage()` and polls `Page.getAppManifest` up to 50 times; Chrome DevTools calls through `b.send` may have no time limit.
- Run on its own, the file passed 3 times out of 3 in 5 to 8 seconds (2026-10-13 22:30).
- Failing before this build: none
- AC4 has no automated test, since tests mustn't read this repo's speck/ folder (0122): a reviewer checks it by reading the `Why it hung:` note below.
- Why it hung: Chrome opens a blank page first and then goes to the panel's page. The test checked that "the page has loaded", but the blank page already counts as loaded, so on a busy machine the test went ahead before the panel's page had arrived. It then asked Chrome for the page's app manifest, and Chrome never answers that question when it's asked on the blank page, so the test waited for ever. On a quiet machine the panel's page wins the race, which is why the file always passed on its own. Reproduced 2026-10-13: one of three runs of two full suites side by side hung there, and a page that arrives 300 ms late leaves every manifest question asked before it unanswered.
- AC1 checked 2026-10-13: ten `npm test` runs in a row all passed, each in 77 to 78 seconds. Under the load that reproduced the hang (two full suites side by side), eight suites finished with no hang, against one hang in six before the fix.
- Self-check: `stop()` and `b.close()` waited for ever for a process that had already exited, so they now return at once; `stop()` also kills a panel that ignores SIGTERM. Tests added for both.

## In plain words
The full test suite no longer gets stuck partway through. One of the panel's browser tests sometimes asked the browser a question before the panel's page had opened, and on a busy machine the browser never answered, so the whole run sat waiting until it was stopped. The test now waits for the panel's page itself before asking. Every wait in that test, and in the shared helpers it uses, now has a time limit and fails with a message saying what it was waiting for.

To see it, run the whole test suite a few times in a row: each run should finish in a little over a minute. Keep an eye on the occasional failure of other panel tests when the machine is very busy: those are a separate, known issue, saved as a follow-up idea.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 browserPage.close sends SIGKILL after five seconds but then continues awaiting gone indefinitely if Chrome never reports exiting.; F2 request's req.setTimeout limits socket inactivity rather than total request duration.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 364,003
- Elapsed since build started: 50 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Tests that check speck run has stopped straight after turning it off fail now and then on a busy machine (0148 AC2 and 0128 AC3, once each with two full suites side by side): speck/ideas/2026-10-13-stop-tests-checking-speck-run-stopped-too-soon.md.
- Tidy-up: `browserPage()` could wait for its page itself, so no browser test can act on Chrome's blank start page; only 0149's test waited on `readyState` alone, so nothing else is known to be affected.

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
    "reviewed_sha": "36a039b6bdcb188fef6b4f89a595953a6d9ed8c2",
    "thread_id": "01a137a0-6582-78b3-8208-e972005f5545",
    "seconds": 27,
    "usage": {
      "input_tokens": 136228,
      "cached_input_tokens": 97280,
      "cache_write_input_tokens": 0,
      "output_tokens": 952,
      "reasoning_output_tokens": 52
    },
    "saved_at": "2026-10-13T23:37:28.104Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The ten /tmp/0159-ac1-{1..10}.out logs each report 1354 tests, zero failures and durations of 76.7–77.5 seconds."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/panel-0149.test.mjs AC4 retains the browser assertions for manifest errors, icon loading and dimensions, and pixel comparison with icon.svg. The full-suite output reports it passing."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "test/support/panel.mjs browserPage.close still awaits an exit event without a rejection deadline. request uses a socket inactivity timeout, allowing a response that keeps sending data to wait indefinitely."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The ticket's 'Why it hung:' note explains the blank-page navigation race and unanswered manifest call in plain words, supported by the delayed-page browser regression test."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "/tmp/speck-0159-tests.txt reports 1351 passing tests, three skipped and zero failures. Existing 0149 browser assertions remain intact."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/support/panel.mjs:285",
        "issue": "browserPage.close sends SIGKILL after five seconds but then continues awaiting gone indefinitely if Chrome never reports exiting. Sending a signal is not a time limit on the wait. The new close test covers an already-exited process only.",
        "suggested_fix": "Add a final rejection deadline naming Chrome and the exit wait, clear cleanup timers on settlement, and test the path where no exit event arrives.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/support/panel.mjs:100",
        "issue": "request's req.setTimeout limits socket inactivity rather than total request duration. A panel that sends response chunks periodically without ending the response keeps request() and raw() pending indefinitely. The silent-server test does not exercise this case.",
        "suggested_fix": "Use an overall request deadline that destroys the request and rejects with the named request message; clear it when the request settles. Add a test whose response keeps sending chunks but never ends.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The navigation fix preserves the browser checks, and ten recorded full-suite runs finish in about 77 seconds. Two helper waits still lack firm deadlines, so the requirement that every wait must eventually fail is not yet met."
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
    "reviewed_sha": "3cc47f44e9a96814591faec8dbf32402ef5f3845",
    "thread_id": "01a137a0-6582-78b3-8208-e972005f5545",
    "seconds": 16,
    "usage": {
      "input_tokens": 225148,
      "cached_input_tokens": 178560,
      "cache_write_input_tokens": 0,
      "output_tokens": 1675,
      "reasoning_output_tokens": 52
    },
    "saved_at": "2026-10-13T23:40:14.387Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Previously inspected /tmp/0159-ac1-{1..10}.out record ten successful consecutive suites in 76.7–77.5 seconds. The latest full suite also passes in 76.8 seconds."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/panel-0149.test.mjs AC4 retains its browser checks for manifest errors, icon loading and dimensions, and pixel comparison with icon.svg. The full suite passes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "test/support/panel.mjs now bounds Chrome shutdown through ended() and HTTP requests through an overall deadline, alongside the existing browser startup, connection and DevTools deadlines. panel-0159 tests cover unanswered calls, missing pages, silent and trickling responses, and processes that never report exiting."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The ticket's 'Why it hung:' note explains the blank-page navigation race and unanswered manifest call in plain words. The delayed-page browser test exercises the corrected behaviour."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The current /tmp/speck-0159-tests.txt reports 1353 passes, three skips and zero failures across 1356 tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/support/panel.mjs",
        "issue": "Chrome shutdown previously awaited an exit event without a final deadline.",
        "suggested_fix": "Implemented: close() uses ended(), which escalates to SIGKILL and then rejects with a named deadline error. A fake-process test exercises the missing-exit path.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/support/panel.mjs",
        "issue": "HTTP requests previously limited inactivity rather than total duration.",
        "suggested_fix": "Implemented: request() uses an overall deadline shared by raw(). A real trickling-response server verifies both helpers reject within their limits.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The fix waits for the actual panel page before requesting its manifest and adds deadlines to prevent indefinite waits. Both review findings are resolved, the original browser checks remain intact, and the full suite passes. Ready for the owner's merge decision."
  }
}
```

</details>
