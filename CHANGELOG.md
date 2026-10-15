# Changelog

## 0.4.0 · 15 October 2026

What's new since 0.3.0. Builds now stop at approved and `speck run` ships what's left in one queue, every ship tests exactly what will land, and the panel has become somewhere you can steer speck from, on your phone as well as your computer.

### Getting started

- Install this release with `npx github:luroai/speck#v0.4.0 init`.
- `speck run` only starts Claude Code for builds when Claude Code is your builder, and setup leaves a build command that matches the builder you chose.

### Tickets and review packs

- Every ticket the builder takes to approval has an "In plain words" section: what's different for someone using the product, how to see it and what to keep an eye on.
- `speck pack <id> --plain` prints a short review pack in plain English, for deciding whether to ship without reading code.
- The review pack counts a ticket's changed lines correctly wherever you run it from.
- When your agent makes tickets that would change the same files as another open ticket, it makes them wait for that ticket with `after:`.

### Building and reviewing

- A reviewer that runs longer than `review_timeout_minutes` (30 by default) is stopped, and the round fails with a message saying so, leaving the ticket as it was.
- A test run that prints nothing for `test_stall_minutes` (5 by default) is stopped, with everything it started, and fails as stalled, so a build or ship never waits for ever.
- When a full test run fails and `commands.test_files` is set, speck runs the failing tests' files once more. Tests that pass the second time don't fail the run: they're listed on a "Flaky:" line, and the reviewer's test summary says which ones they were.
- A build runs the whole suite once before each review round, and only the ticket's own tests the rest of the time. Builders are asked to write each new test the quickest way that still really checks its criterion.
- Stopping a build, ship or test run ends the tests it started too, and a ticket's scratch files are removed once it has shipped or been cancelled.

### Shipping

- Builds end at approved. While `speck run` is on, its ship queue ships each approved ticket that `auto_ship` covers, one at a time, and tries again by itself once whatever stopped a ship has changed.
- When a ship needs work on the ticket, because it clashes with newer work on the base branch or the tests only fail together with it, `speck run` hands the ticket back to its build to sort out and have reviewed again.
- `speck ship` tests the ticket merged with the latest base branch, and lands exactly what it tested. A ticket that merges cleanly and passes ships without another review.
- A ship that was stopped partway no longer gets the ticket stuck: the next ship tidies up and carries on.

### The panel

- An Auto-build switch in the header shows whether `speck run` is on and turns it on or off. While a build runs, it names the ticket and the stage it's at.
- Read the review pack of any approved or shipped ticket, and ship an approved one with the Ship button in its review pack.
- Each ticket being built is a card showing its stage, with speck's builder acting out what the build is doing. A ticket keeps its place in the list until it has shipped, and its card says when it's shipping, when its ship merged but couldn't push, and when it's waiting for Auto-build to be turned on.
- Move a queued ticket back to Plan, open a shipped ticket by tapping its title, tap a tag to see what it means, and tap a linked ticket's id to go to it.
- A new look, in light and dark, that follows your computer's setting until you choose, and is easy to read for people with low vision.
- Use it on your phone: it fits the screen, can be added to your home screen as an app, and `speck panel --url <https address>` serves it at a private address through a tunnel that makes you log in.
- Changes reach every open page as they happen, an open build log shows new lines as they're written, and the panel stays quick however many tickets you have.
- A build's time counts only the time an agent was working on it: from the start of its build to its approval, leaving out time spent blocked or paused.

## 0.3.0 · 11 October 2026

What's new since 0.2.0. Most of it makes builds that run while you work safer and quicker, and makes shipping cope on its own when something gets in the way.

### Getting started

- Install this release with `npx github:luroai/speck#v0.3.0 init`.
- Setup spots another ticket workflow, or rules that clash with speck, in your project. It explains each one in plain words and asks what to do, without removing or editing anything itself.
- Re-running `speck init` brings an old speck section in AGENTS.md up to date.
- The setup skill no longer shows in the `/` menu. The prompt in the README still starts it.
- The README, `speck help`, `speck init` and `package.json` describe speck the same way.

### Tickets

- `speck start` waits for every ticket in a ticket's `after:` list to ship, and says which ones it's still waiting for.
- Setting a ticket ready commits it, and a build starts only from a ready status that's committed.
- speck refuses to change or cancel a ticket from your main checkout while it's being built.
- `speck lint` refuses a ticket that contains one of your private words, listed in `~/.config/speck/private-words`, and warns when a criterion asks for the whole test suite to pass.

### Building and reviewing

- `speck run` builds one ticket at a time by default. A build that was killed shows as stopped, and `speck run` resumes it once by itself.
- Tests that already fail before a build starts are recorded and left alone. The builder doesn't fix them, and the reviewer treats a fix to one as out of scope.
- Builds run only the ticket's own tests while they work, and the whole suite where it counts. Full test runs take turns across builds, as many at a time as `max_parallel_tests` allows.
- `speck test` and `speck ship` reuse a test result for code that's already been tested. `speck test --fresh` runs the suite anyway.
- The reviewer gets a short summary of the test output instead of all of it.
- The panel shows what each build's builder spent, beside what its reviewer spent.

### Shipping

- When a ship conflicts, the build sorts each file by the kind of conflict, with `speck merge-check`, and resolves it. Merge review rounds have their own limit, `max_merge_rounds`, and the ticket is blocked with a plain question if it still conflicts after two merges.
- When a ship's tests fail, `speck ship` checks your base branch too and says plainly when it's the base branch that's failing. The build then opens a fix ticket for it, at priority 0, ahead of everything else.
- When staged changes in your main checkout are all that stops a ship, `speck ship` waits up to `ship_wait_minutes` for them to clear, then ships.

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
