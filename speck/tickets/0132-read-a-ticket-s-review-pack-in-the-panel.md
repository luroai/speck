---
id: "0132"
title: "Read a ticket's review pack in the panel"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0129"]              # ticket ids that must be done first
created: 2026-10-11

---
# 0132 · Read a ticket's review pack in the panel

**Status:** 📋 ready

## Problem
The review pack, the summary to read before shipping, is only available by running `speck pack <id>` in a terminal. A user working from the panel can see that a ticket is approved or shipped but can't read what the reviewer found.

## Outcome
From the panel, the user can open the review pack of any approved ticket in the queue and of any ticket in the Shipped table.

## Acceptance criteria
1. Each approved ticket in the queue, and each row in the Shipped table, has a button that opens that ticket's review pack in the panel.
2. The review pack in the panel has the same content as `speck pack <id>` prints for that ticket, from the same checkout at the same moment: the verdict, the acceptance criteria table, risk, review history, findings and actuals. Its headings, tables and lists are formatted, not shown as raw Markdown.
3. For a ticket with no review rounds recorded, the panel says there's no review pack for it, and shows no error from the server.
4. Opening a review pack changes no file in the repo.
5. No test that passed before this change fails.

## Out of scope
- Shipping from the review pack: that's 0133.
- The plain-English review pack (0131), which stays a draft.
- Changing what's in the review pack.

## Notes
- Comes after 0129, so a shipped ticket's pack doesn't show "Changed lines: 0".
- The pack is built from the ticket each time, as `speck pack` builds it (`reviewPack` in `scripts/pack.mjs`). Nothing new is saved.
- The panel already formats a ticket's Markdown in its side pane (`markdown()` in `templates/panel.html`). Text goes in as text, never as HTML, as it does there.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
