---
id: "0368"
title: "Open Settings in a pop-up over the whole panel"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: cursor
reviewer_model: grok-4.7-high       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-calm-the-settings-view-down.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T19:39:59.696Z"

---
# 0368 · Open Settings in a pop-up over the whole panel

**Status:** 🔨 building

## Problem
Settings opens in a pane down the right, at most 480 px wide. With every group and control in that strip, the view is cluttered and hard to scan.

## Outcome
Settings opens in a pop-up over the whole panel, in the same look as a document's pop-up.

## Acceptance criteria
1. Pressing Settings opens a pop-up that covers the whole panel window at every width, in both looks, in the same look as a document's pop-up (0362): a Close button, and the settings in a centred column at most 760 px wide. Settings no longer opens in the pane on the right.
2. While the pop-up is open, nothing behind it can be clicked, scrolled or reached with Tab, and the focus moves into it. A long view scrolls inside the pop-up.
3. Close, Escape and a click on the backdrop close it, as they close Settings today, including the question when there are unsaved changes (0275). The focus returns to the Settings button.
4. The groups, controls, Save, this-machine choices and messages are the ones the side pane shows today.
5. No test that passed before this change fails, except checks that Settings opens in the right-hand pane, which are changed to check criterion 1.

## Out of scope
- Filling a model list when the builder, reviewer or Foreman agent changes: 0369.
- Keeping the view still when a setting changes: 0370.
- Floating an explanation over its row: 0371.
- The document pop-up and the Foreman's pop-up.

## Notes
- Settings is `#settings` in `templates/panel.html`, a fixed pane `min(480px, 100vw)` wide. A document's pop-up is `#doc-view`: fixed over the window, content at most 760 px wide.
- Checked 2026-10-22: the document pop-up covers the window and scrolls inside itself (0362, `templates/panel.html`).
- 0369, 0370 and 0371 wait for this: they change `templates/panel.html` too.
- Failing before this build: none
- Self-check: a drag from the column ending beside it (such as selecting text) no longer closes Settings: a click closes it only when the pointer also went down beside the column. The column's left edge is rounded to a whole pixel, which 0281's test caught.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
