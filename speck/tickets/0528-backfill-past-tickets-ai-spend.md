---
id: "0528"
title: "Backfill past tickets' AI spend"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0527"]                # ticket ids that must be done first
created: 2026-10-27

---
# 0528 · Backfill past tickets' AI spend

**Status:** 📋 ready

## Problem
Spend recorded before 0523–0530 leaves out a ticket's earlier builds, builds whose log had no result line (83 run records here have no spend), every watch agent run, and every review round's cost. Claude Code keeps each session's transcript, with every message's model and tokens, but by default only for 30 days, so build and watch agent spend can still be recovered, though not for long.

## Outcome
`speck spend --backfill` recovers past spend: builds and watch agent runs from this project's Claude Code transcripts, and review rounds from the tokens they saved.

## Acceptance criteria
1. For each session in this project's Claude Code transcripts (`~/.claude/projects/<project folder>/<session>.jsonl`) whose first prompt is `/speck-build <id>`, and that the ticket's spend doesn't already count, `--backfill` adds its spend to that ticket's builder spend. That spend is each model's tokens, split into uncached input, cached input, cache writes and output, over every message in the session and its subagents, with each message counted once however many lines repeat it. Each model's tokens are priced from the price table (0524), and the spend is dated by the session's last message.
2. A watch agent session found in the transcripts is added to the watch agent spend of the ticket it looked into, in the same way.
3. Each review round saved without a cost gets one, priced from the tokens and `reviewer_model` it saved. For a Codex round saved with `default`, the model is the one its session file in `~/.codex/sessions/` records for its thread.
4. A session or round already counted isn't counted again, so running `--backfill` a second time changes nothing.
5. It prints how many sessions and rounds it added for each ticket, how many it skipped as already counted and how many it added with an unknown cost. With no transcripts folder for the project, it says so and adds only the review rounds.

## Out of scope
- Codex and Cursor build sessions from before this work (this repo has none).
- Builds you ran yourself with `/speck-build` in an interactive session, which can hold other work as well.

## Notes
- Transcript messages carry usage but no `total_cost_usd`, so a backfilled cost is a price-table estimate and can differ a little from what Claude Code would have reported.
- Run it before the transcripts it needs are deleted, or raise `cleanupPeriodDays` in your Claude Code settings first.
- Checked 2026-10-27: `cleanupPeriodDays` defaults to 30 and deletes transcripts silently (https://code.claude.com/docs/en/settings-reference.md#cleanupperioddays). The oldest transcript here is from 2026-10-08.
- Checked 2026-10-27: every one of the 477 run records' sessions has a transcript at `~/.claude/projects/<project folder>/<session>.jsonl`, plus 15 earlier `/speck-build` sessions that no record lists and about 12 watch agent sessions; each assistant line has `message.model`, `message.id` and `message.usage`, and a session's subagents are in `<session>/subagents/agent-*.jsonl` (local files).
- The project folder name is the repo's absolute path with each `/` turned into `-`, such as `-home-me-projects-speck`. Unverified: how Claude Code names it for paths with other characters.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
