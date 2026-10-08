# speck

Last updated by ticket: 0006

## What it is
speck is a lightweight, repo-native workflow for building software with AI coding agents. It's aimed at PMs and founders who write good tickets but don't review code line by line. Ideas become small numbered tickets. One agent builds each ticket, and a second, independent agent reviews it in turns until it approves. The human holds two gates: approving a ticket for development, and shipping it with `/speck-ship`. Everything happens in the local repo, with no PR.

## Current capabilities
- **Six skills**, installed into each project's `.claude/skills/` and `.agents/skills/` so Claude Code, Codex, cptr and other agents find them: `/speck-capture`, `/speck-ticket`, `/speck-build`, `/speck-review`, `/speck-ship` and `/speck-status`.
- **CLI** (`scripts/speck.mjs`, Node 20+, no dependencies):
  - `init`: one-step install and update, run as `npx github:luroai/speck init`. It creates `speck/`, copies the skills and the CLI (into `.speck/`) into the project, points AGENTS.md and CLAUDE.md at it, and runs `doctor`. Re-running it refreshes the skills and CLI and keeps config and tickets. In speck's own repo it links rather than copies.
  - `doctor`: checks Node, git, Claude Code and Codex (installed and signed in), with a plain-English fix for each problem. The GitHub CLI is reported as optional.
  - `new`: creates the next numbered ticket.
  - `lint`: checks the size rules.
  - `set`: updates fields. Statuses are `draft`, `ready`, `building`, `reviewing`, `blocked`, `approved` and `done`. Setting `ready` requires a clean lint, and `building` and `done` record timestamps.
  - `status` (approved tickets first, as waiting for you), `diffstat` (with the size guard), `review` (Codex adapter), `record` (other reviewers), `prompt`, `reviewer-settings`, `next` and `pack` (the review pack).
  - `ship`: the user's gate. It refuses, changing nothing, unless the ticket is `approved`, the review loop says ship, the working tree is clean, no commit after the reviewer's approval touched files outside `speck/` (even if later reverted), and `commands.test` is set and passes. Then it sets the ticket to `done` on its branch, merges into the base branch with a merge commit, deletes the local branch and pushes the base branch if it has a remote. Once that push succeeds, it also deletes the ticket branch on the remote if it's there. If the push fails, the remote copy is kept. A merge conflict is aborted and leaves everything as it was.
- **Build ends at `approved`:** once the reviewer approves, `/speck-build` fills in the ticket's review and delivery logs, sets `approved` and stops. No PR is opened, and the GitHub CLI isn't needed.
- **`/speck-ship <id>`** runs `speck ship`. In Claude Code the skill has `disable-model-invocation: true`, so only the user can start it.
- **Reviewer model and effort:** `reviewer_model` and `reviewer_effort` in `speck/config.yml` set them for the whole repo. `speck new` copies them into each ticket, where they can be overridden, and a blank ticket value falls back to config. If both are blank, speck passes nothing and the reviewer uses its own default. Codex gets them in every round, and the review skill starts a `claude-subagent` reviewer with them. `speck lint` accepts only a blank effort or `low`, `medium`, `high`, `xhigh` or `max`. Model names aren't checked. Every saved round and the review pack show the model and effort used, or "default".
- **Codex review loop:** read-only sandbox, structured verdict (`templates/review-verdict.schema.json`), and the same session resumed across rounds. Every round is saved to `speck/reviews/<id>/round-N.json`.
- **Safeguards:**
  - An `approve` with failing criteria or open blocking findings is overridden to `changes_requested`.
  - The loop blocks after the maximum number of rounds, after the same dispute is rejected twice in a row, or on escalation.
  - Builder and reviewer can't be the same agent without an explicit override.
- **Review pack** (`speck pack <id>`): acceptance criteria table, risk flags, review history and actuals.

## Key decisions and constraints
- **The repo is the source of truth.** All state is Markdown or JSON in `speck/`, so that any UI (such as the future board) is only a view over these files.
- **Small tickets only:** one agent, one sitting, one branch. `L` tickets must be split.
- **Builder and reviewer are different agents by default** (Claude builds, Codex reviews).
- **Only the reviewer can approve. Only the human can ship.** Agents never merge or ship unless the user runs `/speck-ship`.
- **Ticket closure and `product.md` updates travel on the ticket branch.** `product.md` is updated and reviewed during the build, and `speck ship` sets `done` just before merging, so merging is what makes them true and nothing reaches the base branch unreviewed.
- **Local first, for solo builders.** Shipping is a local merge plus a push, so no GitHub PR, `gh` login or branch protection is needed.
- **The reviewer reviews commits**, so `speck review` refuses to run on uncommitted changes.
- **speck never picks a model.** No model name is built into the code, templates or skills. With nothing set, the reviewer runs on its own default: Codex's default, or the builder's model in a fresh session for `claude-subagent`.

## Known limits
- One ticket at a time; no parallel runs or dependency scheduling.
- Claude Code is the only tested builder. The `claude-subagent` reviewer path is written but hasn't been tested end to end.
- If the Codex sandbox can't start (for example, AppArmor blocking bubblewrap on Ubuntu), the reviewer works only from the diff and test output it's given.
- No PR flow yet. Shipping pushes the base branch directly, so it fails if the branch is protected by a "require a pull request" rule. A PR mode for teams is parked in `speck/ideas/2026-10-08-pr-ship-mode.md`.
- In Codex and other agents, nothing technically stops the agent from starting `/speck-ship`. Only the skill and agent instructions say not to. Claude Code enforces it with `disable-model-invocation`.
- If the base branch has moved and conflicts, `speck ship` refuses. There's no automatic rebase.
- Not yet published to npm (planned package name `speck-dev`). Install runs from GitHub with `npx`, so the repo must be public, or the user needs access to it.
- No Claude Code plugin: skills are plain project skills, so commands are `/speck-build` rather than `/speck:build`.

- Speck doesn't check whether a model name exists or whether the reviewer supports the chosen effort. For example, Codex may reject `max`.
- Claude Code's Agent tool takes model aliases rather than full model names, so set `reviewer_model` in that form for a `claude-subagent` reviewer.

## How to run and test
- Unit tests: `npm test`
- Try an install: in a test repo, run `npx github:luroai/speck init`. To test unpushed changes, use `npm pack` in speck, then `npx --package=<path to .tgz> speck init`.
- In this repo, `node scripts/speck.mjs init` links `.claude/skills/`, `.agents/skills/` and `.speck/` back to the source, so edits to the skills take effect straight away.
