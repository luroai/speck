# Count the pack's reviewer tokens as each round saved them

Captured: 2026-10-28 · Status: inbox
From ticket: 0546
Raised by: agent

## What
The review pack's and the Delivery log's "Reviewer tokens" line still adds up each round's raw usage input and output. Count it as each round saved its tokens, as `speck status --json` and the panel now do (0546).

## Why
A resumed Codex round counts the session's earlier rounds again, a Claude round leaves out its cache reads and writes, and a Cursor round reads as 0, so the pack and the Delivery log disagree with the panel's figure for the same ticket.

## Notes
- From the builder's own note on 0546, which the ticket kept to the panel and `speck status --json`. The line comes from `reviewTotals` in the pack and close scripts.
