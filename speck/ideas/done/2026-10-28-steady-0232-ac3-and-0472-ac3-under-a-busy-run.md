# Steady 0232 AC3 and 0472 AC3 under a busy run

Captured: 2026-10-28 · Status: ticketed (0557)
From ticket: 0542
Raised by: agent

## What
Make 0232 AC3 (a speck run whose checks cost more than 5% of one core fails 0176 AC3's check) and 0472 AC3 (every element's computed style is the same as before, in a real browser) pass when the whole suite runs alongside other test runs.

## Why
Both failed in whole-suite runs that had extra test runs going at the same time, on the base code and with 0542's change, and neither touches what 0542 changed. If a ship run lands on a busy machine, they can hand a ticket back for nothing.

## Notes
- From 0542's own whole-suite runs (Delivery log): 0232 AC3 failed in all three busy runs, 0472 AC3 in two of the three. 0384 AC3 failed too, but 0540 covers it.
- Not yet checked whether they fail under a plain `speck ship` run on a quiet machine.
