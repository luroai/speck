# Steady the 0476 AC4 swipe test under heavy load

Captured: 2026-11-27 01:12 · Status: inbox
From ticket: 0776
Raised by: agent

## What
Make "0476 AC4: at 390 px the column is at most 720 px wide, centred, with one lane in view, and a swipe slides between them" pass reliably on a very busy machine.

## Why
It failed once in 0776's related-tests run (about 460 files, load average around 100, another build's load test beside it) with "the browser dropped the end of the touch 3 times in a row, so the page never saw the finger lift", and passed when run again. An unsteady test can fail a ship and hand a finished ticket back to its build.

## Notes
- From 0776's own related run. 0738 added the retries for a dropped touch end (up to 3 tries); under this load all three were dropped.
- Open question: more tries, a wait between tries, or slowing the gesture down when the page is starved.
