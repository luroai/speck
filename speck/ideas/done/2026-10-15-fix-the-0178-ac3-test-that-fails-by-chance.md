# Fix the 0178 AC3 test that fails by chance

Captured: 2026-10-15 · Status: ticketed (0246)
From ticket: 0211

## What
"0178 AC3: the panel works out the same queue, Plan, Shipped list and figures from the cut-down board" sometimes fails because the two boards it compares give a live elapsed-time counter a second apart (`6013:28` against `6013:29`). It should give the same result whichever second it runs in.

## Why
It failed in 0211's full run and passed when run again, so it costs a second run of its file, shows in the flaky log and could hide a real failure.

## Notes
- Seen in 0211's whole-suite run on 2026-10-15. Not covered by 0207, which fixes four other tests that fail by chance.
- Likely fix: leave the live counters out of the comparison, or work both boards out at the same moment.
