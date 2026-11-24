# Steady the 0289 killed-Codex-build test's reads

Captured: 2026-11-24 13:43 · Status: ticketed (0742)
From ticket: 0711
Raised by: agent

## What
The fake `codex` in `test/run-codex-0289.test.mjs` writes each call's JSON file with a plain write, and the test's `calls()` reads every file in that folder while it polls. Write each file under a temporary name and rename it into place, or skip a file that doesn't parse yet, so the test never reads a half-written one.

## Why
"0289 AC3: speck run resumes a killed Codex build in its own session" failed in 0711's related run with `Unexpected end of JSON input`, at load average ~62 from other builds, and passed when run again. A flaky test can fail a ship's test run for a ticket that never touched it.

## Notes
- Seen in 0711's `--related` run. The failing read is `read()` in `calls()` (test/run-codex-0289.test.mjs, about line 45), called from `until()` at line 174.
