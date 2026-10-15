# Say in the plain pack when the reviewer couldn't see the code

Captured: 2026-10-12 · Status: ticketed (0222)
From ticket: 0131

## What
When the reviewer couldn't look round the project in a review round and judged the change from the diff alone, `speck pack <id> --plain` should say so in one plain sentence, as the full pack already does.

## Why
Someone deciding whether to ship from the plain pack can't tell that the review was done half-blind, which matters most to the readers who can't check the code themselves.

## Notes
- From the builder's own note on 0131: the plain pack prints only what its acceptance criteria list, so it leaves this warning out.
- Open question: one sentence for any such round, or only when it happened in the latest round?
