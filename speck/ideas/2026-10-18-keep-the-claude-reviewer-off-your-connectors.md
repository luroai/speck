# Keep the Claude reviewer off your connectors

Captured: 2026-10-18 · Status: inbox
From ticket: 0292

## What
The built-in `reviewer: claude` still loads the user's MCP servers and claude.ai connectors (Gmail, Drive and so on). Pass `--strict-mcp-config` too, so the reviewer only has Claude Code's own read-only tools.

## Why
dontAsk denies any connector call that isn't pre-approved, so nothing is sent today, but the reviewer has no need for them: they fill its context with tool lists and widen what a mistaken rule could allow.

## Notes
- From the builder's own note on 0292: a real run of the built-in command listed Docs, Gmail, Drive and Playwright tools.
- Check that `--strict-mcp-config` without `--mcp-config` also drops claude.ai connectors, not only local MCP servers.
