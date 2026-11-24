# Show the machine-wide test limit in Settings

Captured: 2026-11-15 15:08 · Status: ticketed (0707)
Triaged: 1
From ticket: 0678
Raised by: agent

## What
Show `machine_parallel_tests` in the panel's Settings view, beside `max_parallel_tests`, and let it be changed there, saved in the home folder as `speck config set` saves it.

## Why
0678 added the limit on test runs across every project on the machine, but only `speck config set` and `speck config show` reach it. Someone who tunes speck from the panel won't know it exists, or that it's set.

## Notes
- From the builder's own note on 0678: the panel was out of its acceptance criteria.
- Open question: the view says a change is saved "for your machine only"; this one is saved for every project, so it needs its own wording.
