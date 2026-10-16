# Turn off background commands in speck run builds

Captured: 2026-10-15 · Status: ticketed (0245)
From ticket: 0227

## What
When `speck run` starts a Claude Code build, set `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` in its environment, so the builder can't put a test run or review round in the background at all.

## Why
0227 tells the builder in the skills to wait for every command, but that's only an instruction. A builder that backgrounds the suite anyway and ends its turn still ends the build and kills the run, leaving the ticket `building` with nothing to carry it on.

## Notes
- From 0227's Unverified fact, checked on Claude Code 2.1.296: the variable exists and turns off background tasks.
- Open question: set it only for the default `build_command`, or for any command speck recognises as Claude Code? Other builders would need their own setting, if they have one.
