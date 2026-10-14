# Stop asking for a log once its build has ended

Captured: 2026-10-09 · Status: ticketed (0179)
Triaged: 1
From ticket: 0052

## What
An open queue ticket's log is asked for every second until the ticket is closed or leaves the queue, even after its build has exited and the log can't change.
Stop (or slow) the requests once the build is known to have ended, for example when the ticket has a `build_exit`.

## Why
A ticket left open on a red or blocked build keeps sending a request a second for as long as the page is open, for nothing.
It's a small local request, so this matters little, but it's needless work for the panel server.

## Notes
- From 0052, which put "stopping the requests once a build has ended" out of scope as a guess at when to stop.
- Open question: what counts as ended (a `build_exit`, a status, or a log unchanged for a while), and whether a new `speck run` launch should start the requests again.
