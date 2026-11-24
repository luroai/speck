# Name only the tests that still fail after a full-suite retry

Captured: 2026-11-24 16:08 · Status: ticketed (0745)
From ticket: 0736
Raised by: agent

## What
When the full suite's retry leaves only some of the first run's failures, `latest.json` and the fix ticket should name those remaining failures, not every not-ok from the first run as well.

## Why
A busy machine's first run can fail dozens of tests by chance; the retry usually clears them. Listing all first-run names makes an oversized fix ticket (0736 named 22 when only 0159 AC3 still failed) and sends the builder after tests that already pass alone.

## Notes
- From 0736: `full-suite.mjs` builds `tests` with `failingTestFiles`, which does not drop first-run failures that passed on the second try the way `failingTests` does since 0377.
