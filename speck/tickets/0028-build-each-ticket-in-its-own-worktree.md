---
id: "0028"
title: "Build each ticket in its own worktree"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0027"]                # ticket ids that must be done first
created: 2026-10-09

---
# 0028 · Build each ticket in its own worktree

**Status:** 📋 ready

## Problem
Sessions that share one checkout keep colliding. One session's branch switch changes files under another's feet, one session's files end up in another's commits, and untracked files from elsewhere block reviews. This keeps happening and costs rework.

## Outcome
Each build happens in its own git worktree, so a build never touches the main checkout or another build.

## Acceptance criteria
1. `speck start <id>` takes a `ready` ticket, creates its branch from the local base branch in a new worktree outside the main checkout, sets the ticket to `building` and commits it there, then prints the worktree's path. The main checkout's branch and files are unchanged.
2. If `worktree_setup` in `speck/config.yml` is set (for example `npm ci`), `speck start` runs it in the new worktree. If it fails, the worktree and branch are removed, the ticket stays `ready`, and the error says why.
3. `speck start` refuses, changing nothing, if the ticket isn't `ready` or a branch or worktree for it already exists, and prints the existing path so a build can resume there. With worktrees on, it also refuses if `.speck/` or the installed skills aren't committed, because a worktree wouldn't have them, and says to commit them first.
4. With `worktrees: false` in config, `speck start` creates the branch in the current checkout as builds do today. New projects get `worktrees: true` and a blank `worktree_setup`, and this repo turns worktrees on.
5. The build skill uses `speck start <id>` and does all of its building, testing and reviewing in the printed worktree. When resuming a ticket, it continues in that ticket's existing worktree.

## Out of scope
- Running several builds at once: still one ticket at a time.
- Showing in-progress worktrees in `speck status` (0029).

## Notes
- Pre-check: AC1's "up-to-date base branch" could have meant fetching from the remote. It now says the local base branch; the build skill's pre-flight still pulls first.
- Checked 2026-10-09: this repo tracks `.speck/` (links to `scripts/` and `templates/`) and the skills, so a worktree has the speck CLI.
- Checked 2026-10-09: `speck init` doesn't commit or ignore `.speck/` or the skills in a user's project. A worktree only has the CLI and skills if the user has committed them (AC3 makes `speck start` refuse in that case; agreed 2026-10-09).
- After 0027, because builds in worktrees need to ship from one.
- This reverses the "Worktrees rejected for now" decision in `speck/ideas/2026-10-08-speck-board.md`. The reason is isolation between sessions, not parallel builds. Update that note and `product.md`.
- Worktrees share one `.git` object store, so a new one adds only the checked-out files. Gitignored files (`node_modules`, `.env`) aren't there, which is what `worktree_setup` is for.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
