# Update the panel in real time

Captured: 2026-10-11 · Status: idea

## What
Replace the panel's polling with real-time updates: the panel server watches the project's files and pushes each change to the page as it happens, for example with Server-Sent Events. The board and an open build's log update the moment something changes.

## Why
Today the page asks for the whole state every 2 seconds, and for an open build's log every second. Changes show up late, and the page keeps asking even when nothing is happening.

## Notes
- The panel server already watches its own code files to restart itself, a starting point for watching the project.
- Would make `speck/ideas/2026-10-09-stop-asking-for-a-log-once-its-build-has-ended.md` unnecessary, since the log would be pushed rather than fetched.
- Doesn't fix the jumping build timers, which count in the browser: `speck/ideas/2026-10-11-keep-build-timers-counting-smoothly.md`.
- Open questions: what to watch (tickets, run records, build logs, git), how the page recovers after the server restarts, and whether to keep a slow poll as a fallback.
