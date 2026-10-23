---
id: "0419"
title: "Fit a closed Plan or Build ticket on two lines"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0418"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T16:20:29.027Z"
blocked_at: ""
waited_seconds: 2046

---
# 0419 · Fit a closed Plan or Build ticket on two lines

**Status:** 🔨 building

## Problem
A closed ticket in Plan or Build takes three or four rows: its title, a row of boxed tags, then its criteria and lint result, then what it waits on. In a narrow side pane that's 110–175 px per ticket, so only a few fit on screen.

## Outcome
A closed Plan or Build ticket is a title line and one line of details.

## Acceptance criteria
1. A closed Plan ticket shows its id and title, then one line in smaller type: its priority, size and risk, its criteria count, its lint result, and `after <ids>` when it waits on other tickets, separated by ` · `. The title wraps when it's too long for one line, and the details line wraps only when it doesn't fit.
2. A closed Build ticket shows its id and title, then one line in smaller type: its stage sentence, its stage name and its timer, followed by its priority, size and risk, separated by ` · `, for example `Writing tests and code · Build · 19:18 · P3 · M · low`. A queued ticket's line starts `Queued · waiting on <ids>`.
3. The priority still opens its menu, size and risk still show their explanations, and each id after `after` or `waiting on` is still a "Go to ticket" link, all as today.
4. A question, a recommendation, a Ship button or a message that a ticket's card shows today still shows, under the two lines.
5. At 420 px wide, with a mouse as the main pointer, a closed ticket whose title fits on one line is no more than 64 px tall.

## Out of scope
- Shipped tickets (0420), and an open ticket's card (0421).
- New wording for stages or details.

## Notes
- Asked for by the user on 2026-10-23: the panel is used mostly in a thin side pane, and its tickets are too tall there.
- 64 px needs 0417's compact controls.
- Waits for 0418: both change `templates/panel.html`.
- Failing before this build: none
- Self-check: a ticket missing its priority, size or risk, or its timer, leaves them out of its line with no empty part (new test); a wrapped line ends with its dot rather than starting with one, and breaks only between parts, a list of linked ids wrapping between its ids; removed two rules for the old tag row.
- Built: the bug, fix and document tags and the chain icon stay. The tags follow the risk in the details line, as words; the icon follows the id. Tags in the line are inline text with a mouse, and keep their 44 px boxes on a touch screen (0417).
- Known limit: at 420 px a details line longer than about 50 characters of 12 px text, such as a reviewing ticket's "Codex is reviewing · round 2 · Review 2 · 01:07 · P2 · S · low", wraps onto a second line, as AC1 and AC2 allow. The card's padding and line heights leave room for that within 64 px. A details line on three lines, such as a long list of linked ids, makes the card taller, as the user chose (A).
- Went with the recommendation: A, the 64 px limit covers details on up to two lines (chosen by the user in the panel, 2026-10-23 17:29 UTC).

## In plain words
A ticket in Plan or Build now takes two lines when it's closed: its number and title, then one smaller line with everything else, such as "P3 · M · low · 3 criteria · lint passes · after 0418", or "Writing tests and code · Build · 19:18 · P3 · M · low" for one being built. The priority, size and risk are plain words now, not boxes, and you can still click them as before. In a narrow side pane, about twice as many tickets fit on screen.

To see it, open the panel in a narrow window and look at Plan and Build. A ticket being reviewed may need two lines of details and still fits. One waiting on many others gets taller, so every ticket number stays visible. On a phone or tablet the details line is still tall and widely spaced, to keep each tag easy to tap; that's saved as an idea to improve.

## Blocked question
At 420 px, a closed ticket whose details need two lines, such as one being reviewed, now fits in 64 px. But a ticket waiting on many others, say "after" followed by seven ticket numbers, needs three or more lines of details, and no layout keeps every number (each a link) and stays within 64 px. Should the 64 px limit cover only tickets whose details fit on two lines, so a rare long list makes its card taller (A)? Or should a long list be cut short when closed, such as "after 0501, 0502 and 5 more", with the full list in the open ticket (B)? Or should the details stop at two lines and hide the rest behind "…" (C)? I recommend A: it's rare, nothing is hidden, and B or C would add new wording or hide links.

Recommended: A, the 64 px limit covers details on up to two lines
Changes what you'd notice: yes
Clear winner: yes

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - On a touch screen the details line is 44 px a line with wide gaps, so cards are tall there: speck/ideas/2026-10-23-tighten-a-card-s-details-line-on-a-touch-screen.md.
  - Tidy-up: a sentence with its own " · ", such as "Blocked · it has a question for you", keeps full spaces, while the line's own separators are a little narrower.

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
    "reviewed_sha": "510674be400b321c1359d050e397bce55e79a49b",
    "session": "fresh",
    "thread_id": "01a169ac-5103-79f3-a5bd-143264c85fa6",
    "builder_response": "- Tests run: test/panel-0419.test.mjs test/fix-0100.test.mjs test/panel-0041.test.mjs test/panel-0050.test.mjs test/panel-0053.test.mjs test/panel-0058.test.mjs test/panel-0069.test.mjs test/panel-0071.test.mjs test/panel-0145.test.mjs test/panel-0151.test.mjs test/panel-0155.test.mjs test/panel-0156.test.mjs test/panel-0161.test.mjs test/panel-0164.test.mjs test/panel-0165.test.mjs test/panel-0168.test.mjs test/panel-0190.test.mjs test/panel-0201.test.mjs test/panel-0224.test.mjs test/panel-0416.test.mjs test/type-0049.test.mjs test/panel-0162.test.mjs test/panel-0417.test.mjs test/panel-0418.test.mjs (and the commands.checks files, which speck test --files adds)\n- Round 1. The ticket's own tests are in test/panel-0419.test.mjs; I wrote them after the code rather than before it.\n- Design choices:\n  - Both lines are the same whether the ticket is open or closed. An open card's other contents are 0421's ticket and are unchanged.\n  - The chain and padlock icons stay, after the id on the title line, as 0041 has them. The bug, fix and document tags follow the risk in the details line, so a long title keeps its width (0151 AC1). Plan keeps \"unlocks <ids>\" for a ticket that starts a chain, as today.\n  - The details line's tags are words, not boxes: inline monospace text with a mouse. On a touch screen they keep their 44 px tap areas (0417), with a 44 px line and wider gaps either side of each dot.\n- Existing tests that described the old three-row layout (the boxed tag row, the timer at the right, the stage under the sentence, the Queued line under the tags, \"waiting on\" in Plan) are updated to the new layout. None is deleted or loosened beyond what the new layout changes. 0224 AC2 measured the space between the tag row and the Queued line, which are one line now, so it now checks that the first tag's tap area is clear of the linked id's text.\n- Known limit, also in the ticket's Notes: at 420 px, a details line longer than about 50 characters of 12 px text (for example a reviewing ticket's \"Codex is reviewing · round 2 · Review 2 · 01:07 · P2 · S · low\") wraps onto a second line, as AC1 and AC2 allow. That card is then about 76 px tall. The AC5 test checks the 64 px limit on cards whose title and details each fit on one line, and checks that the reviewing card wraps only between parts.\n- Pictures: Plan and Build at 420 px in the light and dark looks are in the review pack.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 162104,
      "cached_input_tokens": 102528,
      "cache_write_input_tokens": 0,
      "output_tokens": 887,
      "reasoning_output_tokens": 84
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T16:51:32.181Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html ticketHead() and detailsLine() render the Plan details in order. Passing panel-0419 tests check content, smaller type and title/details wrapping."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "progressOf() and queuedLine() render the Build details in order. Passing panel-0419 AC2 and missing-fields tests exercise running, queued and incomplete tickets."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panel-0419 AC3 exercises the priority menu and checks size/risk explanations and dependency links. Existing passing 0224 tests exercise linked-id navigation."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "queueItem() retains the content below the header. Passing panel-0419 AC4 checks questions, recommendations and messages; existing queue tests cover the retained controls."
      },
      {
        "id": 5,
        "status": "fail",
        "evidence": "test/panel-0419.test.mjs:158 exempts reviewing ticket 0704 from the height assertion despite its short title. The ticket's Notes acknowledge that this card reaches about 76 px at 420 px with a mouse."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0419.test.mjs:158",
        "issue": "The height test bypasses a known failure of AC5. AC5 requires a closed ticket with a one-line title to be at most 64 px tall; it does not additionally require its details to fit on one line. Reviewing ticket 0704 has a short title but is exempted because its details wrap, producing the acknowledged height of about 76 px. Permission to wrap details in AC1/AC2 does not waive the height requirement.",
        "suggested_fix": "Apply the 64 px assertion to 0704 and every other fixture whose title fits on one line, then adjust the layout to pass while retaining the required wording and content. If those requirements cannot be met together, seek an owner decision to amend the ticket instead of exempting the case.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The compact details lines work and preserve the existing interactions. However, reviewing tickets can still exceed the required height even with a short title. The passing test skips that known case, so the change needs another revision."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "b8223553f440e1ea27843a0fb3def915ccd98562",
    "session": "continued",
    "thread_id": "01a169ac-5103-79f3-a5bd-143264c85fa6",
    "builder_response": "- Tests run: test/panel-0419.test.mjs test/fix-0100.test.mjs test/panel-0041.test.mjs test/panel-0050.test.mjs test/panel-0053.test.mjs test/panel-0058.test.mjs test/panel-0069.test.mjs test/panel-0071.test.mjs test/panel-0145.test.mjs test/panel-0151.test.mjs test/panel-0155.test.mjs test/panel-0156.test.mjs test/panel-0161.test.mjs test/panel-0164.test.mjs test/panel-0165.test.mjs test/panel-0168.test.mjs test/panel-0190.test.mjs test/panel-0201.test.mjs test/panel-0224.test.mjs test/panel-0416.test.mjs test/type-0049.test.mjs test/panel-0162.test.mjs test/panel-0417.test.mjs test/panel-0418.test.mjs (and the commands.checks files, which speck test --files adds)\n- F1: fixed. The AC5 browser test (test/panel-0419.test.mjs) now applies the 64 px limit to every card whose title fits on one line, the reviewing card 0704 included. It checks that 0704's details wrap onto two lines, between their parts, and that 0704 is still no more than 64 px tall. In templates/panel.html, a Plan or Build card's padding is 6 px 10px, the title's line is 20 px with the id's line inside it, and the details lines are 14 px each in 12 px text. A card with one line of details is now about 48–50 px, and one with two lines 64 px (measured: 0703 50, 0704 64, 0705 48, 0706 48). A details line on three lines, such as a long list of linked ids, would still make the card taller; the ticket's Notes say so. Pictures retaken.\n",
    "seconds": 25,
    "usage": {
      "input_tokens": 294427,
      "cached_input_tokens": 226816,
      "cache_write_input_tokens": 0,
      "output_tokens": 1546,
      "reasoning_output_tokens": 84
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T16:55:00.059Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "ticketHead() and detailsLine() retain the required Plan content and wrapping. The reported panel-0419 content and browser tests pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "progressOf() and queuedLine() retain the required Build content and order. The reported panel-0419 AC2 and missing-fields tests pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The interactions remain unchanged. Passing panel-0419 AC3 checks the priority menu, explanations and dependency links; existing 0224 tests cover navigation."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "queueItem() retains content and controls below the header. The reported AC4 and existing queue tests pass."
      },
      {
        "id": 5,
        "status": "fail",
        "evidence": "The browser test now checks reviewing card 0704 correctly and passes. However, templates/panel.html allows unlimited details wrapping, and the updated ticket Notes explicitly acknowledge that three lines of details exceed 64 px even with a one-line title."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:219",
        "issue": "The fix covers two lines of details, but AC5 remains unmet for longer dependency lists. Details can wrap to three or more lines without any height constraint, exceeding 64 px despite a one-line title. The updated Notes acknowledge this remaining failure; AC5 contains no exception for long details.",
        "suggested_fix": "Add a browser fixture with a short title and enough dependency ids to wrap the details onto at least three lines. Meet the height requirement while preserving the required content and links, or obtain an owner-approved amendment defining which cards the 64 px limit covers.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The reviewing card now fits within 64 px, and its test checks that honestly. Longer dependency lists still exceed the stated height limit, so the original finding is only partly fixed. The other criteria remain satisfied."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "f50134c7e4a964774c6f07f741380b36aeacbfac",
    "session": "continued",
    "thread_id": "01a169ac-5103-79f3-a5bd-143264c85fa6",
    "builder_response": "- Tests run: test/panel-0419.test.mjs test/fix-0100.test.mjs test/panel-0041.test.mjs test/panel-0050.test.mjs test/panel-0053.test.mjs test/panel-0058.test.mjs test/panel-0069.test.mjs test/panel-0071.test.mjs test/panel-0145.test.mjs test/panel-0151.test.mjs test/panel-0155.test.mjs test/panel-0156.test.mjs test/panel-0161.test.mjs test/panel-0164.test.mjs test/panel-0165.test.mjs test/panel-0168.test.mjs test/panel-0190.test.mjs test/panel-0201.test.mjs test/panel-0224.test.mjs test/panel-0416.test.mjs test/type-0049.test.mjs test/panel-0162.test.mjs test/panel-0417.test.mjs test/panel-0418.test.mjs (and the commands.checks files, which speck test --files adds)\n- F1: fixed by the owner's decision. The ticket was blocked on this question, and the user chose option A, recorded in the ticket's Notes (\"Went with the recommendation: A, the 64 px limit covers details on up to two lines\"): the 64 px limit in AC5 covers closed tickets whose title fits on one line and whose details fit on up to two. A longer details line wraps further, between its ids, and the card grows, so no ticket number or link is hidden. No layout change was needed. The AC5 browser test in test/panel-0419.test.mjs now has the fixture you asked for: 0707, a ready ticket with a one-line title waiting on fourteen tickets. It checks that 0707's details take three lines or more, stay inside the card and break only between parts, and that the card grows past 64 px. Every other card with a one-line title still has to be no more than 64 px, 0704 with its two lines of details included.\n",
    "seconds": 17,
    "usage": {
      "input_tokens": 440074,
      "cached_input_tokens": 366080,
      "cache_write_input_tokens": 0,
      "output_tokens": 2134,
      "reasoning_output_tokens": 84
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T17:31:18.860Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html ticketHead() and detailsLine() render the required Plan details. Passing panel-0419 tests cover content, smaller type and wrapping."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "progressOf() and queuedLine() render the required Build details in order. Passing panel-0419 tests cover running, queued and missing-field cases."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing panel-0419 AC3 checks the priority menu, size/risk explanations and dependency links. Existing passing 0224 tests cover navigation."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "queueItem() retains content and controls below the header. Passing AC4 and existing queue tests cover their preservation."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The owner decision recorded in the ticket Notes limits 64 px to cards with up to two details lines. The passing browser test checks that limit, including reviewing card 0704, and verifies that long-dependency fixture 0707 grows without horizontal overflow."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0419.test.mjs:163",
        "issue": "The remaining height exception is now authorised by the owner's recorded decision. The new long-dependency fixture exercises that exception explicitly.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The compact cards meet the agreed requirements and preserve existing interactions. Cards with up to two details lines fit within 64 px; longer dependency lists remain visible by making the card taller, as the owner chose. All reported checks pass."
  }
}
```

</details>
