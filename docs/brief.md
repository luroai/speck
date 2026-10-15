# speck — product brief

Status: 0.5.0, a public preview · 15 October 2026

## Thesis

**You own two decisions: what gets built and what gets shipped. Everything in between is automated.**

PMs have practised spec-driven development for years. It's called a PRD, and it reaches engineers as a ticket. speck applies the same workflow to AI coding agents. You write, or approve, a small ticket. One agent builds it. A second, independent agent reviews it until it's good enough. Then you ship it.

OpenSpec showed the value of keeping specs in the repo. speck keeps that idea but swaps the ceremony for small tickets and an adversarial review loop. There is no separate spec to keep up to date: the code, the tickets and the tests are the record of what the product does.

## Who it's for

- **Primary:** product-minded builders, such as PMs and founders, who can write a good ticket but don't want to review code line by line, and who want to ship personal or small-team projects quickly without giving up quality. They're comfortable setting speck up through a conversation with their agent and running it on their own machine.
- **Secondary:** engineers who want a lightweight, auditable loop of ticket, agent build, independent review and merge.
- **Where it's heading:** people who'd rather not have a development setup at all. That needs speck hosted, with builds running in the cloud, which is a deliberate later step (see "Where it's heading" below).
- **Not for:** large multi-team specification, or work that needs design documents spanning many changes. Use OpenSpec or similar for that.

## Principles

1. **The repo is the source of truth.** Ideas, tickets and review transcripts are Markdown files in the repo, beside the code they describe. Any tool, including the panel, reads and writes these files and nothing else.
2. **Small tickets only.** A ticket is one agent, one sitting, one branch. If a ticket is too big for that, it gets split. It never gets stretched.
3. **Review is adversarial and independent by default.** The builder never reviews its own work. A separate reviewer, preferably a different model, must approve it.
4. **Humans hold two gates.** Gate 1 is moving a ticket to `ready`. Gate 2 is shipping it with `/speck-ship`, or the Ship button in an approved ticket's review pack in the panel, which merges it. Agents never merge or ship unless the user runs `/speck-ship` or clicks that Ship button, and never click it themselves. The one exception is auto-ship: if you set `auto_ship: true` in `speck/config.yml`, `speck run` ships each approved ticket whose risk is listed in `auto_ship_risk`, one at a time. It's off by default.
5. **Evidence over trust.** Every approved ticket has a review pack (`speck pack <id>`) that a non-coder can judge: each acceptance criterion with its result, a plain-English change summary, and flagged risks.
6. **Measure actuals.** Every ticket records its review rounds, time and the reviewer's tokens, and builds that `speck run` starts record the builder's tokens and cost. That data is the product's proof.
7. **One build at a time.** speck runs one build at a time (WIP 1) unless you change it, each in its own worktree, so you keep shaping ideas and tickets on the base branch while builds and ships are handled. You can create tickets, set them ready and walk away. Builds end at approved, and one ship queue in `speck run` ships tickets one at a time, handing a ticket back to its build only when the ship needs work on it. `max_parallel_builds` in `speck/config.yml` sets how many builds `speck run` keeps going at once: 1 unless you change it. Why:
   - **Your attention is the bottleneck.** speck's value is its gates, and what limits it is your attention, not agent time.
   - **It keeps things simple.** Each build starts from the latest base branch, so order, `after:` dependencies, conflicts and a broken base branch stay simple.
   - **It fits speck's users.** They shape product rather than debug races.
   - **Isolation isn't parallelism.** speck keeps worktrees for isolation, so a build never touches your checkout. Running builds side by side is a different thing.
   - **The cost is throughput.** At the default, tickets are built one after another.
   - **One build at a time is the default, not a limit.** Raising `max_parallel_builds` in `speck/config.yml` is supported: `speck run` then keeps that many going at once, while its ship queue still ships tickets one at a time.

## The workflow

```
idea / conversation
  → /speck-capture        → speck/ideas/<date>-<slug>.md
  → /speck-ticket         → speck/tickets/0007-<slug>.md   (status: draft)
  → decide against it     → speck cancel 0007 "<reason>"    (status: cancelled,
                            filed in speck/tickets/done/)
  → you edit and approve  → speck set 0007 status ready,     [GATE 1]
                            or Set ready in the panel: commits the ticket
  → speck run             → starts /speck-build for the next ready ticket, one at a time by default,
                            highest priority first, once its after: tickets have shipped
  → /speck-build 0007     → speck start: branch speck/0007-<slug> in its own worktree
       tests from acceptance criteria → implementation → tests pass
       → builder self-check (edge cases, error paths, claims, scope)
       → review loop with an independent reviewer (see below)
       → approved?  yes → logs filled in, status: approved (waits on its branch, no PR),
                          or shipped straight away if auto_ship allows it
                    no, after max rounds → status: blocked + question for you
  → you read `speck pack 0007`
  → /speck-ship 0007      → checks, final test run, ticket set to done and   [GATE 2]
    or Ship in its review pack in the panel: runs the same speck ship
                            filed in speck/tickets/done/, merge into main,
                            push, branch deleted locally and on the remote
```

`speck ship` sets the ticket to `done` on the ticket branch just before merging. Until you ship, `main` is unchanged. `speck ship` refuses, changing nothing, unless the ticket is `approved`, the review loop says `ship`, the working tree is clean, no commit after the reviewer's approval touched files outside `speck/`, and `commands.test` is set and passes (taking a turn, as `speck test` does). The tests run on what would land: the ticket merged with the base branch as it is now, including any new commits on the remote, so a clean merge into a base branch that has moved on ships without another review. What lands is exactly what passed, apart from the ticket's own file, which ship marks done. If you commit to the base branch while the tests run, ship runs them again with your commits, up to three times in all; after catching up with the remote, it refuses instead, as your base branch and the remote's then each have commits the other doesn't. If they fail but the base branch's own tests pass, ship says the ticket and the base branch's newer changes fail together, naming the failing tests when the output is TAP. When the merge has conflicts, ship tests the ticket branch alone, then refuses at the merge. Ship reuses a recorded passing result for the same code, as `speck test` does, but never a recorded failure. If its tests stall, ship refuses, saying so, without checking the base branch's tests, and the ticket stays approved to ship again. Uncommitted edits in the base branch's checkout stay there through the merge, unless they're in a file the ticket changes, which refuses at once, or staged: git won't merge over a changed index, so ship says once which files are staged and waits, changing nothing, until they're committed or unstaged. It checks again every few seconds and refuses after `ship_wait_minutes` (default 30). A merge conflict is aborted and leaves everything as it was. If the ticket branch is checked out in another git worktree, ship does the branch steps there and the merge where the base branch is checked out, then removes the ticket's worktree. A ship that was killed while the tests ran on the merge leaves that merge checked out in the ticket's worktree; when that worktree is where `speck start` puts it, the next ship checks the ticket's branch out there again before anything else, or refuses, naming the worktree and saying to run `git checkout <branch>` there, when something else is checked out there or git won't switch. `speck run`'s ship queue tries a ticket whose ship was killed again on its next check, without waiting for a new commit, once until the base branch or the ticket's branch has a new commit. Once it has merged, ship removes the ticket's scratch files, as `speck cancel` does: every file and folder in the temporary folder (`/tmp`, unless `TMPDIR` names another) whose name starts with `speck-<id>-`, such as the build's test output and review prompt. One it can't remove is named in one line and doesn't stop the ship; a ship that refuses leaves them all, since the build may still need them.

## Ticket size rules

A ticket is ready only if it passes all of these. `/speck-ticket` checks them and offers a split when a ticket fails.

| Rule | Limit |
|---|---|
| Outcome | One outcome that you can observe or verify. No "and" joining two outcomes in the title. |
| Acceptance criteria | 1–5, each testable |
| Ticket length | Fits on one screen (about 40 lines of body) |
| Expected change | Reviewable in one sitting. Default guideline is ≤ 300 changed lines, excluding tests and lockfiles (configurable). |
| Size | `S` or `M`. `L` can never be `ready`; it must be split into sibling tickets. |
| Risk | `low` or `high`. `high` means it touches auth, payments, data deletion, migrations, infrastructure or secrets, and makes the reviewer stricter. |

Guardrail during build: if the diff passes the size limit before the tests pass, the builder stops and proposes a split. It doesn't push on.

## The review loop

The implementation agent owns the loop. It spawns a reviewer subagent and they work in turns until the reviewer approves or the loop escalates to you.

**Roles**

- **Builder:** writes tests and code. It can fix a finding or dispute it with a reason. It cannot approve.
- **Reviewer:** reads the ticket, the diff and the test output. It runs read-only and cannot edit code. It is the only party that can approve.

The reviewer gets a summary of the test output rather than all of it: when the output is TAP, as `node --test` writes it, speck keeps the run's totals, every failing test with its details and every test named with the ticket's id, and says where the full output is. When a full run passed only on its second try (its output ends with a `Flaky:` line), the summary says the run passed, keeps the full run's totals, and lists the tests that failed then passed under "Passed on a second try" rather than as failing tests. Other formats are sent in full. The output is from the test files the builder ran with `speck test --files`, not the whole suite, which runs in `speck ship`: the reviewer judges a criterion that no test that passed before fails from those tests and the change. Each round's record keeps how many failing tests the summary listed and which passed on a second try, and the review pack shows them for the latest round under "Tests", so it agrees with what the reviewer was told. A round given output that isn't TAP, or none, records nothing, and the pack has no "Tests" part.

**Protocol**

1. **Round 1.** The builder spawns the reviewer with the ticket, the diff against the base branch and the test output. The reviewer returns a structured verdict (`templates/review-verdict.schema.json`):
   - a result for each acceptance criterion: `pass`, `fail` or `unclear`, with evidence;
   - findings, each `blocking` or `minor`;
   - a verdict: `approve`, `changes_requested` or `escalate`.
2. **Builder's turn.** The builder answers every blocking finding with one of:
   - `fixed`, with the change made;
   - `disputed`, with a reason;
   - `needs_pm`, for a scope or product question.
3. **Next round.** The builder resumes the *same* reviewer session, so the reviewer remembers its earlier findings, and sends its responses plus the new diff. The reviewer re-checks, accepts or rejects each dispute, and issues a new verdict.
4. **Termination.** The loop ends in one of four ways:
   - **Approve:** no blocking findings and every criterion passes. The ticket waits for you to ship it, or ships straight away if `auto_ship` allows it.
   - **Max rounds reached** (default 3): the ticket becomes `blocked`, with a summary and one specific question for you. Merge rounds don't count towards this limit (see below).
   - **Repeated disagreement:** the same finding is disputed in two consecutive rounds. It escalates to you rather than looping.
   - **`needs_pm`:** the ticket becomes `blocked` with that question.
5. **Minor findings never block.** They're logged in the ticket and offered as new ideas.

**Merge rounds.** When an approved ticket's ship conflicts with the base branch, the builder merges the base branch in and gets the merge re-reviewed. A round is a merge round when the branch merged the base branch in since the previous round and that round approved. The rounds after it, until one approves, re-review the same merge, so they're merge rounds too. Merge rounds don't count towards `max_review_rounds`, so a ticket approved in its last allowed round can still have its merge checked. They have their own limit instead: `limits.max_merge_rounds` (default 2) merge rounds in a row without an approval block the ticket. The rule on repeated disputes applies to merge rounds as to any other. The ticket's Review rounds, its review log and the review pack mark each merge round.

**Records:** each round is saved in the ticket file itself, in a `## Review rounds` section at the end that only speck writes. Each round is a collapsed `<details>` block with a one-line summary (round, reviewer, verdict, and "merge round" for a merge round) and the full record as a `json` code block, so a ticket is one file holding its whole history, and it moves into `done/` with its rounds. The section is left out of the reviewer's diff and prompt, and `speck lint` reports an error if a round isn't valid JSON or the rounds are out of order. A short summary also goes into the ticket's Review log. The review pack (`speck pack <id>`) is built from the recorded rounds. Working files for a review in progress go in `speck/.cache/`, which git ignores.

**Reviewer adapters**

| Adapter | How it runs | Notes |
|---|---|---|
| `codex` (default when the builder is Claude) | `codex exec --sandbox read-only --output-schema …`, then `codex exec resume <session>` for later rounds | Cross-model by default |
| `claude-subagent` | A fresh-context Claude Code subagent using the review skill | Fallback; same model family, so config must allow it explicitly |
| Any name with a `command` | `speck review` runs the command from `reviewer_options.<name>.command` in `speck/config.yml`, with the prompt on stdin, and reads the verdict from its output | For any agent with a non-interactive mode (Cursor, Claude Code, Gemini…). Later rounds resume the reviewer's session if `session_id_path` and `resume_command` are set, and otherwise resend the full history |

**Time limit.** A reviewer speck runs, Codex or a command reviewer, that hasn't finished after `review_timeout_minutes` (in `speck/config.yml`, default 30, a whole number of 1 or more) is ended, with every process it started. The round fails, saying the reviewer took longer than that many minutes, records nothing and leaves the ticket as it was, so it can be run again. A bad value is refused, saying how to fix it, before any reviewer runs. The `claude-subagent` reviewer runs in the builder's own session, so it has no limit.

**Command reviewers.** Set `reviewer: <name>` and give that name a `command` under `reviewer_options`. `{model}` and `{effort}` in the command are filled in from the ticket's `reviewer_model` and `reviewer_effort`. When a value is blank, the placeholder and the flag just before it are dropped, so the reviewer uses its own default. The command runs from the repo root without a shell, gets the round-1 prompt (the same text `speck prompt <id>` prints, schema included) on stdin, and must print the verdict as JSON, in a ```` ```json ```` block, or in a JSON envelope whose `result` string holds it. Later rounds resend the round-1 prompt exactly as it was sent (kept in `speck/.cache/`, or rebuilt from the round-1 commit if that copy is gone), every earlier verdict and builder response in order, then the new response, diff and test output. A non-zero exit, output with no verdict or an invalid verdict is a plain error quoting the last five lines of stderr, and nothing is recorded. speck records the round itself, so the builder never handles the verdict. Read-only is only an instruction in the prompt: speck doesn't sandbox a command reviewer, so pick the tool's own read-only mode in the command. Check each tool's current flags; for example:

```yaml
reviewer: cursor
reviewer_options:
  cursor:
    command: "cursor-agent -p --output-format json --mode ask --model {model}"
  claude:   # Claude reviewing Claude's build also needs allow_same_model_review: true
    command: "claude -p --output-format json --permission-mode plan --model {model} --effort {effort}"
    session_id_path: session_id   # where the session id is in the output
    resume_command: "claude -p --output-format json --permission-mode plan --resume {session} --model {model} --effort {effort}"
```

**Resuming a command reviewer.** With `session_id_path` set, speck saves the session id from each round's output as `thread_id`. With `resume_command` (containing `{session}`) as well, later rounds continue that session with only the new round's prompt, as Codex does. If there's no saved id, no `resume_command`, or the resume exits non-zero, speck falls back to a fresh run with the full history and says why in one line. The review pack marks each round as a continued or fresh session.

Config rejects `builder` and `reviewer` being the same agent unless `allow_same_model_review: true` is set.

**Reviewer model and effort.** `reviewer_model` and `reviewer_effort` in `speck/config.yml` set the reviewer's model and effort level for the whole repo. `speck new` copies them into each ticket, and a value on the ticket overrides config. A blank ticket value falls back to config. If both are blank, speck sets nothing: Codex uses its own default, and a `claude-subagent` reviewer runs on the builder's model in a fresh session. Model names are free text in the reviewer's own format and aren't checked. Effort must be blank or one of `low`, `medium`, `high`, `xhigh` or `max`. Codex gets them as `-m` and `model_reasoning_effort` in every round. The review skill passes them to the subagent (`speck reviewer-settings <id>` prints them). Every saved round and the review pack show the model and effort used, or "default".

## Repo layout (in a project that uses speck)

```
AGENTS.md / CLAUDE.md        # points agents at speck's tickets and rules
speck/
  config.yml                 # agents, test command, limits, base branch
  ideas/                     # low-ceremony notes and captured conversations
  ideas/done/                # ticketed notes, filed away under the same name
  tickets/0007-<slug>.md     # numbered tickets; status lives in frontmatter, review rounds at the end
  tickets/done/0001-<slug>.md # closed tickets (done or cancelled), filed away under the same name
  .cache/                    # working files for reviews in progress (ignored by git)
.claude/skills/speck-*/      # skills for Claude Code
.agents/skills/speck-*/      # the same skills for Codex, cptr and other agents
.speck/                      # the speck command and templates
```

Every ticket opens with a header rendered from its frontmatter, such as `# 0007 · <title>` followed by `**Status:** 🔍 reviewing`, so previews that hide frontmatter still show the title and status. speck rewrites it whenever it changes the title or status, and `speck lint` warns if it's missing or stale.

Tickets are committed and often published, so you can list words you'd rather keep out of them, such as your real name or an old alias, in `~/.config/speck/private-words` in your home folder: one word per line, with blank lines and lines starting with `#` skipped. `speck lint` then reports a ✗ for each line of a ticket that contains one of them, ignoring case, so `speck set <id> status ready` refuses it. The error names the line but not the word. Without the file, lint checks nothing for it; a file it can't read gets a ! warning. The file lives outside the repo, so the list itself is never committed.

`speck/tickets/` holds only work in progress; `speck/tickets/done/` holds closed tickets, which means `done` or `cancelled`. Setting a ticket to `done` moves its file into `speck/tickets/done/` under the same name, `speck cancel <id> "<reason>"` sets it to `cancelled` with the reason and the date it was cancelled recorded in the ticket, and any other status moves it back into `speck/tickets/`. Commands take a ticket id, not a path, so they find it in either folder, and re-running `speck init` files any done ticket left behind by an older version. A move never overwrites: if the same file name is already in the other folder, speck stops and asks you to keep one.

Idea notes are filed the same way. `speck new --source=speck/ideas/<file>.md` sets the note to `ticketed (<id>)` and moves it into `speck/ideas/done/` under the same name, and the ticket's `source:` points there. Later tickets from the same idea take it from `speck/ideas/done/` (the old path still finds it), and re-running `speck init` files any ticketed note left in `speck/ideas/` and updates the tickets that point at it. So `speck/ideas/` holds only ideas still waiting to be shaped.

## Skills and commands

| Command | Does |
|---|---|
| `npx github:luroai/speck init` | Creates `speck/` and `config.yml`, installs the skills and the `speck` command into the project, and runs `speck doctor`. Re-run it to update. |
| `speck doctor` | Checks Node and git, the builder set in config (`claude`, `cursor`, `codex` or `gemini`; any other builder gets an information line), and the reviewer: a reviewer command's first word on the PATH, or Codex installed and signed in. Each problem comes with a plain-English fix. The GitHub CLI is optional. |
| `speck detect` | Prints, as one JSON object, what setup needs to know: the operating system and whether speck supports it (macOS and Linux), the Node.js version, whether git is installed, the folder's git state (repo, commits, uncommitted changes to tracked files, branch, `main` or `master`, git name and email set), whether speck is installed and its version, which of `claude`, `codex`, `cursor-agent` and `gemini` are on the PATH and whether Codex is signed in, a suggested test command and `worktree_setup` from the project's files (`null` when there's none), and `other_workflows`: each other workflow it finds (OpenSpec, GitHub Spec Kit or Kiro) with the paths that show it, and for OpenSpec its changes still in progress (an empty list when there are none). It changes nothing and works in any folder, before speck is installed too (`npx github:luroai/speck detect`). |
| `speck config set <key> <value>` | Changes one setting in `speck/config.yml`, naming nested ones with dots (`commands.test`, `limits.max_review_rounds`), and prints the old and new value. It checks the value as speck reads it first (true or false, a whole number of 1 or more, an effort, `auto_ship_risk` of low and high) and refuses an unknown key, leaving the file unchanged. Every other line and comment stays as it was, a value that needs quoting is quoted, and a setting missing from an older file is added under its section. It doesn't commit. `reviewer_options` is edited by hand. |
| `/speck-setup` | Sets speck up through a conversation, in a new or existing project. Starts from `speck detect`, explains each choice and asks before every change to the machine or to git (installing Node, `git init`, a git name and email, each commit). Records every setting with `speck config set`. Before changing anything, it names any other workflow `speck detect` found and any rule in the project's `AGENTS.md`, `CLAUDE.md` or the guides they point to that clashes with speck, and asks what to do. It never deletes, moves or edits those files. In an existing project it waits until tracked files have no uncommitted changes, confirms the base branch and the test command (running it once), and warns that shipping pushes straight to the base branch. In a new project it makes the first commit, then a draft ticket to scaffold the app with a test runner. It proposes a builder and a reviewer, preferring another model family, turns on same-model review only if the user agrees, and asks before keeping `build_command`'s skipped permission prompts. It finishes once `speck doctor` passes. It's agent-only (`user-invocable: false`), so it's hidden from the `/` menu: the README's setup prompt starts it. |
| `/speck-capture` | Turns an idea or the current conversation into `speck/ideas/` |
| `/speck-ticket` | Turns an idea into a numbered draft ticket. Runs the size checks and proposes splits, then pre-checks each criterion for more than one reading and checks the external facts it relies on. Also triages the inbox: drops covered notes and puts at most three to you to ticket or drop. |
| `speck cancel <id> "<reason>"` | Cancels a ticket you've decided against: records the reason and the date, sets it to `cancelled`, files it in `speck/tickets/done/` and removes its scratch files (`speck-<id>-*` in the temporary folder). Refuses a blank reason, a `done` ticket or an already-cancelled one. |
| `speck new "<title>" [--source=<idea>]` | Creates the next numbered draft ticket, filling in the builder and reviewer from config. With `--source`, it files the idea note in `speck/ideas/done/`. `--type=bug` or `--type=fix` marks a bug or a fix for a broken base branch (priority 0). |
| `speck lint <id>` | Checks a ticket against the size rules: ✗ for what stops it being ready, ! for warnings. |
| `speck set <id> <field> <value>` | Changes a ticket field. `status ready` runs the lint first and commits the ticket, and only that file, so `speck run` can start it. |
| `speck status [--json]` | Tickets by status, blocked first. `--json` gives everything, for programs such as the panel. |
| `speck panel [--port <n>] [--url https://<hostname>]` | The control panel in your browser, at `http://127.0.0.1:4777`, and with `--url` at that one https address too, for reaching it through a private tunnel: Plan (drafts, ideas and the inbox, with Set ready and priority), Build (the queue, with Back to Plan on a ticket waiting there to make it a draft again, live logs, stop, which builds are paused, with the `speck play <id>` that carries each on, blocked questions, an approved ticket's review pack, with a Ship button that asks first, then runs `speck ship <id>` and shows its message if it refuses, and "Shipping" with how long it has been running on a ticket being shipped from anywhere, or "Auto-ship didn't finish" with speck ship's message when a build's auto-ship ended without shipping) and Shipped (what's shipped, with times, review rounds, tokens and each ticket's review pack). Its header stays at the top of the screen as the page scrolls, slimmed to one row on a phone, and shows whether `speck run` is on, with a button that turns it on or off: on starts `speck run` in the background, writing its output to `speck/.cache/runs/run.log`, and it keeps running after the panel stops; off stops it as Ctrl+C does, leaving running builds to carry on. If `speck run` refuses to start, the panel shows its message. It can be added to a phone's home screen as an app called speck, which opens full screen. It restarts itself when its code changes. |
| `speck run` | Watches for ready tickets committed on the base branch and starts `build_command` for each in turn, highest priority first, skipping any whose `after:` tickets haven't shipped. `max_parallel_builds` sets how many it keeps going at once, 1 unless you change it (see principle 7). A build that was killed is resumed once. When a build ends, it records the builder's tokens and cost from Claude Code's `stream-json` log. |
| `speck pause <id>` / `speck play <id>` / `speck stop <id>` | Hold a build `speck run` started, with every process it started, carry it on, or end it for good and block its ticket, keeping its branch and work. Time a build spends paused, like time its ticket spends blocked, is added to the ticket's `waited_seconds` and left out of its build time in the panel. macOS and Linux only. So is the time a build that stopped before finishing leaves its ticket building or reviewing: its timer stops at the build's exit, or at when speck first noticed a killed build had gone, and the stretch until `speck run` resumes it or `speck start <id>` is run for it again is added. |
| `speck pack <id> [--plain]` | Prints the review pack. `--plain` prints a short one in plain English for someone who doesn't read code: whether the reviewer approved it, the ticket's Outcome and `## In plain words`, each acceptance criterion with its result, a closer-look warning for a high-risk ticket or a change to sensitive files, and a note when the reviewer could see only the change, not the rest of the code, in any round. |
| `speck merge-check <id>` | Reports, as JSON, what merging the base branch into the ticket's branch would conflict on, and the class of each file: `added-lines`, `lockfile`, `ticket` or `logic`. |
| `speck start <id>` | Starts a `ready` ticket: its branch in its own git worktree beside your checkout (with `worktrees: true`), `worktree_setup` run there, status `building`, committed. Prints the folder the build works in. |
| `speck test` | Runs `commands.test` in this checkout and exits with its exit code. No more than `max_parallel_tests` (default 1) test runs, full or `--files`, go at once in a repo, from any of its worktrees: a run beyond that waits, saying once what it's waiting for, and starts when one ends. The build and review skills run the tests this way, and `speck ship`'s test runs take a turn too. A full run's second try at its failing tests (below) runs in the full run's turn, and a test run speck starts while it already holds a turn runs in that turn, so it never waits for itself. A turn held by a process that has died is freed. Every test run speck starts runs at a lower priority than normal, through `nice`, when the system has `nice`, so the computer stays usable for your own programs while the tests run; without it, they run at the usual priority. A run, full or `--files`, that writes no output for `test_stall_minutes` (default 5, a whole number of 1 or more, checked even when a recorded result is reused) is ended, with every process it started, and fails, saying that the tests stalled, for how long and the last line they wrote; a run that keeps writing is never ended. A run with no uncommitted changes outside `speck/` records its result (pass or fail, a failure's output, the test command) against the commit's files outside `speck/`, in a cache every worktree shares. A later `speck test` on the same files with the same test command prints that result, saying which commit it's from and when, and exits with its exit code without running the suite. So does a run that waited for a turn when such a result was recorded while it waited: once its turn comes, it frees the turn at once and prints that result instead. `speck test --fresh` always runs it. A full run that fails with an exit code, in `speck test` or `speck ship`, runs `commands.test_files` once more with just the files of its failing tests, read from each one's `location:` in TAP output. If that run passes and every test that failed passes in it, the full run counts as passed (and is recorded as a pass): its output ends with a line `Flaky: <test>; <test>…`, and those tests are added, with the time and the branch, to `speck/.cache/flaky/flaky.log` in the main checkout, which every worktree shares. Otherwise it fails as before, its output being both runs' in turn. A failing test that also failed in the result recorded for the base branch's latest commit (the same name, in a file at the same path) is left out of that second run, and so is its file unless a test that didn't fail there failed in it too. A line names the tests left out. When that leaves nothing to run, there's no second run, and the line says the failing tests already fail on the base branch. With any test left out, the full run fails whatever the second run does, and has no `Flaky:` line. There's no second run when `commands.test_files` is blank or has no `{files}`, when a failing test has no `location:` in a file in the repo, or when the run stalled or was stopped. `speck test --files <file>…` runs only those files with `commands.test_files` (`{files}` stands for them), from the repo root, taking a turn as a full run does, without a recorded result; when that's blank, it says so in one line and runs the whole suite instead. `speck test --recorded` prints the result recorded for this checkout's code and test command, as `speck test` does when it reuses one, and exits with its exit code, without running any tests. With none recorded, it runs nothing, says so in one line and exits with code 0. A build doesn't run the whole suite before it starts: before it changes anything, it lists the tests already failing from `speck test --recorded`, writing `Failing before this build:` in the ticket's Notes with the failing tests, `none`, or `not checked` when no result is recorded, which the reviewer treats as listing no tests. After that it runs only test files: the ticket's own while it checks that they fail and fixes until they pass, and, before every review round (merge rounds included), the ticket's own test files, any existing test files it changed and the files of any test that failed in its last test run. The whole suite runs in `speck ship`, not during a build: `speck ship` always runs it, on the ticket as it would land. |
| `/speck-build <id>` | Takes a `ready` ticket: `speck start`, then in its worktree: tests from acceptance criteria, implementation, then the review loop. Before each review round it runs only the ticket's test files with `speck test --files`, saying in the round's response file which ones: the whole suite runs in `speck ship`, not during a build. Ends at `approved`, with no PR: `speck run`'s ship queue ships it when `auto_ship` covers it, and you ship the rest. When a ship the queue started hits a conflict (exit 13), `speck run` resumes the build's session, which merges the base branch in, resolves each file by its `speck merge-check` class (both sides' added lines kept, lockfiles rebuilt with the project's install command, logic changes keeping the intent of both sides), runs the ticket's test files and gets the merge a merge round before the queue ships it again, and the same when the tests fail on the ticket as it would land, merged with the base branch, while the base branch's own pass (exit 16), whether its own change broke them or the base branch's newer changes did, running the failing tests' files and the ticket's own. After two such hand-backs without shipping, it blocks the ticket instead. When the base branch's own tests fail (exit 14), it changes no code, creates one fix ticket unless an open one covers it, sets it ready unless it's already on its way, and stops, leaving its own ticket `approved`. It asks the user only when two tickets contradict each other or a merge round blocks. |
| `/speck-review <id>` | Runs the review loop on its own (for example, after a manual fix) |
| `/speck-ship <id>` | Your gate. Runs `speck ship <id>`: checks, marks the ticket done, merges into the base branch, pushes and deletes the branch. Only you start it; in Claude Code the skill can't be started by the agent. The Ship button in an approved ticket's review pack in the panel does the same: it asks first, then runs `speck ship <id>`, showing that the ticket is shipping until it finishes, and its message if it refuses. With `auto_ship` on, `speck run`'s ship queue runs `speck ship <id> --auto` for each approved ticket it covers. While one `speck ship` runs for a ticket, another for the same ticket refuses, changing nothing. A ship that merges but can't push the base branch, whoever started it, shows the ticket in the panel's Shipped list with "Merged, but not pushed" and `speck ship`'s message, and `speck status --json` gives it in the ticket's `ship`, until git sees the commit on the remote. |
| `/speck-status` | Lists tickets by status: approved (waiting for you) first, then blocked with their questions, then cancelled with their reasons |

Agents never merge or ship unless the user runs `/speck-ship` or clicks the panel's Ship button. Shipping pushes the base branch directly, so it mustn't be protected by a "require a pull request" rule.

## Releases

`main` moves with every ship, so it's whatever shipped last. Releases are tagged versions (`v0.3.0`), and the README always points at the latest release, so anyone following its setup prompt gets a fixed version rather than `main`.

A release is an ordinary ticket. It sets the version in `package.json`, adds the release's section at the top of `CHANGELOG.md` and points the README's setup prompt at the new tag. A test fails if those three don't name the same version. Once the release ticket has shipped, the maintainer creates and pushes the tag straight away, as shipping is theirs: until then, the README's prompt points at a tag that doesn't exist yet.

## Where it's heading

speck runs on your own machine today: the panel is a local page over your repo, and builds run in worktrees beside your checkout. That suits people comfortable with a local setup, and it keeps everything in the repo with no service to trust.

A hosted version, where the repo lives on GitHub, builds run in the cloud and the panel is a page you sign in to, would suit people who don't want a development setup at all. It's a bigger, deliberate step, not something to grow ticket by ticket. A hosted page that drives builds on someone's own machine is ruled out: it would be a remote-control channel into a machine where builds skip permission prompts.

Not yet:
- Windows (speck says so plainly and suggests WSL);
- Jira or GitHub Issues sync;
- pull requests as the way to ship (`speck/ideas/2026-10-08-pr-ship-mode.md`);
- dependency graphs beyond each ticket's `after:` list;
- hosted or cloud builds.

## Success measures

- ✅ speck builds itself: its features go through its own tickets, builds and reviews.
- ✅ At least 20 tickets shipped through speck, with published actuals: 104 by 11 October 2026, with a median of 12 minutes and 2 review rounds each (see the README).
- Someone other than the maintainer installs it and ships a ticket.

## Open questions

- Package name: `speck` is taken on npm and PyPI. `speck-dev` is set in `package.json` (private). It installs a `speck` command.
- PR ship mode for teams: bring back GitHub PRs as an option (`ship: pr`), with the GitHub self-approval question that comes with it (ticket 0002). Parked in `speck/ideas/2026-10-08-pr-ship-mode.md`.
- Resolved 8 October 2026: `codex exec resume` accepts `--output-schema` and keeps the session's memory. Verified end to end.
