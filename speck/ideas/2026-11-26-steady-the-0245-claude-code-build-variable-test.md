# Steady the 0245 Claude Code build variable test

Captured: 2026-11-26 23:57 · Status: inbox
From ticket: 0773
Raised by: agent

## What
`0245 AC1: a new build speck run starts with Claude Code has the variable set to 1` (test/run-0245.test.mjs) failed once with "Unexpected end of JSON input" and passed when run again unchanged. It looks like it reads a file of recorded calls while it is still being written. Make it wait for a complete record.

## Why
An unsteady test can fail a ship or a full-suite run for no reason, sending tickets back to their builds or making a needless fix ticket.

## Notes
- Seen in 0773's `speck test --related` run (the JSON.parse in its calls() helper, line 43). 0773 didn't touch run-0245 or what it tests.
