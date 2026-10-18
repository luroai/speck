# Test the Foreman's Shipping list in pull request mode

Captured: 2026-10-18 · Status: inbox
From ticket: 0299

## What
Add a test that starts speck run in pull request mode with an approved ticket and checks the Foreman's record lists no ticket as waiting to ship.

## Why
In pull request mode speck run opens pull requests instead of shipping, so the Foreman leaves its Shipping list empty there. Nothing checks this: if it broke, every approved ticket would show as "next to ship" in the panel and `speck status`, which never happens in that mode.

## Notes
- From the minor finding F1 in 0299's merge review round, after merging 0295's pull request mode.
