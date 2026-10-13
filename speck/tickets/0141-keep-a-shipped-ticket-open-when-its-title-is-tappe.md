---
id: "0141"
title: "Keep a shipped ticket open when its title is tapped on a phone"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-13T07:52:43.284Z"

---
# 0141 · Keep a shipped ticket open when its title is tapped on a phone

**Status:** 🔨 building

## Problem
In cptr's built-in browser on an iPhone, tapping a shipped ticket's title opens the full ticket for a moment, then the page reloads to the top and the ticket closes. The title is an `<a href="#">` link (0137), and that browser follows the link itself even though the page cancels it. The Review pack button in the same row works, because it's a button.

## Outcome
Tapping a shipped ticket's title opens the full ticket and it stays open, in any browser, because the title no longer points to an address.

## Acceptance criteria
1. A Shipped row's title has no `href` and is not an `<a>` element, so no browser can follow it to another address or reload the page.
2. Clicking or tapping the title opens that ticket in the full ticket pane, exactly as before, and the page isn't reloaded or scrolled.
3. The title still looks as it does today: accent colour, underlined on hover, pointer cursor, and the 44 px tap area at phone widths from 0140.
4. The title can be reached with Tab and opened with Enter or Space, and screen readers announce it with the ticket's title as its name.
5. No test that passed before this change fails, except checks that the title is a link (`<a>`), which are changed to check the new element.

## Out of scope
- Other links in the panel, such as links inside a ticket's text.
- Any other phone layout changes.

## Notes
- The title is made by `fullLink` in `templates/panel.html`, which sets `href = '#'` and calls `preventDefault()` on click.
- Reported 2026-10-13 on an iPhone in cptr's browser: the page reloaded to the top and the Review pack button in the same row stayed open. Not reproducible in Chromium with touch emulation, where `preventDefault()` is honoured.
- Checked 2026-10-13: why that browser follows a cancelled `href="#"` can't be confirmed here (no WebKit build installed on the build machine). The fix removes the `href`, so it doesn't depend on the cause.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
