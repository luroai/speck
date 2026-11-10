---
id: "0618"
title: "Drop a waiting watch resume once its ticket has moved on"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-09-drop-a-waiting-watch-resume-once-the-ticket-has-moved-on.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T09:57:13.396Z"
approved: "2026-11-10T10:12:13.897Z"

---
# 0618 · Drop a waiting watch resume once its ticket has moved on

**Status:** 👍 approved

## Problem
When the watch agent asks for a build to be resumed and speck run has to wait for a free build slot, the resume still runs once a slot frees up, even if the ticket has moved on meanwhile, so it can restart a build you've already carried on, or one on a ticket that has since finished, on an old instruction.

## Outcome
A watch resume that's waiting for a slot is dropped once its ticket has moved on, as a waiting decide is.

## Acceptance criteria
1. A resume the watch agent asked for keeps the ticket's status, its branch's commit and its build's session from when it was asked.
2. If, before a slot frees up, the ticket's status changes, its branch gets a new commit, its session changes or that session is in use, the resume is dropped and `speck run` says so once in its log.
3. Otherwise it runs as it does today.
4. No test that passed before this change fails.

## Out of scope
- `speck watch decide`, which 0567 already handles.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- From round 1 of 0567's review. The check is `movedOn` in `foremanAgentQueue` in `scripts/foreman-agent.mjs`, used today only for `decide`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: a resume on a blocked ticket kept `building`, as a decide does, so it would have been dropped though nothing moved on; it now keeps the ticket's own status.

## In plain words
When the watch agent asks for a stopped build to be resumed but every build slot is busy, the request now waits only as long as nothing has changed. If you carry the build on yourself, the ticket finishes or changes status, or its build session changes or is in use before a slot frees up, speck run drops the old request and says so once in its log, instead of restarting the build on a stale instruction. If nothing has changed, the build is resumed as before. To see it, look for "the ticket has moved on since, so speck run left it as it is" in speck run's log.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 289,108
- Elapsed since build started: 15 min
- Changed lines: 14 (limit 5000)
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
    "reviewed_sha": "ecef11fbb4704797f41dd5a693db76e817a42836",
    "session": "fresh",
    "thread_id": "01a1c4e6-ec7d-7621-8a4e-92a54b75d4c6",
    "builder_response": "- Tests run: test/watch-resume-0618.test.mjs, plus with --related every test file naming scripts/foreman-agent.mjs (21 files, 0 failing), and the commands.checks files.\n- Change: `speck watch resume` now keeps the ticket's status, its branch's commit and its build's session in the action, as decide does (a resume leaves a blocked ticket blocked, so it keeps the ticket's own status). The waiting resume carries them as `by: 'watch'`, and the existing `movedOn` check drops it, with one log line, as it does a decide. A resume asked before this change (no head kept) runs as it does today.\n",
    "seconds": 46,
    "usage": {
      "input_tokens": 182868,
      "cached_input_tokens": 136832,
      "cache_write_input_tokens": 0,
      "output_tokens": 906,
      "reasoning_output_tokens": 57
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 46036,
      "cached": 136832,
      "write": 0,
      "output": 906
    },
    "cost_usd": 0.1148152,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T10:01:16.695Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/foreman-agent.mjs: foremanAction captures status, head and session; foremanAgentQueue.finish preserves them. The passing AC1 test verifies both records."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "foremanAgentQueue.check applies movedOn to watch resumes before allocating slots, removes stale requests and logs their removal. Six passing AC2 tests exercise commit, session, session-use and status changes, including logging only once."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Five passing AC3 tests verify unchanged requests resume once with the instruction and original session, immediate execution, legacy requests and blocked tickets."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The saved /tmp/speck-0618-tests.txt confirms 376 tests: 373 passed, three skipped and zero failed. The scoped implementation preserves the existing decide behaviour and resume execution path."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Waiting watch resumes now remember the ticket’s state and are discarded with one log message if it moves on. Unchanged requests still resume normally, including blocked tickets and older queued requests. The tests exercise the required behaviour, and I found no blocking issues."
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
    "reviewed_sha": "6af775bb7eefd2f4e524100f27a5cb43d35dbd04",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1c4e6-ec7d-7621-8a4e-92a54b75d4c6",
    "builder_response": "- Tests run: test/panel-0517.test.mjs, test/watch-resume-0618.test.mjs (plus the commands.checks files): 133 tests, 0 failing.\n- Tests fail together: speck ship reported \"0517 AC3: in a real browser with 500 shipped tickets, a slide's first frame comes within 50 ms of the lane change, with no redraw in it\" failing on the branch merged with main.\n- Merged main into the branch (`git merge main`, clean, no conflicts). No code changed beyond the merge.\n- Why: that test times the panel's lane slide in a real Chromium against a 50 ms budget. This ticket changes only scripts/foreman-agent.mjs (speck run's watch resume queue) and its own test file; nothing the panel page loads. After the merge the test passes in the round's run and in three further runs on its own, so the failure at ship was a timing miss under the full suite's load, not this change. Nothing to fix in this ticket's code, and the test is left as it is.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 287694,
      "cached_input_tokens": 234112,
      "cache_write_input_tokens": 0,
      "output_tokens": 1414,
      "reasoning_output_tokens": 57
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 7546,
      "cached": 97280,
      "write": 0,
      "output": 508
    },
    "cost_usd": 0.0299,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T10:12:11.071Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "foremanAction captures status, branch head and session; foremanAgentQueue.finish preserves them. The AC1 test passes. Implementation and tests are unchanged from round 1."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "foremanAgentQueue.check applies movedOn to watch resumes, removes stale requests and logs once. All six AC2 tests pass, covering status, commit, session and session-use changes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "All four AC3 tests pass: unchanged waiting requests resume once with their instruction and session, immediate requests run, legacy requests run and blocked tickets remain resumable."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0618-tests.txt: 130 passed, three skipped, zero failed. The previously failing 0517 browser timing test passes and was not modified. The merge preserved the reviewed implementation and tests."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The merge preserves the fix: outdated waiting resumes are dropped with one log message, while unchanged requests still run normally. All required behaviour tests pass. The unrelated browser timing test also passes unchanged; I found no blocking issues."
  }
}
```

</details>
