# Turn speck run on in the background from the command line

Captured: 2026-10-25 · Status: ticketed (0544)
From ticket: 0510

## What
Give `speck run` a way to start on its own in the background, as `speck panel --background` does, writing to `speck/.cache/runs/run.log` and saying once it's watching or why it refused.

## Why
Setup now turns `speck run` on with a shell line (`nohup … run >> run.log &`) and reads the log a few seconds later to see whether it started. That depends on the agent's shell and on guessing how long to wait, and other agents and scripts have no plain way to do what the panel's switch does.

## Notes
- From the builder's own note while building 0510: speck has no command for it, so setup copies what the panel's switch does.
