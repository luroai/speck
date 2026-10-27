---
id: "0534"
title: "Count Codex sessions started in a ticket's worktree in its spend"                # one outcome, no "and"
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
after: ["0532", "0533"]                # ticket ids that must be done first
created: 2026-10-27

---
# 0534 · Count Codex sessions started in a ticket's worktree in its spend

**Status:** 📋 ready

## Problem
Some research works better on Codex: in a test on 27 October, Opus was poor at finding LinkedIn contacts and Codex was better. So a Claude Code build will hand that part of a ticket to Codex, running `codex exec` itself, on a model such as `gpt-6.1-sol`. speck never sees a Codex process the builder starts, so the ticket's spend leaves it out and the user can't see what that research costs.

## Outcome
A Codex session started inside a ticket's worktree counts in that ticket's spend, however it was started, with no command or step the builder has to remember.

## Acceptance criteria
1. When a build of a ticket ends, `speck run` records each Codex session whose session file in `$CODEX_HOME/sessions` (or `~/.codex/sessions`) gives as its `cwd` the ticket's worktree or a folder inside it. Each one's tokens and cost are counted and priced as a Codex build's are, including its sub-agents (0532). A session whose `cwd` is outside the worktree, including another ticket's worktree, isn't counted.
2. Each session counts once for the ticket, however many builds of it end. A session already counted as one of the ticket's builds, review rounds or watch agent runs (matched by its thread id), or as a sub-agent of one, isn't counted again.
3. `speck status --json` gives each ticket's `delegated_tokens` and `delegated_cost_usd`, summed over those sessions, or null when it has none. Its `total_cost_usd` and `total_tokens` include them, and `total_cost_unknown` names `delegated` when a session has tokens but no known cost. `speck spend` counts them as a part of their own, `delegated`.
4. A missing sessions folder, or a session file that can't be read or parsed, records nothing for that file and doesn't stop the build's end being handled.
5. `docs/brief.md`, where it says how `speck run` records a ticket's spend, says it counts Codex sessions started in the ticket's worktree. No test that passed before this change fails.

## Out of scope
- Agents other than Codex, such as Cursor or a model provider, run from inside a build.
- Codex started from a folder outside the worktree, for example with `-C`.
- Showing delegated spend as its own line in the panel. Its total already includes it.
- Choosing the builder's model per ticket (`speck/ideas/2026-10-11-choose-the-builder-s-model-per-ticket.md`).

## Notes
- Replaces an earlier draft's `speck delegate` command. Reading the session files means the builder can run `codex exec` directly, or from a Claude sub-agent, and it still counts.
- after 0532 (it reuses 0532's sub-agent counting and changes the same spend code) and 0533 (both change the brief's spend wording).
- Codex review rounds run `codex exec` too and keep their `thread_id` in the round's meta (`scripts/review.mjs`). A Codex build keeps its session in the run record. Criterion 2 keeps both out.
- Recorded when the build ends, as the builder's spend is, so `speck status` and the panel don't scan Codex's sessions folder each time they read a ticket.
- `speck run` sets `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` for Claude builds, so the builder runs Codex in the foreground. A Claude Code Bash call times out after 10 minutes at most, so a long research run may need splitting, for example one call per case.
- Tests use session files written in a temporary `CODEX_HOME`. They never run real Codex.
- Checked 2026-10-27: a `codex exec` session file's first line is `session_meta`, whose payload has `cwd` (the folder it ran in), `timestamp`, `originator: "codex_exec"` and `source: "exec"`, and its file name ends `-<thread id>.jsonl` (local test, codex-cli 0.159.0). `gpt-6.1-sol` is in `codex debug models` and has rates in `scripts/prices.json` ($2 per million input tokens, $10 per million output).
- Unverified: which sandbox and config settings Codex needs to search the web from `codex exec` for this kind of research (not tried). That's for the ticket that does the research, not this one.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
