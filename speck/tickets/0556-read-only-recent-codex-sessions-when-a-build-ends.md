---
id: "0556"
title: "Read only recent Codex sessions when a build ends"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-27-read-only-recent-codex-sessions-when-a-build-ends.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-29
started: "2026-10-29T14:17:26.372Z"

---
# 0556 · Read only recent Codex sessions when a build ends

**Status:** 🔍 reviewing

## Problem
When a build ends, `speck run` reads the first line of every session file in Codex's sessions folder to find the ones started in the ticket's worktree, then reads them all again for each one it finds, to collect its sub-agents. Every build does this, even one that never ran Codex, and the folder only grows: here 1,155 files (448 MB) took about a third of a second with the files cached, and more for each session found.

## Outcome
A build's end opens only the Codex session files that changed since the ticket's first build started, and counts the same sessions as before.

## Acceptance criteria
1. When a build ends, the Codex sessions kept as the ticket's delegated spend, with their sub-agents, are the same as today for every session whose files changed after the ticket's `started` time.
2. A session file that last changed before the ticket's `started` time isn't opened when a build ends, not even for its first line.
3. A build of a ticket with no `started` time reads every session file, as today.
4. No test that passed before this change fails.

## Out of scope
- Counting a resumed session's later turns (`speck/ideas/2026-10-27-count-a-delegated-codex-session-s-later-turns.md`).
- 0532's count of a Codex build's own sub-agents.

## Notes
- Asked for 2026-10-29 for the 0.21.1 patch release.
- From 0534's own note: `codexSessionsIn` and `codexSubagents` in `scripts/round-cost.mjs` each walk the whole folder, called from `recordDelegatedSpend` in `scripts/spend.mjs`.
- Decided: go by each file's last change, not its day folder (`YYYY/MM/DD`), so a session resumed later is found wherever its file is.
- Checked 2026-10-29: `~/.codex/sessions` here holds 1,155 files, 448 MB; `codexSessionsIn` took 336 ms and `codexSubagents` 103 ms with the files cached (timed by calling them directly).
- Shares `scripts/spend.mjs` with 0553, unchained: different functions.
- Relies on Codex's sessions folder layout as 0532 and 0534 already read it.
- Failing before this build: none
- Self-check: a start time that can't be read (blank, malformed, not a string) now reads every file, and a Date or milliseconds works too. Known limit: a recent sub-agent's ancestors come from session files, so an ancestor whose own file hasn't changed since the start isn't seen; a parent writes to its file when it starts one, so this needs a parent that stopped before the ticket started.

## In plain words
When a build finishes, speck looks through Codex's saved sessions to count what any Codex work started in the ticket's folder spent. It used to read every session Codex had ever saved, every time. Now it skips any session that hasn't changed since the ticket's first build started. Each build's end is quicker, and the slowdown no longer grows as Codex's history grows. The spend it counts is the same. To see it, look at a ticket's spend after a build that used Codex: the numbers are as before. One thing to watch: a ticket built before speck kept a start time still has every session read, as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
- Follow-ups (Delivery log only, no inbox notes):
  - Known limit: a session's ancestors above its parent are read from session files, so they're lost only when a session from before the start is resumed and starts a sub-agent in this worktree (reviewer accepted in round 2).
  - Tidy-up: `codexSubagents` still walks the folder once for each session it keeps. It now only stats old files, but it could share one walk with `codexSessionsIn`.
  - Skipped: steadying the speck-run timing tests that failed under load (0232 AC1/AC3, 0301). Already covered by `speck/ideas/2026-10-28-steady-the-0232-ac3-cpu-cost-test-under-load.md`, 0557 and 0559.

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
    "reviewed_sha": "df4a3c8df667a5288a3b563df1b13ce906f9ea03",
    "session": "fresh",
    "thread_id": "01a1881e-72d5-77a1-9007-8a4dbf4aea9e",
    "builder_response": "# Round 1 response (0556)\n\n- Tests run: test/spend-0556.test.mjs (with --related: 28 related files and the checks)\n\nChange: `rollouts` in scripts/round-cost.mjs takes a `since` time and keeps only rollout files whose mtime is at or after it (stat only, never opened), found by last change rather than day folder. `codexSessionsIn` and `codexSubagents` take `{ since }` (ISO string, Date or ms; blank/malformed → null → every file read as before). `recordDelegatedSpend` takes `started` and passes it to both; `speck run`'s recordExit passes the ticket's `t.fm.started`.\n\nTests: test/spend-0556.test.mjs (AC1: same kept sessions and sub-agents with and without the start time, including a session resumed later in an old day folder; AC2: old files never opened, spied on fs.openSync/readFileSync/createReadStream, and a file at exactly the start time is read; AC3: missing/blank/malformed start reads every file; the run.mjs wiring is a source check, since a real speck run test would be slow).\n\nTest files run: `speck test --related test/spend-0556.test.mjs` (28 related files plus the checks). The machine is under heavy load from other builds' full suites (load average 50–90 on 16 cores), so speck-run and panel timing tests fail with \"panel didn't start\", \"speck run didn't start watching\" and similar, a different set in each of three runs. I ran test/quick-waits-0232.test.mjs against the unchanged scripts and it fails the same way there. test/spend-0556.test.mjs, test/spend-0532.test.mjs, test/spend-0534.test.mjs and the other spend/round-cost tests all pass.\n\nKnown limit (in the ticket's Notes): a recent sub-agent's ancestors are read from session files, so an ancestor whose file hasn't changed since the start isn't seen. A parent writes to its file when it starts a sub-agent, so this needs a parent that stopped before the ticket started.\n",
    "seconds": 52,
    "usage": {
      "input_tokens": 108570,
      "cached_input_tokens": 67072,
      "cache_write_input_tokens": 0,
      "output_tokens": 1597,
      "reasoning_output_tokens": 122
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 41498,
      "cached": 67072,
      "write": 0,
      "output": 1597
    },
    "cost_usd": 0.1056732,
    "tests": {
      "failing": 12,
      "second_try": []
    },
    "saved_at": "2026-10-29T14:45:11.048Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/round-cost.mjs: codexSessionsIn and codexSubagents lose ancestry through excluded files. A read-only reproduction with recent A, old child B and recent grandchild C returned C's ancestors as [B] instead of [B,A], and no sub-agents for A instead of [B,C]. The new AC1 tests only compare trees whose files are all recent."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "rollouts checks mtime with statSync before sessionMetas opens files. The AC2 test spies on session file reads and checks that old files are never opened."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "sinceOf maps missing or unreadable times to null, which disables filtering in rollouts. The AC3 test exercises missing, blank and malformed values."
      },
      {
        "id": 4,
        "status": "unclear",
        "evidence": "The supplied run has 12 failures, no completion totals and no 0556 test results. Load-related failures are plausible, but this output does not establish a completed passing run of the ticket tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/round-cost.mjs",
        "issue": "Filtering metadata removes links through older ancestors. A recent session resumed after the ticket started can have an old parent file. With A -> B -> C, where only B is old, C loses its connection to A. recordDelegatedSpend can then count C separately, including when A is an already-counted build or review session. This violates the requirement to preserve accounting for recent sessions; documenting the limitation does not resolve it.",
        "suggested_fix": "Preserve ancestry information without opening old session files, and add regression coverage for a recent grandchild behind an old intermediate parent, including an already-counted ancestor. If that requires a broader design, raise the specific constraint for a product decision.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/spend-0556.test.mjs",
        "issue": "The review's test output contains no results for the new tests and no completed totals. The builder's claimed passes cannot be verified from the supplied run, and the existing failures remain unresolved.",
        "suggested_fix": "Provide a completed run of the ticket test file, required checks and previously failing test files. Establish whether remaining failures also occur on unchanged code under comparable conditions.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change correctly avoids opening older session files, but it can lose family relationships between sessions and count spend incorrectly. The test report is also incomplete. Both need resolving before approval."
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
    "reviewed_sha": "df4a3c8df667a5288a3b563df1b13ce906f9ea03",
    "session": "continued",
    "thread_id": "01a1881e-72d5-77a1-9007-8a4dbf4aea9e",
    "builder_response": "# Round 2 response (0556)\n\n- Tests run: test/spend-0556.test.mjs test/spend-0532.test.mjs test/spend-0534.test.mjs test/quick-waits-0232.test.mjs test/flaky-0207.test.mjs test/killed-0174.test.mjs test/run-0245.test.mjs test/run-switch-0301.test.mjs test/split-0018.test.mjs (speck test --files, so the checks too)\n- F1: disputed. The layout in the reproduction, a recent session behind an old intermediate, can't come from Codex for the sessions this ticket keeps. Here's why:\n  - `codexSessionsIn` keeps only sessions whose session_meta cwd is inside the ticket's worktree. `speck start` creates that worktree before it stamps `started`, and nothing runs in it until the build starts. So every kept session S was created after `started`.\n  - **Sub-agents (`codexSubagents(S)`)**: each descendant of S was spawned by its parent after that parent was created, so by induction after `started`. Creating a rollout file writes it, so every descendant's file has mtime ≥ `started` and is read. The case \"A recent, B old, C recent\" in `codexSubagents(A)` needs B, A's child, to be created before A, which is impossible. So the sub-agent tree is exactly today's.\n  - **Ancestors (`codexSessionsIn`)**: S's parent P spawned S after `started` and records that spawn in its own rollout (the spawn tool call and its result), so P's file is recent and P→S, and P's own session_meta, are both read. A link is lost only above P, and only if P is an old session (created before `started`, its file unchanged since) that is resumed after `started` and spawns a sub-agent into this worktree, with P's parent Q a thread countedThreads names. countedThreads' threads for this ticket (its build sessions and review rounds) all began after `started`, so Q would have to be another ticket's build, review or watch thread, a sub-agent of it would have to be resumed by hand, and that sub-agent would then have to spawn into this ticket's worktree. That isn't the ticket's accounting of recent sessions. It is a session the ticket's AC2 rules out reading, so recovering Q would mean opening an old file, which AC2 forbids.\n  - I checked the real `~/.codex/sessions` here: for every sub-agent file, the parent's files last changed at or after the sub-agent's session_meta timestamp. The parent never goes quiet before its child starts.\n  - The reproduction's B is old while its child C is recent. That's only possible if fixtures set mtimes by hand. If you see a real Codex flow that makes it happen, I'll raise it as a product question (AC1 against AC2), as you suggest.\n- F2: fixed. /tmp/speck-0556-tests.txt is now a completed `speck test --files` run of the files above: 182 tests, 175 pass, 4 fail, 3 skipped, with all 0556 tests listed and passing. The 4 failures are speck-run timing tests (0232 AC1/AC3, two 0301), with load average 55–66 on 16 cores from other builds' whole suites. The same files run on the unchanged scripts (HEAD~1's round-cost.mjs, run.mjs and spend.mjs, output in /tmp/speck-0556-unchanged.txt) fail 0232 AC3 the same way. Across the four runs this build, the failing set differs each time: 0207, 0174, 0245 and 0018 failed once and then passed. None of them reaches the session-reading code: run.mjs's only change is an extra field in the try/catch'd recordDelegatedSpend call when a build ends.\n",
    "seconds": 35,
    "usage": {
      "input_tokens": 252187,
      "cached_input_tokens": 202496,
      "cache_write_input_tokens": 0,
      "output_tokens": 2474,
      "reasoning_output_tokens": 189
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 8193,
      "cached": 135424,
      "write": 0,
      "output": 877
    },
    "cost_usd": 0.0386984,
    "tests": {
      "failing": 4,
      "second_try": []
    },
    "saved_at": "2026-10-29T14:49:36.940Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The passing 0556 AC1 tests exercise session and descendant accounting, including recent files in older day folders. scripts/spend.mjs passes started to both readers. The ancestry counterexample from round 1 does not represent the normal ticket lifecycle: worktree sessions and their descendants originate after the first build starts."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/round-cost.mjs: rollouts checks statSync(...).mtimeMs before opening a file. Passing AC2 tests verify old files are never opened and files exactly at the boundary are read."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "sinceOf returns null for missing or unreadable times, disabling filtering. The passing AC3 test verifies that all session files are read."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The completed run reports 182 tests: 175 passed, four failed and three skipped; all seven 0556 tests passed. Inspection identifies the remaining failures as timing assertions, including checking that finite-duration fake builds remain alive. The unchanged-code run also reproduces a timing failure. No regression attributable to this change was identified; shipping retains the whole-suite gate."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/round-cost.mjs",
        "issue": "The original reproduction used an old intermediate ancestor in a session tree originating in the ticket worktree. That does not follow the normal build lifecycle: those sessions and their descendants are created after started.",
        "suggested_fix": "No change required for the ticket's normal build lifecycle.",
        "state": "dispute_accepted"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/spend-0556.test.mjs",
        "issue": "The previously incomplete test evidence has been replaced with a completed report containing all seven passing ticket tests. Remaining failures are consistent with timing problems under load.",
        "suggested_fix": "No further change required for this finding.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The change skips older Codex session files while preserving accounting for normal ticket builds. All seven ticket tests pass. The remaining timing failures do not indicate a regression from this change; the full suite still runs before shipping."
  }
}
```

</details>
