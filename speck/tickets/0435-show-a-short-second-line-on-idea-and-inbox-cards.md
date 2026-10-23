---
id: "0435"
title: "Shorten the second line of Plan's note cards"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0434"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T20:59:20.145Z"

---
# 0435 · Shorten the second line of Plan's note cards

**Status:** 🔍 reviewing

## Problem
Cards in Plan's Ideas and Inbox lists repeat themselves and run long: `idea` (or `inbox`) shows before the title and again on the second line, the second line is the note's full file path, which wraps on a phone, and the touch sizing puts a big gap between them.

## Outcome
A collapsed idea or inbox card is its title and one short line saying when it was captured, with the file path only when it's open.

## Acceptance criteria
1. A collapsed card in Plan's Ideas list shows the idea's title with no `idea` label before it, then one line in smaller type: when it was captured, as `Captured 8 Oct`, with the year when it isn't this year (`Captured 8 Oct 2025`), followed by its status only when that isn't `idea`, as in `Captured 8 Oct · shaped`.
2. A collapsed card in Plan's Inbox list shows the note's title with no `inbox` label before it, then `From <id> · captured <date>`, or `Captured <date>` when it names no ticket, the date written as in criterion 1.
3. A note whose `Captured:` line is missing or doesn't hold a date shows `No capture date` where its date would be.
4. Neither list shows a note's file path on a collapsed card. An open card shows the path in small type above the note's text.
5. At 390 px wide, on a touch screen as well as with a mouse, a collapsed idea or inbox card is two rows: its title line and its second line.

## Out of scope
- One-line titles, which 0434 gives every collapsed card.
- Tickets in Plan's Tickets list (0419).

## Notes
- The user asked for this on 2026-10-23, from a phone screenshot of Plan's Ideas list.
- Today: `ideaItem` and `inboxItem` in `templates/panel.html`. A note's first lines read `Captured: <YYYY-MM-DD> · Status: <status>`, and an inbox note has a `From ticket:` line (`fromTicket`).
- Waits for 0434: both change Plan's cards in `templates/panel.html`. 0430 waits for it too, as 0430 moves every style.
- Failing before this build: none
- Built: a note whose `Captured:` line is missing or unreadable shows `No capture date` in place of the whole `Captured <date>` (or `captured <date>`) part, as in `No capture date · parked` and `From 0140 · No capture date`. An idea with no status shows only its date, as the status line shows a status only when it isn't `idea`.
- Built: the open card's path is 12 px, the panel's smallest type, as 0161 allows nothing smaller.
- Self-check: no changes
- Review round 1: 0434's one-line titles covered ticket cards only, not idea and inbox cards, so a long note title still wrapped and AC5 failed. The build extends 0434's rule to closed idea and inbox cards, with the whole title as its tooltip; an open card wraps as before.

## In plain words
Cards in Plan's Ideas and Inbox lists are now two short lines: the note's title, then when it was captured, such as "Captured 8 Oct". An idea also shows its status there when it's anything other than plain "idea", and an inbox note says which ticket it came from first. The "idea" and "inbox" labels are gone, and so is the file path, which now shows only once you open a card, in small type above the note. A long title is cut off with "…" until you open the card, and hovering it shows the whole title. To see it, open Plan on a phone or a narrow window and switch to Ideas or Inbox. A note with no readable capture date says "No capture date".

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
- Follow-ups: none.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "f492e62a234fd424f4d05c47332cd46c8ce134ee",
    "session": "fresh",
    "thread_id": "01a16a95-0c51-73c2-898c-a0900d7b562b",
    "builder_response": "- Tests run: test/panel-0435.test.mjs test/panel-0214.test.mjs test/panel-0038.test.mjs test/panel-0039.test.mjs test/panel.test.mjs test/panel-0161.test.mjs (plus the commands.checks files, which speck test --files always runs)\n- Round 1. Changed tests: 0214, 0038, 0039 and 0033 (in panel.test.mjs) asserted the old `idea`/`inbox` label and the path on the collapsed card, which this ticket removes; each is updated to the new layout with a note naming 0435. 0161 forbids type under 12 px, so the open card's path is 12 px.\n- Pictures of Plan's Ideas (one card open) and Inbox lists at 390 px, light and dark, are kept with the review pack.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 140921,
      "cached_input_tokens": 98816,
      "cache_write_input_tokens": 0,
      "output_tokens": 898,
      "reasoning_output_tokens": 102
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T21:05:41.148Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: ideaItem and capturedOn produce the requested date and optional status. The 0435 AC1 test passes and checks labels, current and previous years, status and smaller type."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html: inboxItem formats the source ticket and capture date. The passing 0435 AC2 test covers notes with and without a source ticket."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "capturedOn rejects missing, unreadable and impossible dates. The passing 0435 AC3 test exercises these cases for ideas and inbox notes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "noteItem renders the path only in an open card, above noteOf; .item .path sets 12 px type. The passing 0435 AC4 test checks visibility and placement."
      },
      {
        "id": 5,
        "status": "fail",
        "evidence": "The 0435 browser tests pass for short titles only. The title truncation selector in templates/panel.html applies to .item.ticket, excluding idea and inbox cards. The passing, updated 0214 browser test explicitly confirms that long note titles still wrap."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Long idea and inbox titles still wrap, so collapsed cards can occupy three or more rows at 390 px. Although the ticket assumes 0434 supplied one-line titles, its CSS only covers ticket cards. The new browser fixtures use short titles and miss this failure.",
        "suggested_fix": "Ensure collapsed idea and inbox titles stay on one line, preserving wrapping when open. Include long titles in the 390 px touch and mouse tests and update the older 0214 expectation that collapsed note titles wrap.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The shorter capture-date lines and open-only file paths work, and the reported tests pass. Long note titles still wrap, however, so the promised two-row phone layout needs one fix before approval."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "900ff031cec688c5b967f2acf0270c042a35bab7",
    "session": "continued",
    "thread_id": "01a16a95-0c51-73c2-898c-a0900d7b562b",
    "builder_response": "- Tests run: test/panel-0435.test.mjs test/panel-0214.test.mjs test/panel-0038.test.mjs test/panel-0039.test.mjs test/panel.test.mjs test/panel-0161.test.mjs test/panel-0434.test.mjs (plus the commands.checks files)\n- F1: fixed. templates/panel.html: a new rule beside 0434's cuts a closed idea's or inbox note's title to one line with an ellipsis, and lets its line shrink so its grid column is no wider than the card; ideaItem/inboxItem (noteItem) give the title the whole title as its tooltip (`titled`, as 0434 does). Open cards wrap as before. test/panel-0435.test.mjs now has a long idea title and a long inbox title; its 390 px touch and mouse tests check each closed card's title is one line, stays inside the card, has its whole title as tooltip, that the long one is cut off, and that it wraps again when open. test/panel-0214.test.mjs's browser test now opens the cards before checking a long title wraps and isn't cut off. Pictures retaken.\n",
    "seconds": 17,
    "usage": {
      "input_tokens": 237716,
      "cached_input_tokens": 186880,
      "cache_write_input_tokens": 0,
      "output_tokens": 1540,
      "reasoning_output_tokens": 102
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T21:07:48.110Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: ideaItem and capturedOn render the title without a label, formatted capture date and optional status. Passing test '0435 AC1' checks current and previous years, status and smaller type."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html: inboxItem renders the requested source-ticket and date formats. Passing test '0435 AC2' covers notes with and without a source ticket."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "capturedOn rejects missing, unreadable and impossible dates. Passing test '0435 AC3' checks the fallback text in both lists."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "noteItem renders the path only when open, above the note; .item .path sets 12 px type. Passing test '0435 AC4' checks visibility and placement in both lists."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Collapsed idea and inbox titles now have ellipsis and shrinking rules. Both passing '0435 AC5' browser tests exercise long titles at 390 px with touch and mouse, checking two rows, single-line titles and metadata, containment, spacing and wrapping when opened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Long note titles previously wrapped, breaking the two-row collapsed layout. The new CSS keeps them on one line, and browser tests now cover long titles in both lists.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Idea and inbox cards now show a title and short capture-date line, with file paths visible only when opened. The long-title layout issue is fixed and covered by touch and mouse browser tests. All five criteria pass; the reported run has no failures."
  }
}
```

</details>
