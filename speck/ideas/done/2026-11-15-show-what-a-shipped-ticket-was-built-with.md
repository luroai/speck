# Show what a shipped ticket was built with

Captured: 2026-11-15 13:11 · Status: ticketed (0694)
From ticket: 0669
Raised by: agent

## What
A done or cancelled ticket's Builder fact should show the agent, model and effort its build really ran on, from what speck recorded when the build started, rather than working them out again from today's settings.

## Why
A shipped ticket that left its model or effort to the settings shows whatever the settings say now. After you change the Builder in Settings, older tickets look as if they were built with the new model, which misleads anyone comparing how tickets were built.

## Notes
- From 0669's own note: speck keeps the ticket's own builder_model and builder_effort in the run record, but not the settings' values a build fell back on.
- Open question: record the full worked-out builder, model and effort at `speck start`, in the ticket or the run record?
