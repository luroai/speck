# Say in the README's run row that more builds can run at once

Captured: 2026-10-15 · Status: dropped
From ticket: 0225

## What
The README's command table says `speck run` starts a build for each ready ticket "one at a time", with no mention of `max_parallel_builds`. Make it say one at a time unless you raise `max_parallel_builds`, as the README's "Out of your way" point and the brief now do.

## Why
Someone reading the command table alone would think `speck run` can only ever build one ticket at a time, which contradicts the brief and the config template.

## Notes
- From the builder's own note on 0225, which kept the README out of scope.
