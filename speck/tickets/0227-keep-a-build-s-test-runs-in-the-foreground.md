---
id: "0227"
title: "Keep a build's test runs in the foreground"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T21:25:21.332Z"

---
# 0227 · Keep a build's test runs in the foreground

**Status:** 🔍 reviewing

## Problem
speck runs a build as `claude -p "/speck-build <id>"`, which ends when the builder ends its turn. On a slow machine the full suite takes long enough that the builder ran it in the background and ended its turn to wait. That ended the build and killed the suite, leaving the ticket `building` with nothing to carry it on (0213, 15 October, on an 8 GB MacBook Air).

## Outcome
A build waits for each test run and review round it starts, so it never ends while one is still running.

## Acceptance criteria
1. `/speck-build` tells the builder to run every test run (`speck test`, with or without `--files`) in the foreground and wait for it to finish, however long it takes, and never to end its turn while a command it started is still running in the background. It says why: a build started by `speck run` ends when the builder's turn ends, and whatever is still running is stopped with it.
2. `/speck-review` tells the builder the same for each review round it runs (`speck review`, or a reviewer subagent) and for the test runs between rounds.
3. No test that passed before this change fails.

## Out of scope
- Resuming a build that exited with its ticket still building or reviewing. The panel already says "Build stopped before finishing", and speck run resumes only killed builds today.
- Making the test suite faster.

## Notes
- Seen on 0213: the build's log ends with the builder saying the full suite "is running in the background (~9 min)", then `stop_reason: end_turn`, then the background task marked `killed`. Its run record shows exit code 0. 0215's build also ran commands in the background, three times.
- The steps are in `skills/speck-build/SKILL.md` (sections 1 step 6, 3 step 5 and 4) and `skills/speck-review/SKILL.md`. This repo builds from its installed copies in `.claude/skills/`, so check whether those need updating too, as earlier skill changes did.
- 0219 may also change `skills/speck-build/SKILL.md`. Build this one first.
- Checked 2026-10-15: Claude Code 2.1.296 has an environment variable, `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS`, that turns off background tasks (checked in the installed binary). Its Bash tool also caps a foreground command at `BASH_MAX_TIMEOUT_MS`, 10 minutes by default. Both go in the Delivery log as follow-ups, not here.
- Failing before this build: none
- Self-check: no changes

## In plain words
Builds that speck starts on its own now wait for each test run and review to finish before they carry on, rather than leaving one running in the background and stopping. Before, on a slow computer, a build could stop partway through with its ticket stuck as building. To see it, open the build instructions and read the new rule about waiting for every command, or watch a build's log: its test runs finish before the next step starts. Worth keeping an eye on: this is an instruction to the builder, not something speck enforces, and a single command still can't run longer than ten minutes, so a very slow suite could be cut off.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Turn off background commands in builds `speck run` starts, with `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` (found while checking the Unverified fact). Inbox: `speck/ideas/2026-10-15-turn-off-background-commands-in-speck-run-builds.md`.
- Claude Code stops a foreground command after `BASH_MAX_TIMEOUT_MS`, ten minutes by default, close to the nine-minute suite on the 8 GB MacBook Air. Inbox: `speck/ideas/2026-10-15-let-a-build-s-full-suite-run-past-ten-minutes.md`.

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
    "reviewed_sha": "99a3afaeafabdbae826bb85fa0dbad877447efa3",
    "thread_id": "01a1417f-357b-7d03-806c-a4dc5ffcd465",
    "seconds": 24,
    "usage": {
      "input_tokens": 123967,
      "cached_input_tokens": 87552,
      "cache_write_input_tokens": 0,
      "output_tokens": 700,
      "reasoning_output_tokens": 15
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-15T21:37:21.585Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md Rules explicitly require foreground execution for speck test with or without --files, waiting however long it takes, and never ending the turn with commands running. It explains the build lifecycle. The three AC1 tests in test/build-0227.test.mjs passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "skills/speck-review/SKILL.md, Before every round, applies the same requirements to speck review, reviewer subagents and tests between rounds. The AC2 test and installation consistency test passed; both local .claude skill copies match their sources."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0227-tests.txt: 1,987 tests, 1,984 passed, three skipped, zero failures or cancellations. Existing tests were not modified."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The build and review instructions now require waiting for tests and reviewers to finish and explain why ending a turn early stops the build. Installed skill copies contain the changes, and the full suite passed. No blocking concerns found."
  }
}
```

</details>
