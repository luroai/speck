---
id: "0004"
title: "Show the ticket title as a heading in every viewer"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | done
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-08

---

## Problem
Ticket titles exist only in the frontmatter. Markdown viewers that hide frontmatter (VS Code, Obsidian) show no title, and viewers that don't support it show the fields as a run-on paragraph. Either way, a ticket doesn't open with a readable title.

## Outcome
Every ticket starts with a `# <id> · <title>` heading that stays in sync with the frontmatter title.

## Acceptance criteria
1. `speck new "<title>"` writes a ticket whose first line after the frontmatter is `# <id> · <title>`.
2. `speck set <id> title "<new title>"` updates both the frontmatter and the heading.
3. `speck lint` warns when the heading is missing or doesn't match the frontmatter title.
4. Tickets 0001–0003 have the heading added.

## Out of scope
- Changing the frontmatter format
- Fixing frontmatter support in any particular Markdown viewer

## Notes
The frontmatter stays the source of truth; the heading is a rendered copy. Follows the blank-line-before-closing-fence change made by hand before the first commit.

## Blocked question

## Review log

## Delivery log
