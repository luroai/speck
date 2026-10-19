# Let speck pause and stop a build started outside speck run

Captured: 2026-10-18 · Status: inbox
Triaged: 1
From ticket: 0300

## What
`speck pause`, `speck play` and `speck stop` (and the panel's stop) work on a build speck run sees but didn't start, such as `/speck-build` in a conversation or a build resumed by hand.

## Why
Since 0300, speck run counts and shows those builds, but pause and stop still only take a build whose process leads its own process group, as the ones speck run launches do. A conversation's agent often doesn't, so the panel shows a build you can't pause or stop from there, and stopping it would end the whole conversation rather than just its build.

## Notes
- From my own note while building 0300: run records for such builds are marked `seen: true` and name the agent's own process.
- Open question: should stopping one end the conversation's process, or only what it's running for the build?
