---
id: "0124"
title: "Spot another workflow during setup"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-spot-another-workflow-during-setup.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T13:12:23.032Z"

---
# 0124 · Spot another workflow during setup

**Status:** 🔨 building

## Problem
Setting speck up in a project that already uses another workflow, such as OpenSpec, leaves both running. Agents then get conflicting instructions: work from the other workflow's specs and changes, or only from speck's tickets. The project's own agent rules can also contradict how speck works, for example by banning git worktrees or requiring every change to go through a pull request, so builds fail or break the project's rules. Today setup says nothing about either.

## Outcome
Setup spots another workflow, and rules that clash with speck, explains each in plain words and asks what to do, without removing or editing anything itself.

## Acceptance criteria
1. `speck detect` reports, under `other_workflows`, each other workflow it finds with the paths that show it: OpenSpec (an `openspec/` folder, `openspec-*` skills or `/opsx` commands), GitHub Spec Kit (a `.specify/` folder) and Kiro (a `.kiro/` folder). It's an empty list when there are none.
2. When `other_workflows` isn't empty, the setup skill explains, before changing anything, that running two workflows gives agents conflicting instructions. It recommends using speck for new work, with the other workflow's files left where they are, and asks the user to choose between that, keeping both, or stopping.
3. If the user chooses speck, setup names any work still in progress in the other workflow (for OpenSpec, each folder under `openspec/changes/` other than `archive`) and recommends finishing it, or turning it into speck tickets with `/speck-ticket`, before building with speck.
4. Setup reads the project's `AGENTS.md` and `CLAUDE.md`, and any guide they point to, and names each rule that would clash with speck as it's being set up: for example a ban on git worktrees, a requirement that changes go through pull requests or a particular reviewer, or limits on unattended agents. For each, it says what would happen and what the user could change: the rule itself, or a speck setting such as `worktrees` or `auto_ship`.
5. Setup never deletes, moves or edits the other workflow's files or the project's own rules. It changes a speck setting only after the user agrees, as for every other setting.

## Out of scope
- Moving the other workflow's specs or changes into speck automatically.
- Linking untracked files a build needs, such as `.env.local`, into each worktree (a separate follow-on in the source idea).

## Notes
- Checked 2026-10-11: OpenSpec in a real project has an `openspec/` folder (`config.yaml`, `specs/`, `changes/`, with finished changes under `changes/archive/`), `openspec-*` skills in `.claude/skills/` and `.agents/skills/`, and commands in `.claude/commands/opsx/` (a local project using OpenSpec).
- Unverified: GitHub Spec Kit keeps its files in `.specify/`, and Kiro in `.kiro/` (from memory; check each tool's current documentation).
- Decided 2026-10-11: spot and ask, never remove.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
