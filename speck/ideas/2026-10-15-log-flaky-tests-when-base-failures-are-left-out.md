# Log flaky tests when base branch failures are left out

Captured: 2026-10-15 · Status: inbox
From ticket: 0228

## What
When the retry leaves out tests that already fail on the base branch, a new failing test that passes on the second try is neither named in a `Flaky:` line nor added to the shared flaky log. Add such tests to the flaky log, without a `Flaky:` line (which would make the summary call the run passed).

## Why
While `main` has failing tests, every build's run leaves some out, so tests that fail by chance stop being logged just when the log matters most for spotting them.

## Notes
- From the builder's own note on 0228: the run still fails (it has to, the base branch's failing tests failed), so 0228 skipped the Flaky line and the log entry alike.
- Open question: should the summary for the reviewer also say which new failures passed on the second try in that case?
