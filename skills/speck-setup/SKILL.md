---
name: speck-setup
description: Set speck up in this project through a conversation. Checks what's there with speck detect, explains each choice, asks before changing anything, and leaves speck ready to build the first ticket. Use when the user says "set up speck", "speck setup", "install speck here", or speck isn't set up yet and they want to start. The setup prompt in speck's README starts it, so it isn't typed as a command.
user-invocable: false
---

# speck setup

Take the user through setting speck up in this folder. Assume they aren't technical: explain each choice in a sentence or two, recommend one option, and wait for their answer. The CLI never asks questions. It reports facts (`speck detect`) and writes settings (`speck config set`). The decisions happen here, in the conversation.

CLI: `node .speck/scripts/speck.mjs`, run from the project folder (below: `speck`). Until speck is installed, use `npx github:luroai/speck` instead.

## Rules

- Ask before every change to the machine or to git, and wait for a yes: installing anything, `git init`, setting a git name and email, and every commit. Say what the change is and why it's needed.
- Record every setting with `speck config set <key> <value>`. Never edit `speck/config.yml` directly. It prints the old and new value, so tell the user what changed.
- Never push, merge or ship. Never approve a ticket: moving it to `ready` is the user's decision.
- Leave the user's own files alone, apart from what `speck init` adds. It keeps an existing `CLAUDE.md` and `AGENTS.md` and adds a short speck section to `AGENTS.md`, or brings its `## speck` section up to date.
- If a command fails, show the user the important part of its message in plain words, and say what you'll try next or what they need to do.

## 1. Start from the facts

Run `speck detect` (`npx github:luroai/speck detect` if speck isn't installed yet). It prints one JSON object and changes nothing. Use its answers for every step below rather than guessing, and run it again after any change.

- **Operating system** (`os.supported`): speck supports macOS and Linux. On anything else, explain that and stop.
- **Node** (`node.supported`): speck needs Node.js 20 or newer. If `speck detect` can't start because `node` or `npx` isn't found, or `node.supported` is false, explain that speck's commands run on Node. Ask before installing Node, then install the current LTS the usual way for their system (Homebrew on macOS if they have it, otherwise the installer from https://nodejs.org; their package manager or the Node.js website on Linux). They may need a new terminal afterwards.
- **git** (`git.installed`): speck keeps everything in git. If it's missing, ask before installing it (`xcode-select --install` on macOS, the package manager on Linux).

Then decide which kind of project this is and tell the user:

- **Existing project:** the folder is a git repo with commits (`repo.has_commits`), or it has code in it already. Follow section 3.
- **New project:** an empty or nearly empty folder with no commits. Follow section 4.

If `speck.installed` is true, speck is already here. Say which version, and carry on: the steps below check and keep what's there.

## 2. Two steps both kinds of project use

**Git name and email.** Commits need them. If `repo.git_name_set` or `repo.git_email_set` is false, explain why git wants them and ask before setting a git name and email. Ask for the name and email to use, and whether to set them for every project on this machine (`git config --global user.name "…"`, recommended) or only this one (without `--global`).

**Install speck.** If `speck.installed` is false, explain that this adds the `speck/` folder (settings, ideas and tickets), the speck skills and the `speck` command to the project, and run `npx github:luroai/speck init`. It also runs `speck doctor`: don't fix its ✗ items yet, as sections 5 and 7 deal with them.

## 3. An existing project

1. **Uncommitted changes.** If `repo.uncommitted_changes` is true, tracked files have changes that aren't committed. Stop here: speck builds on branches and ships with git, so it needs a clean starting point. Tell the user, list the changed files (`git status --short`) and explain the options: commit them, stash them, or discard them. Don't commit, stash or discard them yourself. When they say they've dealt with them, run `speck detect` again, and only carry on once `repo.uncommitted_changes` is false. If the folder isn't a git repo yet, there's nothing to check: ask before running `git init`, which makes it one.
2. **Git name and email**, then **install speck** (section 2).
   If `repo.has_commits` is false, speck needs a first commit to branch from. Check that a `.gitignore` keeps out files that shouldn't be committed, such as `.env` files with passwords or keys, and dependency folders like `node_modules/`. Ask before making a commit of their code, with the message `Set up speck`.
3. **Base branch.** speck builds each ticket on its own branch and ships it into the base branch. Work out the likely one: `main` if `repo.main_exists`, `master` if `repo.master_exists` and not `main`, otherwise `repo.branch`. If both `main` and `master` exist, or `repo.branch` is null, ask which. Confirm the base branch with the user, then run `speck config set base_branch <name>`. Warn them that shipping pushes straight to that branch, without a pull request, so a branch that requires pull requests (a protection rule on GitHub, for example) will refuse it. If theirs does, they can relax the rule for themselves or pick another branch.
4. **Test command.** speck runs the tests before every review and refuses to ship until they pass. If `suggestions.test_command` has a command, explain where it came from and ask whether it's the right one. If it's null, ask the user how they run their tests, or whether they have none yet. Run it once to confirm, and show the result:
   - If it passes, run `speck config set commands.test "<command>"`.
   - If it fails, show the end of the output. Ask whether to set it anyway (speck won't ship until it passes) or try another command.
   - If they have no tests, leave it blank and offer a draft ticket to add a test runner. If they want one, make it after sections 5 and 6, as in section 4, step 5, so it records the agents they choose.
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

Look at `agents` in `speck detect`:

- **Builder:** propose Claude Code (`claude`), which is the one most tested. If they'd rather use another agent that's on the PATH (`codex`, `cursor-agent` or `gemini`), run `speck config set builder <name>` with `codex`, `cursor` or `gemini`.
- **Reviewer:** prefer one from another model family than the builder's. Claude Code runs Anthropic's models, Codex OpenAI's and Gemini Google's. Cursor can run several, so its family depends on the model it uses.
  - With a Claude, Cursor or Gemini builder, propose Codex: run `speck config set reviewer codex`. If `codex.on_path` is false, offer to install it (`npm install -g @openai/codex`, asking first). If `codex.signed_in` is false, ask them to run `codex login` and follow the prompts, then run `speck detect` again.
  - With a Codex builder, Codex would be the same family. Another family, such as Claude Code, needs a reviewer command added to `reviewer_options` by hand (see "Using another reviewer" in speck's README). Cursor or Gemini reviewers need one too. If they want that, point them to it rather than editing the file.
  - If only Claude is available, or they'd rather not add another agent, explain same-model review: a fresh session of the builder's own agent reviews the work, which is independent of the build but shares its model's blind spots, so it may miss more. Turn it on only if the user agrees: with a Claude builder, `speck config set reviewer claude-subagent` and `speck config set allow_same_model_review true`; with a Codex builder, `speck config set reviewer codex` and `speck config set allow_same_model_review true`. If they don't agree, they need a reviewer from another family: go back to the options above.
  - Never pair a builder and reviewer from the same family without that agreement.
- Leave `reviewer_model` and `reviewer_effort` blank, which uses each agent's own default, unless the user asks for a particular one.

## 6. Builds that `speck run` starts

`speck run` starts a build for each ready ticket without anyone watching, using `build_command`. Its default passes `--dangerously-skip-permissions`, so those builds skip all permission prompts: the agent can run any command on this machine without asking. Explain that, and that builds started with `/speck-build <id>` in an open agent session still ask as usual. Ask whether to keep it.

- If yes, leave `build_command` as it is.
- If no, run `speck config set build_command ""`. `speck run` then refuses to start builds, and they build each ticket with `/speck-build <id>` instead.

Then, in a new project, go back to section 4, step 5 for the first ticket. In an existing project that wanted a ticket to add a test runner, make it the same way. Otherwise continue with section 7.

## 7. Finish

1. Ask before making a commit of the setup changes (`speck/config.yml` and anything else setup changed, staged by name), with the message `speck: set up`.
2. Run `speck doctor`. For each ✗, explain it and fix it with the user, asking before every change as above, then run it again. Setup is finished once `speck doctor` passes.
3. Tell the user what was set up, in a few lines, and what to do next:
   - **New project:** read the first ticket. When it's right, approve it with `speck set <id> status ready`, then type `/speck-build <id>`.
   - **Existing project:** type `/speck-capture` to save a first idea, then `/speck-ticket` to turn it into a ticket.
