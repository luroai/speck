# Changelog

## 0.2.0 · 10 October 2026

The first public release, a preview. It covers what you can do now that the private 0.1.0 build couldn't. That build had the ticket, idea and config formats, the capture, ticket, build, review, ship and status skills, the Codex and Claude subagent reviewers, and `speck init`.

### Getting started

- Set speck up by talking to your agent: paste the prompt from the README into Claude Code, and the `speck-setup` skill explains each choice and asks before it changes anything.
- Install a fixed release with `npx github:luroai/speck#v0.2.0 init`.
- See what setup needs to know about a folder and machine with `speck detect`, and change one setting with `speck config set <key> <value>`, which checks it first.
- Use Codex, Cursor or another agent that reads skills from `.agents/skills/` as the builder, and have `speck doctor` check the builder you set.
- On Windows, `speck doctor` and `speck init` say plainly that speck doesn't support it yet and suggest WSL.

### Tickets and ideas

- Cancel a ticket with `speck cancel <id> "<reason>"`, and the reason is kept.
- Mark a ticket as a bug fix, and leave priority blank until you choose one.
- Before writing an idea or a ticket, your agent checks for overlapping ideas and tickets and asks you what to do.
- Before a ticket goes to you for approval, your agent checks its criteria for more than one reading and checks the facts it relies on.
- Triage the inbox from chat. A build saves follow-ups worth their own ticket to the inbox, and ideas that became tickets move to `speck/ideas/done/`.
- `speck lint` warns when a ticket contains your home folder's path.

### Building and reviewing

- Each ticket builds in its own git worktree, so several builds can run side by side.
- `speck run` starts a build for each ticket as it becomes ready. `speck pause`, `speck play` and `speck stop` control a running build.
- The builder checks its own work before the first review round, and `speck close` writes the review and delivery logs once the reviewer approves.
- Set the reviewer's model and effort for every ticket or for one, or run any agent with a non-interactive mode as the reviewer from a command in `speck/config.yml`. The reviewer keeps its session between rounds where it can.
- Review rounds are kept in the ticket file.

### Shipping

- `speck ship` merges an approved ticket into your base branch and pushes it if you have a remote. No pull request or GitHub needed.
- Turn on `auto_ship` to ship whatever the reviewer approves, for the ticket risks you choose.
- If the merge conflicts, the build brings its branch up to date and has it reviewed again before shipping.
- A refused ship leaves your uncommitted changes alone, and finished tickets move to `speck/tickets/done/`.

### Seeing what's going on

- `speck panel` opens a control panel in your browser: read your ideas and tickets in full, set a ticket ready or its priority, follow each build's log as it runs, pause, play or stop it, and see what's shipped, with times and review stats.
- `speck status --json` prints every ticket and idea for other programs to read.

### Licence

- speck is MIT licensed.
