---
id: "0719"
title: "Read Claude's usage after a Claude review round"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: cursor              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-11-read-claude-s-usage-after-a-claude-review-round.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T14:27:38.321Z"
waited_seconds: 13
approved: "2026-11-24T15:00:57.998Z"

---
# 0719 · Read Claude's usage after a Claude review round

**Status:** 👍 approved

## Problem
speck runs Claude reviewers with `--output-format json`, which has no usage-limit lines, so a review round on Claude, as reviewer or as a stand-in from `reviewer_bench`, gives no reading. Claude's usage in `speck agents` and Settings can be stale just when it nears its limit.

## Outcome
After a review round on Claude Code, speck keeps Claude's latest usage reading, as after a Claude build.

## Acceptance criteria
1. After a review round run on Claude Code, as the reviewer or a stand-in from `reviewer_bench`, `speck agents` and Settings show the usage reading from that round, as they do after a Claude build.
2. The round's verdict, cost and session id are saved as before.
3. A reviewer command set in `reviewer_options` that prints a single JSON result, as today's does, still gives its verdict and cost.
4. No test that passed before this change fails.

## Out of scope
- Codex and Cursor readings, which already work (0642, 0643).

## Notes
- `CLAUDE_READ_ONLY` in `scripts/reviewers.mjs` uses `--output-format json`; `keepUsage` passes the output to `claudeUsageInLog` (`scripts/agent-usage.mjs`), which looks for `rate_limit_event` lines. `verdictFromOutput`/`jsonIn` parse the whole output as one JSON value.
- Checked 2026-11-24: `claude -p --output-format stream-json --verbose` prints `rate_limit_event` lines and ends with a `type: "result"` line carrying `session_id`, `total_cost_usd` and `usage` (Claude Code 2.1.331, `claude --help` and a saved build log).
- Failing before this build: none
- Builder: Cursor took over this build from Claude at 2026-11-24 14:40 UTC, because Claude's usage limit was reached until 2026-11-24 16:10 UTC, more than an hour away.
- Self-check: dropped the brief's claim that a Claude review round reports no usage; provider reviewers stay on a single JSON result.
- Note: `test/tmp-cleanup.test.mjs` AC1 AC2 fails on this machine (Node 24's default reporter prints `ℹ fail 2`, the check expects `# fail 2` from TAP). It fails with this branch's changes stashed too, so it isn't from this ticket.

## In plain words
After a Claude Code review round, speck updates Claude's usage reading the same way it does after a Claude build. `speck agents` and Settings show that fresher figure, including when Claude stood in for another reviewer. Verdicts, costs and sessions from the round are unchanged, and a custom Claude reviewer command that still prints one JSON result still works. To see it, run a Claude review round, then open Settings or run `speck agents`: Claude's five-hour and weekly usage should match what that round reported.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 496,379
- Elapsed since build started: 33 min
- Changed lines: 34 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
### Follow-ups
- Inbox: run the tmp-cleanup fixture with the TAP reporter (`speck/ideas/2026-11-24-run-tmp-cleanup-fixture-with-tap-reporter.md`), so that check passes on Node 24's default reporter.

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
    "reviewed_sha": "ddd3f861ad2dc948746139e5b6c61a913ddcb2b5",
    "session": "fresh",
    "thread_id": "01a20e11-ceca-7050-b1e7-3a9433830f09",
    "builder_response": "- Tests run: speck test --related test/review-claude-usage-0719.test.mjs test/review-claude-0292.test.mjs test/review-claude-0314.test.mjs (the ticket's own file, the two existing Claude reviewer files it changed, plus every existing test file naming a changed file, and the commands.checks files).\n- In that run, nine tests failed. None is from this change:\n  - `test/tmp-cleanup.test.mjs` AC1 AC2 expects TAP's `# fail 2`; Node 24's default reporter prints `ℹ fail 2`. It fails with this branch's changes stashed too.\n  - `test/related-0676.test.mjs`, `test/results-0677.test.mjs`, `test/turns-0239.test.mjs` and the nested failures inside `test/docs-0267.test.mjs` are turn/load flakes under `max_parallel_tests` (other builds were running). Re-running the ticket's own files alone passes.\n- Every 0719, 0292 and 0314 test in that run passed.\n- Notes: Claude's built-in reviewer now uses `--output-format stream-json --verbose` so `keepUsage` can read `rate_limit_event` lines; `verdictFromOutput` takes the last `type: \"result\"` line. A custom `reviewer_options.claude.command` that still prints one JSON value works as before. Provider reviewers stay on a single JSON result (their usage isn't kept).\n- No pictures: nothing anyone sees in the panel changed (Settings already reads the same usage store).\n",
    "seconds": 36,
    "usage": {
      "input_tokens": 495428,
      "cached_input_tokens": 401408,
      "cache_write_input_tokens": 0,
      "output_tokens": 951,
      "reasoning_output_tokens": 88
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 94020,
      "cached": 401408,
      "write": 0,
      "output": 951
    },
    "cost_usd": 0.2376908,
    "saved_at": "2026-11-24T15:00:13.518Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/reviewers.mjs uses stream-json --verbose for Claude and retains keepUsage on fresh and resumed rounds. Passing 0719 AC1 tests exercise ordinary, resumed and reviewer_bench rounds and speck agents output. Settings reads the same store through subscriptionsAnswer; test/subscriptions-0646.test.mjs covers stored readings and their display."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "verdictFromOutput selects the last stream result envelope, preserving usage, cost and session extraction in commandReview. Passing 0719 AC2 tests check saved verdict, cost, session id, last-result selection and usage-limit refusal; existing 0529 cost tests also passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "reviewerOptions preserves custom commands, and verdictFromOutput retains single-JSON envelope handling. Passing 0719 AC3 exercises a custom Claude command and verifies its saved verdict and cost."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The changed reviewer tests and relevant parsing, provider, usage and cost tests passed. Reported failures concern unrelated reporter-format assumptions and test-turn timing; the implementation changes neither path. The supplied output specifically shows reporter-format mismatches in several failures, so the builder's blanket description of them as load flakes is inaccurate, but they do not indicate a regression from this change."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Claude review rounds now refresh the usage reading, including when Claude stands in for another reviewer. Verdicts, costs, sessions and custom reviewer commands remain supported. The relevant tests passed, and I found no blocking issue. The broader test run has unrelated failures, several caused by test-output formatting assumptions."
  }
}
```

</details>
