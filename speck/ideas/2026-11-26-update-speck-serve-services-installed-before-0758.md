# Update speck serve services installed before 0758

Captured: 2026-11-26 11:48 · Status: inbox
From ticket: 0758
Raised by: agent

## What
A speck serve service installed with `speck serve --install` before 0758 keeps `KillMode=mixed` in its systemd unit until `--install` is run again. speck could notice an installed unit that's out of date and say so, or rewrite it itself, when speck serve starts.

## Why
With the old unit, stopping or restarting the service kills every project's speck run and its builds, which is what 0758 set out to stop. Someone who installed the service before updating speck won't know to install it again.

## Notes
- From my own note on the merge of 0759 into 0758, which changed the unit to `KillMode=process`.
- Open question: rewrite the unit automatically, or only say so in speck serve's output and `speck doctor`?
