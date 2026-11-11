---
id: "0638"
title: "Let speck work out how to start your app the first time it needs to"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-11-11T13:05:48.682Z"
approved: "2026-11-11T13:15:00.056Z"
finished: "2026-11-11T13:17:20.251Z"

---
# 0638 · Let speck work out how to start your app the first time it needs to

**Status:** ✅ done

## Problem
speck checks a build's question in the running app only once `commands.start` is set, and every project starts its app differently: this repo's is the panel, another's a CRM. Setting it by hand in each project is a chore you only find out about when a check-in-the-app question comes to you instead.

## Outcome
The first time speck needs a project's app and `commands.start` isn't set, it works out how to start the app from the project, checks that it answers, saves it and carries on with the check.

## Acceptance criteria
1. `speck app <id> --start "<command>"`, with `--url "<address>"` optionally, starts the app with that command and address instead of `commands.start` and `app_url`, for that run only, `{port}` working as in them.
2. When `commands.start` is blank and an app started that way answers, `speck app` saves the command, and the address when one was given, as `commands.start` and `app_url` in `speck/config.yml`, commits only that file on the base branch as `speck: set how to start the app`, and says so in one line. With `commands.start` already set, it saves nothing. When `speck/config.yml` has uncommitted changes on the base branch, it saves nothing, says why, and leaves the app running.
3. With `watch: fix` or `decide` and `commands.start` blank, `speck run` starts its watch agent for a low-risk ticket blocked with a `Check in the app:` line, as it does when `commands.start` is set, with a brief that says first to work out from the project (its README, its package or build files and its scripts) how to start its app on a given port and try it with `speck app <id> --start`, then to check as it does today.
4. When nothing it tries answers, the agent asks you how to start the app, naming each command it tried and the last lines it wrote, and the question waits for you.
5. With `watch: tell` or `off`, or high risk, a question with a `Check in the app:` line waits for you as it does today.

## Out of scope
- Working out a start command when `speck init` or the setup skill runs: speck learns it the first time a check needs it.
- Changing a `commands.start` that's already set, even one that no longer works.

## Notes
- Builds on 0634 (`speck app`, `scripts/app.mjs`) and 0636 (`scripts/app-check.mjs`, which today starts the agent only with `commands.start` set).
- The commit on the base branch works as `speck split-off` commits a ticket: in a short-lived checkout of the base branch when no checkout has it.
- This repo's own `commands.start` was set by hand on 2026-11-11: `node scripts/speck.mjs panel --port {port}`.
- `scripts/foreman-agent.mjs` is at 600 lines, so brief changes may need to live in `scripts/app-check.mjs`.
- Failing before this build: none
- Self-check: the watch agent's brief and skill now say a --start without --url uses app_url's address, not always http://127.0.0.1:{port}/.
- 0636's AC5 test no longer lists `commands.start` blank as a case where the question waits for you: AC3 of this ticket changes that. Its shared helpers moved to `test/support/app-check.mjs`.

## In plain words
You no longer have to tell speck how to start your app before it can check a question in it. The first time a build asks for something to be checked in the running app and speck doesn't know how to start it, speck reads the project (its README, its package files and its scripts), works out a likely start command and tries it. Once one works, speck remembers it in its settings, with a small commit of its own, and carries on with the check. If nothing it tries works, it asks you how to start the app, saying what it tried and what went wrong.

To see it: leave the start command blank in a project, turn the engineering manager to fix or decide, and let a low-risk build ask for a check in the app. Worth keeping an eye on: speck only saves the command when your settings file has no unsaved edits of your own, and it never changes a start command that's already set.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 160,215
- Elapsed since build started: 9 min
- Changed lines: 96 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (known limits, no inbox notes): when the ticket's app is already running, `speck app <id> --start` reports that running app and saves nothing, even with `commands.start` blank. `seen-builds-0319`'s AC1–AC4 test failed once on a timing race in a 231-file related run and passed alone; worth watching if it recurs.

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
    "reviewed_sha": "787b6263ffdac8f4dc8600ad9fdb8d9bb8e2a67f",
    "session": "fresh",
    "thread_id": "01a1cabe-b2ab-7492-bf17-d6a4ed1dad03",
    "builder_response": "- Tests run: `speck test --related test/app-start-0638.test.mjs test/app-check-0636.test.mjs test/seen-builds-0319.test.mjs` (the ticket's own file, 0636's file it changed, and seen-builds-0319, which failed once in the first related run on a timing race under load: 0002 seen before its record was marked seen; it passed twice alone and in this run). 2555 pass, 0 fail.\n- Round 1. No visual change, so no pictures.\n- `test/app-check-0636.test.mjs`: its AC5 list drops \"commands.start blank → the question waits for you\", which this ticket's AC3 deliberately changes; its shared helpers moved unchanged to `test/support/app-check.mjs` so 0638's tests use them too.\n- `onBase` in `scripts/split-off.mjs` is exported and reused for the commit on the base branch (ticket Notes ask for it to work as split-off does); `commitTicketOnly` commits only `speck/config.yml`, leaving anything else staged as it was.\n- `scripts/foreman-agent.mjs` stays at 600 lines: only its import line and the checkBrief call changed; the brief's new steps live in `scripts/app-check.mjs`.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 159381,
      "cached_input_tokens": 99840,
      "cache_write_input_tokens": 0,
      "output_tokens": 834,
      "reasoning_output_tokens": 159
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 59541,
      "cached": 99840,
      "write": 0,
      "output": 834
    },
    "cost_usd": 0.137406,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T13:14:50.453Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/app.mjs cmdApp and startApp apply command and URL overrides with port substitution. Passing 0638 AC1 tests exercise real app starts and verify configured settings remain unchanged."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "saveStart checks the base checkout's config, preserves existing start settings and uncommitted changes, and uses commitTicketOnly to commit just the config. Passing AC2 tests cover persistence, optional URL, unrelated staged files, a temporary base checkout, failed starts and keeping the app running."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "appCheckable now permits blank commands.start; foremanAgentQueue passes startSet into checkBrief. The passing AC3 test exercises both fix and decide queues and verifies discovery instructions precede the app checks."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "checkBrief and the watch skill instruct the agent to ask how to start the app, including attempted commands and their last output. The passing AC4 test checks these instructions and exercises watch ask, leaving the ticket blocked."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "appCheckable retains the watch-mode and low-risk gates. Passing AC5 tests verify tell, off and high-risk cases start no watch agent when commands.start is blank; existing 0636 tests cover configured starts."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Speck can try an app start command, remember it after the app answers, and use its watch agent to discover it when needed. The tests cover saving safely and leaving questions for you when required. The reported test run passed, and I found no blocking issues."
  }
}
```

</details>
