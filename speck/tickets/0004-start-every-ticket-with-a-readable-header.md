---
id: "0004"
title: "Start every ticket with a readable header"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | done
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-08
started: "2026-10-08T16:44:34.053Z"

---
# 0004 · Start every ticket with a readable header

**Status:** 🔍 reviewing

## Problem
A ticket's title and status exist only in the frontmatter. Markdown previews that hide frontmatter (VS Code, Obsidian, GitHub) show neither, and viewers without frontmatter support show the fields as a run-on paragraph. Either way, you can't open a ticket and see at a glance what it is and where it stands.

## Outcome
Every ticket opens with a `# <id> · <title>` heading and a clear status line under it, both kept in sync with the frontmatter by speck.

## Acceptance criteria
1. `speck new "<title>"` writes a ticket whose first lines after the frontmatter are `# <id> · <title>`, then a blank line, then `**Status:** <emoji> <status>` using the emoji in the Notes (for example `**Status:** 🔍 reviewing`).
2. Every speck command that changes a ticket's title or status (`speck set`, `speck ship`) updates the heading and status line to match the frontmatter, and adds them if they're missing.
3. `speck lint` warns when the heading or status line is missing, or doesn't match the frontmatter.
4. Re-running `speck init` adds or corrects the heading and status line in every existing ticket, in `speck/tickets/` and `speck/tickets/done/`, and leaves the rest of each ticket unchanged. This repo's tickets have them once this ships.

## Out of scope
- Changing the frontmatter format, or dropping it.
- Showing other fields (priority, size, risk, reviewer) in the header.
- Fixing frontmatter support in any particular Markdown viewer.

## Notes
- The frontmatter stays the source of truth; the heading and status line are rendered copies, and hand edits to them are overwritten.
- Status emoji, one per status, with the status word after it exactly as in the frontmatter: 📝 draft, 📋 ready, 🔨 building, 🔍 reviewing, ⛔ blocked, 👍 approved (waiting for you to ship), ✅ done. No coloured circles, so approved can't be mistaken for done.
- Keeps the blank line before the closing frontmatter fence.

## Blocked question

## Review log

## Delivery log
