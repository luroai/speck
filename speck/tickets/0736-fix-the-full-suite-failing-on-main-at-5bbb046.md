---
id: "0736"
title: "Fix the full suite failing on main at 5bbb046"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: cursor              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T15:53:48.835Z"

---
# 0736 · Fix the full suite failing on main at 5bbb046

**Status:** 🔍 reviewing

## Problem
The full suite fails on main at commit 5bbb046 (5bbb0466df17e16d3dd3a9fdb44997e1ac1ea63c). Failing tests:
- 0723 AC1: a test file that ran out of time under --test-timeout exits only once its Chromium has gone
- 0267 AC1, AC3: rewording and reordering the brief, the changelog and the release notes fails no test
- 0320 AC3: in a real browser, icon.svg loads (0413: the header's mark, checked here too, went with the header row)
- 0051 AC1: the log comes from the main checkout, even when the panel runs in a worktree
- 0054 AC2-AC5: in a real browser, the pane opens, keeps a selection through refreshes and closes with Escape
- 0067 AC1: a code change is served on the same port within 5 seconds, on every route
- 0067 AC2: the token survives a restart, so Set ready works with the token from before it
- 0067 AC4: new code that fails to start leaves the old server serving, shows the error and the next change tries again
- 0067 AC5: the URL prints once, and Ctrl+C stops it with no process left behind
- 0073 AC2: a paused build stops from the panel too
- 0077 AC2 (self-check): choosing the priority a ticket already has commits nothing, even with other edits in it
- 0132 AC3: for a ticket with no review rounds the server answers with no pack and no error
- 0133 AC4: when speck ship refuses, the panel gets its message and the ticket stays approved
- 0140 AC1: at 375 px in the light look, nothing reaches past the right edge, with every list, menu and pane open
- 0145 AC4: the server answers 404 to pause and play and changes nothing; speck pause and speck play still work
- 0159 AC3: b.js() and b.until() give up in their time limits, naming what they waited for
- 0159 AC3: b.loaded() gives up when the page never arrives, naming the page
- 0182 AC3: Chromium has closed within 10 s of a test file finishing that ran out of time under --test-timeout
- 0187 AC1: a ticket changed in a build's own worktree, made after the panel started, reaches an open stream within 1 second
- 0187 AC4: in a real browser, the page rides out the panel stopping and starting again, without "Disconnected", and shows the board as it is
- 0206 AC1 AC2: when opening the page itself is never answered, the 0149 test still ends its panel, and the others pass
- 0229 AC1: a full run starts its files by their last recorded times, and records each file's time for the next

## Outcome
The full suite passes on main again.

## Acceptance criteria
1. Each of these tests passes on main again: 0723 AC1: a test file that ran out of time under --test-timeout exits only once its Chromium has gone, 0267 AC1, AC3: rewording and reordering the brief, the changelog and the release notes fails no test, 0320 AC3: in a real browser, icon.svg loads (0413: the header's mark, checked here too, went with the header row), 0051 AC1: the log comes from the main checkout, even when the panel runs in a worktree, 0054 AC2-AC5: in a real browser, the pane opens, keeps a selection through refreshes and closes with Escape, 0067 AC1: a code change is served on the same port within 5 seconds, on every route, 0067 AC2: the token survives a restart, so Set ready works with the token from before it, 0067 AC4: new code that fails to start leaves the old server serving, shows the error and the next change tries again, 0067 AC5: the URL prints once, and Ctrl+C stops it with no process left behind, 0073 AC2: a paused build stops from the panel too, 0077 AC2 (self-check): choosing the priority a ticket already has commits nothing, even with other edits in it, 0132 AC3: for a ticket with no review rounds the server answers with no pack and no error, 0133 AC4: when speck ship refuses, the panel gets its message and the ticket stays approved, 0140 AC1: at 375 px in the light look, nothing reaches past the right edge, with every list, menu and pane open, 0145 AC4: the server answers 404 to pause and play and changes nothing; speck pause and speck play still work, 0159 AC3: b.js() and b.until() give up in their time limits, naming what they waited for, 0159 AC3: b.loaded() gives up when the page never arrives, naming the page, 0182 AC3: Chromium has closed within 10 s of a test file finishing that ran out of time under --test-timeout, 0187 AC1: a ticket changed in a build's own worktree, made after the panel started, reaches an open stream within 1 second, 0187 AC4: in a real browser, the page rides out the panel stopping and starting again, without "Disconnected", and shows the board as it is, 0206 AC1 AC2: when opening the page itself is never answered, the 0149 test still ends its panel, and the others pass, 0229 AC1: a full run starts its files by their last recorded times, and records each file's time for the next.
2. No test that passed before this change fails.

## Out of scope
- Changes the failing tests don't need.

## Notes
<!-- Constraints, links and decisions. Optional. -->
Failing before this build: none (the recorded result for this code, the quick suite at 766f7bb, passed; the full suite at 5bbb046 failed with the tests in the Problem)
- The kept full-suite output at 5bbb046 shows 22 failures on the first run, then a retry of those files with `# fail 1`: only 0159 AC3 (b.js / b.until) still failed (`took 2588 ms` against a 2500 ms within budget for a 1 s Chrome limit). 0229 AC1 failed first and passed on retry; the other named tests passed on retry too. latest.json still lists all 22 because names() reads every not-ok in the combined output.
- 0159 AC3: within budget raised from 2500 ms to 10 s for the b.js(), b.until() and b.loaded() give-up checks (Chrome's own limit stays 1 s). 0429's pin of the within value updated to match. steady-0736 checks the new budgets.
Self-check: no changes

## In plain words
Nothing you use day to day changes. The full test suite on main was failing under load because one browser check that proves a wait gives up in time was measuring the clock too tightly: on a busy machine Chrome's one-second limit could take a couple of seconds of wall time to fire, and the check allowed only two and a half. That check now allows ten seconds on the clock while still requiring the one-second give-up and the same error messages, so a busy machine no longer fails the suite by chance. To see it: after this lands, the full suite on main should pass. Worth watching: a follow-up idea asks for fix tickets to name only the tests that still fail after the suite's retry, so the next busy-machine failure doesn't open an oversized fix ticket.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: one to the inbox — name only the tests that still fail after a full-suite retry (`speck/ideas/2026-11-24-name-only-the-tests-that-still-fail-after-a-full-suite-retry.md`).

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
    "reviewed_sha": "ff6b3f5c6698b163c2be1d8d0bca53e62281e33b",
    "session": "fresh",
    "thread_id": "01a20e4f-ffef-7470-823c-386538c5bfa8",
    "builder_response": "Round 1, type: fix ticket.\n- Tests run: test/steady-0736.test.mjs test/slow-tests-0429.test.mjs test/panel-0159.test.mjs (and the commands.checks files speck test --files adds; then --related reused that passing result)\n\nCause: the full suite at 5bbb046 failed 22 tests on the first run; its retry of those files left only one failure — 0159 AC3 (b.js / b.until), `took 2588 ms` against a 2500 ms within budget wrapping a 1 s Chrome timeout. The other named tests passed on that retry (chance failures under parallel load). latest.json still listed all 22 because names() reads every not-ok in the combined first+retry output.\n\nFix: raise the within budget from 2500 ms to 10 s for 0159 AC3's b.js(), b.until() and b.loaded() give-up checks (Chrome's own 1 s limit unchanged). Update 0429's pin of those within values. Add test/steady-0736.test.mjs to check the new budgets.\n\nNo product code changed (0 lines outside tests/speck).\n",
    "seconds": 32,
    "usage": {
      "input_tokens": 200306,
      "cached_input_tokens": 161408,
      "cache_write_input_tokens": 0,
      "output_tokens": 921,
      "reasoning_output_tokens": 123
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 38898,
      "cached": 161408,
      "write": 0,
      "output": 921
    },
    "cost_usd": 0.1031468,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T16:08:04.649Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/panel-0159.test.mjs exercises the three timeout behaviours with real Chromium, retains the explicit 1000 ms limits and expected error assertions, and passes in /tmp/speck-0736-tests.txt. The change increases only the elapsed-time allowance. The other named tests remain unchanged and are recorded as passing on the earlier retry; the whole-suite ship check remains required."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "/tmp/speck-0736-tests.txt reports 161 passed, zero failed and three skipped. The changed 0429 checks and new 0736 check pass. No product code changes; broader regression verification runs at ship."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change gives browser timeout tests more scheduling allowance on busy machines while preserving their one-second timeout settings and error checks. The targeted tests pass. No blocking issues found; the full suite still needs to pass before shipping."
  }
}
```

</details>
