# One build at a time (WIP 1)

Captured: 2026-10-11 · Status: ticketed (0111, 0112, 0113, 0114, 0115, 0116)

## What
speck runs one build at a time, in its own worktree, so you keep shaping ideas and tickets on main while builds and ships are handled. You create tickets, set them ready and walk away.

## Why
Running builds in parallel caused most of the stoppages on 10 and 11 October, and about 20 tickets since worktrees (0028) went into making builds run side by side. Isolation (worktrees) is what you need, not parallelism.

## Notes
- Decided 2026-10-11: WIP of 1 is a principle. `max_parallel_builds` set to 1, and the ship queue (0102–0105) cancelled.
- No separate shipping agent: the builder ships its own ticket.
- Follow-ons: write the principle and its reasons into the brief, make builds faster by running the full suite less, keep the user's edits on main from breaking a build in flight, and fold 0101's skill into the build.
- Machinery that only exists for parallel builds (`max_parallel_builds`, test turns 0109, some conflict handling) gets simplified later, in small tickets.
