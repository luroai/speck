# speck — product brief

Status: 0.2.0, a public preview · 10 October 2026

## Thesis

**You own two decisions: what gets built and what gets shipped. Everything in between is automated.**

PMs have practised spec-driven development for years. It's called a PRD, and it reaches engineers as a ticket. speck applies the same workflow to AI coding agents. You write, or approve, a small ticket. One agent builds it. A second, independent agent reviews it until it's good enough. Then you ship it.

OpenSpec showed the value of keeping specs in the repo. speck keeps that idea but swaps the ceremony for small tickets and an adversarial review loop. There is no separate spec to keep up to date: the code, the tickets and the tests are the record of what the product does.

## Who it's for

- **Primary:** PMs and non-technical founders who can write a good ticket but can't review code line by line, and who want to ship personal or small-team projects quickly without giving up quality.
- **Secondary:** engineers who want a lightweight, auditable loop of ticket, agent build, independent review and merge.
- **Not for:** large multi-team specification, or work that needs design documents spanning many changes. Use OpenSpec or similar for that.

## Principles

1. **The repo is the source of truth.** Ideas, tickets and review transcripts are Markdown files in the repo, beside the code they describe. Any tool, including the future board, reads and writes these files and nothing else.
2. **Small tickets only.** A ticket is one agent, one sitting, one branch. If a ticket is too big for that, it gets split. It never gets stretched.
3. **Review is adversarial and independent by default.** The builder never reviews its own work. A separate reviewer, preferably a different model, must approve it.
4. **Humans hold two gates.** Gate 1 is moving a ticket to `ready`. Gate 2 is shipping it with `/speck-ship`, which merges it. Agents never merge or ship unless the user runs `/speck-ship`. The one exception is auto-ship: if you set `auto_ship: true` in `speck/config.yml`, the build ships a ticket as soon as the reviewer approves it, for the risks listed in `auto_ship_risk`. It's off by default.
5. **Evidence over trust.** Every approved ticket has a review pack (`speck pack <id>`) that a non-coder can judge: each acceptance criterion with its result, a plain-English change summary, and flagged risks.
6. **Measure actuals.** Every ticket records attempts, review rounds, time and cost. That data is the product's proof.
7. **One build at a time.** speck runs one build at a time (WIP 1), each in its own worktree, so you keep shaping ideas and tickets on the base branch while builds and ships are handled. You can create tickets, set them ready and walk away. Each build ships its own ticket: there is no separate shipping agent. Why:
   - **Your attention is the bottleneck.** speck's value is its gates, and what limits it is your attention, not agent time.
   - **It keeps things simple.** Each build starts from the latest base branch, so order, `after:` dependencies, conflicts and a broken base branch stay simple.
   - **It fits speck's users.** They shape product rather than debug races.
   - **Isolation isn't parallelism.** speck keeps worktrees for isolation, so a build never touches your checkout. Running builds side by side is a different thing.
   - **The cost is throughput.** Tickets are built and shipped one after another.
   - **Parallel builds would come back only as a deliberately designed feature,** not as machinery added ticket by ticket.

## The workflow

```
idea / conversation
  → /speck-capture        → speck/ideas/<date>-<slug>.md
  → /speck-ticket         → speck/tickets/0007-<slug>.md   (status: draft)
  → decide against it     → speck cancel 0007 "<reason>"    (status: cancelled,
                            filed in speck/tickets/done/)
  → you edit and approve  → status: ready                  [GATE 1]
  → /speck-build 0007     → speck start: branch speck/0007-<slug> in its own worktree
       tests from acceptance criteria → implementation → tests pass
       → builder self-check (edge cases, error paths, claims, scope)
       → review loop with reviewer subagent (see below)
       → approved?  yes → logs filled in, status: approved (waits on its branch, no PR),
                          or shipped straight away if auto_ship allows it
                    no, after max rounds → status: blocked + question for you
  → you read `speck pack 0007`
  → /speck-ship 0007      → checks, final test run, ticket set to done and   [GATE 2]
                            filed in speck/tickets/done/, merge into main,
                            push, branch deleted locally and on the remote
```

`speck ship` sets the ticket to `done` on the ticket branch just before merging. Until you ship, `main` is unchanged. `speck ship` refuses, changing nothing, unless the ticket is `approved`, the review loop says `ship`, the working tree is clean, no commit after the reviewer's approval touched files outside `speck/`, and `commands.test` is set and passes (taking a turn, as `speck test` does). Ship reuses a recorded passing result for the same code, as `speck test` does, but never a recorded failure. A merge conflict is aborted and leaves everything as it was. If the ticket branch is checked out in another git worktree, ship does the branch steps there and the merge where the base branch is checked out, then removes the ticket's worktree.

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

**Reviewer adapters (v0.1)**

| Adapter | How it runs | Notes |
|---|---|---|
| `codex` (default when the builder is Claude) | `codex exec --sandbox read-only --output-schema …`, then `codex exec resume <session>` for later rounds | Cross-model by default |
| `claude-subagent` | A fresh-context Claude Code subagent using the review skill | Fallback; same model family, so config must allow it explicitly |
| Any name with a `command` | `speck review` runs the command from `reviewer_options.<name>.command` in `speck/config.yml`, with the prompt on stdin, and reads the verdict from its output | For any agent with a non-interactive mode (Cursor, Claude Code, Gemini…). Later rounds resume the reviewer's session if `session_id_path` and `resume_command` are set, and otherwise resend the full history |

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

`speck/tickets/` holds only work in progress; `speck/tickets/done/` holds closed tickets, which means `done` or `cancelled`. Setting a ticket to `done` moves its file into `speck/tickets/done/` under the same name, `speck cancel <id> "<reason>"` sets it to `cancelled` with the reason and the date it was cancelled recorded in the ticket, and any other status moves it back into `speck/tickets/`. Commands take a ticket id, not a path, so they find it in either folder, and re-running `speck init` files any done ticket left behind by an older version. A move never overwrites: if the same file name is already in the other folder, speck stops and asks you to keep one.

Idea notes are filed the same way. `speck new --source=speck/ideas/<file>.md` sets the note to `ticketed (<id>)` and moves it into `speck/ideas/done/` under the same name, and the ticket's `source:` points there. Later tickets from the same idea take it from `speck/ideas/done/` (the old path still finds it), and re-running `speck init` files any ticketed note left in `speck/ideas/` and updates the tickets that point at it. So `speck/ideas/` holds only ideas still waiting to be shaped.

## Skills and commands (v0.1)

| Command | Does |
|---|---|
| `npx github:luroai/speck init` | Creates `speck/` and `config.yml`, installs the skills and the `speck` command into the project, and runs `speck doctor`. Re-run it to update. |
| `speck doctor` | Checks Node and git, the builder set in config (`claude`, `cursor`, `codex` or `gemini`; any other builder gets an information line), and the reviewer: a reviewer command's first word on the PATH, or Codex installed and signed in. Each problem comes with a plain-English fix. The GitHub CLI is optional. |
| `speck detect` | Prints, as one JSON object, what setup needs to know: the operating system and whether speck supports it (macOS and Linux), the Node.js version, whether git is installed, the folder's git state (repo, commits, uncommitted changes to tracked files, branch, `main` or `master`, git name and email set), whether speck is installed and its version, which of `claude`, `codex`, `cursor-agent` and `gemini` are on the PATH and whether Codex is signed in, and a suggested test command and `worktree_setup` from the project's files (`null` when there's none). It changes nothing and works in any folder, before speck is installed too (`npx github:luroai/speck detect`). |
| `speck config set <key> <value>` | Changes one setting in `speck/config.yml`, naming nested ones with dots (`commands.test`, `limits.max_review_rounds`), and prints the old and new value. It checks the value as speck reads it first (true or false, a whole number of 1 or more, an effort, `auto_ship_risk` of low and high) and refuses an unknown key, leaving the file unchanged. Every other line and comment stays as it was, a value that needs quoting is quoted, and a setting missing from an older file is added under its section. It doesn't commit. `reviewer_options` is edited by hand. |
| `/speck-setup` | Sets speck up through a conversation, in a new or existing project. Starts from `speck detect`, explains each choice and asks before every change to the machine or to git (installing Node, `git init`, a git name and email, each commit). Records every setting with `speck config set`. In an existing project it waits until tracked files have no uncommitted changes, confirms the base branch and the test command (running it once), and warns that shipping pushes straight to the base branch. In a new project it makes the first commit, then a draft ticket to scaffold the app with a test runner. It proposes a builder and a reviewer, preferring another model family, turns on same-model review only if the user agrees, and asks before keeping `build_command`'s skipped permission prompts. It finishes once `speck doctor` passes. It's agent-only (`user-invocable: false`), so it's hidden from the `/` menu: the README's setup prompt starts it. |
| `/speck-capture` | Turns an idea or the current conversation into `speck/ideas/` |
| `/speck-ticket` | Turns an idea into a numbered draft ticket. Runs the size checks and proposes splits, then pre-checks each criterion for more than one reading and checks the external facts it relies on. Also triages the inbox: drops covered notes and puts at most three to you to ticket or drop. |
| `speck cancel <id> "<reason>"` | Cancels a ticket you've decided against: records the reason and the date, sets it to `cancelled` and files it in `speck/tickets/done/`. Refuses a blank reason, a `done` ticket or an already-cancelled one. |
| `speck start <id>` | Starts a `ready` ticket: its branch in its own git worktree beside your checkout (with `worktrees: true`), `worktree_setup` run there, status `building`, committed. Prints the folder the build works in. |
| `speck test` | Runs `commands.test` in this checkout and exits with its exit code. No more than `max_parallel_tests` (default 1) full test runs go at once in a repo, from any of its worktrees: a run beyond that waits, saying once what it's waiting for, and starts when one ends. The build and review skills run the tests this way, and `speck ship`'s test runs take a turn too. A turn held by a process that has died is freed. A run with no uncommitted changes outside `speck/` records its result (pass or fail, a failure's output, the test command) against the commit's files outside `speck/`, in a cache every worktree shares. A later `speck test` on the same files with the same test command prints that result, saying which commit it's from and when, and exits with its exit code without running the suite. `speck test --fresh` always runs it. `speck test --files <file>…` runs only those files with `commands.test_files` (`{files}` stands for them), from the repo root, without a turn or a recorded result; when that's blank, it says so in one line and runs the whole suite instead. The build skill runs only the ticket's own test files while it checks that they fail and fixes until they pass, and the whole suite before it changes anything, once its own tests pass, before every review round and after merging the base branch in. `speck ship` always runs the whole suite. |
| `/speck-build <id>` | Takes a `ready` ticket: `speck start`, then in its worktree: tests from acceptance criteria, implementation, then the review loop. Ends at `approved`, with no PR. |
| `/speck-review <id>` | Runs the review loop on its own (for example, after a manual fix) |
| `/speck-ship <id>` | Your gate. Runs `speck ship <id>`: checks, marks the ticket done, merges into the base branch, pushes and deletes the branch. Only you start it; in Claude Code the skill can't be started by the agent. With `auto_ship` on, the build runs `speck ship <id> --auto` itself after approval. |
| `speck-integrate` | A procedure for an approved ticket whose `speck ship` couldn't go through, written for a ship queue that speck no longer plans: each build ships its own ticket. On a conflict (exit 13) it merges the base branch in, resolves each file by its `speck merge-check` class (both sides' added lines kept, lockfiles rebuilt with the project's install command, logic changes keeping the intent of both sides), runs the tests and gets the merge a merge round before shipping again. When the base branch's own tests fail (exit 14) it changes no code, creates one fix ticket unless an open one covers it, and sets it ready only when `auto_fix_main` is on. It asks the user only when two tickets contradict each other or a merge round blocks. It's agent-only (`user-invocable: false`), and with no ship queue, nothing starts it yet. |
| `/speck-status` | Lists tickets by status: approved (waiting for you) first, then blocked with their questions, then cancelled with their reasons |

Agents never merge or ship unless the user runs `/speck-ship`. Shipping pushes the base branch directly, so it mustn't be protected by a "require a pull request" rule.

## Two projects

1. **speck (this repo):** the file format, the skills, the review loop and the CLI. It's useful entirely on its own.
2. **speck board (later):** a local kanban app over `speck/`. Columns map to ticket status, and moving a card to Ready for Dev is Gate 1 and starts `/speck-build`. It reads and writes the same files, and shipping stays with `/speck-ship`. Captured as an idea in `speck/ideas/`.

## v0.1 scope

In scope:
- the ticket, idea and config formats;
- the capture, ticket, build, review, ship and status skills for Claude Code as builder;
- the `codex` and `claude-subagent` reviewer adapters;
- `speck init`;
- a README with one real worked example and its actuals.

Out of scope for v0.1:
- dependency graphs;
- Jira or GitHub Issues sync;
- the board;
- builders other than Claude Code;
- hosted or remote runs (GitHub Actions comes later).

## Success measures

- speck builds itself: from ticket 0002 onwards, every change goes through speck.
- At least 20 tickets shipped through speck, with published actuals (median time, cost, review rounds, share blocked).
- Someone other than the maintainer installs it and ships a ticket.

## Open questions

- Licence: MIT is set in the manifests as a placeholder. Confirm before publishing.
- Package name: `speck` is taken on npm and PyPI. `speck-dev` is set in `package.json` (private). It installs a `speck` command.
- PR ship mode for teams: bring back GitHub PRs as an option (`ship: pr`), with the GitHub self-approval question that comes with it (ticket 0002). Parked in `speck/ideas/2026-10-08-pr-ship-mode.md`.
- Resolved 8 October 2026: `codex exec resume` accepts `--output-schema` and keeps the session's memory. Verified end to end.
