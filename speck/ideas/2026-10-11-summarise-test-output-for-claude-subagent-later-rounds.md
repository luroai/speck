# Summarise test output for claude-subagent later rounds

Captured: 2026-10-11 · Status: inbox
From ticket: 0119

## What
In round 2 onwards with a `claude-subagent` reviewer, the review skill has the builder send "the new test output" by SendMessage, so it goes in full. speck could print the same summary there (for example a `speck tests <id> --tests=f` command, or `speck diff` taking `--tests`), so every reviewer gets the summary in every round.

## Why
0119 summarises TAP output for `speck review` and `speck prompt`, which covers Codex, command reviewers and a subagent's round 1. A subagent's later rounds still get the full output, about 60,000 tokens here, on every round.

## Notes
- From the builder's own note while building 0119.
- Open question: a new command, or an option on `speck diff`?
