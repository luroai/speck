---
id: "0162"
title: "Declutter the panel on a phone"                # one outcome, no "and"
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
after: ["0167"]                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T15:59:37.015Z"

---
# 0162 · Declutter the panel on a phone

**Status:** 🔍 reviewing

## Problem
On a phone the panel takes a lot of scrolling for what it says. Three lines of instructions that never change ("Click one to open it", "Builds run in their own worktrees", "Latest 5") repeat on every visit, an empty Build section takes a full block, and Shipped, the least urgent section, is the longest: six large stat tiles with seven-digit numbers, then cards of about 600 px each. Shipped titles are in the accent red, which also means "look at this" elsewhere, and the gaps between a Plan card's tags are uneven.

## Outcome
The panel shows the same information in less space: no fixed instructions, a one-line empty Build, a compact Shipped section with details a tap away, neutral Shipped titles and evenly spaced tags.

## Acceptance criteria
1. The hints "Click one to open it", "Builds run in their own worktrees" and "Latest 5" are no longer shown.
2. When nothing is in flight or ready, the Build section is a single line: its heading and "Nothing in flight or ready". It returns to its full layout as soon as a ticket is ready or in flight.
3. Shipped shows three stat tiles: shipped today, median minutes and median builder cost. A "More stats" button below them shows and hides the other three (median review rounds, reviewer tokens and builder tokens). Every stat over 9,999 is shortened as the cards' figures are (for example "2.4M"), with the exact number as a tooltip.
4. Each shipped card shows its id and title, its ship time and one line of figures ("12 min · 1 round · $2.91"). Tapping the card's "Details" button shows the full labelled figures and the Review pack button; tapping the title still opens the full ticket.
5. The gaps between a card's tags are equal, including beside the priority tag with its tap area, and no test that passed before this change fails, except checks of the removed hints and the old Shipped layout, which are changed to check AC1 to AC4.

## Out of scope
- Colours and contrast (0161).
- The Plan and Build card layouts beyond the tag gaps.

## Notes
- Builds after 0167, which takes colour out of titles and links and builds on 0161, so the style changes don't clash.
- Reported 2026-10-14 from phone screenshots; the user liked the layout but felt it might be cluttered.
- Failing before this build: none
- Shipped titles were already in the text colour since 0167; 0162's browser test checks they stay that way.
- On a phone the More stats labels ("median reviewer tokens") can't fit two lines in a three-column row, so they take three; 0157's line limit for them at 375 px is changed to match (an old Shipped layout check, as AC5 allows).
- 0148 AC2 (Auto-build switch over --url) failed once in a full run under load and passes alone; it doesn't touch the page.
- Self-check: corrected a CSS comment that said every stat label fits on two lines on a phone.

## In plain words
The panel takes less scrolling on a phone. The three fixed instructions beside the section headings are gone. When nothing is building or waiting, Build is a single line that says so. Shipped now shows three stats, with a More stats button for the other three, and big numbers are shortened (hover for the exact figure). Each shipped ticket shows one line of figures, such as "12 min · 1 round · $2.91", with a Details button for the full figures and the Review pack. The tags on a Plan ticket are now evenly spaced on a phone. To see it, open the panel on your phone and scroll to Shipped. On a phone, the labels of the extra stats wrap onto three short lines.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Known limit: at 375 px the More stats labels take three lines (one word each), as they can't fit two in a three-column row.
- Skipped (duplicate): 0148 AC2's Auto-build test failed once under load and passed alone, already covered by speck/ideas/2026-10-13-stop-tests-checking-speck-run-stopped-too-soon.md.

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
    "reviewed_sha": "a2d3b2ac7ad71f912b2dfc87e8f72271afb90cc3",
    "thread_id": "01a13b37-2b48-78b0-a05b-93267cf6a835",
    "seconds": 39,
    "usage": {
      "input_tokens": 187207,
      "cached_input_tokens": 135296,
      "cache_write_input_tokens": 0,
      "output_tokens": 777,
      "reasoning_output_tokens": 27
    },
    "saved_at": "2026-10-14T16:21:12.528Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html removes all three header hints. panel-0162.test.mjs AC1 checks static content and real browser headers at 375 and 1280 px; all passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "render() hides the empty queue and puts the message beside Build; CSS prevents the empty section stretching. AC2 tests cover empty-to-ready transitions, in-flight tickets and browser section height; all passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "render() splits stats into two groups, with moreStats controlling the additional tiles. shortened() supplies compact values and exact tooltips. AC3 tests exercise toggling, poll persistence, large token/minute/cost values and browser placement; all passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "render() creates compact shipped summaries and uses openShipped to reveal labelled figures and Review pack. AC4 tests exercise opening, closing, independent cards, polling, missing figures, pack requests and title navigation; browser checks passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Mobile priority wrapper padding and negative margins equalise visible tag gaps while retaining its tap area. AC5 browser tests passed at 375 and 1280 px. The full recorded output confirms 1,592 passed, zero failed and three skipped; existing test changes concern removed hints or the replaced Shipped layout."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel is more compact: repeated instructions are gone, empty Build takes one line, and Shipped keeps extra statistics and detailed figures behind buttons. Tests cover the interactions and phone layout, with no suite failures. I found no blocking issues or unrelated implementation changes."
  }
}
```

</details>
