---
name: speck-ship
description: Ship a speck ticket that the reviewer has approved, by merging its branch into the base branch, pushing and tidying up. This is the user's gate, so only run it when the user types /speck-ship <id> or says "ship <id>". Never run it as part of a build.
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
2. Report the result in a sentence or two. If it refused, explain the reason in plain English and the next step, for example "re-run the review with `/speck-review <id>`" when code changed after approval, or "the base branch's own tests are failing, so fix it first" on exit 14. Don't work around a refusal: never merge by hand, force a push or edit the ticket's status to get past a check.
