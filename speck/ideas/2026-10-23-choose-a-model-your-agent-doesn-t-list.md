# Choose a model your agent doesn't list

Captured: 2026-10-23 · Status: inbox
From ticket: 0400

## What
Since 0400, each role's model is picked from the models your agents list, with no box to type one in. Let Settings take a model an agent doesn't list, such as a full Claude model name or a model Codex couldn't list just then.

## Why
Before 0400 you could type any model name in Settings. Now a model outside the list can only be set with `speck config set`, and when an agent's models can't be read, Settings offers only its default.

## Notes
- From the builder's own note on 0400. Open question: a "Type a model…" entry under each agent, or a box beside the list.
