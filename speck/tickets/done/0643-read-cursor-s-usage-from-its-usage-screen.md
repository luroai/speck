---
id: "0643"
title: "Read Cursor's usage from its usage screen"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0642"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T14:50:18.333Z"
approved: "2026-11-11T15:11:20.711Z"
finished: "2026-11-11T15:16:44.199Z"

---
# 0643 · Read Cursor's usage from its usage screen

**Status:** ✅ done

## Problem
Cursor reports its usage nowhere speck can read it from a run: only its interactive `/usage` screen shows it. Without it, speck can't tell how much of Cursor's monthly allowance is left.

## Outcome
speck reads Cursor's usage from its `/usage` screen and keeps it as it keeps Claude's and Codex's.

## Acceptance criteria
1. `speck agents` reads Cursor's usage, when Cursor's CLI is installed and signed in, by opening its interactive agent with no prompt, showing `/usage` and closing it, so no model runs: the plan, when it resets, how much of the included usage, Auto and API is used as a percentage, and the on-demand spend and limit.
2. It keeps that reading as 0642 keeps the others, and reads it again only when the last reading is more than 10 minutes old, or after a Cursor run speck started ends.
3. When the screen can't be read within 20 seconds, or doesn't show what it expects, speck keeps the last reading, says in one line why it couldn't read a new one, and stops everything it started.
4. speck still needs no packages: it works on Linux and macOS with what the system has.
5. No test that passed before this change fails.

## Out of scope
- Estimating Cursor's usage from the tokens speck records.

## Notes
- Checked 2026-11-11 (Cursor CLI 2026.11.11): `/usage` in the interactive `agent` shows `Usage • Premium`, `Resets 12 Nov`, rows Included, Auto and API with `N% used`, and `On-Demand $0` with `No monthly limit`, without a model turn. In print mode (`agent -p`) `/usage` is sent to the model as a prompt, `agent usage` is taken as a prompt too, and `agent about --format json` gives only `subscriptionTier`.
- It was read by hand through a pseudo-terminal and a terminal emulator. Node has no pseudo-terminal of its own: `script` (util-linux on Linux, BSD `script` on macOS, with different flags) gives one, and the screen's drawing codes have to be followed to read the text.
- Cursor can change this screen in any release, so a test with a recorded screen should fail loudly when the parser no longer finds the rows.
- Failing before this build: none
- Self-check: opens Cursor in an empty folder of speck's own (`speck/.cache/machine/cursor-usage/`) with `--trust`, not the project, after a trial run found an untrusted folder's trust prompt would take the typed `/usage` as keystrokes; still says so and stops if a trust prompt shows; says plainly when the system has no `script`; a usage screen that settles without the expected rows fails after 1.5 seconds rather than waiting out the 20.
- A Cursor run ending marks the reading stale (`speck/.cache/machine/usage/cursor-ran`), so the next `speck agents` reads it again: speck doesn't open Cursor's screen as each run ends, which would hold up `speck run`.
- Checked on Linux (util-linux `script` 2.41) against Cursor CLI 2026.11.11; the macOS form of `script` is tested only as the command speck builds.

## In plain words
`speck agents` now shows how much of your Cursor plan you've used, as it already does for Claude Code and Codex: the plan, the day it resets, how much of the included usage, Auto and API is used, and what you've spent on demand against any limit. To see it, run `speck agents` with Cursor installed and signed in. It quietly opens Cursor's usage screen and closes it again, so no AI runs and nothing is spent. That takes a few seconds, and speck only does it when its last reading is more than 10 minutes old or after one of its Cursor runs has finished, so most of the time the list comes up straight away. Cursor can change that screen in any update: if speck can't read it, it says so in one line and shows the last reading it had. Only checked on Linux so far, not on a Mac.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Cleanup discovers descendants only when finish starts.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 316,745
- Elapsed since build started: 21 min
- Changed lines: 335 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (known limits, no inbox notes):
  - The macOS form of `script` (`script -q /dev/null sh -c …`) is tested only as the command speck builds; nobody has run a real reading on a Mac yet.
  - When Cursor's reading is stale, `speck agents` takes about 5–10 seconds longer while it opens Cursor's screen. A Cursor run that ends only marks the reading stale and doesn't read it straight away, so the next `speck agents` does the reading.
  - The panel's Settings view doesn't refresh Cursor's reading itself. Showing each agent's usage in the panel is already in the inbox: `speck/ideas/2026-11-10-show-each-agent-s-usage-in-the-panel.md`.
  - `0630 AC3: a full run doesn't wait for the max_parallel_tests turns` failed once in a related run because of its 900 ms wall-clock check while the load average was about 40. It passed on its own and in round 2's run.

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
    "reviewed_sha": "5dc1d1c57087593e7a25539bda3cc4fbdcafd7df",
    "session": "fresh",
    "thread_id": "01a1cb25-d976-71c3-a0c6-c00a344eb600",
    "builder_response": "- Tests run: `speck test --related test/cursor-usage-0643.test.mjs test/agent-usage-0642.test.mjs test/full-suite-0630.test.mjs` (the ticket's own file, the 0642 file it changed, and every test file naming a changed file).\n- Changed an existing test: 0642 AC3's last assertion said `saveUsage(..., 'cursor', ...)` is refused (\"only Claude Code and Codex\"). This ticket makes speck keep Cursor's reading as it keeps the others (AC2), so it now checks an agent speck doesn't read usage from (`gemini`) instead.\n- One failure in that run, not from this change: `0630 AC3: a full run doesn't wait for the max_parallel_tests turns` asserts the run takes under 900 ms of wall time; the machine's load average was 38–47 during the run. It passes when its file is run alone (`node --test test/full-suite-0630.test.mjs`: 15 pass, 0 fail). This ticket touches nothing in the full-suite or test-turn code.\n- Design notes:\n  - The reading is done in a node process of its own (`scripts/cursor-usage.mjs`, run by `readCursorUsageSync`), so `speck agents` stays synchronous (it also runs in-process in tests, where async output would be lost).\n  - Cursor is opened in an empty speck-owned folder (`speck/.cache/machine/cursor-usage/`) with `--trust`: a trial run in an untrusted folder showed the trust prompt taking typed keystrokes, and opening it in the project would load the project's Cursor rules/MCP servers. A trust prompt, if one still shows, is detected and the reading stops without answering it.\n  - \"Read again after a Cursor run ends\" is done by marking the reading stale when a Cursor run ends (`cursor-ran`), so the next `speck agents` reads it; opening Cursor's screen as each run ends would hold up `speck run` for several seconds.\n  - Checked live on this Linux machine against Cursor CLI 2026.11.11 (`speck agents` printed the real reading); the recorded fixture is that real screen.\n",
    "seconds": 57,
    "usage": {
      "input_tokens": 190161,
      "cached_input_tokens": 134400,
      "cache_write_input_tokens": 0,
      "output_tokens": 1168,
      "reasoning_output_tokens": 383
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 55761,
      "cached": 134400,
      "write": 0,
      "output": 1168
    },
    "cost_usd": 0.136642,
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-11-11T15:07:54.464Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "parseCursorUsage reads all requested fields. Passing recorded-screen and speck agents integration tests exercise parsing and opening Cursor without a model prompt."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "refreshCursorUsage, saveUsage and cursorUsageStale retain readings and refresh after ten minutes or a Cursor run. Passing AC2 tests cover these paths; build, review and watch callers reach the usage hooks."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "Passing AC3 tests cover timeout, malformed screens, trust prompts and retaining readings, but readCursorUsage's finish function can miss surviving descendants after their parent exits."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Only Node built-ins are imported. The passing AC4 test checks Linux and macOS script commands; macOS execution itself remains unverified, as disclosed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported tests passed apart from an unchanged wall-clock assertion in full-suite-0630.test.mjs, which passed on its isolated rerun. No regression attributable to this change was identified."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/cursor-usage.mjs:185",
        "issue": "Cleanup discovers descendants only when finish starts. If Cursor exits early leaving a subprocess alive, that subprocess can already have been reparented and disappear from descendants(child.pid). If the script process has also exited, family.filter(alive) is empty, so cleanup skips even the process-group signal and resolves with the subprocess still running. The existing stand-in always keeps its parent alive, so it misses this failure path.",
        "suggested_fix": "Track descendants while the reader runs and ensure cleanup signals the owned process group even when its leader has exited. Account for script placing Cursor in a separate terminal session. Add a test where Cursor starts a subprocess and exits before showing usage, then verify the subprocess stops.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change reads and caches Cursor’s usage, and the normal paths are well tested. One cleanup failure needs fixing: if Cursor exits unexpectedly, a process it started can remain running."
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
    "reviewed_sha": "70feeaf3b21e7c78fc77c75a1fde7e1a84c1950c",
    "session": "continued",
    "thread_id": "01a1cb25-d976-71c3-a0c6-c00a344eb600",
    "builder_response": "- Tests run: test/cursor-usage-0643.test.mjs test/agent-usage-0642.test.mjs test/full-suite-0630.test.mjs (157 pass, 0 fail; the 0630 wall-clock test passed this time).\n- F1: fixed. `scripts/cursor-usage.mjs`: `owned(root)` now tracks the processes it started while the reading runs, polling `ps -A -o pid=,ppid=,pgid=` every 250 ms and again at the start of cleanup and after each signal. It adds each descendant, each descendant's process group (Cursor's own session group under `script` included), and every process in those groups, which catches one reparented after its parent exits. It never adds speck's own group. Cleanup signals every tracked group (`kill(-pgid)`) and every tracked pid that is still alive, with SIGTERM then SIGKILL, whether or not `script` has already exited. New test `0643 AC3: when Cursor exits early, a process it started that outlives it is stopped too`: the stand-in starts a child that ignores HUP and INT, then exits a second later without showing usage. The test checks both are stopped. It fails against the round-1 code (checked by stashing the fix) and passes now.\n- Also reworded the trust-prompt reason, since Cursor is now opened with `--trust` in speck's own folder: \"it asked whether to trust the folder speck opens it in, which speck never answers\".\n",
    "seconds": 30,
    "usage": {
      "input_tokens": 315027,
      "cached_input_tokens": 250624,
      "cache_write_input_tokens": 0,
      "output_tokens": 1718,
      "reasoning_output_tokens": 383
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 8642,
      "cached": 116224,
      "write": 0,
      "output": 550
    },
    "cost_usd": 0.0344064,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T15:11:06.152Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "ptyCommand and readCursorUsage open the interactive CLI without a prompt and request /usage. Passing recorded-screen and CLI integration tests cover the plan, reset day, percentages, on-demand spend and limit."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "refreshCursorUsage saves readings through saveUsage; cursorUsageStale checks the ten-minute threshold and cursor-ran marker. Passing AC2 tests cover persistence, JSON output, cache freshness and invalidation after Cursor runs."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "readCursorUsage bounds reading time and tracks owned processes and groups during execution and cleanup. Passing AC3 tests cover timeout, unexpected screens, retaining the previous reading, one-line explanations, and now a surviving subprocess after Cursor exits early."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The reader uses Node built-ins and system commands without package dependencies. Passing AC4 tests check Linux and macOS script command forms. Live macOS execution remains unverified, as disclosed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The reported round ran the ticket tests, changed existing tests and previously failing test file: 157 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/cursor-usage.mjs:160",
        "issue": "The previous cleanup could lose surviving subprocesses when Cursor exited before cleanup began.",
        "suggested_fix": "Implemented: owned tracks descendant processes and process groups while the reader runs; cleanup signals tracked groups and processes. The new early-exit regression test verifies the surviving subprocess stops.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Cursor usage is read and cached as requested. The cleanup fix addresses the earlier concern, with a regression test covering unexpected exits. All reported tests now pass. The change is ready for the product owner’s merge decision."
  }
}
```

</details>
