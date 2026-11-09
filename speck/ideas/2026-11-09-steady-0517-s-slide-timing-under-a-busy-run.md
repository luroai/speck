# Steady 0517's slide timing under a busy run

Captured: 2026-11-09 20:16 · Status: inbox
From ticket: 0581
Raised by: agent

## What
The 0517 AC3 browser test, which expects each lane slide's first frame within 50 ms of the lane change, should hold up while many test files run at once.

## Why
It failed once during 0581's related run, at 58 ms against 19 to 23 ms for the other slides, and passed three times out of three when run alone. A timing check that trips on a busy machine can hold up a ship for a reason that has nothing to do with the ticket.

## Notes
- Seen in 0581's first review round, with 366 test files running together.
- Open question: allow more time for the first slide only, or measure it in a way that doesn't depend on the machine's load?
