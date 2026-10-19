# Show this machine's values in speck config show

Captured: 2026-10-17 · Status: inbox
Triaged: 1
From ticket: 0261

## What
`speck config show` lists `speck/config.yml`'s values only. When this machine has its own `max_parallel_builds` or `max_parallel_tests`, it should say so and give the value speck uses, as the panel's Settings view now does.

## Why
Setup and anyone checking settings from the terminal see the repo's value and may think it's the one speck uses on this machine, when the machine's own value applies.

## Notes
- From the builder's own note on 0261: the panel shows the source of each value, but 0261 kept `speck config show` unchanged to stay in scope.
- Open question: should `--json` add the same `from` and `repo_value` fields the panel gets?
