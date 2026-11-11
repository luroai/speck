# Remember the reviewer's limit while a stand-in reviews

Captured: 2026-11-11 15:04 · Status: inbox
From ticket: 0649
Raised by: agent

## What
Keep a reviewer's usage limit on record after a stand-in has taken a round, until it resets, so later rounds go straight to the stand-in, and speck run's status still says the reviewer is limited.

## Why
A recorded round clears its build's record of the limit, as 0623 does. Once every build's round has run on a stand-in, no record is left, so each later round asks the limited reviewer first and is refused before switching, and the status line no longer says the reviewer is waiting for its reset.

## Notes
- From my own note while building 0649. The record can't simply stay, as it also marks a build as waiting to be carried on (reviewerWaiting), which would hide a blocked build from what needs you. It may want a limit record kept apart from the per-build one.
