# speck

## What it is
speck is a lightweight, repo-native workflow for building software with AI coding agents.
It's aimed at PMs and founders who write good tickets but don't review code line by line.
Ideas become small numbered tickets.
One agent builds each ticket, and a second, independent agent reviews it in turns until it approves.
The human holds two gates: approving a ticket for development, and shipping it with `/speck-ship`.
The second gate can be handed to the reviewer's approval with `auto_ship`.
Everything happens in the local repo, with no PR.

## Current capabilities
- **Six skills**, installed into each project's `.claude/skills/` and `.agents/skills/` so Claude Code, Codex, cptr and other agents find them: `/speck-capture`, `/speck-ticket`, `/speck-build`, `/speck-review`, `/speck-ship` and `/speck-status`.
- **Overlap check before new work:** before `/speck-capture` writes an idea note, and before `/speck-ticket` runs `speck new`, the agent compares the work with every idea note, every ticket in `speck/tickets/` and `speck/tickets/done/` (problem, outcome and acceptance criteria, not only titles) and `speck/product.md`.
  If anything has the same, or largely the same, outcome, it names each match: the idea's path and status, the ticket's id and status (with the reason if cancelled) or the line in `product.md` that covers it.
  It then asks whether to add to the existing item, go ahead anyway or stop, and writes nothing until you answer.
  If nothing overlaps, it says so in one line.
  Overlap is the agent's judgement, not a text match, and the check lives in the skill instructions only.
- **Follow-ups to the inbox:** when a build writes follow-up ideas to the ticket's Delivery log (`/speck-build` section 5 step 1), it also writes each one that would need its own ticket (a behaviour change, a bug or a missing check) as its own inbox note, `speck/ideas/<YYYY-MM-DD>-<slug>.md`.
  Each note uses the `/speck-capture` format, with `Captured: <date> · Status: inbox` and a `From ticket: <id>` line after its heading.
  Tidy-ups and notes on known limits stay in the Delivery log only.
  The build skips any follow-up that clearly duplicates an idea note, a ticket or a line in `product.md`, without asking, and lists each one it skipped with its match in the Delivery log.
  It commits the notes on the ticket branch before `speck close`, so they ship with the ticket, and its final report says how many went to the inbox.
  `/speck-review` sends minor findings that aren't fixed through the same step.
  This lives in the skill instructions only.
- **Triage the inbox from chat:** asking the agent to "triage the inbox" runs the triage section of `/speck-ticket` on every note whose `Status:` is `inbox`.
  If there are none, it says the inbox is empty in one line.
  Without asking, it sets to `dropped` each inbox note that's already done or covered by another idea note, a ticket or `product.md`, keeps one of any inbox notes that duplicate each other, and names each one dropped with the reason.
  It then puts at most three of the rest to you, each with its title, its `From ticket:` and a one-line reason, and asks whether to ticket it or drop it.
  "Ticket it" makes a draft ticket with the note as `--source`, which sets the note to `ticketed (<id>)`, and "drop it" sets the note to `dropped`.
  Triage never sets a ticket to `ready`.
  At the end, each note still `inbox` gets a `Triaged: <n>` line, added or raised by one, and a note that reaches `Triaged: 2` is set to `dropped` instead and listed, so follow-ups nobody picks drop out by themselves.
  It commits the notes it changed, and any tickets it made, staged by name, as `speck: triage inbox`.
  `dropped` is an idea status only triage sets.
  This lives in the skill instructions only.
- **CLI** (`scripts/speck.mjs`, Node 20+, no dependencies):
  - `init`: one-step install and update, run as `npx github:luroai/speck init`.
    It creates `speck/`, copies the skills and the CLI (into `.speck/`) into the project, points AGENTS.md and CLAUDE.md at it, and runs `doctor`.
    Re-running it refreshes the skills and CLI and keeps config and tickets, and files any ticket already marked `done` under `speck/tickets/done/`.
    In speck's own repo it links rather than copies.
  - `doctor`: checks Node and git, then the builder set in `speck/config.yml`: `claude`, `cursor` (`cursor-agent`), `codex` or `gemini` must be on the PATH, with an install link if it's missing.
    Only that builder is checked.
    Any other `builder:` value gets one information line saying speck can't check it, which isn't a failure.
    For the reviewer, a `command` in `reviewer_options` is checked by its first word being on the PATH.
    `reviewer: codex` with no command keeps the Codex install and sign-in checks.
    Tools are found on the PATH, not launched.
    Each problem comes with a plain-English fix, and the GitHub CLI is reported as optional.
  - `new`: creates the next numbered ticket in `speck/tickets/`, skipping numbers already used by finished or cancelled tickets.
    With `--source=<idea note>` (a path relative to the repo root), it first checks the note exists and refuses, creating nothing, if it doesn't.
    It then sets the note's `Status:` value to `ticketed (<id>)`, or adds the id to an existing `ticketed (…)` list unless it's already there.
    Only that value changes.
    A note with no `Status:` line still gets its ticket, with a warning that its status couldn't be updated.
    With `--type=bug` it sets `type: bug` in the ticket's frontmatter, and any other `--type` value is refused, creating nothing.
  - `lint`: checks the size rules.
    It also accepts a ticket's `type` only when it's missing, blank or `bug`, and gives an error naming the field for any other value.
  - `set`: updates fields.
    Statuses are `draft`, `ready`, `building`, `reviewing`, `blocked`, `approved`, `done` and `cancelled`.
    Setting `ready` requires a clean lint, and `building` and `done` record timestamps.
    Setting `done` or `cancelled` also moves the ticket's file into `speck/tickets/done/`, and setting any other status moves it back into `speck/tickets/`.
    Setting `cancelled` is refused, because `speck cancel` is the command that records a reason.
  - `start`: begins building a `ready` ticket.
    With `worktrees: true`, it makes the ticket's branch from the local base branch in its own git worktree, beside the main checkout at `<checkout>.worktrees/<branch>`.
    It runs `worktree_setup` there if set, sets the ticket to `building`, commits that, and prints the folder to work in.
    The main checkout's branch and files don't change.
    It refuses, changing nothing, if the ticket isn't `ready`, has uncommitted edits, already has a branch (printing where it's checked out, so a build can resume there, even when run from inside that worktree), or if the CLI (`.speck/scripts/speck.mjs`) or any installed skill isn't in the base branch's latest commit.
    Staged files don't count, and committed symlinks are followed (a worktree only has what that commit holds).
    A failing `worktree_setup`, or a failed start commit, removes the worktree and branch, and the ticket stays `ready`.
    With `worktrees: false`, or no `worktrees` key (projects set up before it existed), it makes the branch in the current checkout instead.
    The branch is named after the ticket's file.
    `/speck-build` starts every build with it and works only in the printed folder.
  - `cancel`: cancels a ticket you've decided against.
    It records the reason and the date in the ticket, sets the status to `cancelled` and files it in `speck/tickets/done/` with the finished ones, so `speck/tickets/` holds only live work.
    It refuses, changing nothing, when the reason is missing or blank, when the ticket is already `done` (delivered work can't be cancelled) or when it's already `cancelled`; it works from any other status.
    Setting a cancelled ticket to any other status moves it back into `speck/tickets/` and keeps the recorded reason, so a cancelled idea can come back later as new work.
  - `status` (approved tickets first, as waiting for you, and cancelled tickets last, each with its reason, then ideas counted as waiting or ticketed, for example `IDEAS (3: 2 waiting, 1 ticketed)`; an idea is ticketed when its `Status:` value starts with `ticketed`.
    A ticket whose branch is checked out in another worktree is shown once, under the status in that worktree's copy (so an in-progress build no longer reads `ready` from the main checkout), with `↳ being built in <path>` on the line below.
    A bug ticket shows `bug` after its id.
    With no other worktrees, the output is unchanged), `diffstat` (with the size guard), `review` (Codex adapter), `record` (other reviewers), `prompt`, `reviewer-settings`, `diff` (the changes since the reviewer's last round, or the whole change after merging the base branch, as the reviewer sees them), `next` and `pack` (the review pack).
  - `status --json`: prints everything `status` knows as one JSON object, `{"tickets": [...], "ideas": [...], "resume_command": "..."}`, with nothing else on stdout, for programs such as the control panel.
    Tickets are the same ones the text output shows, each once (a ticket being built in another worktree comes from that worktree's copy), sorted by `priority` (no priority last) then id.
    Each has every frontmatter field under its own name, plus `path` (relative to the checkout it was read from), `worktree` (that worktree's absolute path, or `null`), `acceptance_criteria` (each criterion's full text without its number, including wrapped lines and nested lists under it), `blocked_question` (or `null`), `lint` (`{errors, warnings}` counts from the same checks as `speck lint`), `lint_messages` (`{errors, warnings}` with the text of each message `speck lint` prints), `problem`, `outcome`, `out_of_scope` and `notes` (each section's text without template comments or leading and trailing empty lines, or `null` when nothing else is in it), `self_check` (the text after `Self-check:` on the first line of Notes that starts with it, a list marker such as `- ` allowed before it, or `null` if there's no such line or nothing after it), `rounds` (one `{round, reviewer, verdict, seconds, tokens}` per review round, with `seconds` `null` if not recorded and `tokens` the input plus output tokens, or `0`) `waiting_on` (the `after:` ids that aren't a `done` ticket, including ids with no ticket) and `build_exit` (how a build launched by `speck run` ended: `{at, code, message}` with `at` and `code` from its run record's `exited` and `exit_code`, and `message` the last 50 lines of its log with trailing blank lines dropped, or `null` when the log is missing or empty; `build_exit` itself is `null` when there's no run record, it can't be read or it has no `exited`) and `session` (`{id, cwd}`, the session id and folder from the ticket's run record, or `null` when there's no run record, it can't be read or it lacks either).
    `resume_command` is the setting from `speck/config.yml`, trimmed: `claude --resume {session}` when the setting is missing, and `""` when it's blank.
    Run records and logs are read from the main checkout's `speck/.cache/runs/`, wherever the command runs.
    `type` is `"bug"` for a bug ticket, or `null` when it's missing or blank.
    Ideas are each `.md` note in `speck/ideas/`, sorted by file name, with `path`, `title` (its first `# ` heading, or the file name) and `status` (its `Status:` value, or `null`) and `body` (the note's full text).
    A frontmatter field that shares a name with one of these added fields is replaced by it.
    These field names are a contract for the panel.
  - `panel`: a control panel in the browser, with one write (Set ready).
    `speck panel` serves it on `127.0.0.1` at port 4777, or the port given with `--port <n>` (or `--port=<n>`), prints the URL and runs until stopped.
    A port already in use, or a `--port` that isn't a whole number from 1 to 65535, stops it with a plain message and a non-zero exit.
    It answers only requests whose `Host` is `127.0.0.1:<port>` or `localhost:<port>` (anything else gets 403, against DNS rebinding) and only `GET`, apart from the one write below (any other method gets 405, whatever the path).
    `GET /` is the page and `GET /api/state` is the same JSON as `status --json`, read afresh for every request.
    `GET /api/tickets/<id>/log` gives `{"text": "…", "truncated": true|false}`: the last 200 lines of `speck/.cache/runs/<id>.log` in the main checkout (the build's output from `speck run`), read afresh for every request, with trailing blank lines dropped and `truncated` true when the file has more than 200 lines.
    A ticket with no log gets empty text, still with 200.
    A ticket speck can't read gives a 500 with the error, and the server keeps running.
    Any other path gets 404.
    Its one write is `POST /api/tickets/<id>/ready`, which the Set ready button sends: it accepts it only with an `Origin` of `http://127.0.0.1:<port>` or `http://localhost:<port>` and an `X-Speck-Token` header holding the token the server makes afresh each time it starts and puts only into the page it serves.
    Anything else gets 403 and changes nothing, because the `Host` check alone doesn't stop a web page in your browser posting a form to `127.0.0.1`.
    It then sets the ticket ready exactly as `speck set <id> status ready` does and commits only that ticket's file as `speck(<id>): ready` (`speck start` needs it committed), leaving everything else in the checkout, staged or not, as it was.
    It refuses, changing and committing nothing, with the reason as JSON: a ticket that fails lint (422, with the same messages as `speck lint`), one that isn't a draft (409), an id with no ticket (404) and a checkout that isn't on `base_branch` (409).
    The server writes nothing else.
    The page, in the dark style of `docs/panel-mockup.html`, has a header with the repo, the base branch and the connection status, and shows **Shaping**, with a Tickets / Ideas / Inbox toggle, each with its count (`Tickets · <n>`), that shows one list at a time (Tickets when the page loads), tickets in blue, ideas in purple and the inbox in teal on the toggle, the section's top edge and each item's left edge.
    **Tickets** lists drafts in the JSON's order with their id, title, priority, size, risk, criteria count and lint result.
    Clicking that top row opens it: its problem, outcome, numbered acceptance criteria, out of scope and notes (a section with nothing in it is left out), and a readiness list with size and risk, criteria count, each lint error and warning in full (or "lint passes") and each `after:` id marked done or not done, then a **Set ready** button, disabled with the reason as its hover text while the ticket has lint errors.
    Clicking the button doesn't close the ticket.
    When the server refuses, the reason shows under the button until the next click on it, and once it's ready the next refresh moves it to the queue.
    Clicking the top row again closes it.
    Clicking or selecting text in an open ticket's details leaves it open.
    **Ideas** lists the user's own ideas, leaving out those whose status is `inbox` or `dropped`, those whose status doesn't start with `ticketed` first, with title, status and path, and clicking that top row shows its note text under it, until the top row is clicked again.
    Clicking or selecting text in the note leaves it open.
    **Inbox** lists every idea whose status is `inbox`, in the JSON's order, with title, path and "from <id>" from its `From ticket:` line (left out when it has none), and opens and closes to show its note text the same way.
    An empty inbox says "Inbox is empty."
    `dropped` notes show nowhere in the panel.
    More than one ticket or idea can be open at once.
    A ticket whose `type` is `bug` shows a "bug" tag beside its id in Shaping, the queue and Shipped, in a pink used for nothing else.
    A ticket starts a chain when its `waiting_on` is empty and at least one ticket that isn't `done` or `cancelled` lists its id in `after:`.
    In the Tickets list and among the queue's `ready` tickets, such a ticket shows a chain icon in the accent colour after its id, and "unlocks <ids>" (those tickets, in the JSON's order) in its line under the title: the criteria line in Shaping and the "Queued" line in the queue.
    A ticket whose `waiting_on` isn't empty shows a dimmed padlock there instead, with "waiting on <ids>" in the same line.
    Each icon's hover text says what it means, for example "Starts a chain: unlocks 0042" or "Waiting on 0039", and in-flight tickets show neither.
    Hovering a ticket in the Tickets list or a `ready` one in the queue highlights it and every ticket linked to it through `after:` in either direction, following links through other tickets that aren't `done` or `cancelled`, in both places, and dims the other tickets there until the pointer leaves it.
    In-flight tickets in the queue are never highlighted or dimmed, though links still pass through them.
    A ticket's chain icon and "unlocks" text change in place when only other tickets change, so text selected in its open details stays selected.
    Text selected in an open ticket's details or an idea's note stays selected through the refresh while that ticket's (by `id`) or idea's (by `path`) data in `/api/state` is unchanged, whatever else changes.
    When its own data changes, the new content shows in that refresh and the selection may be lost.
    The list showing and what's open survive the refresh and are never sent to the server.
    Then the **Queue**, one list with no groups: in-flight tickets (`building`, `reviewing`, `blocked`, `approved`) first, then `ready` ones, each in the JSON's order.
    Every ticket in it has a five-step bar, Build, Self-check, Review, Approve and Ship: Build is done once `self_check` is set or the ticket has a review round, Self-check once it has a review round or has `self_check` while `reviewing`, Review and Approve once it's `approved` (Ship is then the current step, whatever else is done), and otherwise the current step is the first one not done.
    While a ticket has review rounds, the Review step reads "Review <n>", its latest round number.
    A `building` or `reviewing` ticket that isn't red has a dot of light moving side to side, without stopping, along its current step, to show an agent is at work: it means "in flight", not how far along the step is.
    The dot carries on through the 2-second refresh while the ticket's data is unchanged, and isn't drawn at all when the browser asks for reduced motion (`prefers-reduced-motion: reduce`).
    Red, on its left edge and its current step, marks a ticket that needs you: a `blocked` ticket, with its blocked question under it, and an `approved`, `building` or `reviewing` ticket with a `build_exit`, with "Build finished without shipping" (approved) or "Build stopped before finishing" (building or reviewing) and the build's last message under it, as text.
    A `blocked` ticket with a `session` shows, under its question, the command that reopens its build's session, `cd <cwd> && <resume_command>`, with `{session}` replaced by the session id and the folder and id each in single quotes for a POSIX shell when they contain anything other than letters, digits, `/`, `.`, `_` and `-`.
      A Copy button beside it copies that exact text and says "Copied" for 2 seconds, or says it couldn't copy when the browser refuses.
      With `resume_command` blank it shows only "session <id>", with no button.
      A blocked ticket with no `session` shows nothing extra.
    Nothing else is red: a `blocked` or `ready` ticket with a `build_exit` looks as it would without one.
    A `ready` ticket shows "Queued", a bar with no step done or current and "waiting on <ids>" when it's waiting on any, or "unlocks <ids>" when it starts a chain.
    In-flight tickets show their worktree path, when they have one, and the whole minutes since `started`, when it's set.
    Clicking a queue ticket's top row opens it and asks the server for its build log, once, and clicking that top row again closes it.
    More than one can be open at once, and a log is asked for only when a ticket is opened, never for closed ones.
    The open ticket shows the log in a monospace box with a fixed maximum height and its own scrollbar, as text, with ANSI escape sequences removed and each run of blank lines shown as one.
    When the log was cut short, a first line says earlier lines aren't shown, and a ticket with no log shows "No log yet.".
    Clicking or selecting text in the log leaves it open, and a click that ends selecting text in the top row neither opens nor closes it.
    A log request that fails leaves the last log on screen.
    The open log isn't kept up to date while the build runs: close and open the ticket to read it again.
    Then **Shipped**: above the list, a stats row with the tickets shipped today (`finished` on today's date in the browser's time zone) and the median minutes from `started` to `finished`, median review rounds and median tokens, each saying how many tickets it covers (every `done` ticket with both times, with at least one review round, or with tokens recorded, respectively) and showing a dash when it covers none.
    The list has the latest 5 `done` tickets by `finished` time, newest first, with review rounds, tokens, the minutes from `started` to `finished` and when it shipped, from `finished` in the browser's time zone (`HH:MM` today, otherwise `D Mon HH:MM`, for example `8 Oct 14:02`, with no year); done tickets with no `finished` time come after those, within the 5, and show a dash for when they shipped.
    With no `done` tickets it says nothing has shipped yet and shows no stats.
    Text selected in a queue or Shipped row, and the scroll position of a build message box or an open log, stay put through the refresh while that ticket's data in `/api/state` (by `id`, whatever order its fields come in) is unchanged, whatever else changes.
    A kept row's minutes since `started`, Shipped time, chain icon and "unlocks" or "waiting on" text still change in place when only the clock or other tickets change.
    The minutes and the Shipped time change only the characters that differ, so a selection in or across them stays too.
    When a row's own data changes, the new content shows in that refresh and its selection or scroll position may be lost.
    Cancelled tickets aren't shown.
    It fetches `/api/state` every 2 seconds without reloading (a request still unanswered when the next is due counts as disconnected), says when it's disconnected (or what the server couldn't read), keeps the last state on screen and recovers by itself.
    Ticket and idea text is always shown as text, never as HTML.
    The page is `templates/panel.html`, which `init` copies with the CLI.
  - `close`: closes an approved build with one command, run on the ticket branch after the reviewer approves.
    It refuses, changing nothing, unless `speck next` says `ship`, the ticket isn't already `approved`, `done` or `cancelled`, and nothing outside the ticket file has uncommitted changes (staged, edited or untracked).
    It replaces `## Review log` with one line per round (the round, reviewer, verdict, and the id and first sentence of each blocking finding first seen in that round, not repeated later), adds the review rounds, reviewer and model, reviewer tokens, elapsed time and changed lines with the limit to `## Delivery log` (the same figures as `speck pack`, keeping anything already there such as follow-up ideas), sets `approved` and commits only the ticket file as `speck(<id>): approved`.
    It refuses if the ticket has no `## Review log` or `## Delivery log` heading.
    It never merges or pushes.
  - `ship`: the user's gate.
    It refuses, changing nothing, unless the ticket is `approved`, the review loop says ship, the ticket's folder is clean, no commit after the reviewer's approval touched files outside `speck/` (even if later reverted), and `commands.test` is set and passes.
    If the base branch has a remote, it fetches it first: new remote commits are brought in before merging, and if local and remote have both moved on it refuses and says to `git pull`.
    Then it sets the ticket to `done` on its branch, merges into the base branch with a merge commit, deletes the local branch and pushes the base branch if it has a remote.
    Once that push succeeds, it also deletes the ticket branch on the remote if it's there.
    If the push fails, the remote copy is kept.
    A merge conflict is aborted and leaves everything as it was, and speck names the conflicting files and exits with 13.
    It also names what to merge into the ticket branch: the base branch, or its remote copy (for example `origin/main`) when it had just fetched new commits from the remote, since the undo leaves the local base branch without them.
    Every other refusal keeps its own code.
    A merge that would overwrite uncommitted changes is reported as that, naming the files, not as a conflict.
    When a merge fails, the undo puts back any uncommitted changes to tracked files in the base checkout and the ticket's worktree, staged or not.
    If they can't go back in place, they're saved in git's stash and speck says to run `git stash pop --index` in that folder.
    With `--auto`, it first checks that `auto_ship` allows the ticket (see below), reading the ticket where its branch is checked out.
    If not, it changes nothing, says why and exits with 12.
  - **Shipping across worktrees:** when the ticket branch is checked out in another git worktree, `ship` works from either folder.
    The checks, tests and ship commit happen in the ticket's worktree, and the merge happens where the base branch is checked out, so that checkout ends up with the merged files.
    It refuses, changing nothing, if the ticket's worktree isn't clean, or if its folder is missing (with a hint to run `git worktree prune`).
    Uncommitted edits in the base checkout don't block it, so you can keep editing ideas and tickets there while builds ship: they stay there, uncommitted and out of the merge.
    It refuses only when that checkout has staged changes (git won't merge over them, even in other files) or uncommitted edits to a file the ticket's branch changes, checked before and again after the tests, naming each file and why, and leaving them as they were.
    Untracked files in the base checkout only block it when the merge would overwrite them, and speck names them.
    If the base branch isn't checked out anywhere, the merge happens in the ticket's worktree.
    After shipping, the ticket's worktree is removed; if ship ran from inside it, it says so and prints where the base branch is checked out.
    A worktree that can't be removed (a locked one, say) doesn't stop the ship or the push, and speck prints the commands to finish tidying up.
    A conflict, a failed check or failed tests leave the worktree, both branches and both folders as they were.
- **Closed tickets are filed away:** `speck/tickets/` holds only work in progress, and closed ones sit in `speck/tickets/done/` under the same name.
  "Closed" means `done` or `cancelled`.
  A ticket set to `done` (by `speck set` or by `speck ship`), or cancelled with `speck cancel`, moves there, and any other status moves it back.
  Every command that takes a ticket id finds it in either folder, so ids and `after:` links stay valid, and the review rounds move with the ticket.
  `speck status` still lists the finished ones, and the cancelled ones with their reasons.
  Moving a ticket never overwrites: if a file of the same name is already in the other folder, speck stops and asks you to keep one.
- **Readable ticket header:** every ticket opens with `# <id> · <title>` and a `**Status:** <emoji> <status>` line, so Markdown previews that hide frontmatter still show what it is and where it stands.
  The emoji are 📝 draft, 📋 ready, 🔨 building, 🔍 reviewing, ⛔ blocked, 👍 approved, ✅ done and ❌ cancelled.
  `speck new` writes the header, any `speck set` or `speck ship` rewrites it from the frontmatter, `speck lint` warns when it's missing or out of date, and re-running `speck init` adds or fixes it in every ticket, including `done/`.
- **Ticket pre-check:** before `/speck-ticket` presents a ticket, the agent checks each acceptance criterion for more than one reading (and rewrites it or asks you), and checks external facts the ticket relies on (tool and command names, flags, file formats, URLs, versions) against current documentation or the installed tool.
  Each fact goes in Notes as `Checked <date>: …` or `Unverified: …`.
  `/speck-build`'s pre-flight re-checks any `Unverified:` fact, and stops to tell you if one turns out to be wrong.
  It's in the skills only.
- **Builds commit only their own files:** `/speck-build` and `/speck-review` tell the builder to stage each file it created or changed by name, never with `git add -A`, `git add .` or `git commit -a`, and to leave alone any files it didn't create or change (another session's, say) and mention them to the user.
  It's in the skills only.
- **Builder self-check:** before the first review round, `/speck-build` has the builder check its own change against a short adversarial checklist: unusual input (including built-in names such as `constructor`), state carried across rounds or re-runs, error paths and their messages, every docs and `product.md` claim against code and a test, and scope.
  Each problem found gets a failing test and a fix, and the ticket's Notes get one `Self-check:` line.
  It's in the skill only, and it isn't a review or an approval.
- **`speck run`: builds start themselves.**
  `speck run` checks the tickets every 5 seconds and launches a build for each `ready` ticket whose `waiting_on` is empty, in `speck status` order (priority, then id), while fewer than `max_parallel_builds` (in `speck/config.yml`, default 1, a whole number of at least 1) of the builds it launched or found running are still running.
  Each build runs `build_command` from `speck/config.yml` from the repo root, without a shell and with stdin empty, with `{id}` replaced by the ticket id and `{session}` by a fresh UUID.
  The config template's default is `claude -p "/speck-build {id}" --session-id {session} --dangerously-skip-permissions`.
  `resume_command` in `speck/config.yml` (`claude --resume {session}` in the config template) is what the panel shows to reopen a blocked build's session, run from the folder `speck run` launched it from, since Claude Code keeps sessions by the folder they started in.
  For each build it writes `speck/.cache/runs/<id>.json` (session id, the folder the command ran from, start time, process id and the command) and sends the build's stdout and stderr to `speck/.cache/runs/<id>.log`, and it prints a line when it launches a build and one when it exits, with the exit code.
  When a build exits, it adds `exited` (the ISO time) and `exit_code` (a number, or `null` when a signal stopped it) to the run record, keeping its other fields; a later launch of the same ticket replaces the record, so an old exit never sticks to a new build.
  When it starts, it reads each run record with no `exited`, so a restarted `speck run` doesn't launch a second build of a ticket an earlier one is still building.
  If the record's process is still running, it prints once that the ticket is already being built, with the session and process id, and never launches that ticket.
  That build counts towards `max_parallel_builds`, and `speck run` checks it on every poll.
  When its process has gone, it adds `exited` (the time it noticed) and `exit_code: null` to the record, keeping its other fields, prints that the build stopped, and reports it as below if it left its ticket `ready`.
  If the record's process isn't running (or it has no process id), it adds `exited` and `exit_code: null` straight away, and the ticket is treated as any other.
  It never changes anything in `speck/tickets/` itself: the build does that.
  It launches each ticket at most once per run.
  A build that exits leaving its ticket `ready` is reported with the last five lines of its log, and one whose command can't start is reported with the reason; neither is launched again.
  It runs until stopped (Ctrl+C), and stopping it launches nothing more and leaves running builds running.
  It refuses to start, with a plain message and a non-zero exit, when `build_command` is blank, missing or has an unclosed quote, when `max_parallel_builds` isn't valid, when the checkout isn't on `base_branch`, or when another `speck run` is already running in this repo (a lock file in `speck/.cache/runs/`, written whole before it's put in place and taken over, one runner at a time, if the process that held it is gone).
  Its record is written before a build starts, so a build whose record can't be written isn't started.
  When a build exits, its ticket's status is read the same way as `speck status`, including the copy in the build's own worktree.
- **Build ends at `approved`, or ships:** once the reviewer approves, `/speck-build` runs `speck close` (which fills in the ticket's review and delivery logs, sets `approved` and commits), then runs `speck ship <id> --auto`.
  If that exits with 13 (a conflict), the builder merges the base branch into the ticket branch in its worktree, resolves the conflicts keeping the intent of both sides, runs the tests, commits, and runs a review round whose response lists each file it resolved and how.
  On approval it runs `speck close` and `speck ship <id> --auto` again.
  The extra round counts towards `max_review_rounds`.
  If it still conflicts after two merges, the builder blocks the ticket with the conflicting files in the question.
  This is in the skill only: speck itself never merges the base branch into a ticket branch.
  No PR is opened, and the GitHub CLI isn't needed.
- **Auto-ship:** `auto_ship` and `auto_ship_risk` in `speck/config.yml` decide whether an approved ticket ships straight away.
  It ships only when `auto_ship` is `true`, the ticket's `risk` is listed in `auto_ship_risk`, and the reviewer could inspect the repo in every round (no round with `sandbox_ok: false`).
  All of `speck ship`'s usual checks and the test run still apply.
  Otherwise the ticket stays `approved` for the user to ship with `/speck-ship`.
  New projects get `auto_ship: false` and `auto_ship_risk: [low]`.
  This repo has `auto_ship: true` and `auto_ship_risk: [low, high]`, so every approved ticket ships.
- **`/speck-ship <id>`** runs `speck ship`.
  In Claude Code the skill has `disable-model-invocation: true`, so only the user can start it.
- **Reviewer model and effort:** `reviewer_model` and `reviewer_effort` in `speck/config.yml` set them for the whole repo.
  `speck new` copies them into each ticket, where they can be overridden, and a blank ticket value falls back to config.
  If both are blank, speck passes nothing and the reviewer uses its own default.
  Codex gets them in every round, and the review skill starts a `claude-subagent` reviewer with them.
  `speck lint` accepts only a blank effort or `low`, `medium`, `high`, `xhigh` or `max`.
  Model names aren't checked.
  Every saved round and the review pack show the model and effort used, or "default".
- **Claude subagent review loop** (`reviewer: claude-subagent`, which needs `allow_same_model_review: true`): the builder starts a fresh Claude subagent with `speck prompt`, records each reply with `speck record`, and resumes the same subagent with SendMessage for later rounds.
  It has been run end to end with a real subagent: `changes_requested` in round 1 and `approve` in round 2.
  `speck record` accepts a reply as the subagent sent it, including inside a ```` ```json ```` fence, and refuses a reply that isn't JSON, isn't a JSON object, or has a `criteria` or `findings` entry that isn't an object, with a plain error and nothing recorded.
  It doesn't check the fields inside each criterion or finding.
- **Command reviewers:** any agent with a non-interactive mode can review.
  Give `reviewer: <name>` a `command` under `reviewer_options` in `speck/config.yml`, for example `cursor-agent -p --output-format json --mode ask --model {model}` for Cursor or `claude -p --output-format json --permission-mode plan --model {model} --effort {effort}` for Claude Code.
  `speck review <id>` runs it from the repo root without a shell, sends the round-1 prompt (the same text as `speck prompt <id>`) on stdin, reads the verdict from its output (plain JSON, a ```` ```json ```` block, or a JSON envelope whose `result` string holds it) and records the round itself, with the builder's response kept in the round.
  `{model}` and `{effort}` are filled in from the reviewer settings, and a blank one is dropped with the flag before it.
  Later rounds resend the round-1 prompt exactly as it was sent (kept in `speck/.cache/`, or rebuilt from the commit round 1 reviewed if that copy is gone, without its test output), every earlier verdict and builder response in order, then the new response, diff and test output, because the reviewer has no memory between runs.
  A non-zero exit, output with no verdict or an invalid verdict is a plain error quoting the last five lines of stderr, and nothing is recorded.
  Token use is taken from the envelope's `usage` when there is one.
  A command set for `codex` replaces the built-in Codex adapter.
- **Resuming a command reviewer's session:** a reviewer entry can also set `session_id_path`, a dot path into the command's JSON output, and `resume_command`, which must contain `{session}`.
  The session id found at that path is saved with the round as `thread_id`.
  Later rounds then run `resume_command` with the id saved by the round just before and send only the new round's prompt (builder response, diff since last review, test output), as Codex rounds do.
  If the round before saved no id (for example, a fresh run whose output had none), no `resume_command` is set, or resuming fails, speck sends the full history to a fresh run of `command` and says why in one line.
  Every round records `session: continued` or `fresh`, and the review pack shows it.
  For Codex rounds, it's worked out from whether an earlier round saved a session.
  For Claude Code, `session_id_path: session_id` with `resume_command: "claude -p --output-format json --permission-mode plan --resume {session} --model {model} --effort {effort}"` has been run end to end, and round 2 continued the session.
- **Codex review loop:** read-only sandbox, structured verdict (`templates/review-verdict.schema.json`), and the same session resumed across rounds, using the thread id recorded with the latest round.
- **The first review round sets `reviewing`:** when round 1 starts on a ticket in `building`, speck sets it to `reviewing` (and rewrites its header), so the builder makes no separate status step or commit.
  `speck review` does this once its checks pass and before the reviewer runs, and puts the ticket back exactly as it was if the round fails (the reviewer errors, or its output isn't a valid verdict).
  `speck record` does it in the same write as round 1, so a refused reply changes nothing.
  `speck review` and `speck record` also set an `approved` ticket back to `reviewing` the same way, in any round, for a re-review after a merge, so `speck review` accepts an `approved` ticket.
  Tickets in any other status, and later rounds on a `building` ticket, are left alone.
  The change stays uncommitted alongside the round, and the next round accepts both as the ticket's only uncommitted changes.
- **Re-review after merging the base branch:** when the ticket branch has merged the base branch in since the last round (its merge base with the base branch has moved; the base branch's remote copy as last fetched counts as the base branch when it's ahead of the local one), the reviewer's diff is the branch's whole change against the base branch as merged, which is what would ship, not the diff since its last review.
  The round's prompt says it follows a merge and asks the reviewer to check each resolved file keeps the intent of both sides, and `speck diff` shows the same diff.
  A round 1 prompt rebuilt from git uses the base branch as it was when round 1 ran.
  `speck close` replaces the figures an earlier close wrote in `## Delivery log` rather than adding a second set, keeping everything else there.
- **Review rounds live in the ticket:** every round, from any reviewer, is added to a `## Review rounds` section at the end of the ticket file, as a collapsed `<details>` block with a one-line summary (round, reviewer, verdict) and the full record as a `json` code block.
  After a round, the ticket is the only tracked file that changes, and the round can stay uncommitted until the builder's next commit.
  `next`, `pack` and `ship` read the rounds from there.
  The section is left out of the reviewer's diff and prompt and the size count, and `speck lint` reports an error if a round isn't valid JSON or the rounds aren't numbered 1, 2, 3… in order.
  Working files for a review in progress (raw reviewer output, saved reviewer settings) go in `speck/.cache/`, which git ignores.
  Re-running `speck init` moves rounds from an older speck's `speck/reviews/<id>/` into their tickets and removes `speck/reviews/`.
  Anything it can't place, such as rounds for an id with no ticket, is left where it is with the reason.
- **Sandbox warning:** if a command the Codex reviewer ran failed because its sandbox couldn't start (the error mentions `bwrap`), `speck review` prints "⚠️ Reviewer could not inspect the repo; reviewed the diff only", the round's `meta` records `sandbox_ok: false`, and the review pack shows the same warning for each such round.
  Rounds without the failure carry no flag.
- **Safeguards:**
  - An `approve` with failing criteria or open blocking findings is overridden to `changes_requested`.
  - The loop blocks after the maximum number of rounds, after the same dispute is rejected twice in a row, or on escalation.
  - Builder and reviewer can't be the same agent without an explicit override (`allow_same_model_review: true`).
    `speck lint` treats a `claude-subagent` reviewer as the same model as a `claude` builder.
- **Review pack** (`speck pack <id>`): acceptance criteria table, risk flags, review history and actuals.

## Key decisions and constraints
- **The frontmatter is the ticket's source of truth.**
  The header under it is a rendered copy, and hand edits to the header are overwritten.
  Change a title with `speck set <id> title …`.
- **The repo is the source of truth.**
  All state is in Markdown files in `speck/`, with structured data in YAML frontmatter and JSON code blocks, so that any UI (such as the future board) is only a view over these files.
- **One ticket, one file.**
  A ticket's spec, status and full review history are in the same file, and speck alone writes its `## Review rounds` section.
- **Small tickets only:** one agent, one sitting, one branch.
  `L` tickets must be split.
- **Builder and reviewer are different agents by default** (Claude builds, Codex reviews).
- **Only the reviewer can approve.
  Only the human can ship, unless they turn on `auto_ship`.**
  Agents never merge or ship unless the user runs `/speck-ship`, except through `speck ship <id> --auto` at the end of a build, and only when config allows it.
  Turning it on is the user's standing approval for whatever the reviewer approves.
- **Ticket closure and `product.md` updates travel on the ticket branch.**
  `product.md` is updated and reviewed during the build, and `speck ship` sets `done` just before merging, so merging is what makes them true and nothing reaches the base branch unreviewed.
- **Each build in its own worktree.**
  New projects get `worktrees: true`, and this repo has it on.
  Sessions sharing one checkout kept colliding, and a separate worktree per build stops that.
  It also lets several tickets be built at once.
  Worktrees share one `.git`, so each adds only the checked-out files.
- **Local first, for solo builders.**
  Shipping is a local merge plus a push, so no GitHub PR, `gh` login or branch protection is needed.
- **The reviewer reviews commits**, so `speck review` and `speck record` refuse, recording nothing, while a tracked file is modified or staged and not committed (apart from the ticket's own recorded rounds and round 1's status change), and name those files.
  Untracked files don't stop them: they may belong to another session, and they aren't part of what's reviewed.
  `speck ship` still needs the ticket's own folder fully clean, untracked files included.
- **speck never picks a model.**
  No model name is built into the code, templates or skills.
  With nothing set, the reviewer runs on its own default: Codex's default, or the builder's model in a fresh session for `claude-subagent`.

## Known limits
- Several tickets can be built at once, each in its own worktree, but apart from `speck run`, which waits for a ticket's `after:` tickets to be done before launching it, there's no dependency scheduling: a build started by hand doesn't wait, and nothing stops two tickets that touch the same files from running together.
  Shipped one after the other, they each merge cleanly unless their changes conflict.
  A ticket whose changes conflict with one shipped before it is refused at ship (exit 13), leaving it `approved` with its branch, worktree and the base branch as they were.
  `/speck-build` then merges the base branch in, resolves the conflicts and gets the result re-reviewed before shipping again.
- A worktree has no gitignored files (`node_modules`, `.env`, build output) unless `worktree_setup` provides them.
  New projects start with it blank.
- Known builders: speck works with any agent that reads skills from `.agents/skills/` or `.claude/skills/`, such as Claude Code, Codex and Cursor.
  Claude Code is the only builder that has run a ticket end to end so far.
  Codex and Cursor builders are untested (0016 covers Cursor).
- Builds launched by `speck run` with the default `build_command` run with `--dangerously-skip-permissions`, because nobody is there to answer permission prompts.
  Each build works in its own worktree, but the agent can run any command on this machine, with your access.
  Change `build_command` to use a tool's narrower permissions if you want less.
- Builds from `speck run` ship as `auto_ship` and `auto_ship_risk` allow, with nobody watching, so setting a ticket ready can end in a merge and push to the base branch.
- A build from `speck run` that exits without shipping stays red in the panel while its ticket is `approved`, `building` or `reviewing`, until `speck run` launches it again.
  Resuming it by hand with `/speck-build` doesn't clear its run record, so it stays red while that build runs.
  Builds started by hand leave no run record and are never flagged.
  A build that exits after the `speck run` that launched it has stopped is only flagged once `speck run` is started again, with no exit code.
- `speck run` tells a build is still running only by its process id, so a reused process id can make it treat a finished build as still running.
- An idea's `ticketed (…)` status is only ever added to.
  Cancelling or finishing one of its tickets doesn't change it.
- `speck status` counts a `dropped` idea as waiting, because it counts every idea that isn't ticketed as waiting.
- A `claude-subagent` reviewer, or a command reviewer, is read-only only because its prompt says so.
  Unlike Codex, speck runs it with no sandbox, so a command should use the tool's own read-only mode (for example Cursor's `--mode ask` or Claude Code's `--permission-mode plan`).
- The Claude Code command reviewer has been run end to end (two rounds, `changes_requested` then `approve`).
  The Cursor example hasn't been run.
- If the Codex sandbox can't start (for example, AppArmor blocking bubblewrap on Ubuntu), the reviewer works only from the diff and test output it's given. speck warns about this but can't fix it.
  Later rounds resume the same Codex session, so a reviewer that has seen the sandbox fail may keep saying so without trying again.
  Start a fresh session after fixing the host.
- No PR flow yet.
  Shipping pushes the base branch directly, so it fails if the branch is protected by a "require a pull request" rule.
  A PR mode for teams is parked in `speck/ideas/2026-10-08-pr-ship-mode.md`.
- In Codex and other agents, nothing technically stops the agent from starting `/speck-ship`.
  Only the skill and agent instructions say not to.
  Claude Code enforces it with `disable-model-invocation`.
- If `speck review` is interrupted (for example with Ctrl-C) while the reviewer runs, a ticket that round 1 set to `reviewing` stays `reviewing` with no round recorded.
  Run the review again, or `speck set <id> status building`.
- If the base branch has moved and conflicts, `speck ship` refuses.
  There's no rebase: `/speck-build` merges the base branch into the ticket branch, and a `/speck-ship` run by hand leaves that merge to you.
- Not yet published to npm (planned package name `speck-dev`).
  Install runs from GitHub with `npx`, so the repo must be public, or the user needs access to it.
- No Claude Code plugin: skills are plain project skills, so commands are `/speck-build` rather than `/speck:build`.

- Speck doesn't check whether a model name exists or whether the reviewer supports the chosen effort.
  For example, Codex may reject `max`.
- Claude Code's Agent tool takes model aliases rather than full model names, so set `reviewer_model` in that form for a `claude-subagent` reviewer.

- The control panel is local to this machine and has no login: anyone who can reach `127.0.0.1` on it, such as other programs on the machine, can read the board.
  Its one write, Set ready, needs the token from the page, so a web page in your browser can't use it, but a program on this machine that fetches the page first can.
  It shows only what's in the ticket files, not live agent activity, and it polls rather than being pushed changes.

## How to run and test
- Unit tests: `npm test`
- Try an install: in a test repo, run `npx github:luroai/speck init`.
  To test unpushed changes, use `npm pack` in speck, then `npx --package=<path to .tgz> speck init`.
- In this repo, `node scripts/speck.mjs init` links `.claude/skills/`, `.agents/skills/` and `.speck/` back to the source, so edits to the skills take effect straight away.
