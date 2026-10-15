# Let a build's full suite run past ten minutes

Captured: 2026-10-15 · Status: inbox
From ticket: 0227

## What
Make sure a build's foreground test run can last longer than Claude Code's ten-minute limit on one shell command, for example by having `speck run` set `BASH_MAX_TIMEOUT_MS` higher when it starts a build.

## Why
0227 has the builder run every test run in the foreground, however long it takes. Claude Code stops a foreground command after `BASH_MAX_TIMEOUT_MS`, ten minutes by default. The full suite took about nine minutes on an 8 GB MacBook Air, so a slower run there would be cut off and the builder would see a failed run.

## Notes
- From checking 0227's Unverified fact on Claude Code 2.1.296.
- Open question: what limit to set, and whether to add it to the default `build_command` or to the environment `speck run` gives every build.
