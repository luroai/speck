# Leave chance failures out of a hand-back

Captured: 2026-10-17 · Status: ticketed (0377)
Triaged: 1
From ticket: 0264

## What
When a ship's tests fail, the failing tests' files are run once more and some pass there, those tests shouldn't be named as the ticket's own failures, or be what sends it back to its build.

## Why
A ship names the failing tests from the full run, including ones that passed on the second try. With the base branch failing, 0264 hands a ticket back when any named test passes on the base branch, so a chance failure alone can send a ticket back to its build to fix a test that isn't broken.

## Notes
- From the builder's own note on 0264, which left the second-try handling as it was.
