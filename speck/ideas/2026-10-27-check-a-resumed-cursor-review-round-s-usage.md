# Check a resumed Cursor review round's usage

Captured: 2026-10-27 · Status: inbox
From ticket: 0529
Raised by: agent

## What
Check whether Cursor's usage on a resumed chat covers the whole chat or only that run. If it covers the whole chat, take the earlier round's usage out of a resumed Cursor review round, as 0529 does for Codex.

## Why
0529 prices each Cursor review round from the usage it reports. Codex turned out to report a resumed session's totals, so its later rounds would have been charged for every earlier round too. If Cursor does the same, a ticket reviewed by Cursor over several rounds shows a reviewer cost that's too high.

## Notes
- From 0529's build: Codex was checked from this repo's saved rounds, Cursor wasn't, so its rounds are taken as they report.
- Related, for builds rather than reviews: speck/ideas/2026-10-18-count-a-resumed-cursor-build-s-tokens.md (dropped).
