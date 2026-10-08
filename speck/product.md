# speck

Last updated by ticket: none yet (v0.1 bootstrap, built by hand on 8 October 2026)

## What it is
speck is a lightweight, repo-native workflow for building software with AI coding agents. It's aimed at PMs and founders who write good tickets but don't review code line by line. Ideas become small numbered tickets. One agent builds each ticket, and a second, independent agent reviews it in turns until it approves. The human holds two gates: approving a ticket for development, and merging the PR.

## Current capabilities
- **Six skills**, installed into each project's `.claude/skills/` and `.agents/skills/` so Claude Code, Codex, cptr and other agents find them: `/speck-capture`, `/speck-ticket`, `/speck-build`, `/speck-review`, `/speck-ship` and `/speck-status`.
- **CLI** (`scripts/speck.mjs`, Node 20+, no dependencies):
  - `init`: one-step install and update, run as `npx github:luroai/speck init`. It creates `speck/`, copies the skills and the CLI (into `.speck/`) into the project, points AGENTS.md and CLAUDE.md at it, and runs `doctor`. Re-running it refreshes the skills and CLI and keeps config and tickets. In speck's own repo it links rather than copies.
  - `doctor`: checks Node, git, Claude Code, the GitHub CLI and Codex (installed and signed in), with a plain-English fix for each problem.
  - `new`: creates the next numbered ticket.
  - `lint`: checks the size rules.
  - `set`: updates fields. Setting status to `ready` requires a clean lint, and `building` and `done` record timestamps.
  - `status`, `diffstat` (with the size guard), `review` (Codex adapter), `record` (other reviewers), `prompt`, `next` and `pack` (PR body).
- **Codex review loop:** read-only sandbox, structured verdict (`templates/review-verdict.schema.json`), and the same session resumed across rounds. Every round is saved to `speck/reviews/<id>/round-N.json`.
- **Safeguards:**
  - An `approve` with failing criteria or open blocking findings is overridden to `changes_requested`.
  - The loop blocks after the maximum number of rounds, after the same dispute is rejected twice in a row, or on escalation.
  - Builder and reviewer can't be the same agent without an explicit override.
- **Review pack:** acceptance criteria table, risk flags, review history and actuals.

## Key decisions and constraints
- **The repo is the source of truth.** All state is Markdown or JSON in `speck/`, so that any UI (such as the future board) is only a view over these files.
- **Small tickets only:** one agent, one sitting, one PR. `L` tickets must be split.
- **Builder and reviewer are different agents by default** (Claude builds, Codex reviews).
- **Only the reviewer can approve. Only the human can merge.** Skills never run `gh pr merge`.
- **Ticket closure and `product.md` updates ship inside the PR**, so merging is what makes them true.
- **The reviewer reviews commits**, so `speck review` refuses to run on uncommitted changes.

## Known limits
- One ticket at a time; no parallel runs or dependency scheduling.
- Claude Code is the only tested builder. The `claude-subagent` reviewer path is written but hasn't been tested end to end.
- If the Codex sandbox can't start (for example, AppArmor blocking bubblewrap on Ubuntu), the reviewer works only from the diff and test output it's given.
- GitHub won't let you approve a PR you opened yourself. If agents use your own `gh` login, rely on the required `speck/review` check plus your merge, or give agents a separate bot account.
- Not yet published to npm (planned package name `speck-dev`). Install runs from GitHub with `npx`, so the repo must be public, or the user needs access to it.
- No Claude Code plugin: skills are plain project skills, so commands are `/speck-build` rather than `/speck:build`.

## How to run and test
- Unit tests: `npm test`
- Try an install: in a test repo, run `npx github:luroai/speck init`. To test unpushed changes, use `npm pack` in speck, then `npx --package=<path to .tgz> speck init`.
- In this repo, `node scripts/speck.mjs init` links `.claude/skills/`, `.agents/skills/` and `.speck/` back to the source, so edits to the skills take effect straight away.
