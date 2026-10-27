# Name the builder's model in the facts grid

Captured: 2026-10-24 · Status: ticketed (0545)
Triaged: 1
From ticket: 0462

## What
An open Build ticket's Builder cell names the builder by its agent's name, such as Claude, while the Reviewer cell names the reviewer's model. Name the builder's model too, when speck knows it (builder_model, or the provider's model).

## Why
Someone watching a build sees which model is reviewing but not which one is building, so the two cells don't match and the builder's model has to be looked up in Settings.

## Notes
- From 0462's own note: the board gives a ticket's builder and builder_label, but no builder model, so the panel can't show it today.
- Open question: what to show when builder_model is blank (the agent's own default).
