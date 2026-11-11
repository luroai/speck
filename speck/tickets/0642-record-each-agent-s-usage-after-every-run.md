---
id: "0642"
title: "Record each agent's usage after every run"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: []                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T14:17:37.761Z"

---
# 0642 · Record each agent's usage after every run

**Status:** 🔨 building

## Problem
You can't see how close Claude or Codex is to its usage limit until a build stops on it, and speck can't pick another agent before that happens. Both agents already report their usage with every run, and speck throws it away.

## Outcome
After every build, review round and watch run on Claude Code or Codex, speck keeps that agent's latest usage, and `speck agents` shows it.

## Acceptance criteria
1. When a Claude Code run that speck started or watches ends, speck keeps Claude's latest usage from its log: for each window it reports (`five_hour`, `seven_day`), how much is used as a percentage, when it resets and whether it's refused, with the time it was read.
2. When a Codex run that speck started ends (a build, a review round or a watch run), speck reads the same from that run's session file: the five-hour and weekly windows' used percentage and reset time, the plan and whether a limit is reached, with the time it was read.
3. The readings are kept per agent for this machine in the main checkout's `speck/.cache/machine/`, which git ignores, a newer reading replacing an older one, and a run whose log or session file has no reading leaves the last one as it was.
4. `speck agents` prints, under each agent with a reading, each window's percentage used and when it resets, and how long ago it was read; `speck agents --json` gives the same as data.
5. No test that passed before this change fails.

## Out of scope
- Cursor: 0643.
- Showing it in the panel: 0646.
- Acting on it: 0647 to 0649.

## Notes
- 1.2 on the roadmap, "Your team". From `speck/ideas/2026-11-10-show-each-agent-s-usage-in-the-panel.md`.
- Checked 2026-11-11: Claude Code's stream-json has `rate_limit_event` lines whose `rate_limit_info.unifiedWindows` holds `five_hour` and `seven_day`, each with `utilization` (0 to 1), `resetsAt` (epoch seconds) and `status`. `scripts/usage-limit.mjs` already reads `status` and `resetsAt`.
- Checked 2026-11-11 (Codex 0.159.0): `codex exec --json` gives only tokens; the session file `~/.codex/sessions/YYYY/MM/DD/rollout-*-<thread_id>.jsonl` has `token_count` events with `rate_limits.primary` (`window_minutes` 300) and `rate_limits.secondary` (10080), each with `used_percent` and `resets_at` (epoch seconds), plus `plan_type` and `rate_limit_reached_type`. speck already finds these files by thread id for spend (`scripts/round-cost.mjs`).
- Failing before this build: none
- Self-check: an unreadable or tampered usage file (a bad time, a `constructor` key) now reads as no readings rather than failing `speck agents`; a build on a model provider keeps nothing; kept `scripts/run.mjs` and `scripts/foreman-agent.mjs` within 600 lines by keeping the build hook on `limitQueues` and re-exporting the watch hook from `usage-limit.mjs`.
- A review round on Claude Code (`--output-format json`) has no `rate_limit_event` lines, so it gives no reading; a build or watch run on Claude Code (stream-json) does.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
