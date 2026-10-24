# Confirm sleep time is left out on a real Mac

Captured: 2026-10-20 · Status: dropped
From ticket: 0344

## What
On a real Mac, close the lid during a build `speck run` started, open it again later, and check that `speck run`'s log says the machine was asleep, and that the ticket's `waited_seconds` grew by about that long. Fix whatever doesn't match.

## Why
0344's macOS part reads `sysctl kern.sleeptime` and `kern.waketime` and assumes Node's clock keeps counting through sleep there, but it was built on Linux with stand-in values. If either is wrong, Mac users' build times still count the hours asleep, skewing the panel's and the README's figures.

## Notes
- From 0344's Notes ("Unconfirmed").
- Power Nap and dark wakes may update `kern.waketime` without a full wake, and only the last sleep is read, so several sleeps between two checks count only the last.
