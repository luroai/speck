---
id: "0651"
title: "Give QA its own agent"                # one outcome, no "and"
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
after: ["0645"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T14:39:24.858Z"
approved: "2026-11-11T14:52:12.380Z"

---
# 0651 · Give QA its own agent

**Status:** 👍 approved

## Problem
Checks in the running app (0636, 0638) are done by Virgil's watch agent, on its agent and model. A check that clicks through an app suits a different model from one that decides what to do about a stop, and you can't choose it separately.

## Outcome
QA is a team member of its own: app checks run on QA's agent, model and effort, and say QA did them.

## Acceptance criteria
1. `qa_agent`, `qa_model`, `qa_effort` and `qa_bench` are settings of your own, checked as the watch settings are; `qa_agent` blank uses `watch_agent`'s agent, and `qa_model` and `qa_effort` blank use that agent's defaults.
2. A check in the running app runs on QA's agent, model and effort, and while that agent is limited, on the first agent on `qa_bench` that's ready, as 0637 does for the watch agent.
3. The check's line in the ticket's Notes, `speck run`'s log and the Pipeline log say QA checked it.
4. With the QA settings blank, app checks run as they do today.
5. No test that passed before this change fails.

## Out of scope
- QA's character and card: 0650 and 0652.

## Notes
- App checks: `scripts/app-check.mjs`; the watch agent's agent: `foremanAgentOf` in `scripts/foreman-agent.mjs` (at its 600-line limit).
- Failing before this build: none
- QA settings blank (AC4): qa_agent, qa_model, qa_effort and qa_bench all blank. Then a check runs exactly as before, on watch_model and watch_effort, and its Notes and log lines read as before, so 0636's tests that pin those lines still pass (AC5). Once any is set, the lines say QA (AC3).
- Self-check: no changes. One known limit noted for the Delivery log: while QA's stand-in agent differs from the watch agent's own, the "QA will check in the app on <agent>" line can be said again for each new check until the limit resets.

## In plain words
QA is now its own team member for checks in the running app. You can give it its own agent, model, effort and backup agents (qa_agent, qa_model, qa_effort and qa_bench, saved for your machine with `speck config set`). When one of them is set, each check runs on QA's choices, and the ticket's Notes, speck run's log and the Pipeline log say QA checked it. If QA's agent hits its usage limit, the check moves to the first ready agent on QA's backup list.

To see it, set QA's agent to a different one from Virgil's, then let speck run check a low-risk ticket's question in the app: the log says "QA is checking it in the app on …". With all four settings left blank, nothing changes: checks run and read exactly as before.

Worth keeping an eye on: while QA's agent is limited, the line saying QA moved to a backup agent can repeat for each new check.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 169,250
- Elapsed since build started: 13 min
- Changed lines: 92 (limit 5000)
- Follow-ups:
  - Inbox: speck/ideas/2026-11-11-say-qa-checked-it-even-with-qa-s-settings-blank.md (with the QA settings blank, checks still read as the engineering manager's).
  - Known limit: speck run keeps one record of a stand-in move for the watch agent and QA. While QA's agent differs from the watch agent's and is limited, the line saying QA moved to a stand-in can be said again for each new check until the limit resets.
  - Tidy-up: `speck config show` lists QA's settings under "Your engineering manager" until Settings has a QA card (0652).
  - Panel editing of QA's settings: already covered by 0652.

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
    "reviewed_sha": "28ac61d99e1006e1a8b783e018dfc69652e4baa5",
    "session": "fresh",
    "thread_id": "01a1cb17-8edb-7f31-8183-c5e3e82121af",
    "builder_response": "- Tests run: `speck test --related test/qa-0651.test.mjs test/config-0386.test.mjs` (this ticket's own file, the existing test file it changed, and every test file naming a changed file: 1031 tests, 0 failing).\n- Reading of AC3 against AC4/AC5: \"QA settings blank\" means all four of qa_agent, qa_model, qa_effort and qa_bench are blank. Then a check runs exactly as today, on the watch agent's agent, watch_model, watch_effort and watch_bench, and its Notes and log lines read as today. 0636's tests pin those lines word for word (AC5). Once any QA setting is set, the check runs on QA's settings and every line says QA checked it.\n- test/config-0386.test.mjs: that test pins the exact list of your own settings, and AC1 adds four. Following 0645, which extended the same list for its benches, I added the four QA settings to OWN and gave each a value in VALUES. Nothing was removed or loosened, and the existing assertions now cover the new settings too: they save for this machine and `speck config show` marks them.\n- `speck config show` lists QA's settings under \"Your engineering manager\", next to watch_bench, because 0269's test requires its groups to match the Settings view's. QA's own card is out of scope (0650, 0652).\n- foreman-agent.mjs stays at its 600-line limit: the QA log lines fold into the existing speak calls.\n",
    "seconds": 32,
    "usage": {
      "input_tokens": 168493,
      "cached_input_tokens": 119424,
      "cache_write_input_tokens": 0,
      "output_tokens": 757,
      "reasoning_output_tokens": 101
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 49069,
      "cached": 119424,
      "write": 0,
      "output": 757
    },
    "cost_usd": 0.1176504,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T14:51:53.142Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/config.mjs checks QA values using the watch setting types; machine.mjs includes all four machine settings. qaConfig and benchOwnAgent implement defaults. AC1 tests cover validation, ownership, display and fallback."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "foremanAgentQueue applies qaConfig to app checks; watch-stand-in.mjs selects the first ready, unlimited agent from qa_bench. AC2 tests exercise launch arguments, bench selection and waiting when none is ready."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "foremanAction records QA attribution in Notes; queue logging attributes checks to QA; panel-model.js recognises QA launch details. AC3 tests cover Notes, recommendation parsing, run logs and Pipeline rendering."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "qaConfig returns the original configuration when all QA settings are blank. The AC4 test exercises the existing watch model, effort, Notes and log wording."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported related-test run: 1,031 tests, 1,028 passed, three skipped, zero failures. The existing settings test was extended without removing assertions; the changes preserve the blank-settings path."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "App checks can now use QA’s own agent, model, effort and backup agents, with QA named in the ticket and logs. Leaving all QA settings blank preserves existing behaviour. The tests cover the main paths and report no failures. No blocking concerns found."
  }
}
```

</details>
