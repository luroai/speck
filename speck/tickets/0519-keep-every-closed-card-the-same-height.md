---
id: "0519"
title: "Keep every closed card the same height"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-26
started: "2026-10-26T21:31:19.850Z"

---
# 0519 · Keep every closed card the same height

**Status:** 🔍 reviewing

## Problem
A closed card's height still depends on what's in it. Build's status line stays on one line (0484), but Plan's details line wraps when it doesn't fit, so a ticket with a `task` tag takes an extra line (carbon's 0009, 2026-10-26), and Plan's cards have empty space under their details. Plan's details also spend their room on the criteria count and lint result, which the user doesn't need on a closed card, spaced widely with ` · ` between them.

## Outcome
Every closed card in every lane is the same height, and a closed Plan card's second row is its priority, size, risk and type as small labels.

## Acceptance criteria
1. A closed Plan card's second row shows only its priority, size and risk, and its type when it has one (bug, fix or task), each as a small boxed label, side by side with a small gap and no ` · ` between them. Its criteria count and lint result aren't on a closed card; an open card shows them as today.
2. The priority label still opens the priority menu and changes the ticket's priority as today, and size, risk and type still show their explanations on hover or tap.
3. A closed card in Plan, Build or Shipped shows its title on one line, cut short with `…` when it doesn't fit, and its second row on one line that never wraps, with no empty space under it.
4. In a real browser at 320 px, 375 px and 420 px wide, in both looks, closed cards in Plan, Build and Shipped are all the same height, including a Plan task ticket with a long title and `after` ids, a blocked Build bug ticket, and a Shipped ticket with a long title. Cards that show a question, a recommendation, a Ship button or a message under their two lines, as 0419 keeps, and open cards, are left out of this.
5. No test that passed before this change fails, apart from earlier tests that check a closed Plan card's details line (its ` · ` separators, criteria count, lint result or wrapping), which change to this.

## Out of scope
- What a closed Build or Shipped card's second row says: they keep their details, now on one line.
- Open cards, and what a closed card shows under its two lines (0419's criterion 4).
- The Plan lane's Tickets, Ideas and Inbox buttons, which 0520 removes.

## Notes
- Asked for 2026-10-26: "did we not make the tickets stay consistent with heights … we need to make it all uniform please", with a screenshot of carbon's Plan lane on a phone: 0007, 0008 and 0010 on two lines with space under them, 0009 on three. Then: "The data we need to show on the second row really is Priority. Size. Risk. Type … in little labels or boxes … no need for the wide spacing. I'd still like to update priorities. I don't need to know criteria or whether lint passes."
- Today: 0419 lets Plan's details line wrap "only when it doesn't fit", with ` · ` between its parts; 0484 cuts Build's status words short with `…` and keeps the stage, time and tag whole; 0420 and 0494 set out Shipped's closed card. A ticket's type is `type:` (bug or fix) or `kind: task`.
- Cards: `templates/panel-cards.css`, and the closed cards in `templates/panel.js` (`ticketItem`, the Build queue's and Shipped's rows).
- Failing before this build: none
- Self-check: on a touch screen a Plan label's 44 px tap area reached up into the title line, so a tap on the title showed a tip (0164's test); it now reaches from its row's top to the card's bottom, and only halfway into the gap beside it. The priority's 44 px box reached over the size label beside it; it now reaches left of the priority instead. A building card's 2 px border made it 2 px taller; its padding is a pixel less. Build's bug, fix or task tag is now the same small box as Plan's labels, as 0165 has Plan's and Build's tags match.
- Changed older tests beyond AC5's list (judgement call for the reviewer): 0165 AC1 checked a 44 by 44 px tap area centred on every Plan tag, which can't fit with the small gap AC1 asks for and the user's "no need for the wide spacing"; it now checks a closed Plan label's tap area from its row's top to the card's bottom, and the priority's 44 px box. 0040 AC2 checked that a closed draft's lint change shows; it now checks a priority change.
## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "6013e78a512cbfd3a7aab9da3e3828a04b71e43b",
    "session": "fresh",
    "thread_id": "01a17a39-4cb0-7f41-8349-9afa68036b65",
    "builder_response": "- Tests run: test/panel-0519.test.mjs test/panel-0039.test.mjs test/panel-0040.test.mjs test/panel-0151.test.mjs test/panel-0165.test.mjs test/panel-0419.test.mjs test/panel-0442.test.mjs test/panel.test.mjs test/panel-0161.test.mjs test/panel-0162.test.mjs test/panel-0164.test.mjs test/panel-0190.test.mjs test/panel-0224.test.mjs, with --related (which added panel-0417, 0433, 0469, 0472 and others that name the changed files)\n- Before review I also ran, with --files, the 60 panel test files that check tags, details lines, criteria, lint, .checks, .sum, .meta, .prio or at-build; all pass apart from the ones I changed below, which now pass too.\n- Design: every closed card is now 58 px high in every lane (a 20 or 22 px title line plus a 24 or 22 px second row inside the 44 px top-row minimum). Before this, Plan and Build were 78 px (a 44 px details line with about 15 px under its text) and Shipped was 54 px.\n- Older tests changed under AC5 (they checked a closed Plan card's details line: its \" · \", criteria count, lint result or wrapping): 0039 AC1, 0151 AC3, 0419 AC1 and its missing-fields test, 0442 AC1 (Plan has no dots now), panel.test.mjs 0033 AC4.\n- Older tests changed as a judgement call, which please check:\n  - 0165 AC1 at 375 px checked a 44 by 44 px touch area centred on every Plan tag. With the small gap AC1 asks for (and the user's \"no need for the wide spacing\" in the Notes), side-by-side labels about 18 to 40 px wide can't each have a centred 44 px area without overlapping. On a touch screen a closed Plan label's tap area now reaches from its row's top to the card's bottom, and halfway into the gap beside it, so it never reaches into the title line (0164's tap on the title would otherwise show a tip). The priority keeps its 44 by 44 px box (0151 AC2 is unchanged and passes), reaching left of the label into the card's edge. The test now checks those areas. Build's tags keep their centred 44 px areas (0190 and 0224 are unchanged and pass).\n  - 0040 AC2 checked that a closed draft's lint change shows in the same refresh; a closed card has no lint result now, so it checks a priority change instead.\n- Build's bug, fix or task tag is now the same small box as Plan's labels (and Shipped's), because 0165 AC1 needs Plan's and Build's tags to be the same size and padding.\n- A card with an agent at work has a 2 px border, which made it 2 px taller; its padding is now 1 px less, so it's the same height.\n- Pictures: Plan, Build and Shipped at 375 px in both looks, and the open priority menu.\n",
    "seconds": 39,
    "usage": {
      "input_tokens": 171247,
      "cached_input_tokens": 119808,
      "cache_write_input_tokens": 0,
      "output_tokens": 975,
      "reasoning_output_tokens": 218
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-26T21:59:36.602Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel.js ticketHead renders only tagsOf(t, true) when closed. Passing 0519 AC1 tests cover all labels, omitted criteria/lint and retained open-card readiness; browser tests check boxes and gaps."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0519 AC2 tests exercise the priority menu and priority POST, explanation handlers, and a real browser tap on priority. Existing explained and priorityPicker handlers remain intact."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panel-cards.css applies title ellipsis and fixed, non-wrapping closed second rows. Passing 0519 AC3/AC4 browser measurements check line counts, clipping and space beneath each row."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0519 browser test measures all three lanes at 320, 375 and 420 px in both looks. cards-0519.mjs includes the long Plan task with dependencies, blocked Build bug and long Shipped title."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Recorded run reports 313 passing, zero failing and three skipped tests. Closed Plan assertion updates follow the new content; the priority-refresh replacement remains meaningful. Revised touch-area checks exercise the compact labels rather than merely removing assertions."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-cards.css:275",
        "issue": "The new padding rule for .q:is(.at-build, .at-check, .at-review, .at-ship) also changes open Build cards, reducing their padding from 6px 10px to 5px 9px. The ticket explicitly excludes open cards; this adjustment is needed only to equalise closed-card heights.",
        "suggested_fix": "Restrict the padding adjustment to :not(.open), retaining the existing padding on open cards.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The compact labels and equal closed-card heights are supported by meaningful browser tests across all requested widths and both looks. One CSS rule also changes open cards, which the ticket excludes; restrict that rule before approval."
  }
}
```

</details>
