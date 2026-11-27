---
id: "0771"
title: "Switch speck serve to new code by itself"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "deep"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-26
started: "2026-11-26T23:52:57.564Z"
approved: "2026-11-27T01:17:34.272Z"

---
# 0771 · Switch speck serve to new code by itself

**Status:** 👍 approved

## Problem
The panel and `speck run` switch to new code when speck changes, but `speck serve` keeps running the code it started with. On 2026-11-26 the factory floor shipped and stayed a 404 until `speck serve` was restarted by hand, and every update to speck would need the same.

## Outcome
`speck serve` switches to new code by itself, without dropping its address or the panels behind it.

## Acceptance criteria
1. When the code `speck serve` runs from changes and has settled, `speck serve` is running the new code within 10 seconds, and pages it serves (All projects, the factory floor) come from the new code.
2. While it switches, its port and `--url` keep answering: a request made during the switch gets an answer, not a refused connection.
3. The project panels it started keep running through the switch, and the new code goes on looking after them rather than starting second copies.
4. New code that fails to start leaves the old code serving, says why in its log, and the next change tries again.
5. No test that passed before this change fails.

## Out of scope
- The project panels' own switching, which they already do.

## Notes
- Found 2026-11-26: the systemd service runs `scripts/speck.mjs serve` from speck's own repo, so a ship changes the code under it.
- The panel hands its listening socket to a new process and stops the old one (`restart()` in `scripts/panel.mjs`); `speck run` does the same through `scripts/run-switch.mjs`. `speck serve` is `scripts/serve.mjs` and `scripts/serve-front.mjs`.
- Failing before this build: none
- Self-check: the process you start now serves as before until its first switch, then hosts the worker on the new code, rather than running speck serve in a worker from the start, which doubled the time speck serve took to start (about 330 ms to 630 ms under load) and failed 0762's wait for its address in the related run; the old code hands its panels over completely as it steps down, so one that exits while it gives its last answers is reported and started again by the new code only; a panel's command line is read from /proc where there is one, as ps reads every process (137 ms a call under load) and after a switch every panel is one taken over, looked at on each read of the list; the old code puts back the address's record among the panels' when new code that wrote its own fails; new code isn't let take over once speck serve is stopping, at the first switch or a later one (tested); and a worker started without the host refuses to run.
- speck (2026-11-27 00:30 UTC) told you: The build isn't stuck: it's working through its own tests one file at a time, and they pass (all 5 new tests and the 81 existing speck serve tests). It's slow because the machine is heavily loaded, with a load average around 80. The full suite that ran on main at about the same time had scattered browser-test failures, which look like timeouts from that load rather than a broken base. Why: The build log shows steady progress with passing tests and no hung command, and the load average stayed between 75 and 88 the whole time.

## In plain words
speck serve now picks up a new version of speck by itself. When speck's own code changes, for example when you ship a change to speck itself, it switches to the new version within a few seconds, without you restarting it. Its address keeps answering throughout, so open pages and your phone stay connected, and the project panels it started keep running. If the new version can't start, it carries on with the old one, says why in its log, and tries again the next time the code changes.

To see it, run speck serve from speck's own folder and ship a change to speck: within a few seconds its log says its code changed and it switched to the new code, and a reload of All projects or the factory floor shows the new version.

Worth knowing: a speck serve that's already running doesn't have this yet, so restart it once after this ships (stop it and start it again, or restart its service). After its first switch, speck serve shows as two processes: the one you started, which stays so that stopping it and its service still work, and the one running the new code.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 182,822
- Elapsed since build started: 85 min
- Changed lines: 349 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Saved to the inbox: speck/ideas/2026-11-27-steady-the-0239-turn-waiting-test.md. 0239 AC1 holds a test turn for 1.5 seconds, too short on a busy machine; it failed once in this build's related run and passed again.
- Known limit: the process you started keeps the hosting code it started with (hostWorkers and startSuccessor in scripts/serve-switch.mjs), so a later change to how it hosts its workers takes effect only after speck serve is restarted.
- Known limit: closing a kept-alive connection as the old code hands off can race with a request sent on it at that moment, as with any server closing idle connections; a browser sends such a request again. Every request on a new connection is answered (0771 AC2).
- Known limit: a speck serve started before this ships has no switch, so it needs one restart by hand.

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
    "reviewed_sha": "e946c58024408a601081978839b1cf9fb8899390",
    "session": "fresh",
    "thread_id": "01a21a91-e068-7270-8eac-f00a24780993",
    "builder_response": "- Tests run: test/serve-switch-0771.test.mjs test/serve-switch-panels-0771.test.mjs test/serve-switch-fail-0771.test.mjs test/serve-0762.test.mjs test/turns-0239.test.mjs test/serve-0756.test.mjs test/serve-0756-old.test.mjs test/serve-0757.test.mjs test/serve-0758.test.mjs test/serve-front-0757.test.mjs test/serve-front-0762.test.mjs test/serve-front-panel-0757.test.mjs test/serve-install-0759.test.mjs test/serve-runs-0762.test.mjs (with the repo-wide checks, which `speck test --files` adds itself): 245 tests, 242 passed, 3 skipped (0078's split checks, which always skip now), none failed.\n- Before that run I ran `speck test --related` once over the ticket's own files: it chose 272 files, as docs/brief.md and scripts/speck.mjs are named by most tests. 3,021 passed and 2 failed: 0762 AC2–AC4, which waited 10 seconds for speck serve to print its address while another build kept the machine at a load average of about 95 on purpose, and 0239 AC1, about test turns, which this ticket doesn't touch. The 0762 failure came from a first design that ran speck serve in a worker from the start, which doubled its start time (about 330 ms to 630 ms under load). The self-check in the ticket's Notes changed that: the process you start now serves exactly as before until its first switch, and the run above includes both failing files and every speck serve test file, on the code as committed.\n- Design, in short: the process you start keeps the record (so its pid, which `speck serve --stop`, `--background` and the systemd service track, never changes). Its first switch starts a worker on the new code itself, handing it the listening socket and what it looks after; from then on it only hosts the worker serving (`hostWorkers` in scripts/serve-switch.mjs), which asks it for the next worker when its own code changes, the socket going through it.\n- AC5: the full suite runs at ship; the two runs above are the evidence here.\n- No pictures: nothing anyone sees in a page changes.\n",
    "seconds": 28,
    "usage": {
      "input_tokens": 181919,
      "cached_input_tokens": 128896,
      "cache_write_input_tokens": 0,
      "output_tokens": 903,
      "reasoning_output_tokens": 230
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 53023,
      "cached": 128896,
      "write": 0,
      "output": 903
    },
    "cost_usd": 0.1279656,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-27T01:15:24.783Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/serve-switch.mjs codeWatch and scripts/serve.mjs checkCode detect settled changes and start new code. The passing AC1 integration test changes a running CLI copy and verifies new All projects and factory floor responses within 10 seconds."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "startSuccessor hands over the listening socket before startFront.handOff stops old connections. Both passing AC2 tests check continuous local and --url requests, completion of an outstanding response, and event streams reconnecting across first and subsequent switches."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/serve.mjs carry, takeOver and stepDown transfer panel ownership without stopping panels. Passing AC3 tests verify unchanged panel PIDs, no duplicate panels, subsequent restart and removal, shutdown during switches, and preservation of run keeper state."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "startSuccessor reports startup failures; stayed restores the front's registration and retains old code. The passing AC4 test exercises syntax errors, load exceptions and readiness timeout, then verifies successful retry after another change."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0771-tests.txt: 242 passed, 3 skipped, none failed across 245 tests. The run includes both previously failing test files and existing serve coverage. Whole-suite verification remains the ship gate."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The service now switches to updated code automatically while keeping its address available and its project panels running. Tests cover repeated switches, interrupted requests, panel ownership and failed updates. No blocking issues found."
  }
}
```

</details>
