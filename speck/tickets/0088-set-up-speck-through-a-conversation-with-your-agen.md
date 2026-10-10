---
id: "0088"
title: "Set up speck through a conversation with your agent"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-set-up-speck-by-giving-your-agent-a-prompt.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0086", "0087"]                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T15:19:34.126Z"

---
# 0088 · Set up speck through a conversation with your agent

**Status:** 🔨 building

## Problem
Getting speck working needs Node, git, a clean repo, a test command, a builder and a reviewer, and choices most people can't make alone, like which reviewer to trust or whether builds may skip permission prompts. `speck init` sets up the files and `speck doctor` lists what's missing, but someone without a technical background still has to fix each gap themselves.

## Outcome
A `speck-setup` skill lets your agent take you through setting speck up in a conversation: it checks what's there, explains each choice, asks before changing anything, and leaves speck ready to build your first ticket.

## Acceptance criteria
1. `speck init` installs a `speck-setup` skill in both skill folders, like the other speck skills.
2. The skill starts from `speck detect` (0086) and asks before each change to the machine or to git: installing Node, `git init`, setting a git name and email, and making a commit. It records every setting choice with `speck config set` (0087), never by editing `speck/config.yml` directly.
3. In an existing project, it stops while tracked files have uncommitted changes until the user has dealt with them, confirms the base branch, warns that shipping pushes straight to that branch, so a branch that requires pull requests will refuse it, and confirms the test command by running it once.
4. In a new project, it makes the first commit, then creates a draft ticket to scaffold the app with a test runner, explaining that speck can't ship until a test command passes.
5. It proposes a builder and a reviewer from the agents found, preferring a reviewer from another model family; if only Claude is available, it explains same-model review and turns it on only if the user agrees. It explains that `speck run` builds skip permission prompts and asks before keeping that. It finishes once `speck doctor` passes, saying what to do next.

## Out of scope
- Windows (0091).
- Choosing reviewer models by name: blank (the reviewer's default) unless the user asks for one.

## Notes
- The skill is the conversation; `speck detect` and `speck config set` are the facts and the writes. The CLI never asks questions.
- Decided 2026-10-10: assume Claude Code is installed; support new and existing projects; macOS and Linux only.
- A skill can't be fully tested automatically. Tests should cover AC1 and that the skill names each step; the reviewer checks the rest by reading it.
- Self-check: an existing project with code but no commits had no first commit, so speck couldn't branch from it. The skill now asks for one (checking `.gitignore` first) before the base branch is set, with a test.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
