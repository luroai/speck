# Stop the pause and stop tests leaving processes running

Captured: 2026-10-13 · Status: inbox
From ticket: 0152

## What
Every full test run leaves a `ticker.cjs` process running in the background, from the tests of pausing and stopping a build (0070, 0072). The tests should end every process they start.

## Why
They pile up on the machine running the builds: about 17 were running, some for hours, while 0152 was built.

## Notes
- From the builder's own notes on 0152. Each is its own session leader, so ending the test run doesn't end it. Helper: `test/support/ticker.mjs`.
