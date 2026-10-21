# Changelog

## 0.11.0 · 21 October 2026

What's new since 0.10.3. A minor release that adds document tasks: a ticket can now have its build write a document, such as an email, a plan or a report, instead of changing code. It's reviewed against the ticket like code is, and it waits for you to read it before it ships. You can also send an approved ticket back with a note saying what to change, from the panel or the command line.

### Getting started

- Install this release with `npx github:luroai/speck#v0.11.0 init`.
- Setting speck up, or updating it, adds `/outputs/` to the project's `.gitignore`, making the file if there isn't one. It adds the line only once, and leaves a line that already ignores `outputs/` as it is.

### Document tasks

- Each ticket now says what its build makes: `task: code`, as before, or `task: document`. New tickets start as `task: code`, and a ticket with no `task` counts as code, so existing tickets need no change.
- To make one, ask `/speck-ticket` for a ticket that writes a document. It sets `task: document` and adds an `output:` line naming the folder the document goes in, inside `outputs/` at the project root, such as `output: emails` or `output: strategy-2027/pricing/`. `speck lint` won't let a document ticket be set ready without an `output`, or with one that is an absolute path or leads outside `outputs/`.
- In the panel, a document ticket's card has a "document" tag, as a bug ticket has its "bug" tag.
- A document task's build writes no tests. It writes the document from the sources the ticket names into the ticket's folder in `outputs/`, in your own copy of the project even when the build runs in a worktree of its own, where the document would be lost. `speck output <id>` prints that folder, making it if it's missing. The build only adds new files there or changes the files the ticket names: it never deletes, moves or overwrites any other file in it.
- `outputs/` isn't in git, so what's written there can't be undone with git.

### Reviewing a document

- The reviewer is told where the document is and which files are in it, and judges each criterion by reading the document, quoting the passage it relies on as its evidence. Having no tests doesn't count against any criterion. Code tickets are reviewed as before.
- The reviewer reads the folder as it is during its round, so a change made there after a review isn't covered by it.
- A document task's review pack opens with a button for each file in its folder, above Ship and Ask for changes. Pressing a Markdown file's button shows it formatted in the panel's side pane, with a way back to the pack, and opens nothing else. Any other file, such as a PDF, opens in a new tab, served by the panel, and a web page the build wrote opens with its scripts switched off. The panel only opens files inside that ticket's own folder.
- `speck pack <id>` lists the document's files, by their path from the project root, straight after the summary.

### Shipping a document

- A document task never ships by itself, whatever `auto_ship` and `auto_ship_risk` say: once it's approved, it waits for you to read it and ship it. The auto-ship message says so.
- Shipping one runs no tests: it files the ticket as done. If its branch changes any file outside `speck/`, `speck ship` refuses and names those files.

### Asking for changes

- When you've read an approved result and want something changed, `speck changes <id> "<note>"` sends the note back to the ticket's build, rather than you writing a new ticket. This works for code tickets as well as documents. The note is added, dated, to the ticket's Review log.
- With `speck run` on, the build session that made the work picks the note up, makes the changes and runs the review loop again. The reviewer checks them against your note as well as the acceptance criteria. Until it's approved again, nothing ships it, automatically or by hand.
- In the panel, an approved ticket's review pack has a box for your note and an "Ask for changes" button beside Ship. The button can't be pressed while the box is empty. The panel shows what speck said, and if speck turns the note down, it shows why and keeps your note in the box.
- `speck changes` refuses, changing nothing and saying why, for a ticket that isn't approved, an empty note, a ticket that already has changes waiting, or one whose build session can't be resumed, such as a ticket `speck run` didn't build.

## 0.10.3 · 20 October 2026

What's fixed since 0.10.2. A bug-fix release: a build's time no longer counts the hours a laptop spends asleep, and `speck run` no longer restarts a build each time the Foreman asks about its ticket. Setup and the panel's Settings view get small additions too.

### Getting started

- Install this release with `npx github:luroai/speck#v0.10.3 init`.
- In a folder that already has code but no tests, setup now offers a first ticket that sets up tests for that code, and says why: without it, the first feature ticket has to set up testing itself, which makes it slow. It's left as a draft for you to approve, and saved only if you agree. A folder that holds only documents isn't offered one.

### Build times

- Time the machine spends asleep during a build, such as with a laptop's lid closed, no longer counts towards the build's time while `speck run` is on. `speck run` notices the sleep at its first check after waking, adds it to the ticket's waited time once and says in its log how long the machine was asleep. The panel's timers and Shipped figures leave it out.
- This works on Linux. On a Mac, speck reads the sleep and wake times the Mac records, which haven't been tried on a real Mac yet.
- Builds started by hand with `speck run` off aren't covered, and tickets already recorded with time asleep in them stay as they are.
- The README's "Built with speck" figures now leave out the time a build waited for you or the machine was asleep, as the panel's Shipped median does.

### speck run and the Foreman

- When a build ends with its ticket still ready, a note or question the Foreman adds to the ticket no longer makes `speck run` start the build again. Before, each question the Foreman asked about such a ticket restarted its build, which stopped at the same unanswered question, so the Foreman asked again. Setting the ticket ready again, or editing it yourself, still starts it again.

### Settings view in the panel

- `cursor` is offered as a reviewer when Cursor is installed and signed in. With it saved as the reviewer, `reviewer_model` is a list of Cursor's models, each by its display name, as `builder_model` is for a Cursor builder.
- `foreman_model` is a list of the models of the agent the Foreman runs on: Claude's for `claude`, the models Codex lists for `codex` and the models Cursor lists for `cursor`. With `foreman` blank, it lists the models of the agent the Foreman runs on then.
- When those models can't be read, the setting is a box to type in, with one line saying why. Choosing Cursor as the reviewer, or another agent for the Foreman, while a different one is saved says to save it, then open Settings again to pick from its models.

## 0.10.2 · 20 October 2026

What's fixed since 0.10.1. A bug-fix release: a build's log in the panel now reads the same whichever agent builds the ticket, with times on its lines and the same names for the steps Claude Code, Cursor and Codex take.

### Getting started

- Install this release with `npx github:luroai/speck#v0.10.2 init`.

### Build logs in the panel

- A Cursor build's log shows the time each message and each command started, as `HH:MM:SS` in the panel machine's local time, as a Claude Code build's does. A line Cursor gives no time for, such as its final summary, shows without one.
- A Codex build's log shows the time of each message, command and file change too. Codex doesn't say when things happen, so speck notes the time each line arrives. Logs from Codex builds made before 0.10.2 still have no times.
- The steps a Cursor or Codex build takes show under the names a Claude Code build uses: `→ Bash` for a command, `→ Read`, `→ Edit` and `→ Write` for files, and `→ Grep` and `→ Glob` for searches. Before, a Cursor build's log showed only its messages and its commands, as `→ Shell`, and a Codex build's left out its file edits. Any other tool shows under its own name.
- A Codex command no longer shows with the `/bin/bash -lc "…"` wrapper Codex puts round it.
- A Cursor file edit shows once it has finished, so one cut off partway shows no line.
- When the `codex` command can't be found, a Codex build now starts and ends straight away, with the reason in its log, rather than `speck run` saying the build couldn't start.

## 0.10.1 · 20 October 2026

What's fixed since 0.10.0. A bug-fix release: a ticket whose automatic ship failed no longer asks you to ship it yourself while `speck run` is already dealing with it.

### Getting started

- Install this release with `npx github:luroai/speck#v0.10.1 init`.

### The panel

- When an automatic ship fails and `speck run` has handed the ticket back to its build, the ticket's row in the Build list is no longer red and no longer tells you to ship it from its review pack. While the build is running, it says the ticket was handed back to its build, which is working on it. Once the build has ended, with the ticket still approved, it says the ticket will be shipped again when main or its branch has a new commit. It says that only while `speck run` is on and another ticket is ready, building, reviewing or approved. Otherwise the row is red, with the hint to ship it yourself, as before.
- The failed ship's own message stays on the row in each of these cases, and now also on a ticket that was blocked after its automatic ship failed. A blocked ticket is red and asks its question, as before.
- `speck status --json` gives each ticket a `handed_back` field: when `speck run` last handed it back to its build after a ship it started, or null.

## 0.10.0 · 20 October 2026

What's new since 0.9.1. A minor release that lets you set speck up to run entirely in Cursor from setup's questions alone: Cursor builds, a Cursor reviewer on a model you pick, the Foreman on Cursor, and a test command that lets tickets ship in a folder with no tests yet.

### Getting started

- Install this release with `npx github:luroai/speck#v0.10.0 init`.
- When you pick Cursor as the builder, setup offers an all-Cursor setup in one question: builds on Cursor's `auto`, the reviewer on Cursor with a model you pick, and the Foreman on Cursor or another agent you have installed. It offers only models from your own account's list, as `speck agents --json` reads them, never a made-up name, and makes every setting with `speck config set`, so you don't edit `speck/config.yml` by hand or turn on `allow_same_model_review`. With the builder on `auto`, any reviewer model is accepted; with a builder model set, it recommends a reviewer model from another provider.
- When setup runs in an agent's chat that walls off the network, as Cursor's does, and so can't read your agents' models, it runs `speck agents --json` again outside that sandbox, asking you first if its tool needs your approval. If that doesn't work either, it asks you to run `agent models` in your own terminal and paste the list, and offers models only from that. Builds that `speck run` starts aren't affected.
- In a folder with no tests, such as a folder of documents, setup recommends `node --test` as `commands.test` rather than leaving it blank, after running it once to check it passes. It passes while there are no tests and runs the tests later tickets add, so tickets can ship from the start. Setup says that with `commands.test` blank nothing can ship, and that changes to documents are checked by the reviewer instead. If you still want it blank, it offers a draft ticket to add a test runner, as before.

### Reviewing with Cursor

- `reviewer: cursor` needs no command of your own. speck runs Cursor's CLI, `agent`, or `cursor-agent` when only that is installed, in its read-only ask mode, on `reviewer_model`, or Cursor's own default when that's blank. Later rounds carry on the same Cursor chat. It passes `--trust`, so a review no longer stops at Cursor's Workspace Trust prompt in a folder Cursor hasn't been told to trust. A `reviewer_options.cursor.command` of your own is still used instead, and the README's example of one now has `--trust` too.
- A Cursor build reviewed by Cursor passes the same-model check without `allow_same_model_review`, when the reviewer has a model of its own: with `builder_model` set and a different `reviewer_model`, or with `builder_model` blank, so the build runs on Cursor's `auto`, and `reviewer_model` set to anything but `auto`. `speck lint`, setting a ticket ready and saving the Settings view all accept it. It's still refused when both are given the same model, when `reviewer_model` is blank or `auto`, or when `build_command` is set, as speck then can't tell what model the build runs on.

### The Foreman

- The Foreman can run on Cursor: set `foreman` to `cursor` with `speck config set` or in the Settings view's Foreman group. It runs on `foreman_model` when that's set, and Cursor's own default otherwise. `foreman_effort` isn't passed, as Cursor's model names carry the effort. With `foreman` blank and Cursor as the builder, the Foreman now runs on Cursor rather than Claude Code. A Cursor Foreman can run any command, as Cursor builds can, and only its instructions keep it to speck's own commands.

## 0.9.1 · 19 October 2026

What's fixed since 0.9.0. A bug-fix release: setup suggests the right test command for pnpm, yarn and bun projects, tickets keep their builder after you switch back to Claude Code, a pull request that clashes on GitHub goes back to its build, and `speck run`, `speck status`, the Foreman and the panel each say or do what they should in a few more cases.

### Getting started

- Install this release with `npx github:luroai/speck#v0.9.1 init`.
- `speck detect`, which setup reads, now suggests the test command for the package manager the project uses: `pnpm test`, `yarn test` or `bun run test`, and `npm test` otherwise. Before, it suggested `npm test` for every project with a test script. It goes by the `packageManager` field in `package.json` when there is one, and by the lockfile otherwise, and the install command it suggests always names the same package manager. A project without a test script gets the same suggestion as before.

### Building

- Switching the builder back to Claude Code no longer has Claude Code build the tickets you made with Codex or Cursor. With `build_command` set to speck's own command for Claude Code, each ticket is built by the builder in its `builder:` field, as with `build_command` blank. A `build_command` you've written yourself is still used for every ticket, and the Settings view now says so under the builder, with how to go back to each ticket keeping its builder.
- When a build stops before it has started its ticket, for example to ask about the ticket, `speck run` no longer needs restarting to try it again. Once you set the ticket ready again, or commit a change to it such as a corrected criterion, `speck run` starts it on its next check. Until then, `speck run`'s log says it won't start it again until the ticket is set ready again and committed.

### Shipping through pull requests

- With `ship_mode: pr`, a pull request that GitHub says conflicts with the main branch is now refused as a conflict, and `speck run` hands the ticket back to its build to bring in the newer work and be reviewed again, as it does with a conflict it finds itself. Before, it was refused with an ordinary error and the ticket sat approved until someone noticed. Pull requests GitHub can't merge for other reasons, such as failing checks or a review it needs, are refused as before. Once the build has been approved again, the next ship asks you to run `speck pr` for the ticket to send the new work up to its pull request.

### speck status and the Foreman

- The `IDEAS` line in `speck status` no longer counts ideas that triage has dropped. It now gives three counts, ideas waiting to be shaped, notes in the inbox and ideas ticketed, and they match the panel's Ideas and Inbox tabs. `speck status --json` gives the same counts as `idea_counts`.
- A question the Foreman asked now says, in its recent actions in `speck status` and the panel's Foreman detail, what became of it: that you dismissed it and when, that you answered it, when and with what, or that it no longer waits for you and why. Before, an answered or dismissed question still read as if it were waiting for you. A question still waiting for you, and the Needs you count, are as before.

### The panel

- Closing a ticket's full view, with Close, Escape or a click outside it, puts the keyboard focus back on that ticket's Full ticket button, or on the top of its section when the ticket has left the board, so you can carry on with the keyboard from where you were. Opening the full view from a Shipped ticket's title or a Review pack button still leaves the focus on the page when it closes.

## 0.9.0 · 19 October 2026

What's new since 0.8.0. A minor release that gives the panel the look of the speck design, a dot-matrix LCD screen, lets you answer the Foreman's questions and see what it will do, builds each ticket with the agent it was made for, and ships through pull requests to a main branch that only takes them.

### Getting started

- Install this release with `npx github:luroai/speck#v0.9.0 init`.
- `speck detect`, which setup reads, now finds Cursor's command-line tool under its new name, `agent`, as well as its old one, `cursor-agent`, as `speck agents` already did. Before, setup could say Cursor wasn't installed when it was.
- When the project's main branch only takes pull requests, or you say your team works through them, setup explains pull request mode and offers to turn it on, instead of warning that speck can't work there. Otherwise it asks whether you want it, recommending local shipping for someone working alone.
- The README describes speck as it is now, with new pictures of the panel in its light and dark looks.

### The panel's new look

- Every builder badge on the Build list is drawn on a small green dot-matrix LCD screen by the design's own renderer. When a ticket moves on, its builder hops and blinks into its new pose instead of jumping. A badge waiting for you has a purple frame, and a blocked one a crimson frame. A badge scrolled off screen pauses until you scroll back to it.
- The Foreman's button shows a small builder on its own LCD screen. It hops while builds are running and stands still otherwise, and with reduced motion turned on it doesn't move.
- The header shows the design's logo, a hand-drawn ring with two ears and the red speck, beside "speck" in Doto, the design's dot-matrix lettering. Both are larger than the old mark and title. The panel serves the font itself, so it looks the same with no internet connection. On a phone, the small "control panel" label no longer shows, so the name and your project's name both fit.
- In the light look, the LCD screens are a paler green-grey, so they don't look heavy on the white cards. The dark look is as the design draws it.
- The browser tab's icon is the logo, and it follows your browser's light or dark look by itself. The icon on a phone's or computer's home screen is a small handheld with the logo on its screen, in the design's own colours. A browser may keep showing the old icon until it clears its stored copy.

### The Foreman

- With Fixing set to `fix`, the Foreman's status in the header says "Fixing on" beside its status word, and its detail says which setting Fixing has.
- Each blocked ticket says on its card either that the Foreman will take its recommendation or that it's waiting for you, and only the ones waiting for you count under Needs you.
- Once a recommendation has been taken, the ticket's card says who took it, the Foreman or you with the "Go with the recommendation" button, which option and when, until the ticket moves on. The Foreman's detail lists what it took in the last 24 hours. `speck status` shows the same.
- A question the Foreman agent asked about a stuck ticket shows on the ticket's card and in the Foreman's detail, with an Answer box and a Dismiss button. `speck foreman answer <id> "<text>"` and `speck foreman dismiss <id>` do the same from the command line. Answering writes your answer in the ticket's Notes and picks the work up again with it, carrying the build on or trying the ship again. Dismissing notes that you did and leaves the ticket as it is. Each question can be dealt with once: a second try says it already has been. An answer is carried out only while `speck run` is on, and only if the ticket hasn't moved on since.

### Building with Claude Code, Codex or Cursor

- With `build_command` blank, `speck run` builds each ticket with the builder in its own `builder:` field, rather than whichever one `speck/config.yml` names today, and passes `builder_model` only when that's the builder in `speck/config.yml`. A ticket with no `builder:` field uses the one in `speck/config.yml`. A ticket whose builder isn't installed isn't started, and the Foreman's detail says why. A build carried on after a stop or a hand-back carries on with the builder it started with. With `build_command` set, every ticket still uses it, and `speck run` says once, as it starts, that the tickets' own builders are ignored.
- Switching the builder, in the Settings view or with `speck config set builder`, clears `builder_model` when the new builder doesn't offer that model, or when its models can't be read, and tells you why. A model the new builder does offer is kept.
- A Codex builder and a Codex reviewer on two different models are now accepted without `allow_same_model_review`, as a Claude Code pair already was, when `build_command` is blank and `builder_model` is set. The same model on both, or either left blank, is still refused unless `allow_same_model_review` is on.

### Reviewing

- The built-in Claude reviewer (`reviewer: claude`) now runs with no MCP servers or claude.ai connectors, such as Gmail or Google Drive, in every round. It keeps its other limits, model and effort, and its verdict is recorded as before.

### Shipping through pull requests

- With `ship_mode: pr`, the ticket's move to done is now part of its pull request, so merging the pull request is what files the ticket away. speck no longer pushes anything straight to your main branch, so a main branch that only takes pull requests works, whether speck merges the pull request or you merge it yourself on GitHub. A pull request opened before this change gets that extra commit the first time you ship it, and is merged on a later try once GitHub has run its checks.
- `/speck-ship` explains that with `ship_mode: pr` shipping merges the ticket's pull request on GitHub, and what to do when GitHub can't merge it. The brief lists `ship_mode` with the other settings.

### speck run

- Only one `speck run` works in a repo now, before or after it has switched to new code. Starting another, from a terminal or the Settings view's switch, is refused with a message naming the one that's running. A `speck run` that finds it has lost the repo's lock stops starting builds and ships, says so once in its log and exits, and the builds and any ship it had going carry on and are picked up by the one that remains. Only the `speck run` holding the lock writes the Foreman's status, so the header no longer flickers between two.
- Turning `speck run` off in the Settings view stops all of it, including the copy running newer code after a switch, and the switch shows it off only once all of it has stopped.
- `speck run` no longer says a build it launched or resumed is "being built outside speck run". Builds you start from a conversation, or resume by hand, are still reported that way, once.

## 0.8.0 · 18 October 2026

What's new since 0.7.0. A minor release that gives speck a Foreman, one status for the whole pipeline that can also clear technical blockages itself, shows pictures of a visual change before you ship it, and can ship through GitHub pull requests.

### Getting started

- Install this release with `npx github:luroai/speck#v0.8.0 init`.

### The Foreman

- The button at the top of the panel no longer turns `speck run` on or off. It's now the Foreman: what `speck run` is doing, in a word or two and a colour: Off, Idle, Building and how many, Shipping and which ticket, Waiting with a short reason such as "on hold" or "new code", or Needs you and how many, when tickets are blocked. When the panel's server is running newer code than the page you have open, it says so and offers to reload the page.
- Pressing it opens its detail. Each ready ticket that isn't building says why: the tickets in its `after:` list that aren't done yet, all build slots in use, `speck run` off, or `speck run` switching to new code. Something that holds up everything, such as switching to new code or shipping being on hold, is said once at the top rather than on every line. Under Shipping, every approved ticket that `auto_ship` covers and hasn't shipped yet is listed with why, or that it's next, so "Nothing is waiting to ship" shows only when nothing is. Blocked tickets are listed with their questions.
- `speck status` starts with the same status and reasons, as `speck run` records them as it works.
- The on/off switch for `speck run` is now the first thing in the Settings view, in a new Foreman group, and works as before.

### Blocked questions

- A build that stops to ask you something now also says which option it recommends, whether any option would change something you'd notice, and whether its pick is a clear winner or a close call. The panel shows "Changes what you'd notice" or "Doesn't change what you'd notice", and "Clear recommendation" or "Close call", under the question. `speck status --json` gives them as `blocked_recommendation`, `blocked_noticeable` and `blocked_clear`. This first came in 0.7.0 without being listed there. Questions asked without them look as they did, with neither label.
- A blocked question with a recommendation has a "Go with the recommendation" button in the panel, when `speck run` built the ticket and can resume it. Pressing it asks first, notes your choice and the time in the ticket, sets it building again and has `speck run` carry its build on where it stopped, told which option you chose. Otherwise the question still says how to resume it by hand.
- A new setting, `foreman_fixing`, says what the Foreman does with blocked questions: `off`, `tell` (the default) or `fix`. With `tell`, blocked tickets wait for you as before and the Foreman counts them under Needs you. `off` is the same without the count. With `fix`, `speck run` takes the recommendation itself when no option changes anything you'd notice and it's a clear winner, notes in the ticket that the Foreman chose it, and starts the build again. It does this once per ticket: if the same ticket blocks again, it waits for you, as does every question that would change what you'd notice, is a close call or doesn't say.

### The Foreman agent

- With `foreman_fixing: fix`, when work stops for a reason speck has no steps for, a ship refused for a reason it doesn't hand back to the build or a build that ends with its ticket neither approved nor blocked, `speck run` starts a Foreman agent with a short brief: the ticket, what happened and the last lines of its log.
- The agent does one thing: resumes the build with an instruction, has `speck run` try the ship once more, makes a draft fix ticket for you to shape, or asks you one question. It never sets a ticket ready, approves work, ships anything `auto_ship` doesn't cover or changes code.
- What it did, and why, goes in the ticket's Notes and under Looked into in the Foreman's detail. A question it asks you also counts under Needs you. Only one Foreman agent runs at a time, and it looks into a ticket once until the ticket has new commits.
- New settings `foreman`, `foreman_model` and `foreman_effort` choose the agent it runs on (`claude` or `codex`; blank uses the builder when that's Codex, and Claude Code otherwise), its model and its effort, blank for the agent's own defaults. They're in the Settings view's Foreman group and setup. With Codex, only its instructions keep it from changing files; Claude Code is limited to reading and running speck's own commands.

### Pictures in review packs

- When a ticket changes how something looks, the build now takes pictures of the result in a real browser, in the light and dark looks where both exist, before review, and keeps them with `speck picture`.
- They're kept on this computer in `speck/.cache/`, which git ignores, so they're never committed. `speck pack <id>` lists them with what each shows, and the panel's review pack shows each with its caption, full size when you press it. A pack with no pictures looks as it did.

### Shipping through pull requests

- A new setting, `ship_mode`, takes `local`, the default, which ships as before, or `pr`.
- With `pr`, once a ticket is approved, speck pushes its branch and opens a GitHub pull request into the base branch with `gh`, titled with the ticket's id and title, with its plain review pack as the description. The review pack in the panel links to it. Asking again finds the same pull request rather than opening another. If `gh` isn't installed or signed in, or can't open it, the ticket stays approved, nothing is merged, and the panel and `speck run` say why in one line.
- Shipping such a ticket, with the Ship button, `/speck-ship` or `speck run`'s queue when `auto_ship` covers it, runs the same checks as a local ship, including the whole test suite on the change as it would land, then merges the pull request on GitHub, brings your base branch up to date, files the ticket as done and removes its worktree and branch. If you merged it on GitHub yourself, shipping only tidies up, and `speck run` notices it and tidies up by itself.
- When the pull request can't be merged, because of failing or unfinished checks, a conflict or a review GitHub requires, nothing changes on your machine and speck says why in one line. `speck run` tries again once the pull request changes. On a base branch that only takes pull requests, the "done" commit can't be pushed, and the panel says so.

### speck run

- `speck run` now sees every build of your tickets, however it was started. A build you start with `/speck-build` in a conversation, or a stopped build you carry on by hand, counts towards `max_parallel_builds`, isn't started a second time, shows in the panel as building rather than stopped, and is resumed by `speck run` if it stops partway, as its own builds are. It's noticed the next time the build runs one of speck's commands, with nothing to do by hand. Once its ticket is approved or blocked, it stops taking up a build slot, even if the conversation stays open.
- When a shipped ticket changes speck's own code, `speck run` switches to the new code as soon as no ship is running, rather than waiting for every build to end. Builds that were running carry on untouched, still counted, shown and watched, and each is handled as usual when it ends. While it waits for a ship, it says so once, naming it, and new builds can still start. A carried-over build that crashes partway is resumed once rather than handed to the Foreman, as `speck run` can't tell how it ended.

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
- Saving a builder from the reviewer's own family is refused with a message suggesting a reviewer from another family, such as `claude` for a Codex builder, unless `allow_same_model_review` is true or, for a Claude builder and reviewer, `builder_model` and `reviewer_model` are both set and differ. `speck config set builder` saves it and notes the clash instead, as setup chooses the reviewer next.
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
