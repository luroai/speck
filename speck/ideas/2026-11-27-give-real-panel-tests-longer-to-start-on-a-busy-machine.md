# Give real-panel tests longer to start on a busy machine

Captured: 2026-11-27 00:52 · Status: inbox
From ticket: 0775
Raised by: agent

## What
The shared test helper that starts a real panel gives it 10 s to print its address. On a busy machine many panel tests fail on that alone. Give them as long as a busy machine needs, as 0775 did for the two 0067 restart tests.

## Why
An unsteady test fails builds' related runs and ships for no real fault, and hands finished tickets back to their builds.

## Notes
- From 0775's related run (488 files, load about 77 beside other builds): 92 of its 96 failures were "panel didn't start within 10 s", across 0051, 0057, 0354 and many panel-00xx and 01xx files. All passed when run again.
- 0775 added an optional time limit to the helper, so raising the default is a one-line change; check that it doesn't hide a panel that never starts for too long.
- Related: 0774's build has a note on the same failure in the quick checks' real-panel tests (2026-11-27-steady-the-quick-checks-real-panel-tests-under-load.md).
