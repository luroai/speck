# Read Claude's usage after a Claude review round

Captured: 2026-11-11 14:45 · Status: inbox
From ticket: 0642
Raised by: agent

## What
Keep Claude's latest usage after a review round run on Claude Code too, as speck now does after a Claude build or watch run.

## Why
speck runs Claude reviewers with `--output-format json`, whose output has no `rate_limit_event` lines, so a review round on Claude gives no reading. With Claude as the reviewer and Codex as the builder, `speck agents` shows Claude's usage only from watch runs, so it can be stale just when the reviewer is close to its limit.

## Notes
- From the builder's own note on 0642. One way: run the reviewer with stream-json and read the verdict from its result line, or read the usage some other way Claude Code offers. Needs a check of what Claude Code's json output can include.
