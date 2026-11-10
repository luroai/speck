---
id: "0625"
title: "Let speck schedule a resume for later when it looks into a stop"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0622"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T23:16:01.465Z"
approved: "2026-11-10T23:28:23.056Z"

---
# 0625 · Let speck schedule a resume for later when it looks into a stop

**Status:** 👍 approved

## Problem
When speck's watcher looks into a stop that will clear by itself at a known time, such as a limit or an outage with a stated end, it can only act now: resume, reship, fix, ask, decide or tell. So it either resumes too early or leaves the ticket for you. And when the watcher's own agent is out of usage, as on 2026-11-10, its look fails at once and is noted as "I looked into it and took no action", so nothing is ever looked at again.

## Outcome
The watcher can schedule a ticket's resume for a set time, and a look that couldn't run because of a usage limit is tried again later rather than written off.

## Acceptance criteria
1. `speck watch resume <id> "<instruction>" --at <time>` schedules the resume for that time instead of now, taking a time such as `12:30` (UTC, today or, if passed, tomorrow) or a full ISO date and time; it notes in the ticket's Notes and in `speck run`'s log what it will do and when, for example "I'll resume 0616 at 12:30 UTC: the usage limit resets then.", and counts as the run's one action.
2. At that time `speck run` resumes the build with the instruction, as a resume does now, unless the ticket has moved on meanwhile (0618's check), when it drops it and says so once.
3. `speck status` and the panel's Pipeline log say which resumes are scheduled and when, until they run or are dropped.
4. When the watch agent's own run stops on a usage limit, `speck run` doesn't count it as a look: it doesn't note that it took no action, and it looks into the ticket again once that limit resets (0622).
5. The `speck-watch` skill tells the agent to use `--at` when a stop will clear at a known time, and to say why (checked by review); no test that passed before this change fails.

## Out of scope
- Spotting Claude's own usage limit on a build, which 0622 does without the watcher.
- Running the watcher on another agent while its own is limited.

## Notes
- Asked for 2026-11-10: "I'm pretty sure this is something that speck or Virgil or whatever we call him could understand and fix for us." On 2026-11-10 at 11:57, the watcher looked into 0616's stop on Claude, hit the same usage limit and "took no action"; 0616 waited five hours.
- Decided: the mechanical part (reading the reset time and resuming) is 0622's, as no model can run while the limit holds; the watcher gets the tool to schedule a resume for stops only judgement can read.
- Today: the actions are `ACTIONS` and `foremanAction` in `scripts/foreman-agent.mjs`, whose queue of resumes and `movedOn` check (0618) this builds on; the agent's instructions are `skills/speck-watch/SKILL.md`.
- Waits for 0622, which records when a limit resets.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: a run record holding a time that isn't text no longer breaks speck status; added a test.

## In plain words
When a stop will clear by itself at a known time, speck's watcher can now book the build's restart for that time instead of restarting too early or leaving it to you. It says so in the ticket and the log, and until the restart happens or is dropped, it's listed in speck's status and at the top of the Pipeline log. If the ticket has moved on by then, speck drops the restart and says so.
If the watcher itself runs out of Claude usage while looking into a stop, that no longer counts as having looked. It tries again once the limit resets.
To see it, open the Pipeline log while a restart is booked: the ticket and its time, in UTC, sit under speck's line.
Worth keeping an eye on: a booked restart stops the ticket counting under Needs you until its time, so a time set far ahead would keep it quiet. speck refuses anything more than 31 days away.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 139,709
- Elapsed since build started: 12 min
- Changed lines: 128 (limit 5000)
- Follow-up: steady two speck run tests that failed once each under load (`speck/ideas/2026-11-10-steady-the-0622-and-0549-ac1-run-tests-under-load.md`).
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
    "reviewed_sha": "e04f66b253f4d84f4958dce967b344c348c4ebf2",
    "session": "fresh",
    "thread_id": "01a1c7c9-b663-7d61-9035-5d0d9d96aa62",
    "builder_response": "- Tests run: test/watch-at-0625.test.mjs test/usage-limit-0622.test.mjs test/run-settings-0549.test.mjs test/pipeline-0458.test.mjs test/pipeline-0479.test.mjs test/watch-resume-0618.test.mjs test/foreman-agent-0287.test.mjs (plus commands.checks, which speck test adds).\n- Before this round I ran speck test --related twice on the committed code. Each of those two runs had one failure, a different test each time, both timing-dependent tests that start a real speck run, while the machine's load average was 20 to 26: \"0549 AC1, AC3, AC5\" (test/run-settings-0549.test.mjs) and \"0622 AC1 AC2 AC3: a build that hit the limit while speck run was off\" (test/usage-limit-0622.test.mjs). Each passed in the other related run, and both files passed three times out of three when run by themselves. They're included in this round's files.\n- An earlier related run failed 0458 AC1 and 0479 AC4, which pin the Pipeline log's top to back, title, log-status and log-filters. I left those tests alone and moved the scheduled list inside log-status, on a row of its own.\n- Pictures of the Pipeline log are kept with the review pack, in the light and dark looks.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 138850,
      "cached_input_tokens": 84736,
      "cache_write_input_tokens": 0,
      "output_tokens": 859,
      "reasoning_output_tokens": 82
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 54114,
      "cached": 84736,
      "write": 0,
      "output": 859
    },
    "cost_usd": 0.1252916,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T23:27:56.187Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "resume-at.mjs parses UTC clock times and ISO timestamps. foremanAction records the schedule and instruction in Notes, enforces one action, and finish logs it. Passing AC1 tests exercise these paths."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "foremanAgentQueue.check waits until due and applies the existing movedOn checks. Passing AC2 tests verify the instruction and session, slot availability, and dropping once after status, commit, session or session-use changes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "agentView exposes scheduled resumes; foremanLines displays them in status; drawLogStatus displays them in the Pipeline log. Passing AC3 tests cover visibility and removal, including the panel page script."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "finish requeues a usage-limited look without marking it tried. run.mjs connects this to usageLimitQueue.agentEnded and holds. Passing AC4 tests verify waiting, retrying after reset and repeated limits. Claude watcher output uses stream-json, matching the limit parser."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "skills/speck-watch/SKILL.md instructs the watcher to use --at for a stop with a known end and explain what clears then and how it knows. The supplied test output confirms 231 passed, zero failed and three skipped across the selected files."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The watcher can schedule a build to resume later, show the pending schedule, and cancel it if the ticket moves on. A watcher stopped by Claude’s usage limit now waits and tries again. The tests exercise these behaviours, and I found no blocking issues."
  }
}
```

</details>
