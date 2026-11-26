# Stop a project's speck run when it's turned off

Captured: 2026-11-26 12:08 · Status: inbox
From ticket: 0762
Raised by: agent

## What
When `speck projects off` turns a project off, `speck serve` stops the panel it started for it but leaves the project's `speck run` going, as speck serve never stops a run. Decide whether turning a project off should also stop the run speck serve started for it (not one started by hand).

## Why
A paused side project turned off still builds tickets in the background until its Auto-build switch is turned off, though it no longer shows at speck serve's address, so there's no switch to reach there. The user may expect "off" to mean nothing of it runs.

## Notes
- From 0762's own build: its acceptance criteria only ask for the panel to be stopped and the run not to be started or started again, so the run is left on.
- Open question: stop it and turn Auto-build off, or just stop it and start it again on `speck projects on`?
