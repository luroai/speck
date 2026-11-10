# Count stopped builds on the bridge

Captured: 2026-11-10 17:10 · Status: inbox
From ticket: 0616
Raised by: agent

## What
The bridge (All projects) should count a stopped build that nothing will carry on under Needs you, with a card saying its build stopped, as a project's own bar and Build lane now do.

## Why
Since 0616 a project's bar can say "Needs you 1" for a stopped build while the bridge says "Nothing needs you" for the same project, so someone watching every project from the bridge misses it.

## Notes
- My own note from 0616's build: the bridge's count comes from projectSummary in the panel's summary script, which counts questions, the engineering manager's questions and tickets waiting at Ship, not stopped builds. 0616 kept to the bar, as its AC3 says.
