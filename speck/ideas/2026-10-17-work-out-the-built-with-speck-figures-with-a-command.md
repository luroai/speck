# Work out the Built with speck figures with a command

Captured: 2026-10-17 · Status: inbox
From ticket: 0267

## What
Give release tickets a command that works out the README's "Built with speck" figures (tickets shipped and cancelled, median build minutes, median review rounds, approved in the first round) from the done tickets, so the person preparing a release can copy them in.

## Why
0267 removed the release tests that read those figures out of the README's sentences, because they failed whenever the section was reworded. Nothing now checks the figures, so a release can ship with stale or wrong numbers, and working them out by hand is slow.

## Notes
- From the builder's own note on 0267. The removed helpers (`builtWithSpeckFigures`, `readmeFigures`, `doneTicketsAt`) are in `test/support/release.mjs` on main before 0267, and could be the starting point.
- Open question: print the figures only, or also check the README with a test that reads numbers without depending on its sentences?
