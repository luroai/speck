---
id: "0623"
title: "Carry a build on by itself once the reviewer's usage limit resets"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0622"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T23:16:26.656Z"
approved: "2026-11-10T23:37:16.710Z"

---
# 0623 · Carry a build on by itself once the reviewer's usage limit resets

**Status:** 👍 approved

## Problem
When the reviewer's usage limit is reached, such as Codex's, a review round fails, and the build stops or blocks with nothing to carry it on once the limit resets. Earlier builds blocked on "wait for Codex after 3:41 AM", which you then had to answer by hand.

## Outcome
When a review round fails on the reviewer's usage limit, speck waits until it resets, then carries the build on by itself.

## Acceptance criteria
1. When the reviewer refuses a review round because its usage limit is reached, `speck review` exits with a code of its own and says when the limit resets, from the reviewer's own message, and `speck run` records it as it does a builder's limit (0622).
2. The build skill tells the builder, on that exit, to end its session saying it's waiting for the reviewer's limit, leaving the ticket reviewing, rather than blocking it with a question.
3. From a minute after the reset time, `speck run` resumes that build in its own session, telling it to run the review round again; until then it starts no review on that reviewer.
4. When the reset time can't be read, `speck run` tries again after 30 minutes, and every 30 minutes after.
5. A review round that fails for any other reason is handled as today, and no test that passed before this change fails.

## Out of scope
- The builder's own limit (0622).

## Notes
- Asked for 2026-11-10: "when the usage comes back into play, I would really like it if the builds just started them by themselves again … I've just wasted half a day there of not moving forwards because a usage limit was hit."
- Earlier blocked questions recorded in tickets' Notes went with "wait for Codex's limit to reset" and "wait for Codex after 3:41 AM".
- 0554 made `speck review` show Codex's own reason when it fails, from its JSON events (`turn.failed` or `error`).
- Checked 2026-11-10: Codex 0.159.0's limit message, from its saved sessions and the installed program, is "You've hit your usage limit. Upgrade to Pro (…), visit … to purchase more credits or try again at 3:41 AM.", with a curly or straight apostrophe, or other plan wording before it ("Try again at …"). A reset on another day reads "Oct 28th, 2026 3:41 AM". The time is in the machine's local time zone. With no reset known it ends "Try again later."; `codex exec --json` gives only the message, in `turn.failed` or `error`.
- Waits for 0622, which adds the waiting and resuming.
- Failing before this build: none
- Changed an existing test: 0554's "a failed round says codex exited with its reason" used a usage-limit message as its sample reason and expected exit 1, which AC1 replaces. It now uses another reason, and still checks exit 1, the reason, no round and an unchanged ticket; the limit's own exit is checked in this ticket's tests.
- Self-check: repeated refusals with no reset time now say the limit once rather than once per build; the refusal's wording no longer claims more about other reviewers than was checked (Cursor's limit wording is unknown); added a test.

## In plain words
When your reviewer runs out of usage partway through a build, speck now waits for the limit to reset, then picks the build up where it stopped and runs the review again, without you answering anything. While it waits, the build isn't counted as needing you, and if nothing else is building the status bar reads "Waiting: usage limit until 03:41". Other builds keep going until they reach their own review, and then wait too.

To see it, wait for a review to hit the limit with speck run on: its log says when speck will carry on, and a minute after that time the build resumes.

Worth keeping an eye on: if the reviewer doesn't say when the limit resets, speck tries again every 30 minutes. Codex's and Claude's messages are understood; Cursor's wording hasn't been seen, so a Cursor limit may still stop a build as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 289,706
- Elapsed since build started: 21 min
- Changed lines: 240 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Known limit: Cursor's usage-limit wording hasn't been seen, so it's only caught if it uses the same words as Codex or Claude.
- Known limit: a reset time in a named zone other than UTC or this machine's own is treated as unreadable, so it retries every 30 minutes.

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
    "reviewed_sha": "2f2fd70dcca8e2c2bdaa56a81f80688c5a89e6d6",
    "session": "fresh",
    "thread_id": "01a1c7ca-0335-7421-bede-8161f606c570",
    "builder_response": "- Tests run: test/reviewer-limit-0623.test.mjs and test/codex-failure-0554.test.mjs, with `speck test --related`, which also ran every existing test file naming a changed file, and the repo-wide checks.\n- One existing test changed: in test/codex-failure-0554.test.mjs, \"a failed round says codex exited with its reason, and records no round\" used a usage-limit message as its sample and expected exit 1. AC1 gives exactly that case its own exit, so the sample is now a non-limit reason; the test still checks exit 1, the reason, no round and an unchanged ticket. Please say if you disagree with this change, given AC5.\n- `speck review` exits 18. Each build's `speck review` writes only its own record in the main checkout's runs folder (`reviewer-limits/<id>.json`), and only in a build speck run started (SPECK_BUILD_SESSION), so a round run by hand leaves nothing to wait on and still asks the reviewer.\n- AC3's \"starts no review\": speck run doesn't start reviews itself, so the hold is in `speck review`, for builds speck run started.\n- AC2: a refused round leaves the ticket `reviewing`, uncommitted, as `requireCommitted` already allows, so an approved ticket in a merge round is also carried on.\n- Codex's wording was checked against saved sessions and its 0.159.0 program. Claude's is from 0622's logs. Cursor's limit wording is unknown: it's caught only if it uses the same words.\n- No pictures: the bar reuses 0622's existing \"Waiting: usage limit\" words, and nothing's look changes.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 138157,
      "cached_input_tokens": 86528,
      "cache_write_input_tokens": 0,
      "output_tokens": 754,
      "reasoning_output_tokens": 197
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 51629,
      "cached": 86528,
      "write": 0,
      "output": 754
    },
    "cost_usd": 0.1194508,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T23:28:13.294Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "review.mjs and reviewers.mjs call stopOnLimit, which emits exit 18 and records the reviewer's reset time. Passing 0623 CLI tests cover Codex events, command reviewers, and records shared through the main checkout."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md explicitly instructs builders to end their session on exit 18 and leave the ticket reviewing. Passing AC2 tests check the exit-code instruction and that a refused round leaves the ticket reviewing and allows another round."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "reviewerLimitQueue.check resumes stopped builds through carryOn after reset plus GRACE_MS; holdOnLimit prevents managed builds from starting reviews during the wait. Passing tests cover timing, session reuse, review instructions, available slots, and a real speck run process."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "stopOnLimit uses RETRY_MS when no usable reset is available. Passing AC4 tests exercise the 30-minute delay and three repeated retry cycles."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Passing AC5 tests preserve ordinary Codex and command-reviewer failure behaviour. The revised 0554 test retains its non-limit failure assertions. Reported validation passed 1,338 tests with zero failures and three skips."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change automatically waits out a reviewer's usage limit and resumes the build in its existing session to retry review. Tests cover reset times, repeated retries, shared waiting across builds, and ordinary failures. No blocking issues found."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "a622630ce6cbc8185b4ac2d91a35f8d385fcc880",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1c7ca-0335-7421-bede-8161f606c570",
    "builder_response": "Merge round: main (0625, scheduling a watcher's resume) merged into this branch. Two files conflicted, both class `logic`, and each keeps both sides:\n- scripts/foreman-agent.mjs: the imports keep this ticket's `reviewerWaiting` and 0625's resume-at import. In `agentView`, `resuming` keeps this ticket's list with the builds waiting on a reviewer, and `scheduled` and the `did` line are 0625's as they are on main.\n- scripts/usage-limit.mjs: this ticket's `carryOn` helper and its one-call `resume` stay, and 0625's new `agentEnded` is kept above `resume`. 0625 didn't change the old `resume` body, so taking `carryOn` loses nothing. `limitQueues` spreads the builder queue, so run.mjs still gets `agentEnded`.\n- Tests run: test/reviewer-limit-0623.test.mjs, test/codex-failure-0554.test.mjs, test/usage-limit-0622.test.mjs and test/watch-at-0625.test.mjs, with the repo-wide checks: 213 passed, none failed, 3 skipped.\n",
    "seconds": 28,
    "usage": {
      "input_tokens": 288430,
      "cached_input_tokens": 210688,
      "cache_write_input_tokens": 0,
      "output_tokens": 1276,
      "reasoning_output_tokens": 197
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 26113,
      "cached": 124160,
      "write": 0,
      "output": 522
    },
    "cost_usd": 0.069862,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T23:37:14.275Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "review.mjs and reviewers.mjs still call stopOnLimit, which returns exit 18 and records the parsed reset time. Passing 0623 tests cover CLI refusals, reset parsing and the shared record."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md instructs the builder to end its session on exit 18, leave the ticket reviewing and avoid blocking it. Passing AC2 tests cover the instruction's exit code and the ticket's reviewing status."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "reviewerLimitQueue.check and carryOn preserve session resumption after reset plus one minute; holdOnLimit prevents managed reviews during the wait. Passing AC3 tests cover timing, session reuse and a real speck run. The merge retains foreman-agent.mjs scheduled resumes and exposes usageLimitQueue.agentEnded through limitQueues."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "stopOnLimit retains the 30-minute fallback. Passing AC4 tests cover unreadable reset times and repeated retry cycles."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Ordinary reviewer failures retain their existing handling, covered by passing AC5 and 0554 tests. The extracted carryOn preserves main's resume behaviour, and agentEnded remains intact. Reported validation across 0623, 0554, 0622 and 0625 passed 213 tests with zero failures and three skips."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The merge preserves automatic recovery from reviewer usage limits and the watcher's scheduled resumes. All acceptance criteria remain satisfied, and the relevant tests passed. No blocking issues found."
  }
}
```

</details>
