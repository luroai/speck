---
id: "0410"
title: "Show Plan, Build and Shipped as tabs"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []               # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T13:30:04.514Z"

---
# 0410 · Show Plan, Build and Shipped as tabs

**Status:** 🔨 building

## Problem
The panel stacks Plan and Build side by side with Shipped under them, so the page scrolls as a whole and a long list in one lane pushes the others out of view. On a narrow pane you scroll past one lane to reach the next.

## Outcome
Plan, Build and Shipped are three tabs under the header. One lane shows at a time, and only its tickets scroll.

## Acceptance criteria
1. Under the header are three tabs, Plan, Build and Shipped, and only the open tab's lane shows. Build and Shipped each show the count their section headings show today; Plan shows none, as its Tickets, Ideas and Inbox toggle keeps its own counts. Build is open when the panel loads. The tabs are reached with Tab, and Enter, Space or the left and right arrow keys open another tab.
2. At any window width, the header and the tab row stay where they are while the open lane's list scrolls, and the page itself doesn't scroll.
3. The open tab, and the scroll position of each lane's list, stay as they were through the 2-second refresh.
4. While Plan or Shipped is open and the Foreman's status reads `Needs you <n>`, the Build tab shows `<n> needs you`. With any other Foreman status, it shows nothing extra.
5. Pressing a "Go to ticket" button opens the tab whose lane holds that ticket, then scrolls to it and lights it as today. Closing the full-ticket pane opens the tab holding the element the focus goes back to, as chosen today, before focusing it.

## Out of scope
- Showing more shipped tickets (0411).
- The console at the top of the panel, and the new ticket tiles, from the design in https://claude.ai/artifact/R5CQDZJfMZ2rYcTmZK1B8z (console.html).
- Remembering the open tab across a reload: Build opens each time.
- Plan's own Tickets / Ideas / Inbox toggle, which stays inside the Plan tab as it is.

## Notes
- Replaces the decision behind cancelled 0064, 0065 and 0066 ("keeping the current panel layout"): the user asked for tabs on 2026-10-23.
- Design reference: the tab row in console.html in the artifact above.
- Changes `templates/panel.html`: the `<main>` grid of `#shaping-section`, `#build-section` and `section.shipped`, `goTo` and `returnFocus`.
- Tests written for the old layout, which expect all three sections on screen at once, change with it.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
