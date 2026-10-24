# Fix the 0193 ship test that fails by chance

Captured: 2026-10-23 · Status: dropped
From ticket: 0429

## What
`0193 AC1 AC4: speck run ships with speck ship --auto, and stopping it doesn't stop the ship` sometimes fails while it checks a ticket's status. The ticket's file is moved into done/ between finding it and reading it. The status check should cope with the file moving, by looking again or waiting, rather than failing.

## Why
It failed once in a full suite run during 0429 and passes on its own. A ship's whole-suite run that hits it fails for no reason in the ticket being shipped, and hands the ticket back.

## Notes
- From 0429's full `npm test` run: TypeError "The \"path\" argument must be of type string… Received undefined" from statusIn in test/support/ship.mjs, called from test/run-0193.test.mjs line 235.
- It passed three runs in a row on its own.
