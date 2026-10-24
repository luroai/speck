---
id: "0483"
title: "Drop the chain and padlock icons from closed cards"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-24-drop-the-chain-and-padlock-icons-from-closed-cards.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T18:33:27.080Z"
approved: "2026-10-24T18:41:05.884Z"

---
# 0483 · Drop the chain and padlock icons from closed cards

**Status:** 👍 approved

## Problem
A closed Plan or Build card shows a chain or padlock icon after its id and, since 0468, a dependency chip at the end of its title row. The two say the same thing twice, and the chain icon (others wait on this ticket) looks like the chip's link icon (this ticket waits on others) while meaning the opposite, so someone scanning the board on a phone can read them the wrong way round.

## Outcome
A closed card shows its dependencies only with the chip, and its title gets the room the icon took.

## Acceptance criteria
1. A closed Plan or Build card shows no chain or padlock icon after its id, whether it waits on others, others wait on it, or it's in flight. Its dependency chip (0468) shows at the end of its title row as today.
2. An open Plan or Build card shows its chain or padlock icon with its hover text, as today. Opening a card adds its icon and closing it takes it away, without a reload, and the 2-second refresh never brings an icon back on a closed card.
3. On a phone at 375 px, a closed card's title starts straight after its id, where the icon was. No test that passed before this change fails.

## Out of scope
- The chip itself and what it says (0468).
- The highlight of a chain on hover (0041, 0185), which doesn't depend on the icons.
- Shipped cards.

## Notes
- From the inbox note, raised by the builder while taking 0468's pictures. Decided while ticketing on 2026-10-24: open cards keep their icons, as the note suggests, and the chain highlight stays as it is.
- Failing before this build: none
- Self-check: no changes
- Tests changed: 0041, 0050 and 0053 checked the icon on closed cards, which this ticket removes. Each now checks that a closed card has none and opens the card before checking its icon, keeping what it tested.
- Today: `chainIcon` and the Plan and Build cards' updates in `templates/panel.js` (the queue's update adds the icon after the id whether the card is open or closed), and `.chain, .lock` in `templates/panel-cards.css`.

## In plain words
A closed card in Plan or Build no longer shows a little chain or padlock after its number. The small chip at the end of its title row already says what it waits on or what waits on it, so the title now starts straight after the number and has a bit more room. Open a card and its chain or padlock is still there, with its hover text, as before.

To see it, look at a card that waits on another ticket, or that others wait on, in the Plan or Build lane: closed, it shows only the chip; tap it open and the icon appears beside its number.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 186,877
- Elapsed since build started: 8 min
- Changed lines: 7 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none.

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
    "reviewed_sha": "477806ae58e46ee94ba36148808ca052798ca1dc",
    "session": "fresh",
    "thread_id": "01a16f36-f49b-7911-93db-1569de8d849c",
    "builder_response": "- Tests run: `speck test --related test/panel-0483.test.mjs test/panel-0041.test.mjs test/panel-0050.test.mjs test/panel-0053.test.mjs`, which also ran test/panel-0147, panel-0433, panel-0473, panel-0474, panel.test.mjs, slow-tests-0429 and the commands.checks files. All pass.\n- Change: `titleLine` only adds the icon when the card is open, and `queueUpdate` only puts an icon on an open row, so the 2-second refresh takes one away when a card closes and never adds one to a closed card.\n- Existing tests changed: test/panel-0041, panel-0050 and panel-0053 asserted the icon on closed cards, which AC1 removes. Each now asserts a closed card has none and opens the card before checking its icon and hover text, so they still check what they were written for (the icon's kind, its hover text, and that a kept card's icon follows the board). AC3's \"no test that passed before fails\" can't hold literally for assertions of the behaviour this ticket removes; the ticket's Notes say so.\n- AC3 (375 px): checked by the fake page (the title line of a closed card is id, title, chip) and by pictures at 375 px in light and dark.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 186201,
      "cached_input_tokens": 142336,
      "cache_write_input_tokens": 0,
      "output_tokens": 676,
      "reasoning_output_tokens": 25
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T18:40:58.534Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js titleLine and queueUpdate omit icons on closed cards while retaining depChip. Both AC1 tests in test/panel-0483.test.mjs passed, covering Plan, Build, waiting, waited-on and in-flight cards."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "titleLine retains icons for open cards; queueUpdate respects the open state. All three AC2 tests passed, checking icon types and hover text, opening and closing without another board request, and refresh behaviour."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The AC3 test passed, checking that the title immediately follows the id. The inspected 375 px Plan and Build pictures confirm the layout; panel-cards.css uses an 8 px flex gap without reserving icon space. The related test run recorded 217 passes, zero failures and three unrelated skips."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Closed Plan and Build cards now show dependencies only through their chip, giving titles more room. Open cards keep their icons and hover text, and refreshes preserve the correct behaviour. Tests pass and the phone pictures confirm the layout. No blocking concerns found."
  }
}
```

</details>
