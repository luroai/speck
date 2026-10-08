---
name: speck-ship
description: Ship a speck ticket that the reviewer has approved, by merging its branch into the base branch, pushing and tidying up. This is the user's gate, so only run it when the user types /speck-ship <id> or says "ship <id>". Never run it as part of a build.
disable-model-invocation: true
---

# speck ship

Shipping is the user's decision. Running `/speck-ship <id>` is their approval, like clicking Merge. **Run this only because the user asked for this ticket to be shipped. Never ship on your own initiative or as part of `/speck-build`.**

CLI: `node .speck/scripts/speck.mjs`, run from the repo root (below: `speck`).

## Steps

1. Run `speck ship <id>`. It does everything, or nothing:
   - It checks that the ticket is `approved`, the review loop says `ship`, the working tree is clean, nothing outside `speck/` changed after the reviewer approved, and the tests pass. If any check fails, it stops with the reason and changes nothing.
   - It then sets the ticket to `done` on its branch, merges the branch into the base branch with a merge commit, deletes the branch and leaves the user on the base branch. If the merge conflicts, it aborts and leaves everything as it was.
   - If the base branch has a remote, it pushes it. If the push is refused, the merge stays local and it says how to fix the push.
2. Report the result in a sentence or two. If it refused, explain the reason in plain English and the next step, for example "re-run the review with `/speck-review <id>`" when code changed after approval. Don't work around a refusal: never merge by hand, force a push or edit the ticket's status to get past a check.
