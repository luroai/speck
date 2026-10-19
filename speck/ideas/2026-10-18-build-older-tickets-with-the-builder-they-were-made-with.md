# Build older tickets with the builder they were made with

Captured: 2026-10-18 · Status: dropped
From ticket: 0293

## What
After the builder is switched, `speck run` builds every ready ticket with the builder in `speck/config.yml`, including tickets that were made with the old one and still say `builder: claude`. Either build each ticket with the builder it records, or rewrite or flag the ready tickets that don't match when the builder is switched.

## Why
A ticket's `builder:` is what the same-model check reads. A ticket made with Claude Code and a Codex reviewer, then built by Codex after a switch, is reviewed by its own model family without anyone being told. The Settings view also says older tickets keep their builder, which is true of the file but not of who builds them.

## Notes
- From the builder's own note on 0293. Building per ticket was out of scope there ("a different builder per ticket").
- Open: which is wanted, a build per recorded builder or one builder for every build with the tickets kept in step?
