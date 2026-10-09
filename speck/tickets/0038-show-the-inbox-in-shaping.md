---
id: "0038"
title: "Show the inbox in Shaping"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0036"]            # ticket ids that must be done first
created: 2026-10-09

---
# 0038 · Show the inbox in Shaping

**Status:** 📝 draft

## Problem
Inbox notes (0036) are idea notes, so without a change they'd crowd the panel's Ideas list and bury the user's own ideas. The user wants to see how many follow-ups are waiting without being shown them all.

## Outcome
Shaping has an Inbox tab, with its own colour, that shows the count on the toggle and the follow-ups only when opened, and Ideas shows only the user's own ideas.

## Acceptance criteria
1. Shaping's toggle reads `Tickets · <n>`, `Ideas · <n>` and `Inbox · <n>`, in that order. Tickets is selected when the page loads, one list shows at a time and the choice survives the 2-second refresh.
2. Inbox lists every idea whose status is `inbox`, in the JSON's order, each with its title, path and the id from its `From ticket:` line (left out when it has none). Clicking one shows its note text under it, as text, and clicking it again closes it. An empty inbox says "Inbox is empty."
3. Ideas leaves out ideas whose status is `inbox` or `dropped`, and its count matches what it lists. Everything else about Ideas is unchanged.
4. Inbox uses an accent colour of its own on the toggle, the section's top edge and each item's left edge. It isn't the tickets blue, the ideas purple, the blocked red (`--bad`) or the warning orange (`--warn`).

## Out of scope
- Writing inbox notes (0036) and triage (0037).
- Any write action, including ticketing or dropping a follow-up from the panel.
- Showing `dropped` notes anywhere.

## Notes
- Builds on the Tickets / Ideas toggle from 0033 and uses the note format from 0036.
- Uses the `status` and `body` fields that `speck status --json` already gives each idea, so the CLI doesn't change.
- No external facts: everything is in this repo.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
