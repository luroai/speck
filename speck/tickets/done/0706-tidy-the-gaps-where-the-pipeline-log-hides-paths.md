---
id: "0706"
title: "Tidy the gaps where the Pipeline log hides paths"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-tidy-the-gaps-where-the-pipeline-log-hides-paths.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T12:29:50.712Z"
approved: "2026-11-24T13:10:13.386Z"
finished: "2026-11-24T13:38:53.989Z"

---
# 0706 · Tidy the gaps where the Pipeline log hides paths

**Status:** ✅ done

## Problem
When the Pipeline log takes a file path or command out of a line, the sentence around it can read oddly, such as "Conflicting files:" with nothing after it, or "Resume its session, or run 0457, to carry on." Someone reading on a phone can't tell what was meant.

## Outcome
Every Pipeline log line still reads as a whole sentence after paths and commands are taken out.

## Acceptance criteria
1. For each of these lines as speck writes them today, the Pipeline log shows a sentence with no colon left with nothing after it, no "run", "in", "into" or "of" left with nothing after it, and no "run <id>" where a command was: the merge conflict at ship (`scripts/ship.mjs`), a stopped build's resume line and the paused line (`scripts/run.mjs`), the "Last lines of" line (`scripts/run.mjs`), the cancelled build's filed line (`scripts/cancelled-build.mjs`), the app's uncommitted-changes and `app_url` lines (`scripts/app.mjs`), and the watch agent's "Its log:" line (`scripts/foreman-agent.mjs`).
2. Where a removed path or command carried meaning, the line says what it was in a few words, such as "the conflicting files" or "its build", or leaves out the clause that held it.
3. A line with no path or command in it reads as it does today.
4. No test that passed before this change fails.

## Out of scope
- Showing full paths in the Pipeline log.

## Notes
- The stripping is `runPlain` in `templates/panel-model.js`; its `\bLog:` rule is case-sensitive, so "Its log:" is left behind. Fixing it in `runPlain` or in the source messages is the builder's choice.
- Failing before this build: not checked
- Self-check: made runPlain's dangling-word rules leave "speck run:" and a plain "run" alone, and kept the 0638 message's wording.
- Pictures: none, because the change is to log wording only.
- speck (2026-11-24 13:00 UTC) told you: Most of the extra time went on tests: changing the panel's model file pulled in 441 related test files, and with the machine's load near 80 the first runs hit their 2- and 10-minute time limits before the build narrowed them to 46. It's now on its first review round's fix and moving normally; nothing on main is broken. Why: The build log shows two test runs timing out between 12:31 and 12:43, a narrowed run passing 563 tests, and the failures it saw passing on main once it fixed its own change.

## In plain words
The Pipeline log hides file locations and commands so it stays readable on a phone. Lines that used to be left with a gap, such as "Conflicting files:" with nothing after it, or "or run, to carry on", now read as whole sentences or leave the empty part out. To see it, open the Pipeline log after a build stops, is paused or is cancelled. Ordinary lines are unchanged.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 runPlain applies its new cleanup rules even when nothing was removed.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 214,174
- Elapsed since build started: 40 min
- Changed lines: 23 (limit 5000)
Follow-ups: none.
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
    "reviewed_sha": "befa73696447c347b277bfc7508fc981ffe6625f",
    "session": "fresh",
    "thread_id": "01a20da1-1b08-7920-abe7-70af1f0759b6",
    "builder_response": "First round. Fixed in runPlain (templates/panel-model.js) plus wording in scripts/app.mjs and scripts/cancelled-build.mjs. Ran 46 related test files plus test/pipeline-0706.test.mjs (563 pass, 0 fail).\n",
    "seconds": 45,
    "usage": {
      "input_tokens": 127755,
      "cached_input_tokens": 89344,
      "cache_write_input_tokens": 0,
      "output_tokens": 1352,
      "reasoning_output_tokens": 207
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 38411,
      "cached": 89344,
      "write": 0,
      "output": 1352
    },
    "cost_usd": 0.0992764,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T12:57:16.235Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The eight AC1 tests in test/pipeline-0706.test.mjs passed. Reading the corresponding source messages and runLogSummary/runPlain confirms that the named examples lose their dangling fragments."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/app.mjs names the config file; scripts/cancelled-build.mjs names the done folder. runPlain removes the resume command clause, paused instruction and log-tail clause. The AC2 test verifies that the resume instruction remains."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "Direct execution of runLogSummary shows that 'Please tell me which folder to put it in.' becomes 'Please tell me which folder to put it.' and 'Last lines of the build are useful.' becomes empty. Neither input contains a path or command."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The supplied related-test results report 563 passes, zero failures and three skips. No existing tests were weakened in the supplied implementation diff."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-model.js",
        "issue": "runPlain applies its new cleanup rules even when nothing was removed. It deletes legitimate sentence-ending prepositions and any text starting with 'Last lines of', changing or erasing lines without paths or commands. The two AC3 examples do not exercise these rules.",
        "suggested_fix": "Limit cleanup to the specific source-message forms containing paths or commands, or tie it to fragments actually removed. Add regression cases proving that ordinary text containing these phrases remains unchanged.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The targeted log messages read more clearly, and the related tests passed. One fix is needed: the cleanup also changes ordinary sentences and can erase a message that contains no path or command."
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
    "reviewed_sha": "1d2ab1eb2f8948cb2529afa1b66992daf2dd7330",
    "session": "continued",
    "thread_id": "01a20da1-1b08-7920-abe7-70af1f0759b6",
    "builder_response": "F1 fixed: runPlain only tidies dangling words when it removed something, and the 'Last lines of' rule needs 'of <token>:'. Added regression tests for ordinary sentences. Ran 46 related files, test/pipeline-0706.test.mjs and test/split-0018.test.mjs.\n",
    "seconds": 20,
    "usage": {
      "input_tokens": 212160,
      "cached_input_tokens": 168960,
      "cache_write_input_tokens": 0,
      "output_tokens": 2014,
      "reasoning_output_tokens": 207
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 4789,
      "cached": 79616,
      "write": 0,
      "output": 662
    },
    "cost_usd": 0.0241596,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T13:10:07.492Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "All eight AC1 examples in test/pipeline-0706.test.mjs pass against the current runLogSummary implementation, covering each named source message."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The source wording names the config file and done folder; runPlain removes the clauses containing the other hidden details. The AC2 test confirms that the resume instruction retains its meaning."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "runPlain now gates dangling-word cleanup on content having been removed and narrows the log-tail rule. Both AC3 tests pass, including the ordinary sentences identified in F1."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Reported related-test results show 564 passes, zero failures and three skips. Independently executed all 11 ticket test cases against the current model successfully."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-model.js",
        "issue": "Cleanup previously changed or erased ordinary sentences containing no path or command.",
        "suggested_fix": "Completed: cleanup is conditional, the log-tail pattern is narrower, and regression tests cover the reported examples.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The targeted Pipeline messages read clearly after paths and commands are hidden. The ordinary-text regression is fixed and covered by tests. No blocking concerns remain."
  }
}
```

</details>
