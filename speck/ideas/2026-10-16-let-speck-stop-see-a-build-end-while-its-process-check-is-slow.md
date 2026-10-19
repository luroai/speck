# Let speck stop see a build end while its process check is slow

Captured: 2026-10-16 · Status: inbox
Triaged: 1
From ticket: 0218

## What
When every full check of the running processes takes longer than `speck stop`'s five seconds, check the build's known processes directly as well (for example `process.kill(pid, 0)`, which is instant), so stop returns as soon as they've ended and force-ends only those still there.

## Why
On a very busy machine, a build whose processes end as soon as they're asked still makes `speck stop` wait the full five seconds, then sends a force-end to processes that have already gone. That's never slower than before 0218, but it's slower than it needs to be, and a force-end to a process that has gone could in rare cases reach a new process that has taken its number.

## Notes
- The reviewer's open finding F2 on 0218. The user chose to accept it as it is for 0.5.1.
- `kill(pid, 0)` counts a finished process waiting for its parent (a zombie) as still there; such a one would still get the wait, and a harmless force-end.
