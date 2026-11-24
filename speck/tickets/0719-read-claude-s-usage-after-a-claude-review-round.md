---
id: "0719"
title: "Read Claude's usage after a Claude review round"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: cursor              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-11-read-claude-s-usage-after-a-claude-review-round.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T14:27:38.321Z"

---
# 0719 · Read Claude's usage after a Claude review round

**Status:** 🔨 building

## Problem
speck runs Claude reviewers with `--output-format json`, which has no usage-limit lines, so a review round on Claude, as reviewer or as a stand-in from `reviewer_bench`, gives no reading. Claude's usage in `speck agents` and Settings can be stale just when it nears its limit.

## Outcome
After a review round on Claude Code, speck keeps Claude's latest usage reading, as after a Claude build.

## Acceptance criteria
1. After a review round run on Claude Code, as the reviewer or a stand-in from `reviewer_bench`, `speck agents` and Settings show the usage reading from that round, as they do after a Claude build.
2. The round's verdict, cost and session id are saved as before.
3. A reviewer command set in `reviewer_options` that prints a single JSON result, as today's does, still gives its verdict and cost.
4. No test that passed before this change fails.

## Out of scope
- Codex and Cursor readings, which already work (0642, 0643).

## Notes
- `CLAUDE_READ_ONLY` in `scripts/reviewers.mjs` uses `--output-format json`; `keepUsage` passes the output to `claudeUsageInLog` (`scripts/agent-usage.mjs`), which looks for `rate_limit_event` lines. `verdictFromOutput`/`jsonIn` parse the whole output as one JSON value.
- Checked 2026-11-24: `claude -p --output-format stream-json --verbose` prints `rate_limit_event` lines and ends with a `type: "result"` line carrying `session_id`, `total_cost_usd` and `usage` (Claude Code 2.1.331, `claude --help` and a saved build log).
- Failing before this build: none
- Builder: Cursor took over this build from Claude at 2026-11-24 14:40 UTC, because Claude's usage limit was reached until 2026-11-24 16:10 UTC, more than an hour away.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
