# Show the reviewer which failures passed on a retry

Captured: 2026-10-15 · Status: ticketed (0209)
From ticket: 0195

## What
When a full test run passes only on its second try, the summary of the test output the reviewer gets should say which failing tests passed the second time, rather than listing them as failing tests alongside a run that passed.

## Why
The summary reads the first run's failures, so a reviewer sees "Failing tests (1)" for a run that counts as passed, and may spend a round asking about it. The `Flaky:` line at the end of the output isn't in the summary.

## Notes
- From 0195's build: both full runs had a chance failure (0128 AC4, then 0176 AC1) that passed on the retry; the summary still listed it as failing.
