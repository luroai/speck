# Count a failing full suite on the bridge

Captured: 2026-11-11 10:31 · Status: inbox
From ticket: 0630
Raised by: agent

## What
The bridge (All projects) should count a failing full suite (commands.test_full) under Needs you, with a card naming the project and the failing tests, as a project's own bar now counts it.

## Why
Since 0630 a project's bar can say "Needs you 1" for a failing full run while the bridge says nothing needs you for that project.

## Notes
- My own note from 0630's build: the bridge's count comes from projectSummary, which doesn't read the foreman view's `full`. Close to the stopped-builds idea (2026-11-10-count-stopped-builds-on-the-bridge.md), which could take both.
