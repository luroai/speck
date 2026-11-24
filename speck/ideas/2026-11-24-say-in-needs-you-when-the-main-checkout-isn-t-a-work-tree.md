# Say in Needs you when the main checkout isn't a work tree

Captured: 2026-11-24 20:47 · Status: inbox
From ticket: 0740
Raised by: agent

## What
When `core.bare` is set to true in the main checkout's `.git/config`, show it under Needs you in the panel and in `speck status`, with the command that sets it back, rather than only as the reason shipping is on hold.

## Why
While the main checkout isn't a work tree, more than shipping stops: builds fail before they start and the panel can't load its data, as on 2026-11-24. Since 0740, speck run's ship queue says it once in its log and shows it as its hold, but nothing tells you that builds are stuck too, or that it needs you to fix it.

## Notes
- From 0740's build: its ship refusal and the queue's hold use `bareMain()` in `scripts/bare-main.mjs`, which this could reuse.
- 0707's and 0730's first builds stopped before starting for this reason, by their Notes.
