# Changelog

## 0.7.0 · 18 October 2026

What's new since 0.6.0. A minor release that lets Codex or Cursor build your tickets as well as Claude Code, lets Claude Code review whichever agent builds, and shows which agents and models are really on your machine.

### Getting started

- Install this release with `npx github:luroai/speck#v0.7.0 init`.
- A new command, `speck agents`, says for each of Claude Code, Codex and Cursor whether it's installed and signed in, and lists the models it offers, with their display names and descriptions where the agent gives them. `speck agents --json` gives the same for programs. A list that can't be read within 10 seconds is left empty, with the reason.
- Setup uses it to say which agents are ready, offers each installed and signed-in builder, recommending Claude Code, and offers their models.

### Building with Codex or Cursor

- With `builder: codex` and `build_command: ""`, `speck run` starts each build with Codex itself, on `builder_model` when it's set. It reads each build's Codex session from its log, so a build it resumes after a stop, or a ticket a ship hands back, carries on in that same session, and the panel shows `codex exec resume …` as the command that reopens it. A build stopped before Codex named its session can't be resumed by itself: `speck run` says so in one line.
- With `builder: cursor` and `build_command: ""`, `speck run` opens a new Cursor chat for each build and runs the build in it, on `builder_model`, or on Cursor's Auto model when that's blank, the only one a free Cursor plan allows. Resumed and handed-back builds carry on in the same chat. If Cursor can't open a chat, for example because you're not signed in, `speck run` says why in one line, leaves the ticket ready and tries again shortly after. speck finds Cursor's command as `agent`, or as `cursor-agent` when only that is installed.
- A `build_command` you've set yourself is still used as it is, and Claude Code builds start and resume as before.
- The panel's live log of a Codex or Cursor build now reads like a Claude Code one: the agent's messages, and one line for each command it runs. Once such a build ends, its tokens are recorded and shown wherever a Claude Code build's are. Codex and Cursor don't say what a build cost, so no cost is shown for them rather than $0.

### Switching the builder

- The Settings view's `builder` can now be changed. It offers the builders that are installed and signed in, and saving one sets `build_command` to match in the same commit: Claude Code's own command for `claude`, and blank for `codex` or `cursor`, so `speck run` uses that builder's own. `speck config set builder <name>` does the same from the terminal, and setup uses it.
- If you'd written your own `build_command`, the view says it will be replaced and asks first, and `speck config set builder` refuses without `--replace`.
- Saving a builder from the reviewer's own family, without `allow_same_model_review`, is refused with a message suggesting a reviewer from another family, such as `claude` for a Codex builder.
- Tickets already made keep the builder written in them, and the view says so. `speck run` builds every ready ticket with the builder in `speck/config.yml`.

### Reviewing

- `reviewer: claude` is a new built-in reviewer: `speck review` runs Claude Code itself, without a person, so any builder can be reviewed by Claude. It can read files and run read-only commands but not change files, even when your own Claude Code settings would allow it. Later rounds resume the same session, and `reviewer_model` and `reviewer_effort` are passed to it when set. `speck doctor` checks Claude Code is installed for it.
- The Settings view's `reviewer` offers only reviewers whose agent is installed and signed in, plus the current one, and says in one line why any other is missing. `builder_model` and `reviewer_model` show each model's display name and description, and a Cursor builder's models are listed too.

## 0.6.0 · 18 October 2026

What's new since 0.5.4. A minor release that gives speck a Settings view in the panel, lets you choose the models that build and review, and makes shipping cope better when `main` fails or has moved on.

### Getting started

- Install this release with `npx github:luroai/speck#v0.6.0 init`.
- Setting speck up now also goes through seven more settings: `auto_ship`, `auto_ship_risk`, `max_parallel_builds`, `max_parallel_tests` and the three ticket size limits. For each, setup explains it in the same words as the panel's Settings view, shows its value, recommends one and asks. It turns on shipping without you, or lets high-risk tickets ship that way, only if you say yes to that setting by itself. Running setup again on a project that's already set up asks only about the settings you want to change.
- `speck config show` lists those settings by group, with each one's value, whether it's the default and what it does.

### Settings in the panel

- The panel's header has a Settings button. It opens a view of the settings people tune, in four groups: shipping, building and reviewing, how much runs at once, and ticket size limits. Each shows its value, marked "default" when `speck/config.yml` doesn't set it, and an "i" button that shows what the setting does and what changing it would mean.
- You can change the settings there. One Save button at the bottom saves every change together, checking each first and refusing anything speck wouldn't accept with a message saying what's allowed. Shared changes are committed together. Saving a shared change is refused while the panel's checkout is on another branch or `speck/config.yml` has unsaved edits of your own, so those are never swept up with it.
- Switching `auto_ship` on, or letting it cover another risk, first asks you, naming the approved tickets that would then be merged and pushed by themselves. Nothing changes until you say yes.
- Closing the view with unsaved changes asks whether to save them, discard them or keep editing.
- The view is laid out like the rest of the panel, with each group in its own box, every "i" button in one column, and every box and button drawn with its border on all four sides on a phone.

### Settings for this machine only

- `speck config set --machine max_parallel_builds 3` sets how many builds this computer keeps going, without changing the project's shared settings: a small laptop can run one build while a bigger machine runs four. `max_parallel_tests` works the same way. The value is kept in `speck/.cache/machine/config.yml`, which git ignores, and is used from every worktree. Setting it to `""` goes back to the shared value.
- The Settings view says whether each of those two values is this machine's own or the shared one. Saving one asks whether it's for this machine only or for everyone, and a button clears this machine's value.

### Building and reviewing

- A new setting, `builder_model`, chooses the model every build `speck run` starts, resumes or hands back runs on, passed to Claude Code as `--model`. With Claude Code building, the Settings view offers Fable, Opus, Sonnet and Haiku, each meaning the newest model of that kind, and with Codex building, Codex's models. Blank, the default, leaves the model to Claude Code. With another builder, `speck run` says in one line that the setting is only used for Claude Code builds.
- With Codex as the reviewer, the Settings view lists the models Codex offers for `reviewer_model`, and `reviewer_effort` lists the efforts the chosen model supports, including efforts beyond `max` such as `ultra`, which speck now accepts. With a Claude reviewer it offers Fable, Opus, Sonnet and Haiku. A saved model the list doesn't include still shows, marked as not offered. When Codex can't be asked, you get a text box as before, with one line saying why.
- A reviewer from the builder's own family, such as a Claude subagent reviewing a Claude build, is now allowed without `allow_same_model_review` when `builder_model` and `reviewer_model` are both set and differ. If they don't, the refusal says which models it compared and what to change.
- A new setting, `commands.checks`, lists quick test files that check rules for the whole repo. `speck test --files` runs them with the files it's given, so every build runs them before each review round and finds out straight away when it breaks one. A listed file that doesn't exist fails the run, naming it. Blank, the default, runs none.
- A criterion about how a document reads ends with "(checked by review)": the reviewer checks it by reading the document, and the build writes no test for it. Facts in documents, such as a command, a setting's name, a version or a link, are still tested.

### Shipping

- While `speck run` has paused shipping because `main`'s own tests are failing, an approved fix ticket still ships, so the fix no longer waits for someone to ship it by hand.
- When a ticket's ship fails tests while `main`'s own tests fail too, the message names just the tests that pass on `main`, and `speck run` hands the ticket back to its build to fix them, instead of blaming `main` and pausing shipping. Only when every failing test also fails on `main` is shipping paused, as before.
- When `main` on your remote has commits your own `main` doesn't, and yours has commits the remote doesn't, `speck ship` merges the remote's in, says which commits it brought in and carries on. It still stops, changing nothing, when both changed the same lines, or the merge would overwrite edits you haven't committed or files git doesn't track, and it names them.

### Working on speck

- Editing speck's README, brief, changelog or release notes by hand no longer fails its tests, as long as the commands, settings, versions, links and names in them stay right.
- Three of speck's fullest scripts were split up to give each room to grow, and speck's own test runner now spots slow tests by what they start, instead of from a list kept by hand.

## 0.5.4 · 16 October 2026

What's changed since 0.5.3. A patch release so that every install command gets the newest release, agents set a ticket ready only when you tell them to, and the README says plainly what speck is.

### Getting started

- Install this release with `npx github:luroai/speck#v0.5.4 init`.
- The README's setup prompt, its "Without an agent" section, the brief, `/speck-setup` and the message from a copy of speck that can't install itself now all install the newest release, whichever that is, instead of a fixed release that had to be updated by hand or whatever was on `main` at the time. The command is in single quotes, so it works the same in zsh, the default shell on a Mac, as in bash. Until a new release has been tagged, they install the release before it.

### Planning tickets

- An agent working with speck sets a ticket ready only when your latest message tells it to set that ticket ready. Picking an option, approving wording, answering a question or agreeing to a plan that includes it doesn't count, and the agent asks whether to set the ticket ready once any other change is done. Projects get the same rule in their agent guide the next time speck is installed or updated there. Fix tickets for a broken base branch are still set ready by the build that finds the failure, as before. This is guidance to the agent, not a lock: the panel and `speck set` still let you set a ticket ready.

### The README

- speck has a new tagline, "Ship code you can't read, and still trust it.", in the README, `speck help` and the package description.
- The README opens by saying plainly who speck is for, what you do, where you do it, what happens while you're away, why speck exists and why you can trust the result.
- A picture near the top shows speck at work: a conversation with your agent on one side and speck's panel beside it, in GitHub's light or dark theme.
- The README tells the landing page's story in the same order, with the setup prompt straight after it, then adds the technical detail behind each part in a new "Under the hood" section.
- Each section starts with one plain sentence saying what it tells you or what you do with it.

## 0.5.3 · 16 October 2026

What's changed since 0.5.2. A patch release so that `speck run` runs its newest code by itself.

### Getting started

- Install this release with `npx github:luroai/speck#v0.5.3 init`.

### Building and shipping

- While it's on, `speck run` notices when speck's own code changes, for example when a ticket that changes speck ships, and switches to its new code once nothing it's building or shipping is still running. Until then it starts no new build or ship, and says once which ones it's waiting for. It carries on in the same terminal or panel log, the panel's Auto-build switch stays on throughout, and Ctrl+C still stops it. Before, a change to `speck run` wasn't live until someone turned it off and on. If the new code can't start, `speck run` says why once and carries on with its old code until the next change.
- A `speck run` that's already on when you upgrade is still running 0.5.2's code, which can't switch, so turn it off and on once after upgrading.

## 0.5.2 · 16 October 2026

What's changed since 0.5.1. A patch release that cuts needless stops in builds and ships, so tickets that are nearly done no longer wait for you.

### Getting started

- Install this release with `npx github:luroai/speck#v0.5.2 init`.

### Building and reviewing

- Any re-review after a ticket was approved, for example after a small fix to its own code when its ship was refused, gets rounds of its own instead of using up the ticket's ordinary review rounds, as a re-review after a merge already did. Such rounds show as a merge round in the ticket's review history and review pack, even when nothing was merged.
- A ticket that reaches the review round limit with no more than one blocking finding left gets one extra round by itself, instead of stopping to ask you. If the extra round doesn't approve it, it stops as before. The review pack names it (for example "round 4 of 3, an extra round"), and the ticket's delivery log says when it had one.
- Builds that `speck run` starts with Claude Code can't run commands in the background, so a build can no longer end partway, with its ticket left building or reviewing, by leaving a test run or review round running when its turn ends.

### Shipping

- When a ship is refused because the tests fail on the ticket as it would land, while the base branch's own tests pass, the message says the failure may come from the ticket's own change or from it together with the base branch's newer changes, instead of blaming only the base branch's newer changes.

### Working on speck

- A check in speck's own test suite that sometimes failed by chance, when the clock ticked over a second while it ran, now gives the same result every time.

## 0.5.1 · 16 October 2026

What's changed since 0.5.0. A patch release of fixes to what 0.4.0 shipped: the ship queue's messages, stopping and restarting builds, build timers, the reviewer's test summary, review packs and the panel.

### Getting started

- Install this release with `npx github:luroai/speck#v0.5.1 init`.

### Stopping and restarting builds

- Stopping a build ends it within about five seconds, even on a busy machine, instead of waiting twice as long for a build that ignores the request.
- A build stopped before it started its ticket can be built again with `/speck-build <id>`, with no tidying up by hand. The message you see when you stop it says it was stopped before it started, instead of wrongly saying its branch and work were kept.
- When a build stops before it finishes, its ticket's timer stops too, and the time it waits for you is left out of its shipped minutes, as blocked and paused time already were.

### Shipping and reviewing

- When `speck run` ships a ticket that merged but couldn't be pushed, its log says it was merged but not pushed and how to push it, instead of saying it didn't ship and would be tried again.
- When a test fails on both tries of a full run, the reviewer's test summary lists it once, with the whole run's totals rather than those of the few files run again.
- The plain review pack (`speck pack <id> --plain`) says when the reviewer could see only the change, not the rest of the code, in any round.
- The review pack's build time stops when the reviewer approves, so it agrees with the panel however long the ticket waits to be shipped.

### The panel

- A ticket under review says which round the reviewer is running, or, between rounds, that the builder is fixing the last round's findings.
- When you turn `speck run` on and it refuses to start, the panel shows only the reason it gave, without lines another `speck run` wrote at the same moment.
- A P0 priority tag, which marks the urgent fix for a broken base branch, is red wherever the panel shows it.
- In Plan, idea and inbox cards have the same larger title as ticket cards.
- On a phone, a queued ticket's tags answer a tap anywhere on them, even with a linked ticket id just below.

### Docs

- The brief says plainly that one build at a time is the default, and that raising `max_parallel_builds` is supported, with approved tickets still shipped one at a time. The README's `run` command says the same.

## 0.5.0 · 15 October 2026

What's changed since 0.4.0. A ticket now gets one run of the whole test suite, when it ships, instead of several while it's built, and test runs take turns and give way to your own programs, so the computer stays usable while builds run.

### Getting started

- Install this release with `npx github:luroai/speck#v0.5.0 init`.
- Each new version of speck gets its tag and GitHub release page as soon as it lands, so the README's setup prompt works straight away.

### Building and reviewing

- A build no longer runs the whole suite. Before it changes anything, it lists the tests already failing from the result speck recorded for the same code, or writes `not checked` when there's none. After that it runs only test files: the ticket's own, any existing ones it changed and those of any test that failed in its last run.
- The whole suite runs once per ticket, in `speck ship`, on the ticket as it would land. A ticket that breaks a test elsewhere is caught there and handed back to its build to fix.
- The reviewer is told which test files the build ran, and judges "no test that passed before fails" from those and the change, leaving the whole-suite check to `speck ship`.
- `speck test --recorded` prints the test result speck has recorded for this code, without running any tests.
- The builder is told to wait for every test run and review round it starts to finish, so a build started by `speck run` doesn't stop partway, leaving its ticket stuck as building.

### Test runs

- `speck test --files` now waits its turn like a full run, sharing `max_parallel_tests`, so builds side by side no longer run their tests all at once.
- Every test run speck starts runs at a lower priority than normal, through `nice` when the system has it, so your own programs stay responsive.
- A test run that waited its turn reuses a result recorded for the same code while it waited, instead of running the suite again. A ship reuses only a passing result, and `speck test --fresh` always runs the tests.
- The second try at failing tests leaves out tests that already fail on the base branch, once a result is recorded for its latest code. When those are the only failures, there's no second try, and speck says so in one line.

### Working on speck

- speck's own test suite runs faster: it starts the slowest files first, copies its practice repos instead of making each from scratch, runs most commands inside the test process, shortens the waits in its slowest tests, runs its heaviest files 2 at a time on machines with 8 cores or fewer, and shares one panel across each of two browser test files.

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
