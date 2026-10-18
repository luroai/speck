---
id: "0314"
title: "Keep the Claude reviewer away from your MCP servers and connectors"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T22:33:14.211Z"

---
# 0314 · Keep the Claude reviewer away from your MCP servers and connectors

**Status:** 🔨 building

## Problem
The built-in `reviewer: claude` (0292) runs Claude Code without your settings and without file-editing tools, but it still loads your MCP servers and claude.ai connectors, such as Gmail and Drive. A reviewer only needs to read the code, and shouldn't be able to reach anything else of yours.

## Outcome
The Claude reviewer runs with no MCP servers or connectors, only Claude Code's own read-only tools.

## Acceptance criteria
1. `speck review` starts the Claude reviewer with `--strict-mcp-config` and no `--mcp-config`, so it loads no MCP servers from any configuration.
2. Later rounds, which resume the reviewer's session, are started the same way.
3. The reviewer's other options (no settings sources, no editing tools, its model and effort) are as today.
4. A review round with the Claude reviewer still records its verdict, as today.

## Out of scope
- Command reviewers set up under `reviewer_options`.

## Notes
- From `speck/ideas/2026-10-18-keep-the-claude-reviewer-off-your-connectors.md` (inbox, from 0292). The reviewer's arguments are `CLAUDE_ARGS` in `scripts/reviewers.mjs`.
- Checked 2026-10-18: `claude --help` (Claude Code 2.1.301) lists `--strict-mcp-config`: "Only use MCP servers from --mcp-config, ignoring all other MCP configurations".
- Checked 2026-10-18: claude.ai connectors count as MCP configurations that `--strict-mcp-config` leaves out. A session started with the reviewer's arguments listed the claude.ai Claude Docs, Gmail and Google Drive servers (49 `mcp__` tools) in its init record; with `--strict-mcp-config` added it listed no MCP servers and no `mcp__` tools.
- Failing before this build: none
- Self-check: narrowed the brief's new sentence, which said the reviewer could reach nothing but the repo (its read-only commands can still read local files), to say it can't reach mail, cloud files or other services through MCP; added a test that the brief's reviewer command includes `--strict-mcp-config`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
