# Say in the brief that releases publish themselves

Captured: 2026-10-15 · Status: ticketed (0243)
From ticket: 0236

## What
The brief's "Releases" section still says the maintainer creates and pushes the tag by hand once a release ticket has shipped. Since 0240, a workflow on `main` tags the version and publishes its GitHub release from `docs/releases/v<version>.md`. The section should say so, and that a release ticket must add those notes.

## Why
Anyone reading the brief to learn how releases work is told to do a step that now happens by itself, and isn't told the release notes file is required.

## Notes
- The builder's own note while preparing 0.5.0 (0236): changing the brief's Releases section was outside that ticket's criteria.
