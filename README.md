# speck

**Your judgement, at agent speed.**

You own two decisions: what gets built and what gets shipped. Everything in between is automated. speck builds each ticket, has a second AI review it, and stops only when it needs you. The tickets, the reviews and every decision stay in your repo.

Most AI coding tools sell speed or autonomy. speck gives you the speed and keeps the judgement with you: what's worth building, what "done" means and whether it's good enough to ship. The agents do the typing; you do the steering.

```
idea → ticket → [you: ready] → agent builds → second agent reviews, turn by turn → approved → [you: ship, or auto-ship]
```

- **You hold the gates.** You decide what's ready and what ships. Agents never merge or ship unless you run `/speck-ship` or click the Ship button in the panel, or you turn on `auto_ship` in `speck/config.yml` so that `speck run` ships the risks you choose once the reviewer approves them.
- **When it's stuck, it asks, then moves on.** A build that can't decide something for you stops with one plain question, the options and its recommendation, rather than guessing. `speck run` carries on with the next ticket while it waits for you.
- **Tickets, not specifications.** Each change is a small numbered ticket in your repo, sized for one agent in one sitting. speck checks the size rules and makes you split anything bigger.
- **Adversarial review built in.** The building agent (Claude Code by default) starts an independent reviewer (Codex by default) and they take turns: the builder fixes or disputes each finding, and the reviewer re-checks in the same session. It ends when the reviewer approves or a question comes back to you.
- **Out of your way.** `speck run` builds your ready tickets, each in its own git worktree, so you keep writing ideas and tickets while it works. It builds one at a time unless you raise `max_parallel_builds`, and one ship queue ships approved tickets one after another, so ships never race each other for `main`.
- **It looks after itself.** When `main` breaks, the build that finds it raises a priority-0 fix ticket that goes to the front of the queue, rather than patching it inside someone else's work. When `main` has moved on, the build merges it in and has the merge reviewed again before it ships. A build that spots a bug or a better idea saves it to your inbox, and triage turns the inbox into at most three decisions.
- **The code is the record.** The code, the tickets and the tests say what the product does. Each ticket keeps its review rounds and its actuals: time, review rounds and tokens.
- **No GitHub needed.** Everything happens in your local repo. Shipping merges the approved branch into `main` and pushes it if you have a remote.

**Who it's for.** You think in outcomes, not diffs. You're a PM, a founder, or the person on the team who always has the spec. You have more ideas than evenings, a coding agent you already trust with real work, and no wish to read every line it writes. You set speck up by talking to your agent, write tickets, set them ready and walk away.

It's also for engineers who want a light, auditable loop: ticket, build, independent review, merge. It's not for large multi-team specs, or work that needs design documents spanning many changes.

Inspired by [OpenSpec](https://github.com/Fission-AI/OpenSpec), with less ceremony.


> Status: 0.5.0, a public preview. It works end to end on a local machine. Expect rough edges.

## Get started

Paste this prompt into your coding agent, opened in the folder of the project you want to build, or in an empty folder for a new one. [Claude Code](https://claude.com/claude-code) is the agent speck is most tested with.

```text
Set up speck in this folder. If Node.js 20 or newer isn't installed, offer to
install it first. Then run `npx github:luroai/speck#v0.5.0 init` and follow
the speck-setup skill it installs. Ask me before changing anything on my
machine or in git.
```

Your agent checks what's there, explains each choice in plain words and waits for your answer before it installs anything, makes a commit or changes a setting. When it's done, speck is ready to build your first ticket.

## How you work with it

1. **Capture and shape.** Talk an idea through with your agent, then `/speck-capture` it, or go straight to `/speck-ticket` to turn it into small draft tickets. Your agent checks each one against the size rules, for overlap with what's already there and for criteria that could be read two ways.
2. **Set tickets ready (Gate 1).** Read a draft, then set it ready in `speck panel` or with `node .speck/scripts/speck.mjs set <id> status ready`. A ticket can wait on others with `after:`, and starts only once they've shipped.
3. **Leave it running.** `node .speck/scripts/speck.mjs run` builds each ready ticket in turn, highest priority first. A build writes tests from the acceptance criteria, makes them pass, and goes through the review loop. While it works, a build runs the ticket's own tests; the whole suite runs when a ticket ships.
4. **Ship (Gate 2).** An approved ticket waits for you to run `/speck-ship <id>`, or click the Ship button in its review pack in `speck panel`, after reading the pack. With `auto_ship` on, `speck run` ships it as soon as the reviewer approves, while it's on.
5. **Answer questions.** When a build can't decide something for you, it blocks its ticket with one plain question, and `speck run` moves on to the next ticket. Answer it, then run `/speck-build <id>` to carry on.

## The panel

`node .speck/scripts/speck.mjs panel` opens a control panel in your browser, at `http://127.0.0.1:4777`. It runs on your machine and reads the files in your repo.

- **Plan:** your draft tickets, ideas and inbox, in full. Set a draft ready or change its priority with a click.
- **Build:** the queue, with each build's log as it runs. Turn `speck run` on or off from the header. Stop a build, see which builds are paused (`speck pause <id>` and `speck play <id>` hold and carry them on), and see blocked tickets with their questions and how to resume them. Read an approved ticket's review pack, and ship it from there with its Ship button, which asks first and does what `/speck-ship` does. A ticket being shipped says "Shipping" once, beside its builder, with how long the ship has been running, whoever started it, and an auto-ship that didn't finish says so.
- **Shipped:** what's shipped and when, with the median time, review rounds and tokens per ticket, for the reviewer and the builder.

To use the panel from your phone, put it behind a private tunnel that makes you log in, such as `tailscale serve` or Cloudflare Tunnel with Cloudflare Access, and start it with that address: `node .speck/scripts/speck.mjs panel --url https://<hostname>`. The panel then also serves that one address and accepts its button presses. Add it to your phone's home screen to open it full screen as an app called speck, with speck's logo as its icon. Never expose it openly: anyone who can load the page can start builds and ship.

## Requirements

- macOS or Linux
- [Claude Code](https://claude.com/claude-code), or another builder: any coding agent that reads skills from `.agents/skills/` or `.claude/skills/`, such as [Codex](https://github.com/openai/codex) or [Cursor](https://cursor.com/docs/cli/installation). Set it as `builder:` in `speck/config.yml`, so `speck doctor` checks the right tool. Claude Code is the default and the one most tested.
- git
- Node.js 20 or newer, which your agent can install for you
- Optional: [Codex CLI](https://github.com/openai/codex) as the reviewer (the default). Otherwise any agent with a non-interactive mode set up as a reviewer command in config (see below), or a Claude subagent reviewer if you allow it

Not yet: Windows (speck says so and suggests WSL), Jira or GitHub Issues sync, pull requests as the way to ship, and hosted or cloud builds.

## Without an agent

To install speck yourself, run this in the folder of the project you want to build:

```bash
npx github:luroai/speck init
```

This one command:
- sets up `speck/` (config, ideas and tickets);
- adds the speck skills to `.claude/skills/` and `.agents/skills/`, so Claude Code, Codex, cptr and other agents all find them;
- puts the `speck` command in `.speck/`;
- checks that git, your builder and your reviewer are installed and signed in, and tells you in plain English how to fix anything that isn't.

Commit the new files, and everyone working on the repo gets speck too. To update speck, run the same command again. It refreshes the skills and keeps your config and tickets.

To re-check your setup at any time: `node .speck/scripts/speck.mjs doctor`.

## Commands

In your agent:

| Skill | What it does |
|---|---|
| `/speck-setup` | Takes you through setting speck up in a conversation: checks what's there, explains each choice (base branch, test command, builder and reviewer, whether `speck run` builds skip permission prompts), asks before changing anything, and finishes once `speck doctor` passes. It's hidden from the `/` menu: the setup prompt above starts it |
| `/speck-capture` | Saves an idea or the current conversation to `speck/ideas/` |
| `/speck-ticket` | Turns an idea into small, numbered draft tickets that pass the size rules, or triages the inbox down to at most three decisions |
| `/speck-build <id>` | Builds one ready ticket: tests from the acceptance criteria, then code, then the review loop. Ends with the ticket `approved`, for `speck run` to ship if `auto_ship` allows it |
| `/speck-ship <id>` | Ships an approved ticket (Gate 2): final checks and tests, then merges into `main`, pushes and deletes the branch. Only you run this, or click the Ship button in the ticket's review pack in the panel |
| `/speck-status` | Tickets by status: approved (waiting for you) first, then blocked questions |
| `/speck-review <id>` | Re-runs the review loop on its own |

In your terminal, as `node .speck/scripts/speck.mjs <command>` (`speck help` lists them all):

| Command | What it does |
|---|---|
| `set <id> status ready` | Approves a ticket for building: `node .speck/scripts/speck.mjs set <id> status ready` (Gate 1). Run it on the base branch: it commits the ticket, and only that file. `set` also changes a ticket's priority, size, title and other fields |
| `run` | Starts `/speck-build` in a non-interactive session for each ticket once it's committed as ready on the base branch, one at a time, using `build_command` in `speck/config.yml`. The default skips all permission prompts. A build that was killed before it finished is resumed once |
| `panel` | The control panel in your browser |
| `pause <id>` / `play <id>` / `stop <id>` | Hold a running build where it is, carry it on, or end it and block its ticket, keeping its branch and work |
| `status` | Tickets by status, blocked first (`--json` for programs) |
| `pack <id>` | The review pack for a ticket |
| `cancel <id> "<reason>"` | Cancels a ticket you've decided against, keeping the reason |
| `config set <key> <value>` | Changes one setting in `speck/config.yml`, checking it first |
| `doctor` | Checks that git, your builder and your reviewer are ready |

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
  ideas/                     # captured ideas, and the inbox of follow-ups from builds
  tickets/0007-<slug>.md     # numbered tickets; status in frontmatter, every review round at the end
  tickets/done/              # shipped and cancelled tickets
```

## Built with speck

speck is built with speck. Since 8 October 2026, its features have gone through its own tickets, builds and independent reviews:

- **209 tickets shipped** and 16 cancelled, each with its review rounds and delivery log in [`speck/tickets/done/`](speck/tickets/done/).
- **15 minutes** median from a build starting to its ticket shipping.
- **1 review round** median. 105 tickets were approved in the first round.

That's why the commit history is long: each ticket leaves a trail of small, automatic commits as it moves from ready to shipped. The count isn't the point. Behind every ticket is a decision about what to build, and another about whether it was good enough to ship. In practice the agents keep up with you, not the other way round: by the time you've written the next ticket, the last one has often shipped.

## Design

See [`docs/brief.md`](docs/brief.md) for the principles, the workflow, the size rules and the review loop in full.

## Licence

MIT. See [LICENSE](LICENSE).
