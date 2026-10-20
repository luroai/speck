---
id: "0331"
title: "Set a test command that passes until there are tests in a folder without any"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
created: 2026-10-20
started: "2026-10-20T12:00:51.494Z"
approved: "2026-10-20T12:02:25.636Z"
finished: "2026-10-20T12:05:02.371Z"

---
# 0331 · Set a test command that passes until there are tests in a folder without any

**Status:** ✅ done

## Problem
Setting speck up in an existing folder with no tests, such as a folder of documents with a small dashboard, leaves `commands.test` blank. `speck ship` refuses unless `commands.test` is set and passes, so nothing built there can ever ship, and setup doesn't say so. It happened on the user's first Cursor setup on their work laptop (2026-10-20), where Cursor recommended leaving it blank.

## Outcome
In an existing folder with no tests, setup sets a test command that passes while there are none and runs the tests that later tickets add, so tickets can ship from the start.

## Acceptance criteria
1. In section 3, step 4 of `skills/speck-setup/SKILL.md`, when the user has no tests, the skill tells the agent to recommend `node --test`, run it once and, if it passes, set it with `speck config set commands.test "node --test"`, rather than leaving `commands.test` blank.
2. The same step tells the agent to say, in plain words, that with `commands.test` blank nothing can ship, and that document changes are checked by the reviewer instead of by tests.
3. If the user still wants it blank, the skill keeps today's offer of a draft ticket to add a test runner.
4. The installed copy, `.claude/skills/speck-setup/SKILL.md`, matches `skills/speck-setup/SKILL.md`.
5. No test that passed before this change fails.

## Out of scope
- Section 4's first ticket for a new project, which already sets up a test runner.
- Ticket kinds for documents (`speck/ideas/2026-10-19-add-job-kinds-one-at-a-time.md`).
- Changing `speck detect` to suggest a test command.

## Notes
- Why `node --test`: speck needs Node.js 20 or newer anyway, and in a folder with no test files it exits 0 and prints TAP (`1..0`), so it passes until a ticket adds tests and then runs them. Not `true`, which would never run the tests later tickets add. Not a language's own runner by default: pytest, for one, exits 5 when it finds no tests.
- Checked 2026-10-20: `node --test` in a folder with only a Markdown file prints `1..0`, `# tests 0` and exits 0 (Node 22.23.3 on this machine).
- `node --test` also picks up files such as `*.test.js` written for another runner (Jest, say) and fails on them, which is why AC1 sets it only if it passes.
- The skills are instructions to agents, not documents, so tests may check their wording (`docs/brief.md`, "Criteria about documents").
- Failing before this build: none
- `.claude/skills/speck-setup` (and `.agents/skills/speck-setup`) are symlinks to `skills/speck-setup`, so AC4 holds without copying; the test compares their contents.
- Self-check: added what to do when `node --test` fails (test files for another runner): show the output and ask how they run those tests.

## In plain words
When you set speck up in a folder that has no tests yet, such as a folder of documents, setup no longer leaves the test step empty. It recommends a test command that passes while there are no tests and starts running tests once later work adds some, so finished tickets can ship straight away. It also explains that with no test command nothing can ship, and that changes to documents are checked by the reviewer reading them. You can still choose to leave it empty, and setup then offers a draft ticket to add tests, as before. To see it, run setup in a folder with no tests and watch the test step. Worth watching: a folder with test files written for another tool may make the recommended command fail, and setup then asks how you run those tests.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 86,812
- Elapsed since build started: 2 min
- Changed lines: 3 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups: none.

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
    "reviewed_sha": "dcdfb1964ec840068836729a9ff6676c7ba5a03d",
    "thread_id": "01a15930-831d-7702-abb9-f39f40cca39c",
    "seconds": 24,
    "usage": {
      "input_tokens": 86175,
      "cached_input_tokens": 49792,
      "cache_write_input_tokens": 0,
      "output_tokens": 637,
      "reasoning_output_tokens": 10
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T12:02:17.691Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-setup/SKILL.md, section 3 step 4, recommends node --test, requires running it once, and sets commands.test only if it passes. Covered by passing test '0331 AC1'."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Section 3 step 4 explicitly explains that blank commands.test prevents shipping and that the reviewer reads document changes instead of tests checking them. Covered by passing test '0331 AC2'."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Section 3 step 4 retains the user's option to leave it blank and offers a draft ticket to add a test runner after choosing agents. Covered by passing test '0331 AC3'."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": ".claude/skills/speck-setup links to ../../skills/speck-setup. Passing test '0331 AC4' compares installed and source contents."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Recorded targeted run includes setup-0331, setup-0088 and repository checks: 135 tests, 132 passed, 3 skipped, zero failures. The change is confined to the setup instruction and its tests; existing tests were not weakened."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Setup now recommends a working test command for existing folders without tests, explains why leaving it blank prevents shipping, and preserves the user's choice to defer test setup. The installed skill matches, relevant tests pass, and no blocking issues were found."
  }
}
```

</details>
