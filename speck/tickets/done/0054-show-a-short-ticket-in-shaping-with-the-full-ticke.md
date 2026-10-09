---
id: "0054"
title: "Show a short ticket in Shaping with the full ticket on demand"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-09-shorter-ticket-view-with-full-view-on-demand.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T19:07:59.238Z"
finished: "2026-10-09T19:21:05.030Z"

---
# 0054 · Show a short ticket in Shaping with the full ticket on demand

**Status:** ✅ done

## Problem
An open ticket in Shaping shows everything: problem, outcome, acceptance criteria, out of scope and notes, then the readiness list. That makes it long, so the user can't judge a draft at a glance before setting it ready.

## Outcome
An open ticket in Shaping shows a short view, and one click shows the whole ticket in a side pane.

## Acceptance criteria
1. Opening a ticket in the Tickets list shows its problem, outcome, readiness list and **Set ready** button, and not its acceptance criteria, out of scope or notes.
2. The open ticket has a "Full ticket" button. Clicking it doesn't close the ticket, and opens a side pane showing that ticket's id, title, problem, outcome, numbered acceptance criteria, out of scope and notes, as text, with any section that has nothing in it left out.
3. The side pane shows one ticket at a time: clicking "Full ticket" on another ticket replaces its content. It closes with its close button or the Escape key, and closing it leaves the open ticket in the list open.
4. The side pane stays open, showing the same ticket, through the 2-second refresh; when that ticket's data changes it shows the new content, and when the ticket leaves the Tickets list (for example, it's set ready) the pane closes.
5. Text selected in the side pane stays selected through the refresh while that ticket's data in `/api/state` is unchanged, as in the open ticket today.

## Out of scope
- Ideas and inbox notes: they keep showing their whole note when opened.
- Queue and Shipped rows (0051 opens queue tickets to read the build log).
- Showing the review log, delivery log or anything else not in `/api/state` today. Nothing in the JSON changes.
- Editing a ticket from the pane.

## Notes
- Changes the open view that 0033 (done) added; the open and close rules from 0039 (done) still apply to the short view.
- Side pane, not popup, and the full view shows today's sections rather than the raw file: defaults chosen while ticketing, to confirm before ready.
- What's open in the pane survives the refresh and is never sent to the server, like what's open in the lists.
- product.md's Shaping description needs updating.
- Older panel tests (0031 AC5, 0033 AC4, 0039 AC4, 0040) that read criteria or notes in the open ticket now read them in the side pane, or select problem and outcome text instead, as AC1 moves those sections out of the short view.
- Self-check: no changes

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 831,128
- Elapsed since build started: 12 min
- Changed lines: 80 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "23d196eaa33c6876719b227595b1dfba586a9c32",
    "thread_id": "01a12216-4894-7f32-9f69-f6c9fe1b5ff9",
    "seconds": 36,
    "usage": {
      "input_tokens": 303204,
      "cached_input_tokens": 222720,
      "cache_write_input_tokens": 0,
      "output_tokens": 1123,
      "reasoning_output_tokens": 47
    },
    "saved_at": "2026-10-09T19:14:43.805Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html ticketDetail shows problem, outcome, readiness and both buttons, omitting the remaining sections. test/panel-0054.test.mjs AC1 exercises these inclusions and exclusions."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "fullButton and fullTicket open the pane without closing the list item, render sections with textContent and criteria with an ordered list, and omit empty sections. The AC2 test exercises all these behaviours; panel.test.mjs also checks hostile markup remains text."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "fullId holds one ticket; closeFull and the document Escape handler close only the pane. The AC3 test exercises replacement, Close, Escape and preservation of open list tickets."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "render calls renderFull with current drafts; renderFull retains the chosen id, rebuilds changed content and closes when the draft disappears. The AC4 test exercises unchanged refreshes, updated criteria and transition to ready. Independent read-only in-memory checks also passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "renderFull compares canonical signatures of ownData and preserves pane nodes when unchanged. The AC5 test checks node retention through unchanged and unrelated updates; the supplied passing browser test exercises actual text selection across two refreshes."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "The updated Shaping description matches the short view, full pane, close controls and refresh behaviour. Changes remain within the ticket's scope."
    },
    "escalation_question": "",
    "summary": "Shaping now shows a shorter ticket, with the full details available in a side pane. The pane updates correctly, preserves selected text during unchanged refreshes and closes when the ticket becomes ready. The tests exercise the requested behaviour, and I found no blocking issues."
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
    "reviewed_sha": "8754ae828a2e0a434d1dd98d5c750f3fdf946a58",
    "thread_id": "01a12216-4894-7f32-9f69-f6c9fe1b5ff9",
    "seconds": 26,
    "usage": {
      "input_tokens": 525086,
      "cached_input_tokens": 412032,
      "cache_write_input_tokens": 0,
      "output_tokens": 1715,
      "reasoning_output_tokens": 47
    },
    "saved_at": "2026-10-09T19:19:31.549Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html ticketDetail still shows problem, outcome, readiness and Set ready while omitting criteria, out of scope and notes. test/panel-0054.test.mjs AC1 exercises this behaviour and passes in the supplied results."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "fullButton preserves the open list ticket; fullTicket renders the required fields as text, uses an ordered criteria list and omits empty sections. The AC2 test covers these behaviours and passes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "fullId identifies a single pane ticket; closeFull and the Escape handler close the pane without altering open list tickets. The AC3 test covers replacement and both close controls and passes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "renderFull retains the selected draft through refreshes, rebuilds changed content and closes when that draft leaves the list. The AC4 test exercises these transitions and passes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "renderFull preserves existing nodes while the canonical ownData signature is unchanged. The AC5 node-retention test and browser selection test both pass in the supplied results."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "Verified that only the pane wording and ticket records changed since round 1. The revised sentence preserves the correct meaning and avoids the existing 0032 AC3 phrase check; implementation and tests are unchanged."
    },
    "escalation_question": "",
    "summary": "Approval stands. The documentation wording now avoids the unrelated test failure while accurately describing the pane. All five requirements remain met, and the supplied full-suite results show 373 passing tests with none skipped."
  }
}
```

</details>
