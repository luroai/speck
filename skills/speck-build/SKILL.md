---
name: speck-build
description: Build a ready speck ticket end to end. Branch, write tests from the acceptance criteria, implement, and run the independent review loop with a reviewer subagent until it approves. The ticket then waits as approved for speck run's ship queue to ship it, when auto_ship in speck/config.yml covers it, or for the user to ship it with /speck-ship. Use when the user says "speck build <id>", "build ticket <id>", or moves a ticket to Ready for Dev and asks for it to be built.
---

# speck build

You are the **builder**. You own one ticket from `ready` to `approved`. You never approve your own work, and you never merge or ship unless the user runs `/speck-ship`. Approved tickets that `auto_ship` covers are shipped by `speck run`'s ship queue, not by you. When a ship the queue started needs work on the ticket, `speck run` resumes your session to do it (see "When speck run hands it back" in section 5).

CLI: `node .speck/scripts/speck.mjs`, run from the repo root (below: `speck`).

## 1. Pre-flight

1. Read `speck/config.yml`, the ticket (`speck/tickets/<id>-*.md`, or `speck/tickets/done/<id>-*.md` once it's done) and the repo's AGENTS.md or CLAUDE.md.
2. The ticket must be `ready`. If it's `draft`, stop and tell the user that it needs their approval (Gate 1). If it's `building`, `reviewing` or `blocked`, you're resuming: run `speck start <id>`, which refuses to start it again and prints where its branch is checked out. A `blocked` ticket with no branch was stopped before its build started it: `speck start` starts it as it would a ready one, so carry on from step 5 in the folder it prints. Otherwise, resume in that existing worktree, run `speck next <id>` there, then continue from the right step. If it's `blocked` and the user has answered the question, record the answer in the ticket's Notes before continuing.
3. If the ticket's Notes have any `Unverified:` facts, check each now against current documentation or the installed tool, without editing anything yet. If one turns out to be wrong, stop and tell the user before building, with the correct fact and what it changes in the ticket.
4. Make sure your `base_branch` is up to date (pull it if it has a remote). Create the branch with `speck start <id>`: it checks the ticket is ready and committed, makes its branch from the local base branch, in its own worktree when `worktrees` is on in `speck/config.yml`, runs `worktree_setup` there, sets the ticket to `building` and commits that (`speck(<id>): start`). It prints the folder to work in. From now on, do all of your building, testing, reviewing and shipping in the printed folder, which is the ticket's own worktree when worktrees are on. Never work in the main checkout then, except to create a fix ticket in section 5: other sessions may be using it. If `speck start` refuses a `ready` ticket here, report its reason in plain words and stop. Don't commit the ticket, switch branches or change anything else to get past it: the user decides what happens next.
5. In that folder, change each fact you checked in step 3 from `Unverified:` to `Checked <YYYY-MM-DD>: …` in the ticket's Notes, and commit it (`speck(<id>): facts checked`).
6. In that folder, before you change anything, find which tests already fail from the result speck has recorded for this code: `speck test --recorded 2>&1 | tee /tmp/speck-<id>-tests.txt`. It runs no tests: it prints the result that `speck test` or `speck ship` recorded for this code and test command, and exits with its exit code, or says in one line that no result is recorded and exits with 0. Run it in the foreground (see Rules). Never run the whole suite to find them: `speck ship` runs it. Record what failed in the ticket's Notes as `Failing before this build: <tests>`, naming each failing test, `Failing before this build: none` when the recorded result passed, or `Failing before this build: not checked` when no result is recorded. Commit it (`speck(<id>): failing before`). A test listed as failing before this build is never changed or fixed in this build, whatever the acceptance criteria say, even one asking for the whole suite to pass. List it as a follow-up in the ticket's `## Delivery log` instead.

## 2. Tests first

**A document task** (`task: document` in the ticket) writes a document, such as an email, a plan or a report, rather than code. Skip this section: it has no tests. Instead, run `speck output <id>` in the ticket's folder. It prints the ticket's folder in the main checkout's `outputs/`, making it if it's missing, and refuses a ticket that isn't a document task or whose `output` fails `speck lint`. Write the document into that folder, from the sources the ticket names, as section 3 step 1. `outputs/` isn't in git, so nothing you do there can be undone: in that folder, only make new files (changing them again in later rounds) or change the files the ticket names. Never delete, move or overwrite any other file there. Section 3's test runs and size guard (steps 2, 3 and 5) don't apply, and you commit only the ticket. Then run the review loop as usual, without `--tests`, and say in each round's response file that it's a document task with no tests, and which files you wrote or changed in its folder.

1. For each acceptance criterion, write at least one test that checks it. Start each test's name with the ticket's id and its criterion number (for example `<id> AC2: …`), so the reviewer's summary of the test output lists the ticket's own tests. Put this ticket's new tests in a new test file of their own (for example `test/<area>-<id>.test.mjs`) rather than adding to the end of a shared one, and move any helpers they share into a support module, so tickets don't clash when they're merged. Check each criterion the quickest way that really checks it: calling the code directly, or using a lightweight stand-in, rather than starting a real browser, server or long-running process, unless the criterion is about that real behaviour (for example, selecting text in a browser). `speck ship` runs the whole suite for every ticket, so each slow test costs every ticket after it. When a test has to wait for something to happen, wait for it with a time limit rather than pausing for a fixed time, and keep any pause that shows something doesn't happen as short as the check allows.

   A criterion ending with `(checked by review)` is about how a document reads (its wording, tone, order or layout): write no test for it, as the reviewer checks it by reading the document. Never add a test that checks a document's exact wording, or the order of its sentences, paragraphs or headings, for any criterion: such a test fails the suite on the next edit to that document. Test only the facts in a document: a command, a setting's name, a version, a file name, a link, or a name that mustn't appear. In the README, test only its setup prompt, its status line's version, its demo pictures and whether its links resolve: a criterion about any other fact in it ends with `(checked by review)`. A document is any file written for people to read, such as the README, `docs/` and the changelog.
2. Run only this ticket's own test files: `speck test --files <file>…`. It runs `commands.test_files` from `speck/config.yml` with those files, or the whole suite when that's blank. When `commands.checks` lists test files, the project's quick checks of rules for the whole repo, every `speck test --files` runs them too, in the same run, so you never name them yourself. The new tests should fail. If a test passes before you've written any code, either the criterion is already met or the test is wrong, so look into it.
3. If the project has no test setup, add the lightest standard one for its stack. If nothing can be tested automatically (for example, a pure copy change), say so in the ticket's Notes and describe how a reviewer can check it by reading the code.

## 3. Implement

1. Write the simplest change that makes the tests pass, within the ticket's scope. Don't touch anything listed as out of scope, and don't make unrelated changes.
2. Run the ticket's own test files (`speck test --files <file>…`) until they pass. Don't run the whole suite: `speck ship` runs it (see step 5).
3. **Size guard:** run `speck diffstat`. If it exits 2 (over the limit), stop. Don't push on. Block the ticket (see section 6) and give a proposed split as the question.
4. **Self-check.** Before the first review round, go over your change the way an adversarial reviewer would. This is not a review or an approval: it catches what you can, and the reviewer still decides. Check:
   - **Unusual input:** empty, missing, malformed or repeated values, and names that are built in rather than missing (for example `constructor` or `__proto__` used as a key).
   - **State over time:** anything kept between review rounds, runs or re-runs. Can a later run pick up something stale or out of date that an earlier one left?
   - **Error paths:** every failure gives a plain error message saying what to do, changes nothing it shouldn't, and never ends in a stack trace.
   - **Claims:** every sentence you added to docs or skills matches the code, and a test covers it when it states a fact in the docs you changed (a command, a setting's name, a version, a file name, a link, or a name that mustn't appear), apart from the README, where only its setup prompt, its status line's version, its demo pictures and whether its links resolve are tested. A sentence about how a doc reads needs no test. Narrow any claim the code doesn't fully back.
   - **Scope:** nothing outside the ticket changed, and nothing it puts out of scope was touched.

   For each problem you find, add a test that fails, fix it, and re-run the tests: the ticket's own test files with `speck test --files`. Then add one line to the ticket's Notes: `Self-check: <what it changed>`, or `Self-check: no changes`.
5. After the self-check and before the first review round, run the round's test files once and keep the full output: `speck test --files <file>… 2>&1 | tee /tmp/speck-<id>-tests.txt` as in later rounds, but with `--related` in place of `--files`, so `speck test --related <file>… 2>&1 | tee /tmp/speck-<id>-tests.txt`, in the foreground (see Rules). The files are the ticket's own test files, any existing test files it changed and the files of any test that failed in its last test run. `--related` runs them and, in the same run, every existing test file that names a file this branch changed, so you find what the change broke before review rather than at ship. Before it runs anything, it prints each test file it chose, with the changed file that brought it in. Never run the whole suite (`speck test` without `--files`) for a review round. The whole suite runs in `speck ship`, not during a build, not even before you change anything (section 1 step 6): ship runs it on the ticket as it would land, and hands the ticket back if it fails there. The first round sends this output to the reviewer, and its response file says which test files you ran (see the `speck-review` skill). If a test fails because of your change, fix it and run the files again. That includes a test in a `commands.checks` file: a broken rule for the whole repo is a failure like any other, and ship would fail on it. Never start a review round on a run that failed because of your change. A test listed as failing before this build stays as it is.
6. **Pictures of a visual change.** If the ticket changes how something looks (the panel, a page, or how the README renders), take pictures of the result before the first review round, so the review pack shows the user what they'd be shipping. Start the real thing from this folder (for the panel, `speck panel --port <a free port>`, so it doesn't clash with one already running) and open it in a real browser, such as headless Chrome or Chromium, or a browser tool your session has. Take one picture of each view the change touches, as it looks with the change in, in both the light and the dark look where it has both (for the panel, the look in Settings switches between them). First remove any pictures from an earlier version of the change with `speck picture <id> --clear`, then keep each one with `speck picture <id> <file> "<caption>"`: a PNG, JPEG or WebP file, and a caption saying which view and which look it shows, for example "Review pack with pictures, dark look". speck keeps them in the main checkout's `speck/.cache/pictures/<id>/`, which git ignores, so never commit them. `speck pack <id>` lists them, and the panel shows them in the ticket's review pack. Stop anything you started to take them. When a fix in a later round changes how it looks, take them all again the same way. A ticket that changes nothing anyone sees needs no pictures. If no real browser can be started here, add `Pictures: none, because <why>` to the ticket's Notes and carry on.
7. Commit (`speck(<id>): <summary>`), staging each file you changed by name (see Rules). There's no separate status step: the first review round sets the ticket to `reviewing`.

## 4. Review loop

Follow the `speck-review` skill (in the folder next to this one) exactly. In short:
- Spawn the reviewer configured on the ticket (`reviewer:`), or, when that's blank, the `reviewer` setting (`speck config show`).
- When `speck review` exits 12, the round is still running: run the command it prints, `speck review <id> --wait`, in the foreground, and again each time it exits 12, until it exits with any other code.
- Take turns with it until `speck next <id>` returns `ship` or `block`. When the round at `max_review_rounds` leaves no more than one blocking finding open, `speck next` says `fix` and you get an extra round: take it like any other, without asking the user. Never change `limits.max_review_rounds` in `speck/config.yml` to get past a block.
- Fix or dispute each blocking finding, checking each fix with the ticket's own test files (`speck test --files`). Then, before the next review round, merge rounds included, run once the ticket's own test files, any existing test files it changed and the files of any test that failed in its last test run (`speck test --files <file>… 2>&1 | tee /tmp/speck-<id>-tests.txt`), and commit. Never run the whole suite (`speck test` without `--files`): `speck ship` runs it. Say in the round's response file which test files you ran. If a test fails because of your change, fix it and run the files again: never start a round on a run that failed because of your change.

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

   Then, before you run `speck close`, fill in the ticket's `## In plain words` section (add it above `## Blocked question` if the ticket has none), replacing its comment. In a few short sentences, cover what's different for someone using the product, how to see the change for yourself, and anything worth keeping an eye on. Write it for someone who doesn't read code: no file paths, code, function names or test names.

   Commit the notes and the ticket, with its `## In plain words`, on the ticket branch before `speck close`, staging each file by name (`speck(<id>): follow-ups`).
2. Run `speck close <id>`. It refuses unless `speck next <id>` says `ship` and nothing outside the ticket file has uncommitted changes. It then replaces the ticket's `## Review log` with one line per round, adds the review rounds, reviewer, reviewer tokens, elapsed time and changed lines to the `## Delivery log` (keeping what you wrote there), sets `approved` and commits only the ticket (`speck(<id>): approved`). Change nothing outside `speck/` after the approval, or the user won't be able to ship it.
3. Stop here: don't run `speck ship`. Check whether `auto_ship` covers the ticket: `speck status --json` gives each ticket's `auto_ship`, true when `auto_ship` is on in `speck/config.yml`, the ticket's risk is listed in `auto_ship_risk` and the reviewer could inspect the repo in every round. Then tell the user: a one-line summary, that it's approved, how many follow-ups went to the inbox or that none did, anything worth a look (risk flags, follow-up ideas), and what happens next. When `auto_ship` covers it, it now waits for `speck run`'s ship queue, which ships approved tickets one at a time while `speck run` is on. Otherwise it waits for the user: read the review pack with `speck pack <id>`, then run `/speck-ship <id>` to merge it.

### When speck run hands it back

When a ship that `speck run`'s queue started is refused in a way this ticket's build has steps for, `speck run` resumes this session with a message saying what happened, with `speck ship`'s own message, and which steps to follow. The ticket is still `approved`, and nothing was shipped or changed. Work in the ticket's worktree, without asking the user:

- A conflict merging it into the base branch (`speck ship` exited 13): follow "Conflict".
- The tests failed on the ticket as it would land, merged with the base branch, while the base branch's own tests pass, or while the base branch is failing but those tests pass there (exited 16): follow "Tests fail together".
- The base branch's own tests are failing (exited 14): follow "Base branch failing".
- The message says `speck run` has handed it back twice already without it shipping: follow "Handed back again".
- The user read the approved result and sent changes back with `speck changes`: follow "Changes asked for".

### Conflict

`speck ship`'s message, in the one `speck run` resumed this session with, names the ref to merge: `<base_branch>`, or `<remote>/<base_branch>` when ship had just fetched new commits from the remote. Work in the ticket's worktree.

1. Run `speck merge-check <id>`. It prints one JSON object: `clean`, and for each conflicting file its `class`, how many conflicts it has and their line ranges. It checks against the local base branch, so a file that ship named but merge-check doesn't list counts as `logic`. Then merge the base branch into the ticket branch: merge the ref ship's message names (`git merge <ref>`, no rebase or squash, so the reviewed commits stay as they are).
2. Resolve each conflicting file by its class, keeping the intent of both sides: the base branch's change and this ticket's. Stage each resolved file by name.
   - `added-lines`: both sides only added lines, for example to a list, a table or the imports. Keep both sides' lines, in an order that fits the file, with no duplicates.
   - `lockfile`: don't edit it by hand. Take the base branch's version (`git checkout --theirs -- <file>`), then rebuild it with the project's own install command (the one in `worktree_setup`, or the package manager's install for that lockfile, such as `npm install` for `package-lock.json`), so it has both sides' dependencies.
   - `ticket`: a file under `speck/`. In this ticket's own file, keep the branch's status and `## Review rounds` exactly as they are, and add anything the base branch added elsewhere in it. In any other file under `speck/`, keep both sides.
   - `logic`: anything else. Make the smallest change that keeps the intent of both sides. If both can't hold at once, the two tickets contradict each other: stop and ask (see "Asking the user").
3. Run the tests: the ticket's own test files, any existing test files it changed and the files of any test that failed in its last test run (`speck test --files <file>… 2>&1 | tee /tmp/speck-<id>-tests.txt`), not the whole suite. Fix anything the merge broke, changing only what the merge needs.
4. Commit the merge (`speck(<id>): merge <base_branch>`).
5. Get it reviewed. Every conflict merge gets a merge round, whatever its class: `speck ship` refuses a ticket whose files changed after the reviewer approved, and the merge changed them. Run a review round as in section 4: `speck review <id> --tests=/tmp/speck-<id>-tests.txt --response=/tmp/speck-<id>-response.md` accepts the `approved` ticket and sets it to `reviewing`. Write the response file fresh, replacing any left from the build: it lists each file you resolved and how, with its class, and the test files you ran. The reviewer sees the branch's whole change against the base branch as merged. This merge round, and any rounds after it until the reviewer approves, don't count towards `max_review_rounds`. They have their own limit, `max_merge_rounds`.
6. Take turns as usual until `speck next <id>` says `ship` or `block`. Fix each blocking finding, re-run the tests and commit before every round.
   - On `ship`: run `speck close <id>`, then stop and tell the user it's approved again: `speck run`'s ship queue ships it.
   - On `block`: ask the user (see "Asking the user").

### Tests fail together

The tests failed on the ticket as it would land, merged with the base branch as it is now, and pass on the base branch alone: either its own change broke them, or it doesn't work with the base branch's newer changes. `speck ship`'s message names the failing tests.

1. Merge the base branch into the ticket branch: `git merge <base_branch>` (no rebase or squash). If it conflicts, resolve each file as in "Conflict" steps 1 and 2.
2. Run the files of the failing tests `speck ship` named, plus the ticket's own test files (`speck test --files <file>… 2>&1 | tee /tmp/speck-<id>-tests.txt`), not the whole suite. Fix the failing tests by changing this ticket's code, so it passes them as it would land, keeping the intent of both the ticket and the base branch's newer changes. Never weaken or delete a test to get past it.
3. Commit (`speck(<id>): merge <base_branch>`), then get it reviewed and closed as in "Conflict" steps 5 and 6. In the response file, say which tests failed, why, what you changed and which test files you ran.

### Handed back again

`speck run` has handed this ticket back twice already, and its ship was refused again. Don't merge or fix again: block the ticket (section 6), with the conflicting files in the question, or the failing tests. Write it in plain words, without git terms: say that other shipped work keeps changing the same files or breaking the same tests, name them, and give the options and your recommendation.

### Changes asked for

The user read the approved result and asked for changes. The message gives their note, which is also in the ticket's `## Review log`, dated. Until a review round has looked at the changes and the ticket is approved again, `speck next <id>` says `review` and nothing ships it.

1. Make the changes the note asks for, within the ticket's scope. A document task changes its files in its folder in `outputs/` (`speck output <id>`). Add or change tests as in sections 2 and 3, run the round's test files (`speck test --files <file>… 2>&1 | tee /tmp/speck-<id>-tests.txt`) and commit (`speck(<id>): changes asked for by the user`).
2. Run the review loop again as in section 4, with a response file saying what you changed for the note and which test files you ran. `speck review` accepts the `approved` ticket and sets it to `reviewing`, and the reviewer's round is given the note to check as well as the acceptance criteria. It counts as a merge round, a re-review after an approval: it doesn't count towards `max_review_rounds`, and `max_merge_rounds` limits it.
3. Once `speck next <id>` says `ship`, update the ticket's `## In plain words` if the change alters it, commit, run `speck close <id>`, and stop. It then waits to be shipped as before. On `block`, block the ticket (section 6).

### Base branch failing

The base branch's own tests are failing. Change no code: not in this ticket's branch, and not in the base branch.

1. Look for an open fix ticket: a ticket in `speck/tickets/` (not `speck/tickets/done/`) with `type: fix`. If one already covers this failure (the same failing tests, or the same cause), don't make another: go to step 3 with that ticket.
2. Otherwise, in the main checkout on the base branch (when `worktrees` is off, switch it back to the base branch first), create one: `speck new "<title>" --type=fix`. Give it a title saying what's broken, and fill in its Problem, Outcome and Acceptance criteria in plain words: which tests fail on the base branch, what they show, and that they must pass again. Don't guess at a cause you haven't seen in the test output. Commit only that ticket file, staged by name (`speck(<fix-id>): fix ticket`).
3. In the main checkout, run `speck set <fix-id> status ready` without asking the user, so it builds next, ahead of everything else. Set only a `draft` one, and only if it has no branch yet (`git branch --list '<branch_prefix><fix-id>-*'` prints nothing): one that's ready, building, reviewing, approved or blocked is already on its way, and setting it ready would undo that. If `speck set` refuses (its lint names what's missing), fill that in and try again; if it still refuses, leave it `draft` and say so in step 4.
4. Then stop. Leave this ticket `approved`, and tell the user in plain words: the base branch's tests are failing, which fix ticket covers it and whether it's ready or still a draft waiting for them, and that once the fix has shipped, `speck run`'s ship queue tries this ticket again.

### Asking the user

While getting a ship through, apart from blocking a ticket handed back again (above), ask the user only when two tickets contradict each other, or when `speck next <id>` says `block` during a merge round. Nothing else is a reason to ask.

1. If you stopped partway through resolving a merge (two tickets contradict each other), undo it first with `git merge --abort`. That puts the ticket branch back as the reviewer approved it, without choosing either ticket's side, and lets the next steps commit. Don't commit a half-resolved merge.
2. Write one question under `## Blocked question` in the ticket. Write it in plain words, without git terms (no merge, branch, conflict or commit): say what each ticket wants, the options, and which one you recommend and why. Make it answerable in a sentence. Below it, add the three lines in section 6 step 1: the option you recommend, whether any option changes what you'd notice, and whether your recommendation is a clear winner.
3. Run `speck set <id> status blocked`, then commit the ticket and any work in progress, staged by name.
4. Stop, and tell the user the question and how to resume: answer it, then run `/speck-build <id>`. On resuming after an undone merge, record the answer in the ticket's Notes and start "Conflict" again from step 1, resolving the clash the way the user chose.

## 6. Block

Use this when the review loop says `block`, the size guard trips, or a product question comes up that you can't answer from the ticket or the code:

1. Write one specific question under `## Blocked question` in the ticket. Make it answerable in a sentence, with the options and your recommendation. Below it, add these three lines, each on its own line, so speck and the panel can read them:

   ```markdown
   Recommended: <the option you recommend, in a few words>
   Changes what you'd notice: <yes or no>
   Clear winner: <yes or no>
   ```

   - `Changes what you'd notice`: `yes` when any of the options would change something the user would notice: what speck does, shows or ships. `no` when every option only changes how it's built, such as which test to fix or how the code is laid out.
   - `Clear winner`: `yes` when your recommendation is clearly better than the other options, `no` when they're close and it's a judgement call.
2. Run `speck set <id> status blocked`, then commit your changes, staged by name, including the ticket with its review rounds.
3. Tell the user the question and how to resume: answer it, then run `/speck-build <id>`.

## Rules

- Never merge or ship unless the user runs `/speck-ship`: don't run `speck ship`, merge into the base branch or push it yourself. Shipping is the user's gate, and `speck run`'s ship queue ships only what the user has let `auto_ship` in `speck/config.yml` cover.
- Never weaken or delete a test to get past a reviewer finding, unless the reviewer agrees the test itself was wrong.
- Never commit, stage or change files in the main checkout, before or after `speck start`, except to pull the base branch in section 1, to create and set ready a fix ticket in "Base branch failing" (section 5) and, when `worktrees` is off, to build on the ticket's branch there. That checkout belongs to the user and to other sessions.
- Stage only the files you created or changed, by name (`git add <path> …`). Never use `git add -A`, `git add .` or `git commit -a`: other sessions may have files in the same checkout, and those commands would sweep them into your commit. If files you didn't create or change appear, leave them alone (don't commit, move or delete them) and mention them to the user when you report back.
- Wait for every command you start. Run every test run (`speck test`, with or without `--files`) and every review round in the foreground, and wait for it to finish, however long it takes: give it the longest time limit your shell tool allows. Never end your turn while a command you started is still running in the background. A build that `speck run` started ends when your turn ends, and whatever is still running is stopped with it, so the build stops partway with the ticket left `building` or `reviewing`.
- Never edit a ticket's `## Review rounds` section by hand. Only speck writes it.
- Keep to the ticket. If you find other problems, list them in the Delivery log as follow-up ideas. Don't fix them.
