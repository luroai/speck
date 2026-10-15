# Let a build fix a ticket that fails with newer main

Captured: 2026-10-14 · Status: dropped
From ticket: 0192

## What
When `speck ship --auto` refuses because the ticket and the base branch's newer changes fail their tests together, give that refusal its own exit code and teach `/speck-build` to handle it: merge the base branch in, fix the failing tests and get a merge round, as it does for a conflict (exit 13).

## Why
Today that refusal exits 1 like any other check, so an auto-ship build just stops and reports it, and the user has to restart the work by hand. It's the case 0192 now catches before it breaks main, so it will come up whenever two tickets clash in behaviour.

## Notes
- From the builder's own note on 0192. The refusal already says "fail together" and names the failing tests.
- Open question: should it count towards `max_merge_rounds`, like a conflict merge?
