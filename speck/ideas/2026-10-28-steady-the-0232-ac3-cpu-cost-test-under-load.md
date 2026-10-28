# Steady the 0232 AC3 CPU cost test under load

Captured: 2026-10-28 · Status: inbox
From ticket: 0541
Raised by: agent

## What
Make `0232 AC3` (0176 AC3's check fails for a speck run whose checks cost more than 5% of one core over 5 seconds) pass when the machine is busy, while it still catches a speck run that costs too much.

## Why
It failed in a whole-suite run during 0541's build, while other tests were loading every core. A test that fails by chance can stop `speck ship` for a ticket that didn't break it.

## Notes
- From 0541's own note: one failure at a load average of about 80 on 16 cores. It wasn't re-run alone.
- Open question: whether it measures CPU time, which load shouldn't change much, or wall time, which load does.
