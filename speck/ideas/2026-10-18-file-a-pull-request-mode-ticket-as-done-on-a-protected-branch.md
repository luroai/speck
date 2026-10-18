# File a pull request mode ticket as done on a protected branch

Captured: 2026-10-18 · Status: inbox
From ticket: 0296

## What
In pull request mode, filing a shipped ticket as done shouldn't need a direct push to the base branch, for example by committing it as done on the ticket's branch before the pull request is merged.

## Why
On a base branch that only takes pull requests, the done ticket's commit can never be pushed, so every ship ends saying it wasn't pushed, and your local base branch drifts from GitHub's.

## Notes
- From 0296's build: shipping commits the done ticket on the local base branch after the merge and pushes it; a refused push is kept in the ship record for the panel.
- Open question: committing it on the branch changes the pull request's head, so GitHub runs its checks again before the merge.
