---
id: "0528"
title: "Backfill past tickets' AI spend"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0527"]                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T13:15:07.695Z"
approved: "2026-10-27T13:28:09.900Z"

---
# 0528 · Backfill past tickets' AI spend

**Status:** 👍 approved

## Problem
Spend recorded before 0523–0530 leaves out a ticket's earlier builds, builds whose log had no result line (83 run records here have no spend), every watch agent run, and every review round's cost. Claude Code keeps each session's transcript, with every message's model and tokens, but by default only for 30 days, so build and watch agent spend can still be recovered, though not for long.

## Outcome
`speck spend --backfill` recovers past spend: builds and watch agent runs from this project's Claude Code transcripts, and review rounds from the tokens they saved.

## Acceptance criteria
1. For each session in this project's Claude Code transcripts (`~/.claude/projects/<project folder>/<session>.jsonl`) whose first prompt is `/speck-build <id>`, and that the ticket's spend doesn't already count, `--backfill` adds its spend to that ticket's builder spend. That spend is each model's tokens, split into uncached input, cached input, cache writes and output, over every message in the session and its subagents, with each message counted once however many lines repeat it. Each model's tokens are priced from the price table (0524), and the spend is dated by the session's last message.
2. A watch agent session found in the transcripts is added to the watch agent spend of the ticket it looked into, in the same way.
3. Each review round saved without a cost gets one, priced from the tokens and `reviewer_model` it saved. For a Codex round saved with `default`, the model is the one its session file in `~/.codex/sessions/` records for its thread.
4. A session or round already counted isn't counted again, so running `--backfill` a second time changes nothing.
5. It prints how many sessions and rounds it added for each ticket, how many it skipped as already counted and how many it added with an unknown cost. With no transcripts folder for the project, it says so and adds only the review rounds.

## Out of scope
- Codex and Cursor build sessions from before this work (this repo has none).
- Builds you ran yourself with `/speck-build` in an interactive session, which can hold other work as well.

## Notes
- Transcript messages carry usage but no `total_cost_usd`, so a backfilled cost is a price-table estimate and can differ a little from what Claude Code would have reported.
- Run it before the transcripts it needs are deleted, or raise `cleanupPeriodDays` in your Claude Code settings first.
- Checked 2026-10-27: `cleanupPeriodDays` defaults to 30 and deletes transcripts silently (https://code.claude.com/docs/en/settings-reference.md#cleanupperioddays). The oldest transcript here is from 2026-10-08.
- Checked 2026-10-27: every one of the 477 run records' sessions has a transcript at `~/.claude/projects/<project folder>/<session>.jsonl`, plus 15 earlier `/speck-build` sessions that no record lists and about 12 watch agent sessions; each assistant line has `message.model`, `message.id` and `message.usage`, and a session's subagents are in `<session>/subagents/agent-*.jsonl` (local files).
- The project folder name is the repo's absolute path with each `/` turned into `-`, such as `-home-me-projects-speck`. Checked 2026-10-27: Claude Code (2.1.310) turns every character that isn't a letter or digit into `-`, so `/tmp/tmp.0hUbzZi04k` is `-tmp-tmp-0hUbzZi04k` and `/home/me/projects/speck/.cc-ro-test` is `-home-me-projects-speck--cc-ro-test`.
- Failing before this build: none
- Design: what --backfill recovers is kept beside speck run's records in `speck/.cache/runs/`: builds in `run.backfill-builds.jsonl`, watch agent runs in `run.watch-spend.jsonl` as `backfill:<session>`, and round costs in `run.backfill-rounds.jsonl`, so no ticket file changes. Reading spend leaves out a backfilled session a run record later counts, so earlier builds now keep their session, and a watch run its session.
- AC1 reading: a session the ticket's run record names but hasn't exited yet is still running, so it's left for speck run to record. An earlier build or watch run kept without a session counts the session of its ticket that ended within 5 minutes of it.
- Self-check: a runs folder that can't be written to now gives a plain error saying what to do, and a test checks the brief and help name `speck spend --backfill` and `cleanupPeriodDays`.

## In plain words
`speck spend --backfill` fills in AI spend that speck didn't record at the time: builds whose cost was lost, the watch agent's runs and what each review round cost. It reads the conversation records Claude Code keeps on this machine and the token counts saved with each review round, prices them from speck's price table, and adds them to each ticket's figures, so `speck spend`, `speck status` and the panel all show the fuller totals.

To see it, run `speck spend`, then `speck spend --backfill`, then `speck spend` again: the totals go up, and the backfill says what it added for each ticket. Running it again adds nothing.

Worth keeping an eye on: these costs are estimates at list prices, so they can differ a little from what was billed. Claude Code deletes its conversation records after 30 days by default, so builds older than that can't be recovered. Builds you started yourself in a conversation are left out, as they can hold other work.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 promptKind and backfill accept any session whose first prompt is /speck-build <id>, including interactive sessions.; F2 sessionSpend updates ended from every timestamped JSON object before checking whether it is a message.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 436,101
- Elapsed since build started: 13 min
- Changed lines: 357 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Tried on a copy of this repo's run records (nothing real changed): 98 build sessions, 13 watch agent runs and 850 review rounds recovered, none with an unknown cost; a second run added nothing.
- Known limit: a build that ran on a model provider (0392) keeps its transcripts in that provider's own Claude Code folder, which --backfill doesn't read; nor does it recover Codex or Cursor builds (out of scope).
- Known limit: whether a session was started by a person is read from signs in its transcript (a terminal session, a typed turn or a conversation title). A build someone started with a headless `claude -p "/speck-build <id>"` of their own is counted like speck run's.
- Behaviour change: once rounds are backfilled, a Codex round that carried on an earlier round's thread counts only its own tokens in the totals, not the thread's running total, so some tickets' reviewer tokens go down.
- Follow-ups: none sent to the inbox.

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
    "reviewed_sha": "e556da6a3330542df0a9d877a759b3895fb5b966",
    "session": "fresh",
    "thread_id": "01a17d89-6450-77f0-a003-5e4114b7e7a2",
    "builder_response": "- Tests run: `speck test --related test/spend-0528.test.mjs test/spend-0523.test.mjs` (the ticket's own test file, the 0523 test file it changed, and every related test file it chose, with the commands.checks files): 1759 tests, 1756 passed, 0 failed, 3 skipped.\n- Design: `speck spend --backfill` (scripts/backfill.mjs, called from spend-view.mjs) keeps what it recovers beside speck run's records in the main checkout's `speck/.cache/runs/`, so no ticket file is changed: builds in `run.backfill-builds.jsonl`, watch agent runs appended to `run.watch-spend.jsonl` as run `backfill:<session>`, and round costs in `run.backfill-rounds.jsonl`. spend.mjs reads them in buildsOf (so builderSpent, spendParts and speck status --json all include them), watchOf and costedRounds (used by spendParts and reviewerCost, which speck.mjs now calls with the runs folder and id).\n- AC1: transcripts folder is the main checkout's path with every non-alphanumeric character as `-` (checked against Claude Code 2.1.310, see Notes). Each message is keyed by message.id across the session and its subagents' transcripts, taking each count's largest value (a streamed message's lines repeat with growing output_tokens). `<synthetic>` messages are skipped. Cost is null when any model in the session has no rates.\n- AC1/AC4 \"already counted\": a session its ticket's run record names with spend (latest or an earlier build), a session the record names that hasn't exited (still running, left for speck run), an earlier build kept without a session that ended within 5 minutes of the session's last message, or one --backfill kept before. Read time also leaves out a backfilled session that a run record later counts, so earlierBuilds now carries each build's session (the one existing 0523 assertion of a carried record gains `session: 'old'`), and recordWatchSpend keeps the session its log names.\n- AC3: Codex rounds that carried on an earlier round's thread take that round's usage out, as review.mjs does now; a `default` Codex round is priced at codexModel(thread_id).\n- Out of scope, not handled: interactive /speck-build sessions can't be told apart from speck run's in the transcripts, so a session started by typing `/speck-build <id>` would be counted too.\n- No visual change, so no pictures.\n",
    "seconds": 40,
    "usage": {
      "input_tokens": 154479,
      "cached_input_tokens": 98560,
      "cache_write_input_tokens": 0,
      "output_tokens": 994,
      "reasoning_output_tokens": 145
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 55919,
      "cached": 98560,
      "write": 0,
      "output": 994
    },
    "cost_usd": 0.131634,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-27T13:25:58.241Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/backfill.mjs sessionSpend counts and prices deduplicated messages and subagents, covered by passing AC1 tests. However, it dates spend using every timestamped transcript event rather than the last message (F2), and includes explicitly excluded interactive sessions (F1)."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "Passing AC2 tests exercise watch attribution and existing-run detection. Watch sessions use sessionSpend, so their dates also have F2's defect."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/backfill.mjs roundSpend prices saved tokens and resolves default Codex models through codexModel. Both AC3 tests passed, including continued threads and missing model information."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests verify unchanged files and spend on a second invocation, replacement by later run records, and matching earlier builds without session identifiers."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "backfillLines and backfillSpend report per-ticket additions, skips, unknown costs and missing transcripts. Passing AC5 tests exercise these behaviours and option validation."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/backfill.mjs",
        "issue": "promptKind and backfill accept any session whose first prompt is /speck-build <id>, including interactive sessions. The builder explicitly confirms this limitation. The ticket excludes these sessions because they may contain unrelated work, so this can wrongly charge that work to a ticket.",
        "suggested_fix": "Exclude interactive sessions using reliable session provenance and add a regression test containing an interactive build followed by unrelated work. If available records cannot distinguish them, seek a product decision rather than silently including them.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/backfill.mjs",
        "issue": "sessionSpend updates ended from every timestamped JSON object before checking whether it is a message. A later queue operation or other housekeeping event therefore dates the spend after the session's last message, potentially assigning it to the wrong day, week or month.",
        "suggested_fix": "Derive ended only from transcript messages, including subagent messages. Add a test with a housekeeping event dated after the last message, across a reporting boundary.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The backfill recovers and combines historical spend, and all 17 ticket tests passed. Two gaps need fixing: interactive sessions can charge unrelated work to a ticket, and housekeeping events can put spend in the wrong reporting period."
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
    "reviewed_sha": "b66218de9c897071df1aad0055273c15b2817adc",
    "session": "continued",
    "thread_id": "01a17d89-6450-77f0-a003-5e4114b7e7a2",
    "builder_response": "- Tests run: `speck test --files test/spend-0528.test.mjs test/spend-0523.test.mjs` (with the commands.checks files): 138 tests, 135 passed, 0 failed, 3 skipped.\n- F1: fixed. sessionSpend (scripts/backfill.mjs) now marks a session `person` when its transcript shows a person took part, and backfill leaves those out: Claude Code started in a terminal (entrypoint `cli`), any turn a person typed (`turnOrigin: \"human\"`), or an `ai-title` line, the title Claude Code gives a conversation for its list, which `claude -p` sessions don't get. Evidence from this repo's 580 transcripts: none of the 403 `/speck-build` sessions speck run's records name, nor the 17 no record names, has an `ai-title` line or entrypoint `cli`; the only one with a `human` turn is a build someone resumed by hand and typed into, and its record counts it. The user's own app conversations (entrypoint sdk-py) almost all have `ai-title`; terminal ones have entrypoint `cli` and `human` turns. New test \"0528 AC1: a session a person started or typed in isn't added\" has a terminal session, an app conversation, and a build followed by a typed request for unrelated work: none is added, while a headless build is.\n- F2: fixed. ended now comes only from `user` and `assistant` lines with a message, in the session or a subagent. New test \"0528 AC1: a housekeeping line after the last message doesn't move the spend's date\" has queue-operation and last-prompt lines dated in the next week: the spend stays dated by the last message and counts in its own week.\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 278968,
      "cached_input_tokens": 214144,
      "cache_write_input_tokens": 0,
      "output_tokens": 1660,
      "reasoning_output_tokens": 145
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 8905,
      "cached": 115584,
      "write": 0,
      "output": 666
    },
    "cost_usd": 0.0360284,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-27T13:27:56.202Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/backfill.mjs sessionSpend deduplicates messages across the session and subagents, splits tokens by model and prices them. It now excludes interactive sessions and dates spend only from messages. Passing AC1 tests cover both fixes alongside aggregation and existing-session detection."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "backfill attributes recognised watch prompts to the ticket's watch spend using sessionSpend. Both AC2 tests passed, covering attribution and skipping previously recorded runs."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "roundSpend prices saved tokens or usage and resolves default Codex models through codexModel. Both AC3 tests passed, including continued threads and unavailable session models."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing AC4 tests verify that a second invocation changes neither stored files nor reported spend, and that later run records supersede backfilled sessions without double counting."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "backfillLines reports additions, skips and unknown costs per ticket and overall. Passing AC5 tests cover these reports, missing transcripts, option validation and write errors."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/backfill.mjs",
        "issue": "Interactive sessions could previously charge unrelated work to a ticket.",
        "suggested_fix": "Implemented: sessionSpend detects terminal entrypoints, human turns and conversation titles; backfill excludes these sessions. The new passing regression test exercises all three signals while retaining a headless build.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/backfill.mjs",
        "issue": "Housekeeping events could previously move spend beyond the session's last message.",
        "suggested_fix": "Implemented: ended is updated only for user and assistant messages. The new passing regression test verifies that later housekeeping events do not move spend across a reporting boundary.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Both previously identified problems are fixed. Historical spend is recovered without counting recognised interactive conversations or letting housekeeping events change its date. All 19 ticket tests passed, and no blocking findings remain."
  }
}
```

</details>
