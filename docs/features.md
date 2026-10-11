# What speck does

Everything speck does today, and the positions behind it, in one place. It's the source for the README and a landing page. For how each part works in detail, see [the brief](brief.md).

## In one line

**Write small tickets, set them ready and walk away. speck builds, reviews and ships them one at a time, and stops only for decisions that are yours.**

## The positions speck takes

These are deliberate choices, each made after trying the alternative.

- **You own two decisions: what gets built and what ships.** Everything in between is automated: the build, the review, the fixes, the re-review and the clean-up. You aren't the one keeping the pipeline moving.
- **Less ceremony, fix forward.** No proposal, design and task documents to review for every change. A ticket fits on one screen. When something's wrong, you write another small ticket rather than going back through a process.
- **Review is independent and adversarial.** The agent that wrote the code never approves it. A second agent, from a different model family by default, challenges it until it holds up.
- **One build at a time.** Builds run one after another, each in its own git worktree, so you keep working on ideas and tickets while speck builds. Running builds side by side caused more trouble than it saved: memory, clashing tests, conflicts and a broken `main` inherited by several builds at once. Isolation is kept; parallelism isn't.
- **Each build ships its own ticket.** There's no separate shipping agent or ship queue to orchestrate.
- **Automate what can be undone, gate what can't.** Auto-ship can cover low-risk tickets only, so anything touching auth, payments, data deletion, migrations, infrastructure or secrets waits for you.
- **The repo is the source of truth.** Ideas, tickets and every review round are Markdown files beside the code. There's no separate spec to keep in step: the code, the tickets and the tests are the record.
- **Local first.** speck runs on your machine, with no service to trust and no GitHub needed. A hosted version would be a deliberate later step. A website driving builds on your own machine is ruled out: it would be a remote-control channel into a machine where builds skip permission prompts.
- **Evidence over trust.** Every ticket records what it took, so speck's claims can be checked.

## Features

### Set up by talking to your agent
- **A setup prompt** to paste into Claude Code. Your agent checks the folder and machine, explains each choice in plain words and asks before changing anything.
- **`speck detect`** reports what setup needs to know, and suggests a test command and worktree setup from the project's files.
- **`speck doctor`** checks git, your builder and your reviewer, with a plain-English fix for each problem.
- **`speck config set`** changes one setting, checking it first.
- **Any builder or reviewer:** Claude Code, Codex, Cursor or any agent that reads skills, with any non-interactive agent as reviewer.
- **Updating keeps up:** re-running `speck init` refreshes the skills and brings speck's section of `AGENTS.md` up to date.

### Shape the work
- **Capture** an idea or a conversation in seconds (`/speck-capture`).
- **Ticket it** (`/speck-ticket`): small numbered tickets with 1 to 5 testable acceptance criteria, checked against the size rules, with anything too big split.
- **Before you see a ticket, your agent checks it:** for overlap with existing ideas and tickets, for criteria that could be read two ways, and for the outside facts it relies on.
- **Dependencies:** a ticket can wait on others with `after:`, and won't start until they've shipped.
- **Priorities** from 0 to 5. Fix tickets for a broken `main` start at 0 and jump the queue.
- **Inbox triage:** builds write follow-ups to an inbox, and triage drops what's covered and puts at most three to you.
- **Privacy checks:** `speck lint` refuses a ticket containing one of your private words, and warns about your home folder's path.

### Build and review, unattended
- **`speck run`** builds each ready ticket in turn, highest priority first, and keeps going while you work.
- **Tests first:** each build records what already fails, writes tests from the acceptance criteria, then makes them pass. It never fixes failures that were there before it.
- **A self-check** before the first review round: edge cases, error paths, claims and scope.
- **The review loop:** the reviewer returns a structured verdict on each criterion. The builder fixes or disputes each finding, and the reviewer re-checks in the same session. It ends in approval, or a question for you after a set number of rounds or a repeated dispute.
- **Size guard:** a build that outgrows its ticket stops and proposes a split.
- **Blocked tickets** ask you one plain question, with the options and a recommendation, and the queue moves on.
- **Control:** pause, play or stop a build. A ticket being built can't be edited from your checkout. A build that's killed is resumed once.

### Ship
- **`speck ship`** checks everything, runs the tests, merges into `main`, pushes and deletes the branch. No pull request needed.
- **Auto-ship by risk:** ship whatever the reviewer approves, for the risks you choose.
- **Conflicts are handled in the build:** it merges `main` in, resolves each file by type and gets the merge re-reviewed before shipping.
- **A broken `main`** gets a fix ticket at priority 0 instead of a builder patching it inside someone else's ticket.
- **Your work in progress is safe:** shipping leaves your uncommitted edits alone, and waits for anything you've staged.

### See what's going on
- **`speck panel`,** a control panel in your browser: plan (drafts, ideas and the inbox, with Set ready and priority), build (the queue, live logs, pause, play and stop, blocked questions) and shipped (times, review rounds, and the reviewer's and builder's tokens and cost).
- **The review pack** for each approved ticket, written for someone who doesn't read code: each criterion with the reviewer's evidence, a plain summary, risk flags and the review history.
- **Every review round** is kept in the ticket file, and each ticket's Delivery log records its time, rounds and tokens.

### Fast and frugal
- **Test results are reused** when the code hasn't changed, so a build doesn't re-run a suite that has just passed.
- **While working, a build runs only its own tests;** the whole suite runs at the points that count.
- **The reviewer gets a summary of the test output,** not 60,000 tokens of passing tests.
- **The builder's spend is recorded,** so changes meant to cut it can be judged.

## Proof

speck is built with speck. From 8 to 11 October 2026:

- **107 tickets shipped** and 13 cancelled, each with its review rounds and delivery log in [`speck/tickets/done/`](../speck/tickets/done/).
- **11 minutes** median from a build starting to its ticket shipping.
- **2 review rounds** median, with 47 approved in the first round.

## Coming next

- **Spotting another workflow during setup** (0124): flagging OpenSpec and the like, and project rules that clash with speck.
- **Choosing the builder's model per ticket,** once there's builder spend data to base it on.
- **Release 0.3.0** (0106).
