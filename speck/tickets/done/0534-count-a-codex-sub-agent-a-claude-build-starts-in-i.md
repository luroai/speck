---
id: "0534"
title: "Count Codex sessions started in a ticket's worktree in its spend"                # one outcome, no "and"
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
after: ["0532", "0533"]                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T18:47:24.053Z"
approved: "2026-10-27T18:57:05.646Z"
finished: "2026-10-27T19:01:04.323Z"

---
# 0534 · Count Codex sessions started in a ticket's worktree in its spend

**Status:** ✅ done

## Problem
Some research works better on Codex: in a test on 27 October, Opus was poor at finding LinkedIn contacts and Codex was better. So a Claude Code build will hand that part of a ticket to Codex, running `codex exec` itself, on a model such as `gpt-6.1-sol`. speck never sees a Codex process the builder starts, so the ticket's spend leaves it out and the user can't see what that research costs.

## Outcome
A Codex session started inside a ticket's worktree counts in that ticket's spend, however it was started, with no command or step the builder has to remember.

## Acceptance criteria
1. When a build of a ticket ends, `speck run` records each Codex session whose session file in `$CODEX_HOME/sessions` (or `~/.codex/sessions`) gives as its `cwd` the ticket's worktree or a folder inside it. Each one's tokens and cost are counted and priced as a Codex build's are, including its sub-agents (0532). A session whose `cwd` is outside the worktree, including another ticket's worktree, isn't counted.
2. Each session counts once for the ticket, however many builds of it end. A session already counted as one of the ticket's builds, review rounds or watch agent runs (matched by its thread id), or as a sub-agent of one, isn't counted again.
3. `speck status --json` gives each ticket's `delegated_tokens` and `delegated_cost_usd`, summed over those sessions, or null when it has none. Its `total_cost_usd` and `total_tokens` include them, and `total_cost_unknown` names `delegated` when a session has tokens but no known cost. `speck spend` counts them as a part of their own, `delegated`.
4. A missing sessions folder, or a session file that can't be read or parsed, records nothing for that file and doesn't stop the build's end being handled.
5. `docs/brief.md`, where it says how `speck run` records a ticket's spend, says it counts Codex sessions started in the ticket's worktree. No test that passed before this change fails.

## Out of scope
- Agents other than Codex, such as Cursor or a model provider, run from inside a build.
- Codex started from a folder outside the worktree, for example with `-C`.
- Showing delegated spend as its own line in the panel. Its total already includes it.
- Choosing the builder's model per ticket (`speck/ideas/2026-10-11-choose-the-builder-s-model-per-ticket.md`).

## Notes
- Replaces an earlier draft's `speck delegate` command. Reading the session files means the builder can run `codex exec` directly, or from a Claude sub-agent, and it still counts.
- after 0532 (it reuses 0532's sub-agent counting and changes the same spend code) and 0533 (both change the brief's spend wording).
- Codex review rounds run `codex exec` too and keep their `thread_id` in the round's meta (`scripts/review.mjs`). A Codex build keeps its session in the run record. Criterion 2 keeps both out.
- Recorded when the build ends, as the builder's spend is, so `speck status` and the panel don't scan Codex's sessions folder each time they read a ticket.
- `speck run` sets `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` for Claude builds, so the builder runs Codex in the foreground. A Claude Code Bash call times out after 10 minutes at most, so a long research run may need splitting, for example one call per case.
- Tests use session files written in a temporary `CODEX_HOME`. They never run real Codex.
- Checked 2026-10-27: a `codex exec` session file's first line is `session_meta`, whose payload has `cwd` (the folder it ran in), `timestamp`, `originator: "codex_exec"` and `source: "exec"`, and its file name ends `-<thread id>.jsonl` (local test, codex-cli 0.159.0). `gpt-6.1-sol` is in `codex debug models` and has rates in `scripts/prices.json` ($2 per million input tokens, $10 per million output).
- Checked 2026-10-27: which sandbox and config settings Codex needs to search the web from `codex exec` is still not tried, and this ticket doesn't need it. `codex --help` (codex-cli 0.159.0) lists `--search` for live web search, but `codex exec --help` doesn't, so the research ticket must find how `codex exec` turns it on.

- Failing before this build: none
- Self-check: no changes. A Codex review round that failed before saving its round leaves a session in the worktree with no thread_id kept, so it counts as delegated: it is real spend that nothing else records.

## In plain words
When a builder hands part of a ticket to Codex, for example by running Codex itself to do some research, what that Codex run costs now counts in the ticket's spend. It's picked up when the build ends, from any Codex session that ran in the ticket's own folder, so the builder doesn't need to do anything special. The ticket's total cost in the panel includes it, and `speck spend` shows it as its own Delegated column when any ticket has some. To see it, have a build run Codex in its folder, then look at the ticket's total once the build ends. Worth knowing: it only works for tickets built in their own folder (the default), and a Codex session that's carried on in a later build only counts the part from before it was first recorded.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Sub-agent sessions are discarded even when nothing else counts them.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 584,445
- Elapsed since build started: 10 min
- Changed lines: 230 (limit 5000)
- Follow-ups:
  - Each build's end reads every Codex session file's first line, and again per session found, even for builds that never ran Codex. Inbox: `speck/ideas/2026-10-27-read-only-recent-codex-sessions-when-a-build-ends.md`.
  - A delegated session is recorded once, so turns added to it on a later build (`codex exec resume`), or sub-agents added under it later, aren't counted. Inbox: `speck/ideas/2026-10-27-count-a-delegated-codex-session-s-later-turns.md`.
  - Known limit: a Codex review round that fails before saving its round leaves no thread_id, so its session counts as delegated spend. It is real spend nothing else records.
  - Known limit: with `worktrees` off there's no worktree, so nothing is counted.

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
    "reviewed_sha": "4f0b93781f7c72ee90040b2194d71fd698b1eae3",
    "session": "fresh",
    "thread_id": "01a17eb7-03df-7d52-9870-4bb2ea7f8d36",
    "builder_response": "- Tests run: `speck test --related test/spend-0534.test.mjs` (the ticket's own file, plus the 192 existing test files that name a changed file, with the `commands.checks` files): 1983 tests, 0 failing.\n- Notes for the reviewer:\n  - The scan is `codexSessionsIn` in `scripts/round-cost.mjs`; the record, exclusions and sums are `recordDelegatedSpend`, `countedThreads`, `delegatedSpent` and the `delegated` part in `scripts/spend.mjs`. `speck run` calls it at the end of `recordExit` in `scripts/run.mjs`, inside its own try/catch.\n  - Sub-agent sessions (with a parent thread) are never counted as delegated sessions on their own. They count with the session that started them (codexSubagents), or belong to an excluded build/round, which covers AC2's \"or as a sub-agent of one\".\n  - `recordWatchSpend` now also keeps a Codex watch run's thread, so AC2 can exclude it.\n  - `speck spend` shows a Delegated column only when a ticket shown has delegated spend, so tables without any read as before (0527's tests).\n  - The worktree is found with `ticketsElsewhere`, which leaves out the main checkout, so with `worktrees` off nothing is counted (stated in the brief).\n",
    "seconds": 28,
    "usage": {
      "input_tokens": 223695,
      "cached_input_tokens": 162688,
      "cache_write_input_tokens": 0,
      "output_tokens": 1045,
      "reasoning_output_tokens": 173
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 61007,
      "cached": 162688,
      "write": 0,
      "output": 1045
    },
    "cost_usd": 0.1487328,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-27T18:55:13.109Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The passing AC1 tests cover ordinary sessions and descendants with a usable parent. However, scripts/round-cost.mjs:180 unconditionally excludes sub-agent sessions, and :185–186 excludes parents without usage. A valid child with usage is therefore lost when its parent's file is missing, malformed or has no usage."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "countedThreads and delegatedOf in scripts/spend.mjs exclude recorded threads and repeated delegated records. Both AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "delegatedSpent, spendParts and sumParts feed statusData and spendReport. Both AC3 tests passed, covering totals, null values and unknown delegated costs."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "sessionMetas and sessionUsage catch file errors; run.mjs catches delegated recording errors separately from saving the exit. Both AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "docs/brief.md's speck run entry describes counting Codex sessions in the worktree. The AC5 test checks document facts. Reported related tests had zero failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/round-cost.mjs:180",
        "issue": "Sub-agent sessions are discarded even when nothing else counts them. For example, a parent session in the worktree with no token_count and a child with valid usage produces no delegated spend: the parent fails sessionUsage and the child is unconditionally skipped. A missing or malformed parent file has the same effect. This loses real spend required by AC1.",
        "suggested_fix": "Exclude a sub-agent only when its usage is included through a recorded ancestor or an excluded build, review or watch session. Otherwise record its eligible usage and descendants once. Add regression tests for a child with usage whose parent has no usage or an unreadable/missing file.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change records ordinary delegated Codex spend and includes it in status and spend totals. The reported tests pass, but valid sub-agent spend can disappear when its parent's usage is unavailable. Fix that accounting gap before merge."
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
    "reviewed_sha": "6ae3762cdd6b5873cbf98ca35412c8f89c8d8693",
    "session": "continued",
    "thread_id": "01a17eb7-03df-7d52-9870-4bb2ea7f8d36",
    "builder_response": "- Tests run: test/spend-0534.test.mjs test/spend-0532.test.mjs test/spend-0527.test.mjs test/watch-spend-0525.test.mjs (with the `commands.checks` files): 150 tests, 0 failing.\n- F1: fixed. `codexSessionsIn` (scripts/round-cost.mjs) now returns every session in the worktree, sub-agents included, each with its ancestors (read from every session file's session_meta, whatever its cwd) and with model/usage null when it has no usage yet. `recordDelegatedSpend` (scripts/spend.mjs) leaves out a session when it or any ancestor is already counted (a build, review round, watch run or kept delegated session). Of the rest, it keeps each one with no uncounted ancestor among them, counting its own usage when it has any plus every descendant through `codexSubagents`. A parent with no usage therefore still carries its sub-agents' spend, and a sub-agent whose parent's file is missing or unparseable counts on its own. A group with no usage at all records nothing until it has some. New tests: \"0534 AC1: a sub-agent with usage counts when its parent has none, or its parent's file is missing or can't be parsed\" and \"0534 AC1: a session with no usage, and no sub-agent with any, records nothing until it has some\".\n",
    "seconds": 15,
    "usage": {
      "input_tokens": 358076,
      "cached_input_tokens": 288896,
      "cache_write_input_tokens": 0,
      "output_tokens": 1629,
      "reasoning_output_tokens": 191
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 8173,
      "cached": 126208,
      "write": 0,
      "output": 584
    },
    "cost_usd": 0.0348068,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-27T18:56:43.319Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "codexSessionsIn identifies sessions within the worktree and tracks ancestry. recordDelegatedSpend includes descendants through codexSubagents, including when a parent has no usage or is unavailable. Passing AC1 tests cover discovery, pricing, descendants, outside-worktree exclusions and build-end recording."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "countedThreads excludes previously recorded sessions; recordDelegatedSpend checks both session and ancestor IDs and groups descendants under their eligible ancestor. Passing AC2 tests cover repeated recording and build, review and watch exclusions."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "delegatedSpent supplies status fields; spendParts and sumParts include delegated totals and unknown costs; spendReport exposes delegated separately. Both AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Session discovery and usage parsing catch file errors, while run.mjs isolates delegated recording from exit handling. Both AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The brief's speck run entry describes counting Codex sessions started in the ticket's worktree. The document-fact test passed. This round reports 150 passing tests, zero failures and three skips; the first round's related tests also had zero failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/round-cost.mjs:168",
        "issue": "Sub-agent spend was lost when its parent's usage was unavailable.",
        "suggested_fix": "Implemented: retain eligible sub-agent sessions, track their ancestors and count usage through an eligible parent or independently when the parent is unavailable. New passing regression tests cover parents with no usage and missing or malformed parent files.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Codex sessions started in a ticket's worktree now contribute to its recorded spend and totals, with duplicate exclusions. The fix also preserves sub-agent spend when parent usage is unavailable. All criteria pass, and no blocking findings remain."
  }
}
```

</details>
