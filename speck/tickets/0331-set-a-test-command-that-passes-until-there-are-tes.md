---
id: "0331"
title: "Set a test command that passes until there are tests in a folder without any"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0331 · Set a test command that passes until there are tests in a folder without any

**Status:** 🔨 building

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

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
