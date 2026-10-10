---
id: "0110"
title: Recover a build that was killed                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10

---
# 0110 · Recover a build that was killed

**Status:** 📋 ready

## Problem
When a build's process is killed (here by the out-of-memory killer, which also took down `speck run`), its ticket stays `building` and the panel shows it as in progress, so on 2026-10-10 five dead builds looked busy for half an hour. Nothing restarts them: `speck run` launches only ready tickets, and someone had to resume each session by hand.

## Outcome
A build that was killed is shown plainly as stopped, and `speck run` resumes its session once by itself.

## Acceptance criteria
1. A ticket that's `building` or `reviewing` whose build record has no exit and whose process is gone shows in `speck status` and the panel as "Build stopped unexpectedly", not as in progress.
2. `speck run` resumes such a build once: it continues the same session (as `resume_command` does) with a message saying the build was stopped and to carry on, logs to the same build log and keeps the build's record, so the panel, pause and stop work as for any build.
3. If the resumed build is killed again, `speck run` doesn't resume it a second time. The ticket shows as stopped, with the command to resume it.
4. A build ended by `speck stop`, or one that exited by itself, is never resumed.

## Out of scope
- Preventing out-of-memory kills (0109).

## Notes
- 0045 flags a build that finished without shipping; this covers a build that was killed before it finished.
- On 2026-10-10 the five builds were resumed by hand with `claude --resume <session> -p …`, which carried on cleanly from each worktree.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
