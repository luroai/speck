---
name: speck-setup
description: Set speck up in this project through a conversation. Checks what's there with speck detect, explains each choice, asks before changing anything, and leaves speck ready to build the first ticket. Use when the user says "set up speck", "speck setup", "install speck here", or speck isn't set up yet and they want to start. The setup prompt in speck's README starts it, so it isn't typed as a command.
user-invocable: false
---

# speck setup

Take the user through setting speck up in this folder. Assume they aren't technical: explain each choice in a sentence or two, recommend one option, and wait for their answer. The CLI never asks questions. It reports facts (`speck detect`) and writes settings (`speck config set`). The decisions happen here, in the conversation.

CLI: `node .speck/scripts/speck.mjs`, run from the project folder (below: `speck`). Until speck is installed, use `npx 'github:luroai/speck#semver:*'` instead.

## Rules

- Ask before every change to the machine or to git, and wait for a yes: installing anything, `git init`, setting a git name and email, and every commit. Say what the change is and why it's needed.
- Record every setting with `speck config set <key> <value>`. Never edit `speck/config.yml` directly. It prints the old and new value, so tell the user what changed.
- Never push, merge or ship. Never approve a ticket: moving it to `ready` is the user's decision.
- Never delete, move or edit another workflow's files or the project's own rules (its `AGENTS.md`, `CLAUDE.md` and the guides they point to), apart from the speck section `speck init` adds. Point out what clashes and let the user change it.
- Leave the user's own files alone, apart from what `speck init` adds. It keeps an existing `CLAUDE.md` and `AGENTS.md` and adds a short speck section to `AGENTS.md`, or brings its `## speck` section up to date.
- If a command fails, show the user the important part of its message in plain words, and say what you'll try next or what they need to do.

## 1. Start from the facts

Run `speck detect` (`npx 'github:luroai/speck#semver:*' detect` if speck isn't installed yet). It prints one JSON object and changes nothing. Use its answers for every step below rather than guessing, and run it again after any change.

- **Operating system** (`os.supported`): speck supports macOS and Linux. On anything else, explain that and stop.
- **Node** (`node.supported`): speck needs Node.js 20 or newer. If `speck detect` can't start because `node` or `npx` isn't found, or `node.supported` is false, explain that speck's commands run on Node. Ask before installing Node, then install the current LTS the usual way for their system (Homebrew on macOS if they have it, otherwise the installer from https://nodejs.org; their package manager or the Node.js website on Linux). They may need a new terminal afterwards.
- **git** (`git.installed`): speck keeps everything in git. If it's missing, ask before installing it (`xcode-select --install` on macOS, the package manager on Linux).

### Other workflows and the project's rules

Do this before changing anything in the project. Never delete, move or edit the other workflow's files or the project's own rules: say what you found and let the user decide.

**Another workflow.** If `other_workflows` isn't empty, name each one and the paths that show it. Explain that running two workflows gives agents conflicting instructions: one tells them to work from its own specs and changes, speck tells them to work only from speck's tickets. Recommend using speck for new work, with the other workflow's files left where they are, so nothing is lost. Ask the user to choose between that, keeping both (agents may follow either, so builds can go astray), or stopping setup here, and wait for their answer. If they choose to stop, change nothing and stop.

If they choose speck, name any work still in progress in the other workflow: for OpenSpec, each folder in `in_progress` (every folder under `openspec/changes/` other than `archive`). For the others, ask the user whether any of their work is unfinished. Recommend finishing it in the other workflow, or turning it into speck tickets with `/speck-ticket`, before building with speck.

**Rules that clash with speck.** Read the project's `AGENTS.md` and `CLAUDE.md`, if they exist, and any guide they point to (a linked file or an `@` import in the project). Look for rules that would clash with speck as it's being set up, for example:

- a ban on git worktrees: `worktrees` is on by default, so each build would happen in its own worktree and break the rule. They could change the rule, or turn `worktrees` off.
- a requirement that changes go through pull requests: with `ship_mode: local`, the default, shipping merges and pushes straight to the base branch, with no pull request, so every ship would break the rule. Pull request mode settles it: explain it and offer to turn it on, as section 3, step 3 describes.
- a requirement for a particular reviewer: every review is done by the reviewer in `speck/config.yml`, so a different one would break the rule. If the required reviewer is one speck can run, they could set it as the reviewer (section 5); otherwise they could change the rule.
- limits on unattended agents: `speck run` builds without anyone watching, and `auto_ship` ships as soon as the reviewer approves. They could change the rule, or keep `auto_ship` off (section 7) and leave `build_command` blank (section 6).

For each clash, quote the rule, say what would happen and what the user could change: the rule itself (theirs to edit), or a speck setting. Change a speck setting only after the user agrees, with `speck config set`, once speck is installed. If nothing clashes, say so in one line.

Then decide which kind of project this is and tell the user:

- **Existing project:** the folder is a git repo with commits (`repo.has_commits`), or it has code in it already. Follow section 3.
- **New project:** an empty or nearly empty folder with no commits. Follow section 4.

If `speck.installed` is true, speck is already here. Say which version, and carry on: the steps below check and keep what's there.

## 2. Two steps both kinds of project use

**Git name and email.** Commits need them. If `repo.git_name_set` or `repo.git_email_set` is false, explain why git wants them and ask before setting a git name and email. Ask for the name and email to use, and whether to set them for every project on this machine (`git config --global user.name "…"`, recommended) or only this one (without `--global`).

**Install speck.** If `speck.installed` is false, explain that this adds the `speck/` folder (settings, ideas and tickets), the speck skills and the `speck` command to the project, and run `npx 'github:luroai/speck#semver:*' init`. It also runs `speck doctor`: don't fix its ✗ items yet, as sections 5 and 8 deal with them.

## 3. An existing project

1. **Uncommitted changes.** If `repo.uncommitted_changes` is true, tracked files have changes that aren't committed. Stop here: speck builds on branches and ships with git, so it needs a clean starting point. Tell the user, list the changed files (`git status --short`) and explain the options: commit them, stash them, or discard them. Don't commit, stash or discard them yourself. When they say they've dealt with them, run `speck detect` again, and only carry on once `repo.uncommitted_changes` is false. If the folder isn't a git repo yet, there's nothing to check: ask before running `git init`, which makes it one.
2. **Git name and email**, then **install speck** (section 2).
   If `repo.has_commits` is false, speck needs a first commit to branch from. Check that a `.gitignore` keeps out files that shouldn't be committed, such as `.env` files with passwords or keys, and dependency folders like `node_modules/`. Ask before making a commit of their code, with the message `Set up speck`.
3. **Base branch.** speck builds each ticket on its own branch and ships it into the base branch. Work out the likely one: `main` if `repo.main_exists`, `master` if `repo.master_exists` and not `main`, otherwise `repo.branch`. If both `main` and `master` exist, or `repo.branch` is null, ask which. Confirm the base branch with the user, then run `speck config set base_branch <name>`. Tell them that with `ship_mode: local`, the default, shipping pushes straight to that branch, without a pull request, so a branch that requires pull requests (a protection rule on GitHub, for example) will refuse it.

   **Pull request mode.** If their base branch requires pull requests, a rule in the project says changes go through them, or the user says their team works through pull requests, don't warn that speck can't work there: explain pull request mode instead. Once the reviewer approves a ticket, speck pushes its branch to GitHub and opens a pull request into the base branch, with the ticket's review pack as its description. Shipping it, with `/speck-ship`, the panel's Ship button or, when `auto_ship` covers it, `speck run`'s ship queue, merges that pull request on GitHub once nothing there is in the way, such as a failing check or a review it still needs, and speck never pushes straight to the base branch. It needs `gh`, GitHub's command line tool, installed and signed in (`gh auth login`), and the base branch needs a remote on GitHub. Offer to turn it on with `speck config set ship_mode pr`, and run it only if they agree. If `gh` isn't installed or signed in, say so and offer to help set it up, asking before installing anything. Otherwise, the choice of `ship_mode` comes in section 7.
4. **Test command.** speck runs the tests before every review and refuses to ship until they pass. If `suggestions.test_command` has a command, explain where it came from and ask whether it's the right one. If it's null, ask the user how they run their tests, or whether they have none yet. Run it once to confirm, and show the result:
   - If it passes, run `speck config set commands.test "<command>"`.
   - If it fails, show the end of the output. Ask whether to set it anyway (speck won't ship until it passes) or try another command.
   - If they have no tests, don't leave it blank: recommend `node --test`. Explain in plain words that with `commands.test` blank nothing can ship, because speck refuses to ship until the tests pass, and that `node --test` passes while there are no tests and runs the tests later tickets add. Changes to documents are checked by the reviewer, who reads them, instead of by tests. Run it once to confirm: if it passes, run `speck config set commands.test "node --test"`. If it fails, the folder has test files it can't run, such as ones written for another test runner: show the end of the output and ask how they run those tests instead.
   - If they still want it blank, leave it blank and offer a draft ticket to add a test runner. If they want one, make it after sections 5 and 6, as in section 4, step 5, so it records the agents they choose.
5. **Worktree setup.** If `suggestions.worktree_setup` has a command, explain that each build happens in a fresh copy of the project, which needs its dependencies installed first. Ask, then run `speck config set worktree_setup "<command>"`.
6. Continue with section 5.

## 4. A new project

1. **Make it a git repo.** If `repo.is_repo` is false, explain that git keeps the history of every change and lets speck build on branches. Ask before running `git init -b main`, which makes `main` the base branch. If it's already a repo, confirm the base branch with the user as in section 3, step 3, and give the same warning about pull requests. Don't record it yet: that needs speck installed.
2. **Git name and email**, then **install speck** (section 2). If the base branch isn't `main`, now run `speck config set base_branch <name>`. Offer a `.gitignore` for files that shouldn't be committed, such as `node_modules/` and `.env`.
3. **The first commit.** Explain that speck needs one commit to branch from. Ask before making a commit, then commit everything with the message `Set up speck`.
4. **The agents.** Follow sections 5 and 6 now, then come back here. A ticket records the builder and reviewer set when it's made, so they're chosen first.
5. **The first ticket.** A new project has no tests, and speck can't ship anything until a test command is set and passes. So the first ticket sets up the app with a test runner. Run `speck new "Scaffold the app with a test runner"` and fill it in as `/speck-ticket` describes. Ask the user what they want to build, and if they have no preference, recommend a common language and test runner for it. Its acceptance criteria include that the tests pass and that `commands.test` is set to the command that runs them (with `speck config set`). Leave it `draft`: the user reads it and approves it. Ask before making a commit of the ticket (`speck: first ticket`), because a build can only start from a committed ticket.
6. Continue with section 7.

## 5. Builder and reviewer

The builder writes the code; the reviewer is a second agent that checks it and must approve it before it can ship. A reviewer from another model family catches more, because it doesn't share the builder's blind spots.

Run `speck agents --json` (`npx 'github:luroai/speck#semver:*' agents --json` if speck isn't installed yet). For each of Claude Code (`claude`), Codex (`codex`) and Cursor (`cursor`) it says whether it's `installed` and `signed_in`, with `why` when it isn't ready, and lists its `models`. Tell the user in a sentence which agents are ready to use, and how to get any other they want ready (the `why` says what to run). Only offer an agent that's installed and signed in, and run `speck agents` again after they install one or sign in. Gemini isn't listed there: look at `agents.gemini` in `speck detect` for it.

- **Builder:** offer each agent that's installed and signed in, and recommend Claude Code (`claude`), which is the one most tested. Set the one they pick with `speck config set builder <name>` (`claude`, `codex` or `cursor`), as the panel's Settings view does: it sets `build_command` to that builder's own in the same change, Claude Code's default for `claude`, or blank for `codex` and `cursor`, which `speck run` then starts with its own command. If `build_command` was set by hand, it changes nothing and says what it would replace: ask the user, and run it again with `--replace` only if they agree. If the reviewer is from the builder's family, it says so and names a reviewer from another family: choose the reviewer next, as below. Gemini, if it's on the PATH, is set with `speck config set builder gemini`, which leaves `build_command` for section 6.
- **Reviewer:** prefer one from another model family than the builder's. Claude Code runs Anthropic's models, Codex OpenAI's and Gemini Google's. Cursor can run several, so its family depends on the model it uses.
  - With a Claude, Cursor or Gemini builder, propose Codex: run `speck config set reviewer codex`. If Codex isn't `installed`, offer to install it (`npm install -g @openai/codex`, asking first). If it isn't `signed_in`, ask them to run `codex login` and follow the prompts, then run `speck agents` again.
  - With a Codex builder, Codex would be the same family: propose Claude Code instead, which speck runs itself: `speck config set reviewer claude`. Offer it only if Claude Code is `installed` and `signed_in`; if it isn't, the `why` says what to run.
  - With a Cursor or Gemini builder, Claude Code is another option too (`speck config set reviewer claude`), if they'd rather not use Codex.
  - Cursor needs no command either: `speck config set reviewer cursor`, which speck runs itself, read-only. Offer it only if Cursor is `installed` and `signed_in`. With a Cursor builder it counts as the same family unless `builder_model` and `reviewer_model` are both set and differ.
  - A Gemini reviewer needs a reviewer command added to `reviewer_options` by hand (see "Using another reviewer" in speck's README). If they want that, point them to it rather than editing the file.
  - If only Claude is available, or they'd rather not add another agent, explain same-model review: a fresh session of the builder's own agent reviews the work, which is independent of the build but shares its model's blind spots, so it may miss more. Turn it on only if the user agrees: with a Claude builder, `speck config set reviewer claude-subagent` and `speck config set allow_same_model_review true`; with a Codex builder, `speck config set reviewer codex` and `speck config set allow_same_model_review true`. If they don't agree, they need a reviewer from another family: go back to the options above.
  - Never pair a builder and reviewer from the same family without that agreement.
- Leave `reviewer_model` and `reviewer_effort` blank, which uses each agent's own default, unless the user asks for a particular one. If they'd like to pick a model, offer the chosen agent's `models` from `speck agents`, each by its display name and description where it has them, and set the one they pick by its `name`: `speck config set reviewer_model <name>` (a `claude` or `claude-subagent` reviewer takes Claude Code's models), or `speck config set builder_model <name>` for the builder's, which only Claude Code builds use for now. A model list that couldn't be read is empty, with why in `models_why`: say why, and offer to type the model's name instead.
- **The Foreman agent.** With `foreman_fixing: fix`, `speck run` starts an agent to look into work that stops for a reason speck has no steps for. Explain that, then offer the agents for it, `claude`, `codex` or `cursor`, each only if it's installed and signed in, and set the one they pick with `speck config set foreman <name>`. Blank, the default, uses the builder when that's Codex or Cursor and Claude Code otherwise. Leave `foreman_model` and `foreman_effort` blank, which uses the agent's own defaults, unless the user asks for a particular one: then offer that agent's `models` from `speck agents` as for the reviewer, and set them with `speck config set foreman_model <name>` and `speck config set foreman_effort <effort>`.

## 6. Builds that `speck run` starts

`speck run` starts a build for each ready ticket without anyone watching, using `build_command`. Its default starts Claude Code.

If the builder is Codex (`codex`), `build_command` is blank, as setting the builder left it: `speck run` then starts each build with Codex itself, as `codex exec --json --dangerously-bypass-approvals-and-sandbox '$speck-build <id>'`, passing `builder_model` as `-m` when it's set, and resumes a build's own session with `codex exec resume`. Explain that `--dangerously-bypass-approvals-and-sandbox` lets those builds run any command on this machine without asking, and that builds started with `$speck-build <id>` in an open Codex session still ask as usual. If they'd rather not, ask for their own command and set it as below. Then skip the rest of this section.

If the builder is Cursor (`cursor`), `build_command` is blank, as setting the builder left it: `speck run` then makes a chat for each build with `agent create-chat` and starts it there as `agent -p --force --trust --output-format stream-json --resume <session> '/speck-build <id>'`, passing `builder_model` as `--model` (`auto` when it's blank), and resumes that chat after a hand-back or a stop. Explain that `--force` lets those builds run any command on this machine without asking, and that builds started with `/speck-build <id>` in an open Cursor session still ask as usual. If they'd rather not, ask for their own command and set it as below. Then skip the rest of this section.

If the builder is any other than Claude Code (`gemini`, or `codex` or `cursor` with a command of their own), the default can't stay: explain that `build_command` must start that builder without anyone watching, running `/speck-build {id}` with no prompts to answer, where speck puts the ticket's id in place of `{id}`. speck doesn't know the right command for each agent, as their options change between versions. Ask them for the command, and set it with `speck config set build_command '<their command>'`, or offer to leave it blank with `speck config set build_command ""`, so that `speck run` refuses to start builds and they build each ticket with `/speck-build <id>` in an open agent session instead. Never leave Claude Code's default in place: `speck run` refuses to start and `speck doctor` reports it while `build_command` starts `claude` with another builder. Then skip the rest of this section.

With Claude Code as the builder, the default passes `--dangerously-skip-permissions`, so those builds skip all permission prompts: the agent can run any command on this machine without asking. Explain that, and that builds started with `/speck-build <id>` in an open agent session still ask as usual. Ask whether to keep it.

- If yes, leave `build_command` as it is.
- If no, run `speck config set build_command ""`. `speck run` then refuses to start builds, and they build each ticket with `/speck-build <id>` instead.

Then, in a new project, go back to section 4, step 5 for the first ticket. In an existing project that wanted a ticket to add a test runner, make it the same way. Otherwise continue with section 7.

## 7. How much ships, runs and fits in a ticket

`speck init` writes speck's general defaults for the settings below, which nobody chose for this project. Go through them now, so the user knows what each one does and picks its value. Run `speck config show`. It prints each setting of the panel's Settings view by group, with its value now, whether that's speck's default and what it does. Use its explanation for each setting rather than your own words, so setup and the panel say the same thing.

Go through these settings, one at a time and in this order:

- `ship_mode` (whether shipping merges locally or through a pull request on GitHub)
- `auto_ship` and `auto_ship_risk` (how much ships without the user)
- `max_parallel_builds` and `max_parallel_tests` (how much runs at once)
- `limits.max_acceptance_criteria`, `limits.max_changed_lines` and `limits.max_review_rounds` (how big a ticket can be)

For each one:

1. Give its explanation from `speck config show` and its value now.
2. Recommend a value for this project and say why in a sentence. For example: `ship_mode` at `local` for someone working alone, as there's nobody else to open a pull request for, and `pr` when their team works through pull requests; keep `auto_ship` off until they've shipped a few tickets themselves; one or two builds at once on a laptop; `max_parallel_tests` at 1 unless the tests are known to run side by side safely; a bigger `limits.max_changed_lines` for a project whose changes usually touch many files.
3. Wait for their answer before the next setting.
4. If they pick a different value, run `speck config set <key> <value>` and tell them the old and new value it prints. If they keep it as it is, don't run anything: the file stays as it was.

**Pull request mode.** Ask whether to use pull request mode with `ship_mode`, on its own. If it was chosen in section 3, step 3, say so and move on. Before asking, explain it as section 3, step 3 does. Recommend `local` for someone working alone, and `pr` when they work with a team through pull requests or their base branch requires them. Set `pr` only if the user says yes and `gh` is installed and signed in.

**Shipping without the user.** Ask about `auto_ship` and `auto_ship_risk` each on its own, never together with other settings or as part of a "keep the defaults" answer. Before asking, say plainly that a ticket `auto_ship` covers is merged and pushed to the base branch as soon as the reviewer approves it, without waiting for them, and that adding `high` to `auto_ship_risk` lets risky changes (such as auth, payments, data deletion or secrets) ship that way too. Turn `auto_ship` on, or add `high` to `auto_ship_risk`, only if the user says yes to that setting after hearing this. Recommend keeping `high` out of `auto_ship_risk`. If `auto_ship` is off and stays off, say that `auto_ship_risk` then has no effect, and ask whether to leave it as it is.

**When speck was already set up.** If `speck.installed` was true when setup started, these settings may have been chosen before. Show all eight with their values from `speck config show` in one list, and ask which, if any, the user wants to change. Go through only those, as above, and leave the rest as they are. The rule on shipping without the user still holds for `auto_ship` and `auto_ship_risk`.

Then continue with section 8.

## 8. Finish

1. Ask before making a commit of the setup changes (`speck/config.yml` and anything else setup changed, staged by name), with the message `speck: set up`.
2. Run `speck doctor`. For each ✗, explain it and fix it with the user, asking before every change as above, then run it again. Setup is finished once `speck doctor` passes.
3. Tell the user what was set up, in a few lines, and what to do next:
   - **New project:** read the first ticket. When it's right, approve it with `speck set <id> status ready`, then type `/speck-build <id>`. Set a ticket ready only when the user's latest message tells you to set that ticket ready: nothing else counts, not choosing an option, approving wording, answering a question or agreeing to a plan.
   - **Existing project:** type `/speck-capture` to save a first idea, then `/speck-ticket` to turn it into a ticket.
