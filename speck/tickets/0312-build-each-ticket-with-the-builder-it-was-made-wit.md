---
id: "0312"
title: "Build each ticket with the builder it was made with"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0319", "0317"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-19T05:43:06.442Z"

---
# 0312 · Build each ticket with the builder it was made with

**Status:** 🔨 building

## Problem
A ticket records the builder it was made with, but `speck run` builds every ready ticket with the builder in `speck/config.yml`. After switching the builder, tickets that still say `builder: claude` are built with the new one, which the ticket doesn't say.

## Outcome
`speck run` builds each ticket with the builder the ticket records.

## Acceptance criteria
1. With `build_command` blank, `speck run` starts each ticket's build with the command for the builder in that ticket's `builder:` field (0289, 0290), and passes `builder_model` only when that builder is the one in `speck/config.yml`.
2. A ticket with no `builder:` field is built with the builder in `speck/config.yml`, as today.
3. When `build_command` is set, every build uses it, as today, and `speck run` says once when it starts that tickets' own builders are ignored because `build_command` is set.
4. A ticket whose builder isn't installed isn't started, and the Foreman's detail says why.
5. Hand-backs and resumed builds use the builder the build started with.

## Out of scope
- Changing a ticket's builder from the panel.

## Notes
- From `speck/ideas/2026-10-18-build-older-tickets-with-the-builder-they-were-made-with.md` (inbox, from 0293). Builds start in `scripts/run.mjs`.
- Failing before this build: none
- With `build_command` blank, a ticket recording `claude` is started with the `build_command` speck sets up for Claude Code. A config whose own builder is `claude` with `build_command` blank is still refused when `speck run` starts, as today (AC2), so this applies when the config's builder is Codex or Cursor.
- AC3's line is said only when a ticket that isn't done or cancelled records a builder other than the config's, so the default Claude Code setup, which sets `build_command`, isn't told about it on every start.
- The Codex and Cursor `speck run` tests in 0289 and 0290 now give their ticket `builder: codex` and `builder: cursor`: with `builder: claude`, as before, it's now built with Claude Code.
- Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
