---
id: "0118"
title: "Stop panel tests failing when another test takes their port"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-make-the-test-suite-faster.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T10:35:54.329Z"

---
# 0118 · Stop panel tests failing when another test takes their port

**Status:** 🔍 reviewing

## Problem
Panel tests fail now and then with "Port … is already in use, so the panel didn't start". The helper `freePort()` in `test/support/panel.mjs` finds a free port, releases it, and the panel is started on it a moment later. Meanwhile another test file running in parallel can take the same port. It stopped 0097 shipping, and it cost 0111's build a re-run. Each time, the builder had to work out that it wasn't their change.

## Outcome
A panel test no longer fails because another test took the port it picked.

## Acceptance criteria
1. When the port a panel test picked is already taken by the time the panel starts, the test starts the panel on another free port and carries on, instead of failing. A test proves this by holding the picked port open itself.
2. A panel that fails to start for any other reason still fails the test, with the panel's own message.
3. Requests in a test go to the port the panel actually started on.
4. No test that passed before this change fails.

## Out of scope
- Changing `speck panel` itself, for example accepting `--port 0`. This is a fix to the tests only.
- Speeding up the panel tests (0117 and the fixed waits).

## Notes
- `freePort()` is used 41 times across about 20 test files. Most go through `startPanel()`.
- Seen 2026-10-11 with no other build running, so it's a race inside one suite run, not between builds.
- Failing before this build: none
- Self-check: no changes (checked a missing or malformed --port value, the panel exiting before its message is read, and a panel that starts on a port other than the one given, which startPanel stops and fails)

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none.

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
    "reviewed_sha": "73950426a3119339cdef4eb2320cc1328c3a97f3",
    "thread_id": "01a12a8b-ccef-7822-b15e-019776a85189",
    "seconds": 33,
    "usage": {
      "input_tokens": 337648,
      "cached_input_tokens": 219648,
      "cache_write_input_tokens": 0,
      "output_tokens": 804,
      "reasoning_output_tokens": 98
    },
    "saved_at": "2026-10-11T10:40:00.698Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "startPanel in test/support/panel.mjs retries occupied ports, and both held-port tests exercise this successfully. However, test/panel-0118.test.mjs:39 asserts p.port === asked after releasing asked, so that test still fails if another test takes its picked port."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "startPanel retries only the occupied-port diagnostic; the AC2 test in test/panel-0118.test.mjs exercises missing configuration and an invalid port, checking the panel's messages. Both passed in the supplied output."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "startPanelOnce returns the printed port; updated callers and readyPanel use p.port. The held-port tests make real HTTP requests to the replacement port and passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The supplied whole-suite output reports 1002 passes, zero failures and three skips. No previously passing test is reported failing. Tests were not rerun because they create files and this review is read-only."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0118.test.mjs:39",
        "issue": "The new free-port test reintroduces the exact race this ticket fixes. Between freePort() releasing asked and startPanel binding it, another parallel test can take asked. The helper then successfully retries, but assert.equal(p.port, asked) fails the suite.",
        "suggested_fix": "Remove the requirement that the returned port equal the initially released port in this test. Check the printed URL and successful requests against p.port; startPanel already verifies each successful attempt uses the port supplied to that attempt.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The helper recovers from occupied ports, preserves other startup errors, and callers use the actual port. The supplied suite passed, but one new test can still fail under the same port race. Fix that assertion before merging."
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
    "reviewed_sha": "922891f0dff442f9733551cb3e993a5db08223d2",
    "thread_id": "01a12a8b-ccef-7822-b15e-019776a85189",
    "seconds": 20,
    "usage": {
      "input_tokens": 729583,
      "cached_input_tokens": 531840,
      "cache_write_input_tokens": 0,
      "output_tokens": 1289,
      "reasoning_output_tokens": 98
    },
    "saved_at": "2026-10-11T10:41:30.802Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/support/panel.mjs startPanel retries the occupied-port diagnostic on a newly selected port. Both AC1 AC3 tests in test/panel-0118.test.mjs hold the original port open and successfully request the replacement port; both passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "startPanel propagates other startup failures with captured panel output. The AC2 test exercises missing configuration and an invalid port, checks their messages, and passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "startPanelOnce returns the port from the printed URL; callers and readyPanel use p.port. The revised AC3 test checks the URL and a real HTTP request against p.port, without assuming the original port remains available. All AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The supplied fresh whole-suite output reports 1002 passes, zero failures and three skips. Tests were not rerun during this read-only review because they create files."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0118.test.mjs",
        "issue": "Resolved: the new test no longer requires the actual port to equal the initially picked port, so a successful retry does not fail its assertion.",
        "suggested_fix": "Implemented: check the printed URL and HTTP response using p.port.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Panel tests now recover when another test takes their chosen port and send requests to the replacement port. Other startup errors still fail with the panel’s message. The earlier test race is fixed, the supplied suite passes, and no blocking concerns remain."
  }
}
```

</details>
