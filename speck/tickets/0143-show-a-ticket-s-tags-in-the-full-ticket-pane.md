---
id: "0143"
title: "Show a ticket's tags in the full ticket pane"                # one outcome, no "and"
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
after: []                # ticket ids that must be done first
created: 2026-10-13

---
# 0143 · Show a ticket's tags in the full ticket pane

**Status:** 📋 ready

## Problem
When a shipped ticket, or one in the Build queue, is opened in the full ticket pane, the pane shows only its id and title above the text. Its priority, size and risk, which the lists show as tags, aren't there, so the user can't see how big or risky the change was.

## Outcome
The full ticket pane shows a ticket's priority, size, risk and any bug or fix tag under its title, whichever list it was opened from.

## Acceptance criteria
1. When a ticket is opened in the full ticket pane from Plan, Build or Shipped, the pane shows its priority (as `P<n>`), size and risk as tags under the title, styled as they are in the lists: a high risk in the warning colour and P1 as it is marked there.
2. A bug or fix ticket also shows its bug or fix tag there, as it does in the lists.
3. A field the ticket doesn't have (for example no priority) shows no tag, and nothing else in the pane changes.
4. The tags in the pane only show the values: clicking the priority tag there doesn't open the priority menu.
5. No test that passed before this change fails.

## Out of scope
- Showing other fields in the pane, such as dates, builder, reviewer or build time.
- Changing the tags in the lists.

## Notes
- The pane's top row is built in `fullTicket()` in `templates/panel.html`; the lists' tags come from `tags()` and `typeTag()`.
- Checked 2026-10-13: `/api/state` already has `priority`, `size`, `risk` and `type` for done tickets (live panel, ticket 0079).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
