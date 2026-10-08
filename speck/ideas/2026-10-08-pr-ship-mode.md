# PR ship mode for teams

Captured: 2026-10-08 · Status: idea

## What
A config setting, `ship: local | pr` (default `local`). In `pr` mode, the build opens a GitHub PR with the review pack once the reviewer approves, and sets the `speck/review` check. `/speck-ship <id>` then merges through GitHub (`gh pr merge`) instead of merging locally, or just tidies up if the user already merged in the GitHub app.

## Why
Teams, and solo builders who rely on GitHub Actions or branch protection, still want the PR. Local ship (ticket 0006) removes it for now. This brings it back as an option.

## Notes
- Comes after 0006, which replaces today's PR step with local ship.
- GitHub won't let you approve your own PR, so this mode needs either "required `speck/review` check, no required approval" or a bot account. Ticket 0002 (GitHub setup docs) belongs with this mode.
- Running `/speck-ship` again should be safe: if the PR is already merged, only tidy up.
- Open question: should `pr` mode push the branch and open the PR as a draft before review, or only after approval? (User's preference so far: only after approval.)
