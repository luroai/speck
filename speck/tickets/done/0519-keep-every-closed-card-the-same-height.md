---
id: "0519"
title: "Keep every closed card the same height"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
approved: "2026-10-26T22:15:00.320Z"
finished: "2026-10-26T22:18:38.800Z"

---
# 0519 · Keep every closed card the same height

**Status:** ✅ done

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
Closed cards in Plan, Build and Shipped are now all the same height, and shorter than Plan's and Build's were, with no blank space under their second line. A closed Plan card's second line is now just its priority, size, risk and type as small boxed labels, close together. Its criteria count and lint result show once you open it. Tapping the priority still changes it, and tapping or hovering over the other labels still explains them. To see it, open the panel on a phone and swipe between the lanes: every closed card should line up at the same height. Worth keeping an eye on: on a touch screen the labels are closer together than before, so their tap areas are smaller, and Build's bug, fix or task tag is now a small box too.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The new padding rule for .q:is(.at-build, .at-check, .at-review, .at-ship) also changes open Build cards, reducing their padding from 6px 10px to 5px 9px.
Round 2 (codex): approve.
Round 3 (codex, merge round): approve.
Round 4 (codex, merge round): approve.

## Delivery log
- Review rounds: 4, 2 of them merge rounds
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,387,460
- Elapsed since build started: 44 min
- Changed lines: 63 (limit 5000)
- Follow-ups (none sent to the inbox):
  - Known limit: on a touch screen a closed Plan label's tap area is about 35 px tall (from its row's top to the card's bottom) and stops halfway into the 4 px gap beside it, rather than 44 by 44 px, so the small gap and the title's own tap area both fit. The priority keeps its 44 px box, which reaches left of it.
  - Tidy-up: docs/design/lcd/panel-mock.html still draws a Plan card with its criteria count and "lint passes".

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

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "c14794f9b991a05e1ecd0a1bfe19b2b2655e7c06",
    "session": "continued",
    "thread_id": "01a17a39-4cb0-7f41-8349-9afa68036b65",
    "builder_response": "- Tests run: test/panel-0519.test.mjs test/panel-0039.test.mjs test/panel-0040.test.mjs test/panel-0151.test.mjs test/panel-0165.test.mjs test/panel-0419.test.mjs test/panel-0442.test.mjs test/panel.test.mjs\n- F1: fixed. The padding rule in templates/panel-cards.css is now `.q:is(.at-build, .at-check, .at-review, .at-ship):not(.open)`, so open cards keep 6px 10px. New browser test \"0519 AC4: a card an agent is at work on loses a pixel of padding for its thicker border only while it's closed\" checks 5px 9px closed and 6px 10px open.\n",
    "seconds": 18,
    "usage": {
      "input_tokens": 280105,
      "cached_input_tokens": 224768,
      "cache_write_input_tokens": 0,
      "output_tokens": 1504,
      "reasoning_output_tokens": 218
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-26T22:00:22.749Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel.js ticketHead renders only priority, size, risk and optional type labels when closed. Passing 0519 AC1 tests cover label contents, boxes, gaps, omitted criteria/lint and retained open-card readiness."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0519 AC2 tests exercise the priority menu, priority update request and explanation handlers. Browser coverage verifies tapping the priority label opens its menu."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panel-cards.css provides closed-title ellipsis and non-wrapping second rows. Passing 0519 AC3/AC4 browser tests check single-line titles and details, clipping and remaining space below the row."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing browser tests measure equal heights across Plan, Build and Shipped at 320, 375 and 420 px in both looks, including the specified task, blocked bug and long-title fixtures. The new passing regression test verifies open Build cards retain their original padding."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Current test output records 220 passes, zero failures and three skips. The changed older tests retain meaningful checks while accommodating the new closed Plan details."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-cards.css:276",
        "issue": "The padding adjustment previously affected open Build cards. It now includes :not(.open), preserving their original padding.",
        "suggested_fix": "Completed; the new browser regression test verifies closed and open padding separately.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Closed cards now have consistent heights and compact Plan labels, with priority changes and explanations preserved. Browser tests cover every requested width and both looks. The open-card padding issue is fixed; no blocking concerns remain."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "9101952e05b46c21304ba7e01653b2fd495cff1a",
    "merge": true,
    "session": "continued",
    "thread_id": "01a17a39-4cb0-7f41-8349-9afa68036b65",
    "builder_response": "- Tests run: test/panel-0039.test.mjs test/panel-0060.test.mjs test/panel-0040.test.mjs test/panel-0128.test.mjs test/panel-0041.test.mjs test/panel-0053.test.mjs test/panel-0063.test.mjs test/panel-0143.test.mjs test/panel-0142.test.mjs test/panel-0061.test.mjs test/panel-0062.test.mjs test/panel-0156.test.mjs test/panel-0054.test.mjs test/panel-0155.test.mjs test/panel-0132.test.mjs test/panel-0168.test.mjs test/panel-0178.test.mjs test/panel-0058.test.mjs test/panel-0196.test.mjs test/panel-0257.test.mjs test/panel-0203.test.mjs test/panel-0162.test.mjs test/panel-0261.test.mjs test/panel-0361.test.mjs test/panel-0213.test.mjs test/panel-0138.test.mjs test/panel-0077.test.mjs test/panel-0140.test.mjs test/panel-0141.test.mjs test/panel-0427.test.mjs test/panel-0153.test.mjs test/panel-0171.test.mjs test/panel-0435.test.mjs test/panel-0426.test.mjs test/panel-0158.test.mjs test/panel-0442.test.mjs test/panel-0417.test.mjs test/panel-0469.test.mjs test/panel-0154.test.mjs test/panel-0165.test.mjs test/panel-0151.test.mjs test/panel-0461.test.mjs test/panel-0444.test.mjs test/panel-0519.test.mjs test/panel-0258.test.mjs test/panel-0473.test.mjs test/panel-0164.test.mjs test/panel-0484.test.mjs test/panel-0463.test.mjs test/panel-0187.test.mjs test/panel-0201.test.mjs test/panel-0167.test.mjs test/panel-0069.test.mjs test/panel-0190.test.mjs test/panel-0224.test.mjs test/panel-0185.test.mjs test/panel.test.mjs test/panel-0161.test.mjs test/tap-0221.test.mjs test/panel-0273.test.mjs test/panel-0411.test.mjs test/panel-0281.test.mjs test/panel-0431.test.mjs test/panel-0424.test.mjs test/panel-0372.test.mjs test/panel-0416.test.mjs test/panel-0418.test.mjs test/panel-0428.test.mjs test/panel-0419.test.mjs test/panel-0440.test.mjs test/panel-0420.test.mjs test/panel-0462.test.mjs test/panel-0453.test.mjs test/panel-0472.test.mjs test/panel-0500.test.mjs test/tap-0209.test.mjs with --related (794 pass, 0 fail, 3 skipped as before)\n- Ship refused: 0156 AC3 to AC5 (at 375 and 1280 px, light and dark) failed with \"0401: its status line stays inside the card\". main was already merged in (\"Already up to date\"), so the failure came from this ticket alone, not from main's newer changes: no files conflicted and nothing was resolved.\n- Why: 0156 checks that a closed Build card's status line clips with overflow-x hidden and an ellipsis. In round 1 I'd changed it to overflow-x: clip, so the 24 px line wouldn't cut off its tag's 44 px touch area (0190, 0224). With hidden, overflow-y is clipped too.\n- What I changed (templates/panel-cards.css only): the closed Build status line is overflow: hidden again. To keep its tag's 44 px touch area inside it, it's now a 44 px line (height and line-height 44 px) with margin -10px top and bottom, so it still takes only 24 px of the card (cards stay 58 px) and its text sits where it did. Its tag is vertical-align: top with margin-top calc(14px - var(--label-border)), which puts the tag (16 px plus its two borders) in the line's exact middle, so the ±21.5 px touch area fits inside. Plan's and Shipped's rows are unchanged.\n- Checked: 0156, 0190, 0224, 0434, 0443, 0484, 0165, 0164, 0494, 0419 and 0519 all pass, along with every other file in the list above.\n",
    "seconds": 18,
    "usage": {
      "input_tokens": 400018,
      "cached_input_tokens": 338816,
      "cache_write_input_tokens": 0,
      "output_tokens": 2046,
      "reasoning_output_tokens": 218
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-26T22:08:50.006Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel.js ticketHead still renders only priority, size, risk and optional type labels when closed. Passing 0519 AC1 tests verify content, boxed styling, gaps and retained open-card readiness."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0519 AC2 tests cover the priority menu, update request and explanation handlers. Browser tests verify priority interaction; existing Build touch-area tests 0190 and 0224 also pass after the clipping change."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panel-cards.css retains single-line titles with ellipsis and non-wrapping details. The revised closed Build row uses negative margins to retain its previous layout height while clipping overflow. The 0519 browser measurements and existing 0156 overflow tests pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0519 browser tests verify equal closed-card heights at 320, 375 and 420 px in both looks, including the specified task, blocked bug and long-title fixtures. The open-card padding regression test also passes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The latest recorded run has 794 passes, zero failures and three skips. Previously failing 0156 checks now pass without weakening their assertions; the clipping fix is confined to closed Build rows."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-cards.css:276",
        "issue": "The padding adjustment remains restricted to closed Build cards with :not(.open), preserving open-card padding.",
        "suggested_fix": "Completed and covered by the passing open/closed browser regression test.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The Build clipping fix preserves equal card heights and tag touch areas, and the previously failing overflow tests now pass. Compact Plan labels and existing interactions remain covered. No blocking concerns remain."
  }
}
```

</details>

<details><summary>Round 4 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 4,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "1c30e65b0c115061e4f07373a419215bd9b9bb7c",
    "merge": true,
    "session": "continued",
    "thread_id": "01a17a39-4cb0-7f41-8349-9afa68036b65",
    "builder_response": "- Tests run: test/panel-0039.test.mjs test/panel-0040.test.mjs test/panel-0041.test.mjs test/panel-0050.test.mjs test/panel-0051.test.mjs test/panel-0052.test.mjs test/panel-0053.test.mjs test/panel-0054.test.mjs test/panel-0055.test.mjs test/panel-0058.test.mjs test/panel-0060.test.mjs test/panel-0061.test.mjs test/panel-0062.test.mjs test/panel-0063.test.mjs test/panel-0069.test.mjs test/panel-0077.test.mjs test/panel-0128.test.mjs test/panel-0132.test.mjs test/panel-0138.test.mjs test/panel-0140.test.mjs test/panel-0141.test.mjs test/panel-0142.test.mjs test/panel-0143.test.mjs test/panel-0151.test.mjs test/panel-0153.test.mjs test/panel-0154.test.mjs test/panel-0155.test.mjs test/panel-0156.test.mjs test/panel-0158.test.mjs test/panel-0160.test.mjs test/panel-0161.test.mjs test/panel-0162.test.mjs test/panel-0164.test.mjs test/panel-0165.test.mjs test/panel-0167.test.mjs test/panel-0168.test.mjs test/panel-0171.test.mjs test/panel-0178.test.mjs test/panel-0185.test.mjs test/panel-0187.test.mjs test/panel-0190.test.mjs test/panel-0196.test.mjs test/panel-0201.test.mjs test/panel-0203.test.mjs test/panel-0213.test.mjs test/panel-0224.test.mjs test/panel-0257.test.mjs test/panel-0258.test.mjs test/panel-0261.test.mjs test/panel-0273.test.mjs test/panel-0281.test.mjs test/panel-0361.test.mjs test/panel-0372.test.mjs test/panel-0410.test.mjs test/panel-0411.test.mjs test/panel-0416.test.mjs test/panel-0417.test.mjs test/panel-0418.test.mjs test/panel-0419.test.mjs test/panel-0420.test.mjs test/panel-0421.test.mjs test/panel-0422.test.mjs test/panel-0424.test.mjs test/panel-0426.test.mjs test/panel-0427.test.mjs test/panel-0428.test.mjs test/panel-0431.test.mjs test/panel-0434.test.mjs test/panel-0435.test.mjs test/panel-0438.test.mjs test/panel-0440.test.mjs test/panel-0442.test.mjs test/panel-0443.test.mjs test/panel-0444.test.mjs test/panel-0453.test.mjs test/panel-0454.test.mjs test/panel-0455.test.mjs test/panel-0461.test.mjs test/panel-0462.test.mjs test/panel-0463.test.mjs test/panel-0464.test.mjs test/panel-0465.test.mjs test/panel-0468.test.mjs test/panel-0469.test.mjs test/panel-0472.test.mjs test/panel-0473.test.mjs test/panel-0476.test.mjs test/panel-0477.test.mjs test/panel-0478.test.mjs test/panel-0480.test.mjs test/panel-0481.test.mjs test/panel-0484.test.mjs test/panel-0494.test.mjs test/panel-0500.test.mjs test/panel-0513.test.mjs test/panel-0519.test.mjs test/panel.test.mjs test/tap-0209.test.mjs test/tap-0221.test.mjs with --related (962 pass, 0 fail, 3 skipped as before)\n- Ship refused: 0051 AC2-AC5 and 0055 AC1-AC4 failed, both on selecting a closed Build card's title by dragging in a real browser (an empty selection where 'Expor' and 'A buil' were expected). main had nothing new to merge in (\"Already up to date\"), so no files conflicted and nothing was resolved. The cause was last round's change: the closed status line is now a 44 px box that reaches 10 px up behind the title line, and as it comes later in the page it was on top of the title's lower part, so a press there landed in the status line rather than the title.\n- What I changed (templates/panel-cards.css only): `.q:not(.open) .top .line { position: relative; }`, which puts a closed Build card's title line above the status line reaching behind it. A tag's touch area (z-index 1 on a touch screen) is still above both, so 0190 and 0224 still pass. Layout is unchanged.\n- This time I ran a wider set: every panel test file the earlier list covered, plus every browser test that touches the Build lane (99 files).\n",
    "seconds": 19,
    "usage": {
      "input_tokens": 528986,
      "cached_input_tokens": 463232,
      "cache_write_input_tokens": 0,
      "output_tokens": 2579,
      "reasoning_output_tokens": 218
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-26T22:14:58.334Z"
  },
  "verdict": {
    "round": 4,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "ticketHead still renders only priority, size, risk and optional type labels for closed Plan cards. Passing 0519 tests cover label contents, boxes, spacing and retained criteria/lint information when open."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0519 tests cover priority menu interaction, the update request and label explanations. Existing 0190 and 0224 browser tests confirm Build tag touch areas still work after the stacking fix."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Closed-card ellipsis and non-wrapping row rules remain intact. Passing 0519 browser measurements verify single-line titles and details without excess space below them; the new position: relative rule changes stacking without changing layout."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The 0519 browser test passes at 320, 375 and 420 px in both looks across all three lanes, including the required task, blocked bug and long-title fixtures. Open-card padding remains unchanged and tested."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified current output reports 962 passes, zero failures and three skips. Previously failing browser selection tests 0051 AC2-AC5 and 0055 AC1-AC4 now pass, alongside touch-area and card-height tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-cards.css:276",
        "issue": "The padding adjustment remains restricted to closed Build cards, preserving open-card padding.",
        "suggested_fix": "Completed and covered by the passing open/closed padding regression test.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The title stacking fix restores text selection while preserving tag touch areas and equal card heights. All requested behaviour remains covered, and the wider test run reports no failures. No blocking concerns remain."
  }
}
```

</details>
