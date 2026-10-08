---
name: ship
description: Ship a speck ticket that the reviewer has approved. Close the ticket and log actuals inside the branch, push, open a PR with the review pack, and set the speck/review status check. Never merges. Use from /speck:build after approval, or when the user says "speck ship <id>".
---

# speck ship

Opens the PR for the user's final gate. **You never merge.**

CLI: `node ${CLAUDE_PLUGIN_ROOT}/scripts/speck.mjs` (below: `speck`).

## Steps

1. **Confirm approval:** `speck next <id>` must print `ship`. If it doesn't, stop and go back to the review loop.
2. **Close the ticket inside the PR** so that merging is what makes it true:
   - Add one line per review round to `## Review log`, for example: `Round 1 (codex): changes requested: F1 missing empty-input case. Round 2: approved.`
   - Fill in `## Delivery log`: review rounds, the reviewer tokens from `speck pack`, elapsed time, and any follow-up ideas from minor findings.
   - Run `speck set <id> status done`.
   - Commit the ticket and `work/reviews/<id>/` (`speck(<id>): ship`).
3. **Push and open the PR:**
   ```
   git push -u origin HEAD
   speck pack <id> > /tmp/speck-<id>-pack.md
   gh pr create --base <base_branch> --title "<id>: <ticket title>" --body-file /tmp/speck-<id>-pack.md
   ```
4. **Set the review check** on the head commit. This is what branch protection requires:
   ```
   gh api repos/{owner}/{repo}/statuses/$(git rev-parse HEAD) \
     -f state=success -f context=speck/review \
     -f description="Approved by <reviewer> in round <N>"
   ```
   The check must point at the commit the reviewer approved plus the ship commit. If you push code changes after this, the approval no longer applies: re-run the review.
5. **Report** the PR link, a one-line summary and anything the user should look at before merging, such as risk flags or follow-up ideas.

## Rules

- Never run `gh pr merge`, enable auto-merge, or approve the PR.
- If there's no remote or `gh` isn't authenticated, stop after step 2. Tell the user the branch is ready locally, and print the review pack.
