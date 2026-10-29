# Steady the 0384 AC3 running-round test under load

Captured: 2026-10-28 11:40 · Status: dropped
From ticket: 0537
Raised by: agent

## What
"0384 AC3: the panel shows the round as running through every exit 12, until it is recorded" should pass however busy the machine is.

## Why
0540 steadied it, but it failed again in 0537's `speck test --related` run of about 1,600 tests, and passed when its file ran alone. If it fails like that in `speck ship`, it stops a ticket that didn't break it.

## Notes
- Seen in 0537's build on 2026-10-28; 0537 changed nothing it tests.
- Not the same test as `2026-10-28-steady-the-0384-run-twice-at-once-test.md` (that's AC2).
