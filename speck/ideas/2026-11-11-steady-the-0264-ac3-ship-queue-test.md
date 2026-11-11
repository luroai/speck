# Steady the 0264 AC3 ship queue test

Captured: 2026-11-11 14:36 · Status: inbox
From ticket: 0645
Raised by: agent

## What
`0264 AC3: speck run doesn't put shipping on hold, and hands the ticket back to its build` in test/ship-0264.test.mjs failed once with "Cannot read properties of undefined (reading 'done')": the ship queue hadn't launched the ship yet when the test read it. It should wait for the launch with a time limit rather than expect it straight away.

## Why
It fails by chance under a busy run (200 test files at once), so a build's related run or the full suite can fail on a ticket that didn't touch it.

## Notes
- Seen in 0645's `speck test --related` run; it passed alone twice and in the next run.
