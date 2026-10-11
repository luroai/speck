# Spend fewer tokens per build

Captured: 2026-10-11 · Status: ticketed (0119, 0120)

## What
Cut what each build spends on tokens, starting with what's clearly wasted, and make the builder's spend visible next to the reviewer's.

## Why
The panel's median of 440k tokens per ticket counts only the reviewer. Each review round's prompt includes the full test output, about 245 KB or 60,000 tokens of passing tests, which Codex re-reads on every model call in the round. The builder's own spend (0.5–2.8M tokens read, $0.50–2.18 as Claude Code reports it, for 0094, 0107 and 0110–0112) isn't recorded at all.

## Notes
- Measured 2026-10-11: reviewer input per ticket was 282k–1.26M, 64–75% of it cached, with under 3k tokens of output.
- Choosing the builder's model by ticket size is a separate idea: `speck/ideas/2026-10-11-choose-the-builder-s-model-per-ticket.md`.
