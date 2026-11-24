# Show the machine-wide build limit in Settings

Captured: 2026-11-24 18:59 · Status: ticketed (0746)
From ticket: 0707
Raised by: agent

## What
Settings should show `machine_parallel_builds` after "Builds at once", and let you change it, as 0707 did for `machine_parallel_tests`.

## Why
0726 added a home-folder limit on builds across every project, but only `speck config set` and `speck config show` reach it, so someone who tunes speck from the panel won't know it exists or that it's set.

## Notes
- From my own note while building 0707, which kept to the test limit. Adding it to `PANEL_HOME_SETTINGS` and giving it a row like `homeRow`'s should be most of the work.
