# speck

**Small tickets. Independent review. You ship.**

speck is a lightweight, repo-native workflow for shipping software with AI coding agents. It's designed for PMs and founders who can write a good ticket but don't want to review code line by line.

```
idea → ticket → [you: Ready for Dev] → agent builds → second agent reviews, turn by turn → approved → [you: /speck-ship]
```

- **Tickets, not specifications.** Each change is a small numbered ticket in your repo, sized for one agent in one sitting. speck checks the size rules and makes you split anything bigger.
- **Adversarial review built in.** The building agent (Claude Code) starts an independent reviewer (Codex by default) and they take turns: the builder fixes or disputes each finding, and the reviewer re-checks in the same session. It ends when the reviewer approves or the question comes back to you.
- **One living spec.** `speck/product.md` tells any new agent session or person what the product is today. It's updated on each ticket's branch and checked by the reviewer.
- **Two human gates.** You decide what gets built and what gets shipped. Agents never merge or ship unless you run `/speck-ship`, or you turn on `auto_ship` in `speck/config.yml` to ship whatever the reviewer approves.
- **No GitHub needed.** Everything happens in your local repo. Shipping merges the approved branch into `main` and pushes it if you have a remote.

Inspired by [OpenSpec](https://github.com/Fission-AI/OpenSpec), with less ceremony.

> Status: v0.1, early. It works end to end on a local machine. Expect rough edges.

## Requirements

- [Claude Code](https://claude.com/claude-code) (builder)
- [Codex CLI](https://github.com/openai/codex) (default reviewer), or allow a Claude subagent reviewer in config
- Node.js 20+ and git

## Install

In the folder of the project you want to build, run:

```bash
npx github:luroai/speck init
```

That's it. This one command:
- sets up `speck/` (config, living spec, ideas and tickets);
- adds the speck skills to `.claude/skills/` and `.agents/skills/`, so Claude Code, Codex, cptr and other agents all find them;
- puts the `speck` command in `.speck/`;
- checks that git, Claude Code and Codex are installed and signed in, and tells you in plain English how to fix anything that isn't.

Commit the new files, and everyone working on the repo gets speck too. To update speck, run the same command again. It refreshes the skills and keeps your config and tickets.

To re-check your setup at any time: `node .speck/scripts/speck.mjs doctor`.

## Use

| Command | What it does |
|---|---|
| `/speck-capture` | Save an idea or the current conversation to `speck/ideas/` |
| `/speck-ticket` | Turn an idea into small, numbered tickets that pass the size rules |
| *you* | Approve a ticket for development: `node .speck/scripts/speck.mjs set <id> status ready` (Gate 1) |
| `/speck-build <id>` | Tests from the acceptance criteria, then code, then the review loop. Ends with the ticket `approved`, waiting for you |
| `/speck-review <id>` | Re-run the review loop on its own |
| `/speck-status` | Tickets by status: approved (waiting for you) first, then blocked questions |
| *you* | Read the review pack: `node .speck/scripts/speck.mjs pack <id>` |
| `/speck-ship <id>` | Ship it (Gate 2): final checks and tests, then merge into `main`, push and delete the branch. Only you run this |

## What a review pack looks like

Every approved ticket has a **review pack** written for someone who doesn't read code:
- each acceptance criterion with ✅/❌ and the reviewer's evidence;
- a plain-English summary;
- risk flags (sensitive files touched, size);
- whether the living spec is accurate;
- the review history;
- actuals: review rounds, reviewer tokens and elapsed time.

## Repo layout

```
.claude/skills/speck-*/      # the skills, for Claude Code (installed by init)
.agents/skills/speck-*/      # the same skills, for Codex, cptr and other agents
.speck/                      # the speck command and templates (installed by init)
speck/
  config.yml                 # builder, reviewer, test command, limits
  product.md                 # the living spec
  ideas/                     # captured ideas
  tickets/0007-<slug>.md     # numbered tickets; status in frontmatter, every review round at the end
```

## Design

See [`docs/brief.md`](docs/brief.md).

## Licence

MIT
