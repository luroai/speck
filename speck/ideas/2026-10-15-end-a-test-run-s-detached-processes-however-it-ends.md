# End a test run's detached processes however it ends

Captured: 2026-10-15 · Status: inbox
Triaged: 1
From ticket: 0202

## What
When a test run finishes on its own, or the speck process watching it is killed outright, speck ends only the run's process group. Processes the tests started in a group of their own, or that outlived their parent, keep running. End those too, as a stalled or stopped run now does.

## Why
A test suite that leaves a detached process behind leaks it on every run, using memory and slowing later runs and builds on the same machine, the same kind of leak that pushed the load above 100 on 2026-10-14.

## Notes
- From building 0202, which covered only runs speck ends (stalled, stopped by a signal, or whose starter went). The shared process finding in `scripts/procs.mjs` could be used for the other two.
- Open question: should a run that passes but leaves processes behind say so, rather than end them silently?
