---
id: "0774"
title: "Write the other fake agents' call files whole"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-24-write-the-other-fake-agents-call-files-whole.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-26
started: "2026-11-26T23:57:36.883Z"
approved: "2026-11-27T00:11:07.448Z"
finished: "2026-11-27T00:54:44.346Z"

---
# 0774 · Write the other fake agents' call files whole

**Status:** ✅ done

## Problem
The fake agents in several `speck run` tests write each call file with a plain write while the test reads the folder, so on a busy machine a test can read half a file and fail for no real reason. 0742 fixed this for the 0289 fake only.

## Outcome
Every fake agent in speck's tests writes its call files so a reader never sees half of one.

## Acceptance criteria
1. The fake agents in run-0110, run-0194, run-cursor-0290, run-builder-0312, run-settings-0549, machine-builds-0726 and `test/support/provider-builder.mjs` write each call file under another name and rename it into place, as the 0289 fake does since 0742.
2. No fake agent in `test/` writes a file another part of its test reads while it runs with a plain write.
3. No test that passed before this change fails.

## Out of scope
- Tests that don't use a fake agent.

## Notes
- From 0742's build. None of these has been seen to fail this way yet.
- Failing before this build: none
- Self-check: no changes

## In plain words
Nothing changes for someone using speck: only its own tests did. The stand-in agents those tests use now finish writing each record before the test can see it, so a busy machine should no longer cause a test to fail by reading half a file.

To see it, there is nothing to try in the app; the tests passed with the change in. Worth keeping an eye on: some real-panel tests failed to start once on a very busy machine, and that is noted in the inbox separately.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 214,653
- Elapsed since build started: 14 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Saved to the inbox: the quick checks' real-panel tests failing with "panel didn't start" under load.

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
    "reviewed_sha": "d5b25251a626c70f4f3bc3f9b0b05819f3145d77",
    "session": "fresh",
    "thread_id": "01a21a56-c710-7120-b5f0-37641c3c515c",
    "builder_response": "- Tests run: test/fake-writes-0774.test.mjs test/build-panels-0619.test.mjs test/foreman-agent-0287.test.mjs test/machine-builds-0726.test.mjs test/panel-0220.test.mjs test/reviewer-limit-0623.test.mjs test/run-0110.test.mjs test/run-0194.test.mjs test/run-0245.test.mjs test/run-agents-0654.test.mjs test/run-builder-0312.test.mjs test/run-cursor-0290.test.mjs test/run-settings-0549.test.mjs test/usage-limit-0622.test.mjs  (run with `speck test --related`, which also ran the files naming them and the quick checks): 0 failures.\n- AC2 survey: besides the files AC1 names, these fakes wrote files read while they run and now write then rename: run-0245 (its reader now filters to .json), run-agents-0654, reviewer-limit-0623, usage-limit-0622, support/ticker.mjs, build-panels-0619, panel-0220, foreman-agent-0287 (shell fake).\n- Left alone on purpose: line appends to logs (appendFileSync, >>), which don't rewrite a file; files only read after the fake's run has ended (review-0180 pids, review prompt/verdict captures); files only checked for existence; files never read (killed-0174's build.json); stand-ins that aren't agents (app-0634's app, run-lock-0321's speck run, the gh fake, held test commands).\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 213920,
      "cached_input_tokens": 167936,
      "cache_write_input_tokens": 0,
      "output_tokens": 733,
      "reasoning_output_tokens": 44
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 45984,
      "cached": 167936,
      "write": 0,
      "output": 733
    },
    "cost_usd": 0.1160916,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-27T00:10:50.531Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "All seven named fakes write call + '.part' then rename it to call. test/fake-writes-0774.test.mjs checks each source and exercises an interrupted provider write; all three 0774 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The additional concurrent fake writers use write-and-rename, including support/ticker.mjs and foreman-agent-0287.test.mjs. Directory readers exclude temporary files. The AC2 regression check passed; the remaining plain writes examined are setup, post-exit captures, existence markers or outside the fake-agent scope."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0774-tests.txt: 475 tests, 472 passed, 3 skipped and 0 failures. Changed tests and related checks ran successfully; no regression identified in the change."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The fake agents now finish writing their records before making them visible to readers, preventing partial-file failures. Readers ignore temporary files, and the interrupted-write test confirms the behaviour. The relevant tests pass, with no blocking concerns found."
  }
}
```

</details>
