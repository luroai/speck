# Make the test suite faster

Captured: 2026-10-11 · Status: ticketed (0117, 0118)

## What
Make speck's own test suite run faster. It takes about 108 seconds for 968 tests in 70 files (`node --test test/*.test.mjs`).

## Why
Every build waits on the full suite several times, so its speed sets the pace of every ticket. 0111, a docs-only change, spent about 5 of its first 6 minutes waiting on three full runs. Even after 0112 (reuse results) and 0113 (only the ticket's own tests while working), at least one full run per build remains, and one per ship.

## Findings (measured 2026-10-11, 16 cores)
- **Not CPU-bound:** the full run used about 3.8 of 16 cores (376% CPU over 108 seconds). It's held up by one slow file.
- **One file is the wall time:** `test/speck.test.mjs` (3,126 lines, 171 tests) takes 89 seconds alone. `node --test` runs files in parallel but the tests in one file one after another. None of its tests is slow on its own (median 0.44 seconds, the slowest 5.4); there are just a lot of them, each starting the `speck` CLI (about 90 ms) a few times and setting up a temporary git repo.
- **Next slowest files:** `run.test.mjs` 27 seconds, `panel-0067` 26, `panel-0050` 23, `turns-0109` 20, `stop-0072` 19. Every other file takes under 15. The panel files mostly sit waiting: `panel-0067` uses fixed waits of 2.5 and 4.5 seconds for the panel's polls (26 seconds elapsed for 5 seconds of CPU).
- **Flaky panel tests:** `test/support/panel.mjs` `freePort()` finds a free port, closes it, then starts the panel on it later. Panel test files running in parallel can take the same port in between ("Port … is already in use"). That hit 0077, 0040 and 0111's build, even with no other build running.

## Notes
- Biggest win: split `speck.test.mjs` into several files by area. The suite would then take about as long as the next slowest file, about 30 seconds instead of 108, with no change to what's tested.
- Then: shorter poll intervals for the panel tests (through a test-only setting), and starting the panel on port 0 so the system picks the port and the panel prints it, which removes the race.
- Starting the CLI faster (about 90 ms each time) isn't worth it yet.
