# speck

**Small tickets. Independent review. You ship.**

speck is a lightweight, repo-native workflow for shipping software with AI coding agents. It's designed for PMs and founders who can write a good ticket but don't want to review code line by line.

```
idea → ticket → [you: Ready for Dev] → agent builds → second agent reviews, turn by turn → approved → [you: /speck-ship]
```

- **Tickets, not specifications.** Each change is a small numbered ticket in your repo, sized for one agent in one sitting. speck checks the size rules and makes you split anything bigger.
- **Adversarial review built in.** The building agent (Claude Code) starts an independent reviewer (Codex by default) and they take turns: the builder fixes or disputes each finding, and the reviewer re-checks in the same session. It ends when the reviewer approves or the question comes back to you.
- **The code is the record.** The code, the tickets and the tests say what the product does. There's no separate spec to keep in step with them.
- **Two human gates.** You decide what gets built and what gets shipped. Agents never merge or ship unless you run `/speck-ship`, or you turn on `auto_ship` in `speck/config.yml` to ship whatever the reviewer approves.
- **No GitHub needed.** Everything happens in your local repo. Shipping merges the approved branch into `main` and pushes it if you have a remote.

Inspired by [OpenSpec](https://github.com/Fission-AI/OpenSpec), with less ceremony.

> Status: 0.2.0, a public preview. It works end to end on a local machine. Expect rough edges.

## Get started

Open [Claude Code](https://claude.com/claude-code) in the folder of the project you want to build, or in an empty folder for a new one, and paste this:

```text
Set up speck in this folder. If Node.js 20 or newer isn't installed, offer to
install it first. Then run `npx github:luroai/speck#v0.2.0 init` and follow
the speck-setup skill it installs. Ask me before changing anything on my
machine or in git.
```

Your agent checks what's there, explains each choice in plain words and waits for your answer before it installs anything, makes a commit or changes a setting. When it's done, speck is ready to build your first ticket.

## Requirements

- macOS or Linux
- [Claude Code](https://claude.com/claude-code), or another builder: any coding agent that reads skills from `.agents/skills/` or `.claude/skills/`, such as [Codex](https://github.com/openai/codex) or [Cursor](https://cursor.com/docs/cli/installation). Set it as `builder:` in `speck/config.yml`, so `speck doctor` checks the right tool. Claude Code is the default and the one most tested.
- git
- Node.js 20 or newer, which your agent can install for you
- Optional: [Codex CLI](https://github.com/openai/codex) as the reviewer (the default). Otherwise any agent with a non-interactive mode set up as a reviewer command in config (see below), or a Claude subagent reviewer if you allow it

## Without an agent

To install speck yourself, run this in the folder of the project you want to build:

```bash
npx github:luroai/speck init
```

This one command:
- sets up `speck/` (config, ideas and tickets);
- adds the speck skills to `.claude/skills/` and `.agents/skills/`, so Claude Code, Codex, cptr and other agents all find them;
- puts the `speck` command in `.speck/`;
- checks that git, Claude Code and Codex are installed and signed in, and tells you in plain English how to fix anything that isn't.

Commit the new files, and everyone working on the repo gets speck too. To update speck, run the same command again. It refreshes the skills and keeps your config and tickets.

To re-check your setup at any time: `node .speck/scripts/speck.mjs doctor`.

## Use

| Command | What it does |
|---|---|
| `/speck-setup` | Your agent takes you through setting speck up in a conversation: it checks what's there, explains each choice (base branch, test command, builder and reviewer, whether `speck run` builds skip permission prompts), asks before changing anything, and finishes once `speck doctor` passes |
| `/speck-capture` | Save an idea or the current conversation to `speck/ideas/` |
| `/speck-ticket` | Turn an idea into small, numbered tickets that pass the size rules, or triage the inbox down to at most three decisions |
| *you* | Approve a ticket for development: `node .speck/scripts/speck.mjs set <id> status ready` (Gate 1) |
| `/speck-build <id>` | Tests from the acceptance criteria, then code, then the review loop. Ends with the ticket `approved`, waiting for you |
| `node .speck/scripts/speck.mjs run` | Starts `/speck-build` in a non-interactive session for each ready ticket as it becomes ready, using `build_command` in `speck/config.yml`. The default skips all permission prompts. A build you end with `speck stop` isn't reported as failed or launched again |
| `node .speck/scripts/speck.mjs pause <id>` | Holds a build that `speck run` launched where it is, with the processes it started, until you play it. Its ticket keeps its status, and it keeps its place among the builds running, even if `speck run` is restarted. In `speck panel`, the pause icon on the left of a running build's queue row does the same, and turns into a play icon that plays it. macOS and Linux only |
| `node .speck/scripts/speck.mjs play <id>` | Carries a paused build on from where it was paused, in the same session, worktree and log |
| `node .speck/scripts/speck.mjs stop <id>` | Ends a build that `speck run` launched, running or paused, with every process it started. Its ticket is set `blocked` with the question `Stopped by you on <date>.`, committed where the build keeps it, and its branch, worktree and commits are kept, so you can resume its session or run `/speck-build <id>` to carry on. In `speck panel`, a running or paused build's open queue row has a Stop build button that does the same once you confirm it. macOS and Linux only |
| `/speck-review <id>` | Re-run the review loop on its own |
| `/speck-status` | Tickets by status: approved (waiting for you) first, then blocked questions |
| *you* | Read the review pack: `node .speck/scripts/speck.mjs pack <id>` |
| `/speck-ship <id>` | Ship it (Gate 2): final checks and tests, then merge into `main`, push and delete the branch. Only you run this |

## What a review pack looks like

Every approved ticket has a **review pack** written for someone who doesn't read code:
- each acceptance criterion with ✅/❌ and the reviewer's evidence;
- a plain-English summary;
- risk flags (sensitive files touched, size);
- the review history;
- actuals: review rounds, reviewer tokens and elapsed time.

## Using another reviewer

Any agent that can run non-interactively can review. Give it a name and a command in `speck/config.yml`, and `speck review` runs it and records its verdict:

```yaml
reviewer: cursor
reviewer_options:
  cursor:
    command: "cursor-agent -p --output-format json --mode ask --model {model}"
```

For Claude Code, use `"claude -p --output-format json --permission-mode plan --model {model} --effort {effort}"`, and set `allow_same_model_review: true` if Claude is also the builder. To let later rounds continue the reviewer's own session instead of resending everything, add `session_id_path: session_id` and `resume_command: "claude -p --output-format json --permission-mode plan --resume {session} --model {model} --effort {effort}"`. `{model}` and `{effort}` come from `reviewer_model` and `reviewer_effort`; if one is blank, it's left out with its flag. The reviewer is asked to stay read-only, but speck doesn't sandbox it, so use the tool's read-only mode as above. Flags change, so check your tool's current ones.

## Repo layout

```
.claude/skills/speck-*/      # the skills, for Claude Code (installed by init)
.agents/skills/speck-*/      # the same skills, for Codex, cptr and other agents
.speck/                      # the speck command and templates (installed by init)
speck/
  config.yml                 # builder, reviewer, test command, limits
  ideas/                     # captured ideas
  tickets/0007-<slug>.md     # numbered tickets; status in frontmatter, every review round at the end
```

## Design

See [`docs/brief.md`](docs/brief.md).

## Licence

MIT. See [LICENSE](LICENSE).
