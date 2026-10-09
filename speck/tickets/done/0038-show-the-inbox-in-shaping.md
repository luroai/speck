---
id: "0038"
title: "Show the inbox in Shaping"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
started: "2026-10-09T18:29:39.619Z"
finished: "2026-10-09T18:34:40.149Z"

---
# 0038 · Show the inbox in Shaping

**Status:** ✅ done

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
- Self-check: the `From ticket:` id is now the first word on the line, so a line with trailing text (`0041 (round 2)`) still shows its id; added a test.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 283,904
- Elapsed since build started: 4 min
- Changed lines: 36 (limit 5000)
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
    "reviewed_sha": "05c3a90077f830b7c77aa0920429fbfbb7ab17ea",
    "thread_id": "01a121f0-5934-7002-ad55-98f3a6b06371",
    "seconds": 34,
    "usage": {
      "input_tokens": 283010,
      "cached_input_tokens": 216448,
      "cache_write_input_tokens": 0,
      "output_tokens": 894,
      "reasoning_output_tokens": 56
    },
    "saved_at": "2026-10-09T18:33:15.783Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: shapingToggle, shapingView, render and POLL_MS implement ordered counts, Tickets by default, one visible list and refresh persistence. The AC1 test independently passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html: panelModel preserves inbox JSON order and extracts From ticket ids; inboxItem renders title, path and optional source using textContent, with open/close state. All four AC2 tests independently passed, covering ordering, expansion, literal text, empty state and source parsing."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html: panelModel excludes inbox and dropped notes from Ideas while retaining its previous grouping and rendering. The AC3 test independently passed, checking ordering, exclusions and matching count."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html defines --inbox as #4cc4b4 and applies it to the selected toggle, section top border and item left border. The AC4 test independently passed and verifies this colour differs from the existing accents."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "The updated panel description matches the implementation, including counts, teal inbox styling, filtering, source ids and the empty message."
    },
    "escalation_question": "",
    "summary": "Shaping now has a separate Inbox tab with a count and expandable follow-up notes. Ideas excludes inbox and dropped notes. All seven new tests passed independently; they exercise the actual page code. The change stays within scope, and I found no issues that should hold up merging."
  }
}
```

</details>
