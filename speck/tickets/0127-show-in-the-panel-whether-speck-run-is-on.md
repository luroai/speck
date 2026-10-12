---
id: "0127"
title: "Show in the panel whether speck run is on"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-12T19:40:29.568Z"

---
# 0127 · Show in the panel whether speck run is on

**Status:** 👍 approved

## Problem
Someone watching the panel can't tell whether `speck run` is going. If it isn't, setting a ticket to ready does nothing, and nothing on the page says why.

## Outcome
The panel always shows whether `speck run` is on or off for this repo, and keeps it up to date without a reload.

## Acceptance criteria
1. While a `speck run` process is running in the repo, the panel page shows that speck run is on, and `/api/state` reports it as on.
2. While no `speck run` is running, the panel page shows that speck run is off, and `/api/state` reports it as off.
3. When `speck run` starts or stops while the panel page is open, the page shows the new state at its next refresh of `/api/state`, without reloading the page.
4. A run lock left behind by a `speck run` whose process has gone (for example, killed with SIGKILL) shows as off, not on.
5. No test that passed before this change fails.

## Out of scope
- Starting or stopping `speck run` from the panel: that's 0128.
- Showing what `speck run` is doing beyond on or off (its output, its builds); the queue rows already show builds.

## Notes
- Failing before this build: none
- `/api/state` must still equal `speck status --json` while speck run is off (0031, 0059), and that output's keys are fixed (0030, 0044). So `/api/state` has `run` (`{ on: true, pid }`) only while speck run is on, as `restart_error` is only there while there is one, and no `run` means off. `speck status --json` is unchanged.
- Self-check: no changes
- `speck run` keeps one lock per repo, `speck/.cache/runs/run.lock`, holding its process id (`takeRunLock` in `scripts/run.mjs`). Reading it must never take, change or delete it.
- The on/off indicator sits where it's always visible, not inside a ticket row.

## In plain words
The panel's header now has a small label saying "speck run on" or "speck run off", just left of the connection status. When it's off, that's why setting a ticket ready doesn't start a build. The label updates by itself every couple of seconds, without reloading the page.

To see it, open the panel with speck run stopped: it says off. Start speck run and within a few seconds it says on; stop it and it goes back to off. If speck run was killed outright, the panel still shows off.

Worth keeping an eye on: the panel looks for speck run in the main copy of the repo, so a speck run started from inside a build's own folder wouldn't show as on.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 139,803
- Elapsed since build started: 9 min
- Changed lines: 26 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (known limits, no inbox notes):
- The panel reads the lock in the main checkout's `speck/.cache/runs`, as it does for builds. A `speck run` started inside a worktree keeps its lock there, so it shows as off.
- A lock whose process id has since been reused by an unrelated process shows as on until that process ends.

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
    "reviewed_sha": "1991d6523acf12a9c3894887193787f34b3a5f98",
    "thread_id": "01a131a9-3729-7ad2-9f89-6d7b65f10e14",
    "seconds": 29,
    "usage": {
      "input_tokens": 139059,
      "cached_input_tokens": 106368,
      "cache_write_input_tokens": 0,
      "output_tokens": 744,
      "reasoning_output_tokens": 13
    },
    "saved_at": "2026-10-12T19:49:24.328Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/panel.mjs panelServer reads runState for /api/state; templates/panel.html render displays 'speck run on'. Both AC1 tests exercise these paths and passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelServer omits run when off, preserving the required API contract; render treats its absence as off. AC2 tests cover no runner, a stopped runner and the page display; all passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html poll updates state and calls render after each successful refresh. The AC3 test executes successive polling callbacks and verifies off → on → off with three API requests; passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/run.mjs runState reads the lock and checks pidAlive without modifying it. The AC4 test uses a killed process and verifies off plus unchanged lock contents and modification time; passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0127-tests.txt: 1,208 tests, 1,205 passed, three skipped, zero failures or cancellations. Existing tests were not changed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel header now shows whether speck run is on and updates automatically. Dead-process locks correctly show off and remain untouched. The tests exercise the new behaviour, the full suite has no failures, and the change stays within scope."
  }
}
```

</details>
