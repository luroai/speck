---
id: "0123"
title: "Bring an old speck section in AGENTS.md up to date"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-refresh-an-old-speck-pointer-in-agents-md.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T12:36:02.784Z"

---
# 0123 · Bring an old speck section in AGENTS.md up to date

**Status:** 🔨 building

## Problem
`speck init` adds a speck section to a project's AGENTS.md, but once one is there it never updates it. Projects set up with an older speck keep its old instructions, such as "Read `speck/product.md` first", a file speck no longer creates. Their agents follow stale rules before every build, and re-running `speck init` to update speck doesn't fix it.

## Outcome
Re-running `speck init` brings the speck section of AGENTS.md up to date with the current one.

## Acceptance criteria
1. When AGENTS.md has a `## speck` section that differs from the current one, `speck init` replaces that section, from its heading up to the next heading of the same or a higher level or the end of the file, with the current text, and says it updated it.
2. Everything in AGENTS.md outside that section is left byte for byte as it was.
3. When the section already matches the current text, `speck init` leaves AGENTS.md untouched and doesn't say it updated it.
4. AGENTS.md without a speck section, or no AGENTS.md at all, gets the section added as today.
5. AGENTS.md that mentions "This repo uses speck" but has no `## speck` heading is left as it is, and `speck init` says the speck instructions in it may be out of date and shows the current text to compare.

## Out of scope
- CLAUDE.md, which only imports AGENTS.md.
- Keeping edits someone made inside speck's own section: they're replaced, and show in `git diff`.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
