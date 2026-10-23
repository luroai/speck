# Clear a builder effort the new builder doesn't take

Captured: 2026-10-23 · Status: inbox
From ticket: 0402

## What
When the builder is switched, clear `builder_effort` if the new builder doesn't offer it, as switching already clears a `builder_model` it doesn't offer. For example, `ultra` saved for Codex and then a switch to Claude Code.

## Why
Today the effort stays saved, and Settings shows it only as "(not offered)". Every Claude Code build is then started with `--effort ultra`, which it may refuse, so builds can fail without the user knowing why.

## Notes
- The builder's own note on 0402, kept out of scope there, as the reviewer's effort behaves the same way.
- Related: speck/ideas/2026-10-17-check-the-effort-against-the-ticket-s-own-reviewer.md covers the reviewer's effort, checked by lint.
- Open question: does Claude Code refuse an effort it doesn't know, or ignore it?
