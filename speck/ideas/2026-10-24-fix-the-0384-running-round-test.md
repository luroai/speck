# Fix the 0384 test of a running review round

Captured: 2026-10-24 · Status: inbox
Triaged: 1
From ticket: 0439

## What
The test "0384 AC3: the panel shows the round as running through every exit 12, until it is recorded" fails on the base branch: just after the first `speck review` exits 12, the round isn't shown as running. Find out why and make it pass again.

## Why
`speck ship` runs the whole suite, so if it fails there too, every ticket's ship stops on it. If it only fails in some setups, such as inside a build started by `speck run`, it makes test results hard to trust.

## Notes
- Found during 0439's build: it failed in the related run and when run alone, with 0439's changes stashed too. The test result speck had recorded for the base branch (commit 7cf85a9) passed, so it may depend on the environment it runs in, for example inside a build session. The cause hasn't been checked.
