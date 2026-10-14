---
id: "0157"
title: "Tidy the Shipped section"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0151"]                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-14T06:59:20.485Z"

---
# 0157 · Tidy the Shipped section

**Status:** 🔍 reviewing

## Problem
The Shipped section is hard to read, worst on a phone. Its six stats stack as large numbers with long labels that wrap, and they're hard to tell apart. The section has no accent colour, unlike Plan. Shipped tickets run into each other. Each ticket's figures are one long run of values separated by dots, and the time in its bottom left corner has no label, so it isn't clear what it is.

## Outcome
Shipped has a green accent, its stats sit in a tidy grid of small labelled tiles, and each shipped ticket is a card with labelled figures and a labelled ship time.

## Acceptance criteria
1. The Shipped section has a 2 px top border in the panel's green (`--ok`), as Plan's section has a top border in its own colour.
2. The six stats are tiles of equal size, each with its number above a short label (for example "10" over "shipped today", "1.5" over "median review rounds"), with the number of tickets each median covers in smaller, muted text under the label. At a viewport 375 px wide they sit two to a row with no label wrapping onto a third line; at 700 px wide and over they sit in one row.
3. Each shipped ticket is a card with a visible border on all sides, a green left edge and at least 8 px of space between cards, readable in light and dark mode. Its id and title come first, laid out like a Plan card after 0151, with the title still opening the full ticket.
4. Under the title, the card says when it shipped, labelled: "Shipped 21:52" for today and "Shipped 12 Oct, 21:52" for an earlier day. Under that, its figures are label and value pairs in a grid, not a run separated by dots: Time, Review rounds, Reviewer tokens, Builder tokens and Builder cost. A figure the ticket doesn't have is left out. Token counts of 10,000 and over are shortened (for example "108k" and "2.4M"), with the exact number as a tooltip. The Review pack button sits at the bottom of the card and works as before.
5. Nothing overflows a 375 px wide screen, and no test that passed before this change fails, except checks of the old Shipped layout (the dot-separated figures, the unlabelled time, the stats' text), which are changed to check AC1 to AC4.

## Out of scope
- Which tickets are listed (the latest 5) and how the stats are worked out.
- The Plan and Build sections.

## Notes
- Builds on 0151's card styles, so it waits for it.
- The rows are filled by `fill('shipped', …)` and the stats by `$('shipped-stats')` in `templates/panel.html`; the time comes from `shippedAt()`.
- Reported 2026-10-13 from a phone screenshot in dark mode.
- Failing before this build: none
- Self-check: no changes

## In plain words
The Shipped section is easier to read, most of all on a phone. It has a green line along its top, like Plan's coloured one. Its six stats are small tiles, two to a row on a phone and all in one row on a wider screen, each with its number, a short label and how many tickets it covers. Each shipped ticket is now its own card with a green left edge: its number and title, then "Shipped 21:52" (or "Shipped 12 Oct, 21:52" for an earlier day), then its figures each under its own label, then the Review pack button. Big token counts read as "108k" or "2.4M"; hover over one to see the exact number. To see it, open the panel and scroll to Shipped, ideally on your phone in dark mode. Worth a look: on a phone a one-line title leaves a little space under it, because the title keeps a finger-sized tap area.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - Inbox: speck/ideas/2026-10-14-shorten-big-numbers-in-the-shipped-stats.md (the stat tiles still show token medians in full).
  - Known limit: at phone width a shipped card's title keeps its 44 px tap height (0140), so a one-line title leaves some space under it.
  - Tidy-up: the `td.num` rule no longer styles anything in the panel; 0135's test still asserts it is unchanged, so it stayed.
  - Updated checks of the old Shipped layout, as AC5 allows: 0035 (stats text, time format), 0049 and 0100 (the type tag now sits under the title, as in Plan), 0050 (the labelled time), 0120 (the figures) and 0137 AC4 (the row no taller with Review pack, now Review pack at the card's bottom).

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "809454ebd5adfa501f2e691ea389cbc171554351",
    "thread_id": "01a1393e-f9fb-7053-8f6e-db239fa3beac",
    "seconds": 48,
    "usage": {
      "input_tokens": 124397,
      "cached_input_tokens": 75776,
      "cache_write_input_tokens": 0,
      "output_tokens": 672,
      "reasoning_output_tokens": 15
    },
    "saved_at": "2026-10-14T07:10:38.521Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: section.shipped sets a 2px solid var(--ok) top border. Both light and dark AC1 browser tests in test/panel-0157.test.mjs passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html: .stats/.stat styles and render() create six equal tiles with separate numbers, labels and median counts. AC2 tests passed for content and browser geometry at 375, 700 and 1280px, including two-line mobile labels and smaller muted counts."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html: #shipped card styles provide all borders, a green left edge and 8px gaps; render() places id and fullLink() title first. AC3 tests passed for title opening, alignment, borders and spacing in both themes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html: shippedAt(), tokenCount() and render() provide labelled ship times, optional figure pairs, abbreviated tokens with exact tooltips and the final packButton(). AC4 tests passed for values, omissions, dates, layout and opening the review pack; updated panel-0050 tests retain midnight-update coverage."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Both 375px overflow browser tests passed. Verified /tmp/speck-0157-tests.txt: 1473 passed, zero failed and three unrelated existing skips. Changes to existing assertions reflect the requested Shipped layout; ticket selection, statistics calculations, Plan and Build implementation remain unchanged."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Shipped now has a green accent, compact stat tiles and separated cards with clearly labelled times and figures. Tests cover mobile sizing, both colour themes and existing ticket and review-pack actions. The full test log shows no failures. No blocking concerns found."
  }
}
```

</details>
