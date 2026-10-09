---
id: "0050"
title: Keep unchanged rows outside Shaping through the panel refresh                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T17:29:40.760Z"

---
# 0050 · Keep unchanged rows outside Shaping through the panel refresh

**Status:** 🔨 building

## Problem
The panel still rebuilds every queue row and Shipped row on each 2-second refresh, so text you select there, such as a blocked ticket's question or a stopped build's last message, is lost within 2 seconds. A long build message scrolls in its own box, and that box jumps back to the top on every refresh, so you can't read or copy the end of it. 0040 fixed this only for open items in Shaping.

## Outcome
Text selected in a queue or Shipped row, and the scroll position of a build message box, stay put through refreshes until that row's own content changes.

## Acceptance criteria
1. With text selected in a queue row (its title, blocked question or build message), the selection is still there after a refresh in which that ticket's data in `/api/state` is unchanged, even when other tickets change in that refresh. Those other changes still show in the same refresh.
2. With a build message box scrolled away from the top, it keeps the same scroll position after a refresh in which that ticket's data is unchanged.
3. With text selected in a Shipped row, the selection is still there after a refresh in which that ticket's data is unchanged and no ticket is added to or removed from Shipped.
4. An in-flight ticket's whole minutes since `started`, and a Shipped row's time when it changes from the time alone to date and time after midnight, keep updating while text in that row is selected, and the selection stays.
5. When a row's own ticket data changes, the row shows the new content in that refresh, even if its selection or scroll position is lost.

## Out of scope
- Selections in the Shaping section (0040).
- Selections in the header, the Shipped stats row and the connection status.

## Notes
- The page is `templates/panel.html`. No CLI or JSON change.
- Found after 0040 shipped: the live panel keeps Shaping nodes across polls but replaces every `#queue` and `#shipped` child each poll, including the `.question.exit` box (max-height 16em, scrolls).
- "Data unchanged" means the same field values in `/api/state` for that ticket (matched by `id`), whatever order the fields come in. Changes to the hover highlight, chain icon or "unlocks"/"waiting on" text that come only from other tickets aren't the row's own data.
- No external facts: everything is in this repo.
- Real-browser tests can use the helpers in `test/support/panel.mjs`.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
