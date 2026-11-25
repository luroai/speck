---
id: "0741"
title: "Fix tmp-cleanup's check for Node's default reporter"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
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
source: "speck/ideas/done/2026-11-24-fix-tmp-cleanup-for-nodes-default-reporter.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T23:12:02.545Z"
approved: "2026-11-24T23:15:55.010Z"
finished: "2026-11-24T23:36:03.129Z"

---
# 0741 · Fix tmp-cleanup's check for Node's default reporter

**Status:** ✅ done

## Problem
`test/tmp-cleanup.test.mjs` AC1 AC2 expect TAP's `# fail 2` from a nested `node --test` run, but Node's default reporter prints `ℹ fail 2` when its output is captured. Every `speck test --files` run includes this check, so five builds on 2026-11-24 saw it fail for no fault of their own and spent review rounds explaining it.

## Outcome
tmp-cleanup's checks, and related-0676's failing-run check, pass whatever reporter Node uses by default.

## Acceptance criteria
1. `test/tmp-cleanup.test.mjs` AC1 and AC2 pass on the Node this machine runs, when the temporary folder is cleaned up, and still fail when it isn't.
2. related-0676's AC1 tests, which read a failing run's fail count, pass on the same Node.
3. No test that passed before this change fails.

## Out of scope
- Other tests, which already pass `--test-reporter=tap` to the runs they read.

## Notes
- Failing before this build: none
- The recorded result is from Node 22.23.3, which prints TAP when piped. The failures show on Node 24.18.1 (the one bundled with Cursor's server, `~/.cursor-server/bin/`), checked there before and after.
- Self-check: no changes
- Raised by the builds of 0719, 0720, 0722, 0724 and 0727; their four other notes are dropped as duplicates of this one.
- Other tests that read `# fail` already spawn their fixture with `--test-reporter=tap`, which may be the simplest fix.

## In plain words
Nothing changes for someone using speck. Some of speck's own tests failed on a newer version of Node, the program that runs them, although nothing was wrong. They now say which output format they need, so they pass on both the older and newer versions.

To see it, later builds should stop reporting these failures as someone else's problem. Worth watching: speck's shorter test summaries still expect the older format, so that is saved as a follow-up idea.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 83,059
- Elapsed since build started: 4 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up (inbox): `speck/ideas/2026-11-24-keep-test-summaries-working-on-node-24.md`: a failing `--related` run and the reviewer's summary need TAP, which Node 24 doesn't print by default.

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
    "reviewed_sha": "261ef0fb872092bfa8bceafa53530ee8af5daca0",
    "session": "fresh",
    "thread_id": "01a20fd7-be19-7490-a32b-a95b92ab8e62",
    "builder_response": "- Tests run: test/reporter-0741.test.mjs test/tmp-cleanup.test.mjs test/related-0676.test.mjs (with `speck test --related`, plus commands.checks), on Node 22.23.3: 155 passed, 3 skipped.\n- Node 22 prints TAP when piped, so the failures only show on Node 24. Also checked by hand with Node 24.18.1 first on PATH: before the change tmp-cleanup AC1 AC2 and four tests in tmp-cleanup/related-0676 failed (5 in all); after it, all 16 tests in reporter-0741, tmp-cleanup and related-0676 pass.\n- Checked by hand that tmp-cleanup AC1 AC2 still fails on both Nodes when the fixture doesn't load the clean-up helper (\"nothing left in the temporary folder\"), then restored it.\n- The 0741 tests read the two files' source: Node 22 can't be made to default to another reporter without clashing with an explicit --test-reporter.\n",
    "seconds": 17,
    "usage": {
      "input_tokens": 82517,
      "cached_input_tokens": 50688,
      "cache_write_input_tokens": 0,
      "output_tokens": 542,
      "reasoning_output_tokens": 18
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 31829,
      "cached": 50688,
      "write": 0,
      "output": 542
    },
    "cost_usd": 0.0741468,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T23:15:43.996Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/tmp-cleanup.test.mjs's 'AC1 AC2: a run with passing and failing tests leaves nothing in the temporary folder' explicitly requests TAP, checks exit status 1 and '# fail 2', and asserts the temporary folder is empty. The recorded run passes; remaining folders still fail the unchanged empty-folder assertion."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/related-0676.test.mjs's speckRepo default and whole-suite fallback command explicitly request TAP. The recorded output confirms all 0676 AC1 tests pass, including real failing --related runs and the commands.test_files blank case."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The recorded test output reports 155 passed, 3 skipped and no failures. Changes are confined to the affected test fixtures, supplementary reporter checks and ticket records; no production code or unrelated tests changed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The affected tests now request a consistent output format, so Node's default reporter no longer breaks them. They retain their checks for failed runs and leftover temporary folders. The recorded tests pass, with no blocking concerns."
  }
}
```

</details>
