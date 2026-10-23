# Name DeepSeek properly when it reviews

Captured: 2026-10-23 · Status: inbox
From ticket: 0391

## What
A card whose reviewer is DeepSeek, with no reviewer model set, says "Deepseek is reviewing · round 1": the panel capitalises the reviewer's setting. It should say "DeepSeek", as the builder sentence now does through the board's provider label.

## Why
The panel misspells the provider's name for anyone reviewing with DeepSeek, and any provider added later gets the same treatment.

## Notes
- From the builder's own note while building 0391, which added `builder_label` to the board for the builder only. A `reviewer_label` the same way would fix it.
