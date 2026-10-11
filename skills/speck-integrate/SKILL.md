---
name: speck-integrate
description: The shipping agent's procedure for getting one approved speck ticket shipped when a plain speck ship couldn't, because merging hit a conflict or the base branch's own tests are failing. Only the ship queue starts it, never a person or another skill.
user-invocable: false
---

# speck integrate

You are the **shipping agent**. The ship queue starts you for one `approved` ticket whose `speck ship <id>` didn't go through. Your only job is to get that ticket shipped, or to say plainly why it can't be. You don't build, you don't approve, and you only ask the user about real decisions (see "Asking the user").

CLI: `node .speck/scripts/speck.mjs`, run from the repo root (below: `speck`).

## Start

1. Read `speck/config.yml`, the ticket (`speck/tickets/<id>-*.md`) and the repo's AGENTS.md or CLAUDE.md.
2. Run `speck start <id>`. It refuses to start the ticket again and prints the folder its branch is checked out in. Do all of your work in that folder, never in the main checkout, except where "Base branch failing" says otherwise. If it says the branch isn't checked out anywhere, report that and stop: don't check it out yourself.
3. Run `speck ship <id>` there and look at how it ends:
   - Exit 0: it shipped. Report that and stop.
   - Exit 13: follow "Conflict".
   - Exit 14: follow "Base branch failing".
   - Anything else: report its reason in plain words and stop. Don't work around it.

## Conflict

`speck ship <id>` exits with 13 when merging into the base branch hit a conflict. It names the conflicting files, changes nothing, and says which ref to merge: `<base_branch>`, or `<remote>/<base_branch>` when it had just fetched new commits from the remote.

1. Run `speck merge-check <id>`. It prints one JSON object: `clean`, and for each conflicting file its `class`, how many conflicts it has and their line ranges. It checks against the local base branch, so a file that ship named but merge-check doesn't list counts as `logic`.
2. Merge that ref into the ticket branch: `git merge <ref>`. No rebase or squash, so the reviewed commits stay as they are.
3. Resolve each conflicting file by its class, and stage each one by name:
   - `added-lines`: both sides only added lines, for example to a list, a table or the imports. Keep both sides' lines, in an order that fits the file, with no duplicates.
   - `lockfile`: don't edit it by hand. Take the base branch's version (`git checkout --theirs -- <file>`), then rebuild it with the project's own install command (the one in `worktree_setup`, or the package manager's install for that lockfile, such as `npm install` for `package-lock.json`), so it has both sides' dependencies.
   - `ticket`: a file under `speck/`. In this ticket's own file, keep the branch's status and `## Review rounds` exactly as they are, and add anything the base branch added elsewhere in it. In any other file under `speck/`, keep both sides.
   - `logic`: anything else. Make the smallest change that keeps the intent of both sides: what the base branch's change does and what this ticket does. If both can't hold at once, the two tickets contradict each other: stop and ask (see "Asking the user").
4. Run the tests: `speck test 2>&1 | tee /tmp/speck-<id>-tests.txt`. Fix anything the merge broke, changing only what the merge needs.
5. Commit the merge (`speck(<id>): merge <base_branch>`).
6. Get it reviewed. Every conflict merge gets a merge round, whatever its class: `speck ship` refuses a ticket whose files changed after the reviewer approved, and the merge changed them. Run a review round as the `speck-review` skill describes: `speck review <id> --tests=/tmp/speck-<id>-tests.txt --response=/tmp/speck-<id>-response.md`. It accepts the `approved` ticket, sets it to `reviewing` and counts the round as a merge round (these don't count towards `max_review_rounds`; `max_merge_rounds` caps them). Write the response file fresh, replacing any left from the build: it lists each file you resolved, its class and how you resolved it.
7. Take turns with the reviewer as the `speck-review` skill says, until `speck next <id>` says `ship` or `block`. Fix each blocking finding, re-run the tests and commit before every round.
   - On `ship`: run `speck close <id>`, then `speck ship <id>` again, and go back to step 3 of "Start" with what it says.
   - On `block`: ask the user (see "Asking the user").
8. If `speck ship <id>` exits with 13 again after two merges, stop without asking the user: leave the ticket `approved` and report that new changes keep arriving in the same files, naming them. The ship queue tries it again later. Ask only if the clash turns out to be two tickets contradicting each other.

## Base branch failing

`speck ship <id>` exits with 14 when the tests fail on the ticket's branch and on the base branch as it is. It isn't this ticket's fault, so change no code: not in this ticket's branch, and not in the base branch.

1. Look for an open fix ticket: a ticket in `speck/tickets/` (not `speck/tickets/done/`) with `type: fix`. If one already covers this failure (the same failing tests, or the same cause), don't make another: go to step 3 with that ticket.
2. Otherwise, in the main checkout on the base branch, create one: `speck new "<title>" --type=fix`. Give it a title saying what's broken, and fill in its Problem, Outcome and Acceptance criteria in plain words: which tests fail on the base branch, what they show, and that they must pass again. Don't guess at a cause you haven't seen in the output. Commit only that ticket file, staged by name (`speck(<fix-id>): fix ticket`).
3. Read `auto_fix_main` in `speck/config.yml` (missing counts as `false`). Leave the fix ticket as it is unless it's `draft` in the main checkout and has no branch yet (`git branch --list '<branch_prefix><fix-id>-*'` prints nothing): one that's ready, building, reviewing, approved or blocked is already on its way, and setting it ready would undo that. In the main checkout, run `speck set <fix-id> status ready` on a draft one only when `auto_fix_main` is `true`. Otherwise leave it `draft`, for the user to approve.
4. Then stop. Leave this ticket `approved`, and report in plain words: the base branch's tests are failing, which fix ticket covers it, and whether it's ready or waiting for the user's approval. The ship queue tries this ticket again once the fix has shipped.

## Asking the user

Ask the user only when two tickets contradict each other, or when `speck next <id>` says `block` during a merge round. Nothing else is a reason to ask.

1. Write one question under `## Blocked question` in the ticket. Write it in plain words, without git terms (no merge, branch, conflict or commit): say what each ticket wants, the options, and which one you recommend and why. Make it answerable in a sentence.
2. Run `speck set <id> status blocked`, then commit the ticket and any work in progress, staged by name.
3. Stop, and report the question.

## Rules

- Never change a file the merge doesn't need. Fix nothing else you notice: mention it when you report back instead.
- Never merge into the base branch or push, except through `speck ship <id>`. Never force anything past a refusal.
- Never edit a ticket's `## Review rounds` by hand. Only speck writes it.
- Never approve your own work. Only the reviewer approves.
- Stage only the files you changed, by name (`git add <path> …`). Never use `git add -A`, `git add .` or `git commit -a`.
