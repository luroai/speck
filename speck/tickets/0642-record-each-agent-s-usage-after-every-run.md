---
id: "0642"
title: "Record each agent's usage after every run"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T14:17:37.761Z"

---
# 0642 · Record each agent's usage after every run

**Status:** 🔍 reviewing

## Problem
You can't see how close Claude or Codex is to its usage limit until a build stops on it, and speck can't pick another agent before that happens. Both agents already report their usage with every run, and speck throws it away.

## Outcome
After every build, review round and watch run on Claude Code or Codex, speck keeps that agent's latest usage, and `speck agents` shows it.

## Acceptance criteria
1. When a Claude Code run that speck started or watches ends, speck keeps Claude's latest usage from its log: for each window it reports (`five_hour`, `seven_day`), how much is used as a percentage, when it resets and whether it's refused, with the time it was read.
2. When a Codex run that speck started ends (a build, a review round or a watch run), speck reads the same from that run's session file: the five-hour and weekly windows' used percentage and reset time, the plan and whether a limit is reached, with the time it was read.
3. The readings are kept per agent for this machine in the main checkout's `speck/.cache/machine/`, which git ignores, a newer reading replacing an older one, and a run whose log or session file has no reading leaves the last one as it was.
4. `speck agents` prints, under each agent with a reading, each window's percentage used and when it resets, and how long ago it was read; `speck agents --json` gives the same as data.
5. No test that passed before this change fails.

## Out of scope
- Cursor: 0643.
- Showing it in the panel: 0646.
- Acting on it: 0647 to 0649.

## Notes
- 1.2 on the roadmap, "Your team". From `speck/ideas/2026-11-10-show-each-agent-s-usage-in-the-panel.md`.
- Checked 2026-11-11: Claude Code's stream-json has `rate_limit_event` lines whose `rate_limit_info.unifiedWindows` holds `five_hour` and `seven_day`, each with `utilization` (0 to 1), `resetsAt` (epoch seconds) and `status`. `scripts/usage-limit.mjs` already reads `status` and `resetsAt`.
- Checked 2026-11-11 (Codex 0.159.0): `codex exec --json` gives only tokens; the session file `~/.codex/sessions/YYYY/MM/DD/rollout-*-<thread_id>.jsonl` has `token_count` events with `rate_limits.primary` (`window_minutes` 300) and `rate_limits.secondary` (10080), each with `used_percent` and `resets_at` (epoch seconds), plus `plan_type` and `rate_limit_reached_type`. speck already finds these files by thread id for spend (`scripts/round-cost.mjs`).
- Failing before this build: none
- Self-check: an unreadable or tampered usage file (a bad time, a `constructor` key) now reads as no readings rather than failing `speck agents`; a build on a model provider keeps nothing; kept `scripts/run.mjs` and `scripts/foreman-agent.mjs` within 600 lines by keeping the build hook on `limitQueues` and re-exporting the watch hook from `usage-limit.mjs`.
- A review round on Claude Code (`--output-format json`) has no `rate_limit_event` lines, so it gives no reading; a build or watch run on Claude Code (stream-json) does.
- speck (2026-11-11 14:38 UTC) told you: The build is slow because the machine is heavily loaded (load average 25 to 43) from other builds running at once. Its long related-test runs each had one or two timing-sensitive tests fail (a different one each run: 0622, then 0630 and 0264), and the build spent its time re-running them; every one passed when run on its own, and it has now committed and started its review. Why: The log shows different tests failing on each full run while the same tests pass alone, which points to load-related timing failures rather than anything broken on the base branch or in this change.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
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
    "reviewed_sha": "715bca398b45d22e452ea0714292d675314f9535",
    "session": "fresh",
    "thread_id": "01a1cb0a-6eb0-7990-b699-1f38cae63fe5",
    "builder_response": "- Tests run: speck test --related test/agent-usage-0642.test.mjs (the ticket's own file, plus every existing test file naming a changed file, and the commands.checks files).\n- In that run, two tests failed (0630 AC3 in test/full-suite-0630.test.mjs and 0264 AC3 in test/ship-0264.test.mjs), and in an earlier run of the same set a different one (0622 in test/usage-limit-0622.test.mjs). Each is a timing test and the machine's load average was 30-50 from other builds. All three files were run again on their own and pass (the lines at the end of the test output). None touches what this change does.\n- Notes: a review round on Claude Code (its built-in command uses --output-format json) has no rate_limit_event lines, so it gives no reading; builds and watch runs on Claude Code (stream-json) do. Codex reviews read the session file of the thread the round started or resumed.\n- No pictures: nothing anyone sees in the panel changes (the panel is 0646).\n",
    "seconds": 52,
    "usage": {
      "input_tokens": 180097,
      "cached_input_tokens": 128768,
      "cache_write_input_tokens": 0,
      "output_tokens": 1304,
      "reasoning_output_tokens": 169
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 51329,
      "cached": 128768,
      "write": 0,
      "output": 1304
    },
    "cost_usd": 0.1285748,
    "tests": {
      "failing": 2,
      "second_try": []
    },
    "saved_at": "2026-11-11T14:37:53.007Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "claudeUsageInLog parses both windows, percentages, resets and refusal status. Passing AC1 tests exercise parsing and the build/watch storage hooks."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "Codex parsing and build/review/watch hooks have passing tests, but codexUsageInSession uses the event timestamp for read_at rather than the time it was read."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "Passing AC3 tests cover the ignored main-checkout location and sequential replacement. saveUsage performs an unlocked read-modify-write, so concurrent processes can lose readings or replace newer data with older data."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "Passing AC4 tests exercise text and JSON output. However, Codex's displayed reading age derives from its event timestamp, so it does not report how long ago speck read it."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The related run passed all 15 ticket tests. Two existing tests failed under load; the supplied output records passing isolated reruns of all three previously failing files. No regression attributable to this change was identified."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/agent-usage.mjs:92",
        "issue": "saveUsage reads the shared file and later replaces it without locking. Two review/build processes can read the same state, then each write its own version: the last writer discards the other agent's update. For the same agent, an older reading can overwrite a newer one because the freshness comparison used stale state. Atomic rename prevents partial files but does not prevent these lost updates.",
        "suggested_fix": "Serialise the complete read, freshness check and replacement across processes. Add a test that forces overlapping saves and verifies that both agents survive and the newest reading wins.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/agent-usage.mjs:62",
        "issue": "Codex's read_at is the session event timestamp rather than the time speck reads it. A read-only reproduction reading a 10:00 event at 12:00 returns read_at 10:00. Consequently, speck agents reports a two-hour-old read immediately after reading it. The new tests encode this incorrect behaviour.",
        "suggested_fix": "Record the actual read time in read_at. Preserve the source event timestamp separately for selecting the latest usage and preventing stale events from replacing newer ones. Update tests to distinguish these times and verify the displayed age.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Usage collection and display are implemented and tested, but simultaneous runs can discard saved readings, and Codex shows the wrong time since the reading was taken. Fix both before merge."
  }
}
```

</details>
