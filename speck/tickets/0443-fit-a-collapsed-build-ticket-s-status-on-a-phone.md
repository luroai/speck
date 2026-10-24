---
id: "0443"
title: "Fit a collapsed Build ticket's status on a phone"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-fit-a-closed-card-s-stage-and-time-on-a-phone.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T07:32:32.904Z"
approved: "2026-10-24T07:45:27.095Z"

---
# 0443 · Fit a collapsed Build ticket's status on a phone

**Status:** 👍 approved

## Problem
Since 0434, a collapsed Build ticket's status line is one line, cut off with an ellipsis. On a phone, a long status such as `Approved · waiting for you to ship it` or `Blocked · the Foreman will take its recommendation` pushes the stage and time out of sight.

## Outcome
A collapsed Build ticket's status uses short words, so its stage and time always show.

## Acceptance criteria
1. On a collapsed Build ticket, each long status shows in short words: `Ready to ship` (approved, waiting for you to ship it), `Shipping next` (approved, waiting to ship), `Has a question` (blocked with a question for you), `Foreman will answer` (blocked, the Foreman will take its recommendation), `Build stopped`, `Turn on Auto-build` (approved, waiting for Auto-build) and `Read the document` (a finished document task). `Paused`, `Shipping` and `Queued · waiting on <ids>` stay as they are.
2. The full sentence is the short words' tooltip and accessible name, and an open ticket shows the full sentence.
3. At 375 px wide, every collapsed Build ticket's status line shows its words, stage and time without cutting any of them off.

## Out of scope
- The grid of lights and the time (0434).

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- From the builder's note on 0434. The sentences come from `doing()` in `templates/panel-model.js`.
- Waits for nothing: no open ticket changes `doing()`.
- Failing before this build: none
- Self-check: no changes

## In plain words
A closed ticket in the Build lane now says what it's waiting for in a few words, such as "Ready to ship", "Has a question" or "Foreman will answer", so its stage and time still fit beside them on a phone. Hover over the words, or open the ticket, to read the full sentence, and a screen reader reads the full sentence too. To see it, open the panel on a phone, or narrow the window to phone width, and look at the Build lane. One thing to keep an eye on: on a phone, a long line can still cut off a bug or document tag at its end.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 151,638
- Elapsed since build started: 13 min
- Changed lines: 30 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - On a phone, a closed card with a long status line still cuts off a trailing bug, fix or document tag with the line's ellipsis, sometimes to just `…` (AC3 names only the words, stage and time). Saved to the inbox: speck/ideas/2026-10-24-keep-a-closed-card-s-bug-or-document-tag-whole-on-a-phone.md.

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
    "reviewed_sha": "a30dff16517639352b8803449a2e512043749887",
    "session": "fresh",
    "thread_id": "01a16cde-653e-7362-93ef-55602ad170ac",
    "builder_response": "- Tests run (speck test --related): test/panel-0443.test.mjs test/panel-0040.test.mjs test/panel-0156.test.mjs test/panel-0161.test.mjs test/panel-0168.test.mjs test/panel-0196.test.mjs test/panel-0201.test.mjs test/panel-0203.test.mjs test/panel-0361.test.mjs test/panel-0416.test.mjs test/panel-0434.test.mjs, plus every related test file --related brought in (2489 pass, 0 fail).\n- Change: doing() in templates/panel-model.js now also returns `short`, the short words for a long sentence (null for the rest). progressOf() in templates/panel.js shows them on a closed card, with the sentence as their tooltip (title) and accessible name (role=\"img\" + aria-label, as 0434's grid of lights does); an open card shows the sentence as before.\n- AC3: at 375 px on a touch screen the line still overflowed (the 12 px separator gaps for tap areas, from 0419). In templates/panel.css, on a closed card only the gap before a tag stays wide, since nothing else in that line is tapped. A bug, fix or document tag after the time may still be cut off with the line's ellipsis on a long line: AC3 names only the words, stage and time, and the 375 px test checks each of those is whole and inside the line, for both a touch screen and a mouse.\n- Existing tests changed, all because a closed card's long sentence is now its short words' accessible name: 0040, 0156, 0168, 0196, 0201, 0203, 0361, 0416 and 0434 read the sentence from aria-label (as they already did for the grid of lights) or expect the short words on a closed card. 0416 AC1's \"no picture\" check now skips the say span with role=\"img\" (words, not a picture). 0161 AC3's lastCompound helper now ignores what's inside :not()/:has(), so the new `.sep:not(:has(+ .tag))` selector isn't mistaken for a rule that sizes tags.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 150985,
      "cached_input_tokens": 105984,
      "cache_write_input_tokens": 0,
      "output_tokens": 653,
      "reasoning_output_tokens": 43
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T07:45:05.570Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-model.js SHORT and doing(), plus templates/panel.js say(), implement all seven shortened statuses. Both passing 0443 AC1 tests check those mappings and unchanged Paused, Shipping and Queued statuses."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.js say() sets the full sentence as title and aria-label on a named span, and restores full visible text when open. Both passing 0443 AC2 tests exercise these attributes and opening and closing each status."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.css removes unnecessary separator padding on collapsed progress lines. Both passing 0443 AC3 browser tests use a 375 px viewport with touch and mouse input, checking that status words, stage and time remain within the line without clipping."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Collapsed Build tickets now use the requested shorter statuses, while tooltips, accessible names and open tickets retain the full sentences. The phone layout tests pass for both touch and mouse input. The changed tests exercise the behaviour honestly; no blocking issues found."
  }
}
```

</details>
