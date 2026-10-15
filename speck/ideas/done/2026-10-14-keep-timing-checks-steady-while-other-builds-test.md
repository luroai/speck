# Keep timing checks steady while other builds test

Captured: 2026-10-14 · Status: ticketed (0207)
From ticket: 0187

## What
The checks that time something (0176 AC1, how much bigger logs slow the board; 0177 AC3, the panel answering within 1 second while it reads) should give the same result whether or not other builds are running their tests on the same machine.

## Why
With several builds going at once, the machine's load average reached about 30, and these checks failed by a few points, then passed when run again. A build then has to spend time showing its reviewer that a failure isn't its own, and a real slowdown could be waved away as "just load".

## Notes
- From 0187's build: 0176 AC1 failed twice in full runs (333 vs 377 ms, against a 10% limit) and passed alone. A full run of main's suite under the same load failed both 0177 AC3 timing checks.
- `speck test --files` runs don't wait for a turn, so they add load to another build's full run.
- Open question: retry a timing check once, compare against a baseline measured in the same run, or have `--files` runs take turns too?
