# Stop the build timer while a stopped build waits

Captured: 2026-10-14 · Status: inbox
From ticket: 0166

## What
When a build stops or exits before finishing, while its ticket is still building or reviewing, the Build queue shows "Build stopped unexpectedly" or "Build stopped before finishing", but its timer keeps counting. That idle time should be left out of the build time too, as blocked and paused time now are.

## Why
Until someone resumes it, nobody is building that ticket, so its timer and its shipped minutes count time spent waiting for the user, which is what 0166 set out to remove.

## Notes
- From the builder's own note on 0166, which covered only blocked and paused time.
- Open question: the ticket's status doesn't change when a build dies, so the stretch would have to come from the run record's exit time (or the kill being noticed) to the build being resumed.
