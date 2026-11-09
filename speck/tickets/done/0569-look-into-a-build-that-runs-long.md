---
id: "0569"
title: "Look into a build that runs long"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-13-look-into-a-build-that-runs-long.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0567"]                # ticket ids that must be done first
created: 2026-11-08
started: "2026-11-09T00:14:01.074Z"
approved: "2026-11-09T00:24:04.778Z"
finished: "2026-11-09T00:28:15.288Z"

---
# 0569 · Look into a build that runs long

**Status:** ✅ done

## Problem
When a build runs far longer than usual, nobody notices until you ask why. On 2026-10-13 a test added by 0149 hung about half of all full test runs, builds went from 6 to 9 minutes to 26 and 45+, and spotting it and raising the fix (0159) took a human, though speck already knows its usual build time.

## Outcome
When a build runs well past the usual time, speck looks into why and tells you what it found, raising a draft fix ticket when the base branch itself is broken.

## Acceptance criteria
1. With `watch: fix` or `watch: decide`, when a build has been running for more than twice the median build time of the last 20 shipped tickets, and for at least 20 minutes, `speck run` starts its watch agent for it once per build. The agent's brief names the ticket, how long the build has run, the median, the last lines of its log and the machine's load average. A paused build doesn't count.
2. With `watch: tell`, `speck run` says once in its log that the build is running long, with the same figures, and starts no agent. With `watch: off`, it does neither.
3. `speck watch` has a `tell` action that writes what the agent found in the ticket's Notes and in `speck run`'s log, needs no answer, and doesn't count under Needs you.
4. The `speck-watch` skill tells the agent, for a build that runs long, to read its log, its test runs in `speck/.cache/results/` and the machine's load, then to make a draft fix ticket with `fix` when the base branch is broken (such as a test that hangs), and otherwise to `tell` what it found, even when the slowness was harmless (checked by review).
5. No test that passed before this change fails.

## Out of scope
- Stopping or restarting the slow build.
- Setting a fix ticket ready: it stays a draft for you, as `speck watch fix` makes it today.

## Notes
- Asked for 2026-11-08 for release 0.22.0, alongside 0563 to 0568 (speck decides and tells you): "Agree to all of that including 4. Set it all ready and get a release out".
- Decided with the user: the fix ticket is raised as a draft and you're told; Gate 1 stays yours.
- Today: `speck run` starts the agent for ended builds (`lookInto` in `scripts/run.mjs`, `buildStuck` and `stuck` in `scripts/foreman-agent.mjs`); `speck watch fix` already makes a draft fix ticket (`makeFixTicket`). The panel works out the median build time in `templates/panel-model.js`.
- Waits for 0567, which adds `decide` to `speck watch`'s actions in `scripts/foreman-agent.mjs`, after 0564 and 0566.
- Relies on nothing outside this repo; the load average is Node's `os.loadavg()`, which is all zeros on Windows.
- Failing before this build: none
- Self-check: dropped a look at a long build whose build ended while it waited for the agent; held the look back while a question waits for you (0566); timed a hand-back or the agent's resume from then; kept `tried` for stops, so a long look doesn't swallow a later stop.

## In plain words
When a build has run for more than twice the usual time, and at least 20 minutes, speck now notices without being asked. With the watch setting on fix or decide, its agent looks into why and tells you what it found, in the ticket's notes and speck run's log, or raises a draft fix ticket if the main branch itself is broken. With the setting on tell, speck run just says the build is running long, and with it off nothing happens.

You'll see it next time a build runs long: look for a "running long" line in speck run's log and, with fix or decide, a note on the ticket. It needs no answer from you and doesn't add to Needs you. The agent never stops or restarts the build.

Worth watching: your own long-running build conversations count too, so one left open for a long time can get a look from the agent.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 A queued long-build investigation can start after the build is paused.; F2 longBuilds explicitly excludes records with seen: true, which represent builds started outside speck run and adopted into its running set.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 432,918
- Elapsed since build started: 10 min
- Changed lines: 154 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "8d9735db1130c9efde37ebd3a57ad413b7652815",
    "session": "fresh",
    "thread_id": "01a1bdaf-08b6-73e3-9667-1f1c210d708d",
    "builder_response": "- Tests run: test/long-build-0569.test.mjs and, through --related, every test file naming a changed file (2058 tests: 0 failed, 3 skipped).\n",
    "seconds": 46,
    "usage": {
      "input_tokens": 271289,
      "cached_input_tokens": 219264,
      "cache_write_input_tokens": 0,
      "output_tokens": 1416,
      "reasoning_output_tokens": 253
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 52025,
      "cached": 219264,
      "write": 0,
      "output": 1416
    },
    "cost_usd": 0.1401364,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T00:22:52.952Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/foreman-agent.mjs longBuilds and check cover thresholds and briefs, but exclude adopted external builds and can launch a queued investigation after its build is paused. The passing AC1 tests do not cover the queued-then-paused case."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "Passing AC2 tests cover tell/off and figures for builds launched by speck run. However, longBuilds excludes records with seen: true, so watched builds started outside speck run receive no long-running notice."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "foremanAction records tell in Notes; finish writes it to the log; agentView treats only ask as requiring an answer. Passing AC3 tests exercise these behaviours and the draft fix action."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "skills/speck-watch/SKILL.md, ‘A build that runs long’, instructs reading the build log, cached test results and machine load, then making a draft fix for a broken base branch or reporting findings with tell, including harmless slowness."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported related-test run: 2055 passed, 0 failed, 3 skipped. Existing tests were not modified. Whole-suite verification remains the ship check."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/foreman-agent.mjs",
        "issue": "A queued long-build investigation can start after the build is paused. If another watch agent is busy, longBuilds queues the investigation. On subsequent checks, queue cleanup checks only whether running still contains the ticket; paused builds remain there. When the busy agent ends, launch starts the investigation despite the pause.",
        "suggested_fix": "Revalidate queued long-build eligibility before launching, including pause and ticket status. Preserve the opportunity to investigate after the build resumes. Add a regression test that pauses a build while its investigation is queued.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/foreman-agent.mjs",
        "issue": "longBuilds explicitly excludes records with seen: true, which represent builds started outside speck run and adopted into its running set. Criteria 1 and 2 contain no such exclusion, and the existing workflow watches these builds too. They silently receive neither investigation nor a tell-mode warning.",
        "suggested_fix": "Include adopted external builds in long-running detection and test both agent and tell modes for them. Handle unavailable log information explicitly rather than excluding the build.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Slow-build detection and reporting work on the tested paths, and the investigation guidance is clear. Two gaps need fixing: builds started outside speck run are ignored, and an investigation waiting in the queue can start after its build is paused."
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
    "reviewed_sha": "dfe21435265f8125a281caef47dadec7ae669bef",
    "session": "continued",
    "thread_id": "01a1bdaf-08b6-73e3-9667-1f1c210d708d",
    "builder_response": "- Tests run: test/long-build-0569.test.mjs (plus the commands.checks files): 142 tests, 0 failed, 3 skipped.\n- F1: fixed. check() in scripts/foreman-agent.mjs now re-checks each queued long look before launching (new canRunLong in scripts/long-build.mjs: paused or out of hand). A queued look on a paused, blocked or approved build is dropped and its once-per-build mark cleared, so it comes back once the build is running again. Tests: \"a look waiting for the agent doesn't start while its build is paused, and comes once it plays\", and the blocked variant.\n- F2: fixed. Removed the rec.seen exclusion, so builds speck run adopted from outside it count in both agent and tell modes. A missing log reaches the brief as \"(the log is empty or missing)\". Tests: \"a build started outside speck run counts too, whether or not it has a log\" and the tell variant. docs/brief.md no longer mentions the exclusion.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 430748,
      "cached_input_tokens": 360704,
      "cache_write_input_tokens": 0,
      "output_tokens": 2170,
      "reasoning_output_tokens": 253
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 18019,
      "cached": 141440,
      "write": 0,
      "output": 754
    },
    "cost_usd": 0.057722,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T00:23:56.171Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/long-build.mjs implements the last-20 median, both time thresholds and pause exclusion. foremanAgentQueue persists once-per-build detection and rechecks queued eligibility. Passing AC1 tests cover fix/decide, brief contents, restart persistence, adopted builds and pausing while queued."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "foreman-agent.mjs longBuilds logs figures once with tell and does nothing with off. Passing AC2 tests cover figures, persistence, adopted external builds and no agent launch."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "foremanAction writes tell findings into Notes; finish reports them in the run log. Passing AC3 tests verify both outputs, no question or Needs you count, action validation and draft fix creation."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "skills/speck-watch/SKILL.md, ‘A build that runs long’, explicitly requires reading logs, cached test results and load, raising a draft fix for a broken base branch, and otherwise reporting findings even for harmless slowness."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Round 2 reports 139 passed, 0 failed and 3 skipped; round 1's related tests also had no failures. No existing tests were weakened. Whole-suite verification remains the ship check."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/foreman-agent.mjs",
        "issue": "Queued investigations could previously start after their build was paused.",
        "suggested_fix": "Implemented: check revalidates queued investigations with canRunLong and clears the detection mark when deferred. Passing regression tests cover pause/resume and blocked/building transitions.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/foreman-agent.mjs",
        "issue": "Builds adopted from outside speck run were previously excluded from long-running detection.",
        "suggested_fix": "Implemented: removed the seen exclusion. Passing regression tests cover agent and tell modes, including a missing log; documentation now matches.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Both review findings are fixed. Slow builds now receive attention regardless of how they started, and queued investigations respect pauses. All criteria pass, with no blocking concerns remaining."
  }
}
```

</details>
