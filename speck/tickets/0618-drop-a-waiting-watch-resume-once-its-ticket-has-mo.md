---
id: "0618"
title: "Drop a waiting watch resume once its ticket has moved on"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0618 · Drop a waiting watch resume once its ticket has moved on

**Status:** 🔍 reviewing

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
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
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
