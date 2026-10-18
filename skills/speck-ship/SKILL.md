---
name: speck-ship
description: Ship a speck ticket that the reviewer has approved, by merging its branch into the base branch, pushing and tidying up, or, with ship_mode pr, by merging its pull request on GitHub. This is the user's gate, so only run it when the user types /speck-ship <id> or says "ship <id>". Never run it as part of a build.
disable-model-invocation: true
---

# speck ship

Shipping is the user's decision. Running `/speck-ship <id>` is their approval, like clicking Merge. Clicking the Ship button in an approved ticket's review pack in `speck panel` is the same approval: it runs the same `speck ship <id>`. Only the user clicks it; an agent never does. **Run this only because the user asked for this ticket to be shipped. Never ship on your own initiative or as part of `/speck-build`.**

CLI: `node .speck/scripts/speck.mjs`, run from the repo root (below: `speck`).

## Steps

1. Run `speck ship <id>`. It does everything, or nothing:
   - It checks that the ticket is `approved`, the review loop says `ship`, the ticket's folder is clean, nothing outside `speck/` changed after the reviewer approved, and the tests pass on the ticket merged with the base branch as it is now, which is exactly what lands. Uncommitted edits in the base branch's checkout are fine and stay there, unless they're staged or in a file the ticket changes. When staged files are all that's in the way, it says which they are and waits, changing nothing, until they're committed or unstaged, then ships. It gives up after `ship_wait_minutes` (default 30). An edit to a file the ticket changes stops it at once. If any check fails, it stops with the reason and changes nothing.
   - If the tests fail, it runs them again on the base branch as it is, in a temporary worktree it then removes. If every failing test fails there too, it exits with 14 and says the base branch's own tests are failing, so it isn't the ticket's fault. If they pass there, it says so. If the base branch is failing but some of the failing tests pass there, it says the ticket fails tests that pass on the base branch, names them, and says the base branch is failing as well.
   - If the base branch has a remote, it fetches it first and brings in any new commits. If local and remote have both moved on, it refuses and says to `git pull`.
   - It then sets the ticket to `done` on its branch, merges the branch into the base branch with a merge commit, deletes the branch and leaves the user on the base branch. If the merge conflicts, it aborts, leaves everything as it was and exits with 13.
   - If the base branch has a remote, it pushes it, then deletes the ticket branch on the remote too. If the push is refused, the merge stays local, the remote branch is kept and it says how to fix the push.

   That's shipping with `ship_mode: local`, the default. With `ship_mode: pr` in `speck/config.yml`, the ticket already has a pull request on GitHub, opened when it was approved, and shipping merges that pull request on GitHub instead (`gh pr merge --merge`). It makes the same checks first, and tests the ticket merged with the remote's base branch as it is now. It merges only when GitHub has nothing in the way: no failing or unfinished checks, no conflict, no review it still requires and no draft. Then it brings the local base branch up to date with the remote's and removes the ticket's worktree and branch, locally and on the remote. It never pushes straight to the base branch.

   When GitHub can't merge it, `speck ship` says why and changes nothing, and the ticket stays approved. What to do depends on the reason it gives:
   - Checks failing or still running, a review still required, or a draft: deal with it on GitHub (wait for the checks, get the review, mark it ready), then ship again.
   - A conflict with the base branch (exit 13): as with a local ship, the ticket needs the base branch merged in and the merge reviewed before it can ship. When `speck run`'s ship queue started the ship, it hands the ticket back to its build for that.
   - No pull request yet, or `gh` not installed or signed in: install `gh` or run `gh auth login` as the message says, then `speck pr <id>` to open the pull request, and ship again.
   - It pushed the commit that files the ticket as done and didn't merge yet: ship again once GitHub has run its checks on it.
   - GitHub only queued the merge, as with a merge queue: ship again once it's merged, to tidy up.
2. Report the result in a sentence or two. If it refused, explain the reason in plain English and the next step, for example "re-run the review with `/speck-review <id>`" when code changed after approval, or "the base branch's own tests are failing, so fix it first" on exit 14. Don't work around a refusal: never merge by hand, merge the pull request yourself on GitHub, force a push or edit the ticket's status to get past a check.
