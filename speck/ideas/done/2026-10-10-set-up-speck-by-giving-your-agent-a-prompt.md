# Set up speck by giving your agent a prompt

Captured: 2026-10-10 · Status: ticketed (0086, 0087, 0088, 0089)

## What
Setup is a conversation with your agent. The user pastes a short "give your agent this prompt" message into Claude Code, and the agent installs what's missing, sets up git and the project, detects the agents present, proposes builder and reviewer models and writes the config, asking the user at each decision.

## Why
The target is PMs and programme managers without a technical background. Today `npx … init` assumes Node, git, a repo, Claude Code, Codex and a test command, and `speck doctor` only diagnoses. Every missing piece is a cliff. "A chat with your agent really is the new interface."

## Notes
- Decided: assume Claude Code is installed. Support brand-new and existing projects. macOS and Linux only at first.
- Split: the CLI never asks questions, the agent does. `speck init --detect` reports facts as JSON (git repo and clean tree, base branch, git identity, agent CLIs on the PATH and signed in, Node version, likely test command and `worktree_setup`), plus a safe way to set config values. All judgement happens in the chat.
- The pasted prompt stays tiny and points to versioned instructions (a `SETUP.md` or a `speck-setup` skill), so the README's prompt never goes stale.
- Node is still required by the framework (the skills call `speck start`, `review`, `ship`), and Claude Code's native installer doesn't bring Node. The agent checks and offers to install it. Later option: ship `speck` as a single compiled binary so Node isn't needed.
- Existing project: stop on a dirty tree, detect main/master, warn if the base branch requires pull requests (ship pushes to it directly), confirm the test command by running it, keep existing CLAUDE.md/AGENTS.md.
- New project: `git init`, `.gitignore`, git identity, first commit, then ticket 0001 "scaffold the app with a test runner", because `speck ship` refuses without a passing `commands.test`.
- Both: propose a builder and reviewer, explain same-model review when only Claude is present, and get explicit consent before `--dangerously-skip-permissions` in `build_command`.
- Suggested models must be data that ships with each release (or blank for the agent's default), not hard-coded, since names go stale.
- Pilot: the maintainer adds speck to one of their existing projects using only the prompt. Anything done by hand becomes backlog.
- Open: `SETUP.md` fetched by URL, or a skill installed first?
