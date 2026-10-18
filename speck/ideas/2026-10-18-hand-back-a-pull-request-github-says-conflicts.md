# Hand back a pull request GitHub says conflicts

Captured: 2026-10-18 · Status: inbox
From ticket: 0316

## What
In pull request mode, when GitHub reports that a ticket's pull request conflicts with the base branch, `speck ship` refuses with its ordinary error, not exit 13, so `speck run` doesn't hand the ticket back to its build to merge the base branch in. Treat a conflict GitHub reports like the one ship's own landing test finds (exit 13), so the build resolves it and gets the merge reviewed.

## Why
Until then the ticket waits for its pull request to change, which nothing does by itself, so an auto-shipped ticket can sit approved with a conflict until the user notices. The `/speck-ship` skill can't promise a hand-back for it either.

## Notes
- From 0316's review, minor finding F1: whyNotMergeable in scripts/pr-ship.mjs refuses a CONFLICTING or DIRTY pull request before the exit-13 check in testLanding is reached.
- Open question: would GitHub and the local landing test ever disagree about a conflict?
