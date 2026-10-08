# speck

**Small tickets. Independent review. You merge.**

speck is a lightweight, repo-native workflow for shipping software with AI coding agents. It's designed for PMs and founders who can write a good ticket but don't want to review code line by line.

```
idea → ticket → [you: Ready for Dev] → agent builds → second agent reviews, turn by turn → PR → [you: merge]
```

- **Tickets, not specifications.** Each change is a small numbered ticket in your repo, sized for one agent in one sitting. speck checks the size rules and makes you split anything bigger.
- **Adversarial review built in.** The building agent (Claude Code) starts an independent reviewer (Codex by default) and they take turns: the builder fixes or disputes each finding, and the reviewer re-checks in the same session. It ends when the reviewer approves or the question comes back to you.
- **One living spec.** `work/product.md` tells any new agent session or person what the product is today. It's updated inside each PR and checked by the reviewer.
- **Two human gates.** You decide what gets built and what gets shipped. Agents never merge.

Inspired by [OpenSpec](https://github.com/Fission-AI/OpenSpec), with less ceremony.

> Status: v0.1, early. It works end to end on a local machine. Expect rough edges.

## Requirements

- [Claude Code](https://claude.com/claude-code) (builder)
- [Codex CLI](https://github.com/openai/codex) (default reviewer), or allow a Claude subagent reviewer in config
- Node.js 20+, git, and the GitHub CLI (`gh`) for opening PRs

## Install

```bash
git clone <this repo> ~/tools/speck
# Claude Code: load as a plugin for this session…
claude --plugin-dir ~/tools/speck
# …or add it as a marketplace and install it
claude plugin marketplace add ~/tools/speck
claude plugin install speck@speck
```

Then, in the repo you want to build:

```bash
node ~/tools/speck/scripts/speck.mjs init     # or `npm link` in ~/tools/speck and run `speck init`
```

## Use

| Command | What it does |
|---|---|
| `/speck:capture` | Save an idea or the current conversation to `work/ideas/` |
| `/speck:ticket` | Turn an idea into small, numbered tickets that pass the size rules |
| *you* | Approve a ticket for development: `speck set <id> status ready` (Gate 1) |
| `/speck:build <id>` | Tests from the acceptance criteria, then code, then the review loop, then a PR |
| `/speck:review <id>` | Re-run the review loop on its own |
| `/speck:ship <id>` | Open the PR with the review pack and set the `speck/review` check |
| `/speck:status` | Tickets by status, blocked questions first |
| *you* | Merge in GitHub (Gate 2) |

## What a PR looks like

Every PR body is a **review pack** written for someone who doesn't read code:
- each acceptance criterion with ✅/❌ and the reviewer's evidence;
- a plain-English summary;
- risk flags (sensitive files touched, size);
- whether the living spec is accurate;
- the review history;
- actuals: review rounds, reviewer tokens and elapsed time.

## Repo layout

```
work/
  config.yml                 # builder, reviewer, test command, limits
  product.md                 # the living spec
  ideas/                     # captured ideas
  tickets/0007-<slug>.md     # numbered tickets; status in frontmatter
  reviews/0007/round-N.json  # every review round, kept in git
```

## Design

See [`docs/brief.md`](docs/brief.md).

## Licence

MIT
