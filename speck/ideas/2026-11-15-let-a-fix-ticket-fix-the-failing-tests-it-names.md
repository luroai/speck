# Let a fix ticket fix the failing tests it names

Captured: 2026-11-15 13:02 · Status: inbox
From ticket: 0671
Raised by: agent

## What
Say in the build and review skills (and the reviewer's prompt) that a `type: fix` ticket may change or fix the failing tests it names, even though they're listed as failing before the build. Other failing-before tests stay off limits.

## Why
Every fix ticket lists its own target test as failing before the build, and the rule "a test failing before this build is never changed or fixed" then makes the reviewer escalate. 0671 blocked on exactly this, and only went on because watch: decide took the recommendation.

## Notes
- From 0671's round 1, where the reviewer escalated with both criteria passing.
- An alternative: have the build leave a fix ticket's own named tests out of its `Failing before this build` line.
