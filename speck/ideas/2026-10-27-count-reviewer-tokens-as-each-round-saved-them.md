# Count reviewer tokens as each round saved them

Captured: 2026-10-27 · Status: inbox
From ticket: 0526
Raised by: agent

## What
The panel's "Reviewer tokens" figure, and each round's `tokens` in `speck status --json`, should count the tokens each review round saved (uncached and cached input, cache writes and output), as the ticket's total now does, rather than the raw input and output its usage reports.

## Why
A resumed Codex round's usage covers the whole session, so its tokens are counted again in every later round; a Claude round's cache reads and writes are left out; and a Cursor round's camelCase usage reads as 0. The reviewer tokens figure and its median are wrong for anyone looking at what review costs.

## Notes
- From review round 1 of 0526 (F1), which fixed this for `total_tokens` only: the existing per-round `tokens` was out of its scope.
- Rounds saved before 0529 have no saved tokens and would keep using their usage.
