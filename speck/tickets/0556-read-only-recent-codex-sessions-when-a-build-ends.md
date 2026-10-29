---
id: "0556"
title: "Read only recent Codex sessions when a build ends"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-27-read-only-recent-codex-sessions-when-a-build-ends.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-29

---
# 0556 · Read only recent Codex sessions when a build ends

**Status:** 📋 ready

## Problem
When a build ends, `speck run` reads the first line of every session file in Codex's sessions folder to find the ones started in the ticket's worktree, then reads them all again for each one it finds, to collect its sub-agents. Every build does this, even one that never ran Codex, and the folder only grows: here 1,155 files (448 MB) took about a third of a second with the files cached, and more for each session found.

## Outcome
A build's end opens only the Codex session files that changed since the ticket's first build started, and counts the same sessions as before.

## Acceptance criteria
1. When a build ends, the Codex sessions kept as the ticket's delegated spend, with their sub-agents, are the same as today for every session whose files changed after the ticket's `started` time.
2. A session file that last changed before the ticket's `started` time isn't opened when a build ends, not even for its first line.
3. A build of a ticket with no `started` time reads every session file, as today.
4. No test that passed before this change fails.

## Out of scope
- Counting a resumed session's later turns (`speck/ideas/2026-10-27-count-a-delegated-codex-session-s-later-turns.md`).
- 0532's count of a Codex build's own sub-agents.

## Notes
- Asked for 2026-10-29 for the 0.21.1 patch release.
- From 0534's own note: `codexSessionsIn` and `codexSubagents` in `scripts/round-cost.mjs` each walk the whole folder, called from `recordDelegatedSpend` in `scripts/spend.mjs`.
- Decided: go by each file's last change, not its day folder (`YYYY/MM/DD`), so a session resumed later is found wherever its file is.
- Checked 2026-10-29: `~/.codex/sessions` here holds 1,155 files, 448 MB; `codexSessionsIn` took 336 ms and `codexSubagents` 103 ms with the files cached (timed by calling them directly).
- Shares `scripts/spend.mjs` with 0553, unchained: different functions.
- Relies on Codex's sessions folder layout as 0532 and 0534 already read it.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
