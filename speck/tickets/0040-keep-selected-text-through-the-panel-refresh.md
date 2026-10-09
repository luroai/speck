---
id: "0040"
title: "Keep selected text through the panel refresh"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-08-speck-board.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0039"]                # ticket ids that must be done first
created: 2026-10-09

---
# 0040 · Keep selected text through the panel refresh

**Status:** 📋 ready

## Problem
The panel rebuilds the whole page on every 2-second refresh, so any text you select in an open ticket or idea is lost within 2 seconds. You can't reliably copy a criterion or a lint message out of the panel.

## Outcome
Text you select in an open ticket or idea stays selected through refreshes until that item's own content changes.

## Acceptance criteria
1. With text selected in an open ticket's details, the selection is still there after a refresh in which that ticket's data in `/api/state` is unchanged.
2. Criterion 1 still holds when other parts of the state change in that refresh, for example another ticket's status, a queue ticket's review round or a new shipped ticket. Those changes still show on screen in the same refresh.
3. With text selected in an open idea's note text, the selection is still there after a refresh in which that idea's data is unchanged, whatever else changes.
4. When the open ticket's or idea's own data changes, the panel shows the new content in that refresh, even if the selection is lost.
5. Nothing else on the page waits on a selection: the minutes since `started` in the queue, the connection status and the disconnected message keep updating while text is selected.

## Out of scope
- Clicks inside an open item closing it (0039).
- Selections outside the open ticket and idea details, such as in the queue or Shipped.
- Keyboard access and capping the height of long details.

## Notes
- The page is `templates/panel.html`. No CLI or JSON change.
- Builds after 0039, which changes the same item code.
- "Data unchanged" means the same field values in `/api/state` for that ticket (matched by `id`) or idea (matched by `path`).
- No external facts: everything is in this repo.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
