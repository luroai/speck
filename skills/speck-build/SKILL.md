---
name: speck-build
description: Build a ready speck ticket end to end. Branch, write tests from the acceptance criteria, implement, and run the independent review loop with a reviewer subagent until it approves. The ticket then ships automatically if auto_ship in speck/config.yml allows it, or waits as approved for the user to ship with /speck-ship. Use when the user says "speck build <id>", "build ticket <id>", or moves a ticket to Ready for Dev and asks for it to be built.
---

# speck build

You are the **builder**. You own one ticket from `ready` to `approved`, and to `done` when `auto_ship` allows it. You never approve your own work, and you never merge or ship unless the user runs `/speck-ship`, except through `speck ship <id> --auto` in section 5.

CLI: `node .speck/scripts/speck.mjs`, run from the repo root (below: `speck`).

## 1. Pre-flight

1. Read `speck/product.md`, `speck/config.yml`, the ticket (`speck/tickets/<id>-*.md`, or `speck/tickets/done/<id>-*.md` once it's done) and the repo's AGENTS.md or CLAUDE.md.
2. The ticket must be `ready`. If it's `draft`, stop and tell the user that it needs their approval (Gate 1). If it's `building`, `reviewing` or `blocked`, you're resuming: run `speck start <id>`, which refuses to start it again and prints where its branch is checked out. Resume in that existing worktree, run `speck next <id>` there, then continue from the right step. If it's `blocked` and the user has answered the question, record the answer in the ticket's Notes before continuing.
3. If the ticket's Notes have any `Unverified:` facts, check each now against current documentation or the installed tool, without editing anything yet. If one turns out to be wrong, stop and tell the user before building, with the correct fact and what it changes in the ticket.
4. Make sure your `base_branch` is up to date (pull it if it has a remote). Create the branch with `speck start <id>`: it checks the ticket is ready and committed, makes its branch from the local base branch, in its own worktree when `worktrees` is on in `speck/config.yml`, runs `worktree_setup` there, sets the ticket to `building` and commits that (`speck(<id>): start`). It prints the folder to work in. From now on, do all of your building, testing, reviewing and shipping in the printed folder, which is the ticket's own worktree when worktrees are on. Never work in the main checkout then: other sessions may be using it.
5. In that folder, change each fact you checked in step 3 from `Unverified:` to `Checked <YYYY-MM-DD>: …` in the ticket's Notes, and commit it (`speck(<id>): facts checked`).

## 2. Tests first

1. For each acceptance criterion, write at least one test that checks it. Name or comment each test with its criterion number (for example `AC2`).
2. Run the test command from `speck/config.yml` (`commands.test`). The new tests should fail. If a test passes before you've written any code, either the criterion is already met or the test is wrong, so look into it.
3. If the project has no test setup, add the lightest standard one for its stack. If nothing can be tested automatically (for example, a pure copy change), say so in the ticket's Notes and describe how a reviewer can check it by reading the code.

## 3. Implement

1. Write the simplest change that makes the tests pass, within the ticket's scope. Don't touch anything listed as out of scope, and don't make unrelated changes.
2. Run the tests until they pass. Keep the full output: `<test command> 2>&1 | tee /tmp/speck-<id>-tests.txt`.
3. **Size guard:** run `speck diffstat`. If it exits 2 (over the limit), stop. Don't push on. Block the ticket (see section 6) and give a proposed split as the question.
4. **Living spec:** if the change adds, removes or alters something a user can do, update `speck/product.md` in the same branch: change "Current capabilities", and record any key decisions or known limits. Set `Last updated by ticket: <id>`. Describe the present, not history.
5. **Self-check.** Before the first review round, go over your change the way an adversarial reviewer would. This is not a review or an approval: it catches what you can, and the reviewer still decides. Check:
   - **Unusual input:** empty, missing, malformed or repeated values, and names that are built in rather than missing (for example `constructor` or `__proto__` used as a key).
   - **State over time:** anything kept between review rounds, runs or re-runs. Can a later run pick up something stale or out of date that an earlier one left?
   - **Error paths:** every failure gives a plain error message saying what to do, changes nothing it shouldn't, and never ends in a stack trace.
   - **Claims:** every sentence you added to docs, skills or `product.md` matches the code, and a test covers it. Narrow any claim the code doesn't fully back.
   - **Scope:** nothing outside the ticket changed, and nothing it puts out of scope was touched.

   For each problem you find, add a test that fails, fix it, and re-run the tests. Then add one line to the ticket's Notes: `Self-check: <what it changed>`, or `Self-check: no changes`.
6. Commit (`speck(<id>): <summary>`), then run `speck set <id> status reviewing` and commit again.

## 4. Review loop

Follow the `speck-review` skill (in the folder next to this one) exactly. In short:
- Spawn the reviewer configured on the ticket (`reviewer:`).
- Take turns with it until `speck next <id>` returns `ship` or `block`.
- Fix or dispute each blocking finding, re-run the tests and commit before every round.

## 5. Approved

When `speck next <id>` says `ship`, the reviewer has approved. Close out the build on the ticket branch:

1. Add one line per review round to the ticket's `## Review log`, for example: `Round 1 (codex): changes requested: F1 missing empty-input case. Round 2: approved.`
2. Fill in `## Delivery log`: review rounds, the reviewer tokens from `speck pack <id>`, elapsed time, and any follow-up ideas from minor findings.
3. Run `speck set <id> status approved`, then commit the ticket (`speck(<id>): approved`). Its review rounds are in the ticket file. Change nothing outside `speck/` after the approval, or the user won't be able to ship it.
4. Run `speck ship <id> --auto`. It ships only if `auto_ship` is `true` in `speck/config.yml`, the ticket's risk is listed in `auto_ship_risk`, and the reviewer could inspect the repo in every round. Then it runs all of `speck ship`'s usual checks and the tests.
   - If it shipped (exit code 0), tell the user: a one-line summary, that it's merged and pushed, and anything worth a look (risk flags, follow-up ideas).
   - If it exits with 12, auto-ship doesn't apply and nothing changed. Stop and tell the user: a one-line summary, why it didn't ship automatically (from its message), anything worth a look, and how to finish: read the review pack with `speck pack <id>`, then run `/speck-ship <id>` to merge it.
   - If any other check refused, report the reason as the ship skill describes. Don't work around it.

## 6. Block

Use this when the review loop says `block`, the size guard trips, or a product question comes up that you can't answer from the ticket or `product.md`:

1. Write one specific question under `## Blocked question` in the ticket. Make it answerable in a sentence, with the options and your recommendation.
2. Run `speck set <id> status blocked`, then commit everything, including the ticket with its review rounds.
3. Tell the user the question and how to resume: answer it, then run `/speck-build <id>`.

## Rules

- Never merge or ship unless the user runs `/speck-ship`: don't run `speck ship`, merge into the base branch or push it yourself. Shipping is the user's gate. The one exception is `speck ship <id> --auto` in section 5, which ships only when the user has turned on `auto_ship` in `speck/config.yml`.
- Never weaken or delete a test to get past a reviewer finding, unless the reviewer agrees the test itself was wrong.
- Never edit a ticket's `## Review rounds` section by hand. Only speck writes it.
- Keep to the ticket. If you find other problems, list them in the Delivery log as follow-up ideas. Don't fix them.
