---
name: speck-build
description: Build a ready speck ticket end to end. Branch, write tests from the acceptance criteria, implement, and run the independent review loop with a reviewer subagent until it approves. The ticket then ships automatically if auto_ship in speck/config.yml allows it, or waits as approved for the user to ship with /speck-ship. Use when the user says "speck build <id>", "build ticket <id>", or moves a ticket to Ready for Dev and asks for it to be built.
---

# speck build

You are the **builder**. You own one ticket from `ready` to `approved`, and to `done` when `auto_ship` allows it. You never approve your own work, and you never merge or ship unless the user runs `/speck-ship`, except through `speck ship <id> --auto` in section 5.

CLI: `node .speck/scripts/speck.mjs`, run from the repo root (below: `speck`).

## 1. Pre-flight

1. Read `speck/config.yml`, the ticket (`speck/tickets/<id>-*.md`, or `speck/tickets/done/<id>-*.md` once it's done) and the repo's AGENTS.md or CLAUDE.md.
2. The ticket must be `ready`. If it's `draft`, stop and tell the user that it needs their approval (Gate 1). If it's `building`, `reviewing` or `blocked`, you're resuming: run `speck start <id>`, which refuses to start it again and prints where its branch is checked out. Resume in that existing worktree, run `speck next <id>` there, then continue from the right step. If it's `blocked` and the user has answered the question, record the answer in the ticket's Notes before continuing.
3. If the ticket's Notes have any `Unverified:` facts, check each now against current documentation or the installed tool, without editing anything yet. If one turns out to be wrong, stop and tell the user before building, with the correct fact and what it changes in the ticket.
4. Make sure your `base_branch` is up to date (pull it if it has a remote). Create the branch with `speck start <id>`: it checks the ticket is ready and committed, makes its branch from the local base branch, in its own worktree when `worktrees` is on in `speck/config.yml`, runs `worktree_setup` there, sets the ticket to `building` and commits that (`speck(<id>): start`). It prints the folder to work in. From now on, do all of your building, testing, reviewing and shipping in the printed folder, which is the ticket's own worktree when worktrees are on. Never work in the main checkout then, except to create a fix ticket in section 5: other sessions may be using it. If `speck start` refuses a `ready` ticket here, report its reason in plain words and stop. Don't commit the ticket, switch branches or change anything else to get past it: the user decides what happens next.
5. In that folder, change each fact you checked in step 3 from `Unverified:` to `Checked <YYYY-MM-DD>: …` in the ticket's Notes, and commit it (`speck(<id>): facts checked`).
6. In that folder, before you change anything, run the test command (`commands.test` in `speck/config.yml`) through speck: `speck test 2>&1 | tee /tmp/speck-<id>-tests.txt`. It waits its turn if `max_parallel_tests` test runs are already going in this repo, and exits with the test command's exit code. Always run the full suite this way, never the test command directly. Record what fails in the ticket's Notes as `Failing before this build: <tests>`, naming each failing test, or `Failing before this build: none`. Commit it (`speck(<id>): failing before`). A test listed as failing before this build is never changed or fixed in this build, whatever the acceptance criteria say, even one asking for the whole suite to pass. List it as a follow-up in the ticket's `## Delivery log` instead.

## 2. Tests first

1. For each acceptance criterion, write at least one test that checks it. Start each test's name with the ticket's id and its criterion number (for example `<id> AC2: …`), so the reviewer's summary of the test output lists the ticket's own tests. Put this ticket's new tests in a new test file of their own (for example `test/<area>-<id>.test.mjs`) rather than adding to the end of a shared one, and move any helpers they share into a support module, so tickets don't clash when they're merged.
2. Run only this ticket's own test files: `speck test --files <file>…`. It runs `commands.test_files` from `speck/config.yml` with those files, or the whole suite when that's blank. The new tests should fail. If a test passes before you've written any code, either the criterion is already met or the test is wrong, so look into it.
3. If the project has no test setup, add the lightest standard one for its stack. If nothing can be tested automatically (for example, a pure copy change), say so in the ticket's Notes and describe how a reviewer can check it by reading the code.

## 3. Implement

1. Write the simplest change that makes the tests pass, within the ticket's scope. Don't touch anything listed as out of scope, and don't make unrelated changes.
2. Run the ticket's own test files (`speck test --files <file>…`) until they pass. Once they pass, run the whole suite and keep the full output: `speck test 2>&1 | tee /tmp/speck-<id>-tests.txt`. Fix anything it breaks.
3. **Size guard:** run `speck diffstat`. If it exits 2 (over the limit), stop. Don't push on. Block the ticket (see section 6) and give a proposed split as the question.
4. **Self-check.** Before the first review round, go over your change the way an adversarial reviewer would. This is not a review or an approval: it catches what you can, and the reviewer still decides. Check:
   - **Unusual input:** empty, missing, malformed or repeated values, and names that are built in rather than missing (for example `constructor` or `__proto__` used as a key).
   - **State over time:** anything kept between review rounds, runs or re-runs. Can a later run pick up something stale or out of date that an earlier one left?
   - **Error paths:** every failure gives a plain error message saying what to do, changes nothing it shouldn't, and never ends in a stack trace.
   - **Claims:** every sentence you added to docs or skills matches the code, and a test covers it. Narrow any claim the code doesn't fully back.
   - **Scope:** nothing outside the ticket changed, and nothing it puts out of scope was touched.

   For each problem you find, add a test that fails, fix it, and re-run the tests: the ticket's own test files with `speck test --files`, then the whole suite with `speck test 2>&1 | tee /tmp/speck-<id>-tests.txt`. Then add one line to the ticket's Notes: `Self-check: <what it changed>`, or `Self-check: no changes`.
5. Commit (`speck(<id>): <summary>`), staging each file you changed by name (see Rules). There's no separate status step: the first review round sets the ticket to `reviewing`.

## 4. Review loop

Follow the `speck-review` skill (in the folder next to this one) exactly. In short:
- Spawn the reviewer configured on the ticket (`reviewer:`).
- Take turns with it until `speck next <id>` returns `ship` or `block`.
- Fix or dispute each blocking finding, re-run the whole suite (`speck test`, not `--files`) and commit before every review round.

## 5. Approved

When `speck next <id>` says `ship`, the reviewer has approved. Close out the build on the ticket branch:

1. If minor findings or your own notes suggest follow-up ideas, write them in the ticket's `## Delivery log`. Then save to the inbox each one that would need its own ticket (a behaviour change, a bug or a missing check), so the shaping chat sees it once the ticket is done:
   - Write each one as its own note, `speck/ideas/<YYYY-MM-DD>-<slug>.md`, with today's date and a short slug of its title. If that file already exists, add `-2`, `-3` and so on to the slug rather than overwriting it.
   - Tidy-ups (such as unused code) and notes on known limits go only in the Delivery log. If none qualify, write no note.
   - First check each one against every idea note in `speck/ideas/` and `speck/ideas/done/`, every ticket in `speck/tickets/` and `speck/tickets/done/` (problem, outcome and acceptance criteria), as `/speck-capture` does. Skip any that clearly duplicates one of them, but don't stop to ask the user: an auto-ship build mustn't wait. Under the Delivery log's follow-ups, list each skipped follow-up and its match (an idea's path or a ticket's id).
   - Use the `/speck-capture` format, with `Status: inbox` and a `From ticket:` line. Keep it under 30 lines:

     ```markdown
     # <the follow-up in a few words>

     Captured: <date> · Status: inbox
     From ticket: <id>

     ## What
     <what should change, in 1–3 sentences>

     ## Why
     <the problem it causes, and who for>

     ## Notes
     - <where it came from (a review finding or your own note) and any open questions>
     ```

   Commit the notes and the ticket on the ticket branch before `speck close`, staging each file by name (`speck(<id>): follow-ups`).
2. Run `speck close <id>`. It refuses unless `speck next <id>` says `ship` and nothing outside the ticket file has uncommitted changes. It then replaces the ticket's `## Review log` with one line per round, adds the review rounds, reviewer, reviewer tokens, elapsed time and changed lines to the `## Delivery log` (keeping what you wrote there), sets `approved` and commits only the ticket (`speck(<id>): approved`). Change nothing outside `speck/` after the approval, or the user won't be able to ship it.
3. Run `speck ship <id> --auto`. It ships only if `auto_ship` is `true` in `speck/config.yml`, the ticket's risk is listed in `auto_ship_risk`, and the reviewer could inspect the repo in every round. Then it runs all of `speck ship`'s usual checks and the tests.
   - If it shipped (exit code 0), tell the user: a one-line summary, that it's merged and pushed, how many follow-ups went to the inbox or that none did, and anything worth a look (risk flags, follow-up ideas).
   - If it exits with 12, auto-ship doesn't apply and nothing changed. Stop and tell the user: a one-line summary, why it didn't ship automatically (from its message), how many follow-ups went to the inbox or that none did, anything worth a look, and how to finish: read the review pack with `speck pack <id>`, then run `/speck-ship <id>` to merge it.
   - If it exits with 13, merging into the base branch hit a conflict (it names the conflicting files) and nothing changed. Follow "Conflict" below, without asking the user.
   - If it exits with 14, the tests failed on the ticket's branch and on the base branch as it is, so it isn't this ticket's fault, and nothing changed. Follow "Base branch failing" below.
   - If any other check refused, report the reason as the ship skill describes. Don't work around it.

### Conflict

`speck ship <id> --auto` names the ref to merge: `<base_branch>`, or `<remote>/<base_branch>` when ship had just fetched new commits from the remote. Work in the ticket's worktree.

1. Run `speck merge-check <id>`. It prints one JSON object: `clean`, and for each conflicting file its `class`, how many conflicts it has and their line ranges. It checks against the local base branch, so a file that ship named but merge-check doesn't list counts as `logic`. Then merge the base branch into the ticket branch: merge the ref ship's message names (`git merge <ref>`, no rebase or squash, so the reviewed commits stay as they are).
2. Resolve each conflicting file by its class, keeping the intent of both sides: the base branch's change and this ticket's. Stage each resolved file by name.
   - `added-lines`: both sides only added lines, for example to a list, a table or the imports. Keep both sides' lines, in an order that fits the file, with no duplicates.
   - `lockfile`: don't edit it by hand. Take the base branch's version (`git checkout --theirs -- <file>`), then rebuild it with the project's own install command (the one in `worktree_setup`, or the package manager's install for that lockfile, such as `npm install` for `package-lock.json`), so it has both sides' dependencies.
   - `ticket`: a file under `speck/`. In this ticket's own file, keep the branch's status and `## Review rounds` exactly as they are, and add anything the base branch added elsewhere in it. In any other file under `speck/`, keep both sides.
   - `logic`: anything else. Make the smallest change that keeps the intent of both sides. If both can't hold at once, the two tickets contradict each other: stop and ask (see "Asking the user").
3. Run the tests (`speck test 2>&1 | tee /tmp/speck-<id>-tests.txt`) and fix anything the merge broke, changing only what the merge needs.
4. Commit the merge (`speck(<id>): merge <base_branch>`).
5. Get it reviewed. Every conflict merge gets a merge round, whatever its class: `speck ship` refuses a ticket whose files changed after the reviewer approved, and the merge changed them. Run a review round as in section 4: `speck review <id> --tests=/tmp/speck-<id>-tests.txt --response=/tmp/speck-<id>-response.md` accepts the `approved` ticket and sets it to `reviewing`. Write the response file fresh, replacing any left from the build: it lists each file you resolved and how, with its class. The reviewer sees the branch's whole change against the base branch as merged. This merge round, and any rounds after it until the reviewer approves, don't count towards `max_review_rounds`. They have their own limit, `max_merge_rounds`.
6. Take turns as usual until `speck next <id>` says `ship` or `block`. Fix each blocking finding, re-run the tests and commit before every round.
   - On `ship`: run `speck close <id>`, then `speck ship <id> --auto` again, and handle its exit code as in section 5 step 3.
   - On `block`: ask the user (see "Asking the user").

If `speck ship <id> --auto` exits with 13 again after two merges, block the ticket (section 6) with the conflicting files in the question. Write it in plain words, without git terms: say that other shipped work keeps changing the same files, name them, and give the options and your recommendation.

### Base branch failing

The base branch's own tests are failing. Change no code: not in this ticket's branch, and not in the base branch.

1. Look for an open fix ticket: a ticket in `speck/tickets/` (not `speck/tickets/done/`) with `type: fix`. If one already covers this failure (the same failing tests, or the same cause), don't make another: go to step 3 with that ticket.
2. Otherwise, in the main checkout on the base branch (when `worktrees` is off, switch it back to the base branch first), create one: `speck new "<title>" --type=fix`. Give it a title saying what's broken, and fill in its Problem, Outcome and Acceptance criteria in plain words: which tests fail on the base branch, what they show, and that they must pass again. Don't guess at a cause you haven't seen in the test output. Commit only that ticket file, staged by name (`speck(<fix-id>): fix ticket`).
3. In the main checkout, run `speck set <fix-id> status ready` without asking the user, so it builds next, ahead of everything else. Set only a `draft` one, and only if it has no branch yet (`git branch --list '<branch_prefix><fix-id>-*'` prints nothing): one that's ready, building, reviewing, approved or blocked is already on its way, and setting it ready would undo that. If `speck set` refuses (its lint names what's missing), fill that in and try again; if it still refuses, leave it `draft` and say so in step 4.
4. Then stop. Leave this ticket `approved`, and tell the user in plain words: the base branch's tests are failing, which fix ticket covers it and whether it's ready or still a draft waiting for them, and that once the fix has shipped, `/speck-ship <id>` ships this ticket.

### Asking the user

While getting a ship through, apart from blocking after two merges (above), ask the user only when two tickets contradict each other, or when `speck next <id>` says `block` during a merge round. Nothing else is a reason to ask.

1. If you stopped partway through resolving a merge (two tickets contradict each other), undo it first with `git merge --abort`. That puts the ticket branch back as the reviewer approved it, without choosing either ticket's side, and lets the next steps commit. Don't commit a half-resolved merge.
2. Write one question under `## Blocked question` in the ticket. Write it in plain words, without git terms (no merge, branch, conflict or commit): say what each ticket wants, the options, and which one you recommend and why. Make it answerable in a sentence.
3. Run `speck set <id> status blocked`, then commit the ticket and any work in progress, staged by name.
4. Stop, and tell the user the question and how to resume: answer it, then run `/speck-build <id>`. On resuming after an undone merge, record the answer in the ticket's Notes and start "Conflict" again from step 1, resolving the clash the way the user chose.

## 6. Block

Use this when the review loop says `block`, the size guard trips, or a product question comes up that you can't answer from the ticket or the code:

1. Write one specific question under `## Blocked question` in the ticket. Make it answerable in a sentence, with the options and your recommendation.
2. Run `speck set <id> status blocked`, then commit your changes, staged by name, including the ticket with its review rounds.
3. Tell the user the question and how to resume: answer it, then run `/speck-build <id>`.

## Rules

- Never merge or ship unless the user runs `/speck-ship`: don't run `speck ship`, merge into the base branch or push it yourself. Shipping is the user's gate. The one exception is `speck ship <id> --auto` in section 5, which ships only when the user has turned on `auto_ship` in `speck/config.yml`.
- Never weaken or delete a test to get past a reviewer finding, unless the reviewer agrees the test itself was wrong.
- Never commit, stage or change files in the main checkout, before or after `speck start`, except to pull the base branch in section 1, to create and set ready a fix ticket in "Base branch failing" (section 5) and, when `worktrees` is off, to build on the ticket's branch there. That checkout belongs to the user and to other sessions.
- Stage only the files you created or changed, by name (`git add <path> …`). Never use `git add -A`, `git add .` or `git commit -a`: other sessions may have files in the same checkout, and those commands would sweep them into your commit. If files you didn't create or change appear, leave them alone (don't commit, move or delete them) and mention them to the user when you report back.
- Never edit a ticket's `## Review rounds` section by hand. Only speck writes it.
- Keep to the ticket. If you find other problems, list them in the Delivery log as follow-up ideas. Don't fix them.
