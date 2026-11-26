# Write the other fake agents' call files whole

Captured: 2026-11-24 23:15 · Status: ticketed (0774)
From ticket: 0742
Raised by: agent

## What
The fake agents in other `speck run` tests should write each call file under another name and rename it into place, as the 0289 fake now does.

## Why
They use a plain write while the test reads the folder, so a busy machine can make a test read half a file and fail for no real reason.

## Notes
- From the build of 0742, which put them out of scope. Seen in run-0110, run-0194, run-cursor-0290, run-builder-0312, run-settings-0549, machine-builds-0726 and support/provider-builder.mjs; not checked which of their tests read while the fake runs.
- None of these has been seen to fail this way.
