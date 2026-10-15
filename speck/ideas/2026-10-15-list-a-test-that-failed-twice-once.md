# List a test that failed on both tries once

Captured: 2026-10-15 · Status: inbox
From ticket: 0209

## What
When a full test run fails and its failing tests fail again on the second try, the reviewer's test summary lists each of them twice, once for each run, and its totals are the second run's few files rather than the whole suite's. The summary should list each failing test once, with the second try's details, and keep the full run's totals.

## Why
A reviewer reading the summary sees double the failures and totals that look like a tiny suite, which is confusing and can cost a review round asking about it.

## Notes
- From the builder's own note on 0209, which kept this case as it was on purpose (its AC2).
- Open question: show both tries' error details, or only the second's?
