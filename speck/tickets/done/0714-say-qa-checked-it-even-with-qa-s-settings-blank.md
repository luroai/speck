---
id: "0714"
title: "Say QA checked it even with QA's settings blank"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-11-say-qa-checked-it-even-with-qa-s-settings-blank.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T13:51:24.136Z"
approved: "2026-11-24T14:22:36.077Z"
finished: "2026-11-24T15:15:26.468Z"

---
# 0714 · Say QA checked it even with QA's settings blank

**Status:** ✅ done

## Problem
A check in the running app is described as QA's only once one of QA's settings is set; with all four blank it still reads as the engineering manager's. Now that Settings shows QA as a member of its own, that hides who checked what.

## Outcome
A check in the running app always says QA did it.

## Acceptance criteria
1. With `qa_agent`, `qa_model`, `qa_effort` and `qa_bench` all blank, a check in the running app is described as QA's in the ticket's Notes, speck run's log and the Pipeline log, in the same words as when a QA setting is set.
2. The agent, model and effort the check runs on are unchanged: with QA's settings blank, it still runs on the watch agent's.
3. No test that passed before this change fails, except tests that pin the old wording for blank QA settings (from 0636), which are changed to the new wording.

## Out of scope
- Changing which agent runs QA.

## Notes
- The gate is `qa = !!check && qaOn(c)` in `scripts/foreman-agent.mjs`. Parsers already accept both wordings (`scripts/foreman-took.mjs`, `templates/panel-model.js`). Tests pinning the old wording: `test/app-check-0636.test.mjs`, possibly `test/qa-0651.test.mjs` and `test/app-check-0679.test.mjs`.

- Failing before this build: none
- Pictures: none, because nothing visual changes (log wording only)
- Self-check: no changes

## In plain words
When speck looks at the running app to check a ticket, its messages now always say QA did it, even if you've never set any of QA's settings. Nothing about which agent does the check has changed. To see it, wait for a check to run and read the Pipeline log or the ticket's Notes: they say QA checked it. Nothing else to watch.

Follow-ups: none.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 183,694
- Elapsed since build started: 31 min
- Changed lines: 6 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "73d7d4b8aa1ccd543fe952f9564a7006ec45e256",
    "session": "fresh",
    "thread_id": "01a20def-78df-7fa0-a8df-1a9d68fc0c29",
    "builder_response": "- Tests run: test/qa-0714.test.mjs test/qa-0651.test.mjs test/app-check-0636.test.mjs (AC3: the old-wording assertions in the last two now say QA)\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 183092,
      "cached_input_tokens": 137216,
      "cache_write_input_tokens": 0,
      "output_tokens": 602,
      "reasoning_output_tokens": 29
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 45876,
      "cached": 137216,
      "write": 0,
      "output": 602
    },
    "cost_usd": 0.1114936,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T14:22:31.263Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "foremanAgentQueue now labels every app check as QA's. Passing tests in qa-0714 and qa-0651 cover blank-settings run logs and Notes; the passing 0651 Pipeline log test verifies those QA lines remain visible with agent details."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Agent selection still uses qaConfig and foremanArgv unchanged. Passing 0714 AC1+AC2 and 0651 AC4 tests verify blank QA settings retain the watch agent claude, model opus and effort low."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Recorded test output confirms 170 passed, zero failed and three skipped across 173 tests. Changed existing assertions update the old blank-QA wording; no tests were weakened or unrelated behaviour changed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "App checks now say QA performed them even when QA's settings are blank. They still use the watch agent's agent, model and effort. The relevant tests pass, and I found no blocking concerns."
  }
}
```

</details>
