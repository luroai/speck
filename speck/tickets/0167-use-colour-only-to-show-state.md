---
id: "0167"
title: "Use colour only to show state"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0161"]                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T14:32:21.212Z"

---
# 0167 · Use colour only to show state

**Status:** 🔍 reviewing

## Problem
The panel uses colour for decoration as much as for meaning: each Plan tab and the Shipped section have their own accent stripe, every card has a coloured left edge, and ids and links are in the accent red. Red also means blocked and high risk, so colour no longer tells the user where to look.

## Outcome
Cards are plain, set apart by their border, space and type, and colour only appears when it says something: an agent at work, a ticket waiting for the user, something wrong, or something that passed.

## Acceptance criteria
1. No section or card has a decorative coloured stripe: the Plan section's tab-coloured top border, the Shipped section's green top border and the coloured left edges on Plan, Build and Shipped cards are gone. Cards keep a visible border on all sides.
2. Colour appears only for state: a ticket waiting for the user's decision (approved and not covered by auto-ship) has a purple border and a light purple background; a blocked ticket or a stopped build has a crimson border and a light crimson background; passing checks (lint passes, green ticks) stay green; the speck red is used only for the speck itself.
3. Ids, titles, Plan tabs and links (shipped titles, linked ticket ids, the selected Plan tab) are in the normal text colours, with underlines or borders to show what can be clicked, not in the accent colour. Idea and inbox ids are in the normal muted colour.
4. The high risk tag stays red, and the bug and fix tags keep their own colours, as the user asked for on 2026-10-14.
5. All of this holds in light and dark mode with the contrast 0161 sets, and no test that passed before this change fails, except checks of the removed stripes and accent colours, which are changed to check AC1 to AC3.

## Out of scope
- The builder badge (0168) and what moves.
- Layout and spacing beyond removing the stripes.

## Notes
- Agreed 2026-10-14 from the "Colour that means something" section of a mockup: plain cards, red only for the speck, purple for "waiting for you", crimson for "something's wrong".
- Builds after 0161, which sets the colour tokens' contrast.
- Stripes today: `#shaping-section.tickets/.ideas/.inbox { border-top: 2px … }`, the Shipped section's top border (0157), and card left edges from 0151, 0155 and 0157 (`templates/panel.html`).
- Failing before this build: none
- Self-check: no changes. The state colours (crimson, purple) come after the open, highlight and set-back rules, so a ticket in trouble or waiting keeps its colour whatever else applies. The unused list colour tokens (--inbox, --accent-bg, --inbox-bg) stay, as the palette checks of 0134, 0136 and 0126 pin them.

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
    "reviewed_sha": "53b0e093ae65f28eb714869fe1f7afc333dd88b1",
    "thread_id": "01a13add-d2a7-78e1-9d4a-315f89856cf6",
    "seconds": 55,
    "usage": {
      "input_tokens": 238239,
      "cached_input_tokens": 183296,
      "cache_write_input_tokens": 0,
      "output_tokens": 1033,
      "reasoning_output_tokens": 80
    },
    "saved_at": "2026-10-14T14:43:52.977Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html removes section stripes and card left edges while retaining full borders. panel-0167 and updated 0151/0155/0157 browser tests cover both themes."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "panelModel in templates/panel.html:627 requires an exit_label before setting to_ship. An approved ticket without build_exit remains plain, even when auto-ship does not cover it. The new browser fixture only tests approval with build_exit."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Neutral text colours and click indicators are checked by panel-0167 AC3 tests, including browser checks in both themes and updated shipped-title tests."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The high, bug and fix tag rules retain their tokens; panel-0167 AC4 explicitly checks their text and borders."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Browser coverage checks light and dark themes; existing contrast tests remain intact. Full test output confirms 1530 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:627",
        "issue": "Approved tickets only receive the purple border and background when a build exit is recorded. A manually built approved ticket without build_exit can need the user's shipping decision yet remain plain. Auto-ship eligibility is not considered by this condition.",
        "suggested_fix": "Determine the waiting-for-user state from approval and auto-ship eligibility, while preserving shipping and failure states. Add coverage for an approved ticket without build_exit when auto-ship is disabled or excludes its risk.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "minor",
        "file": "templates/panel.html:194",
        "issue": "The linked-ticket flash replaces a blocked or waiting ticket's coloured background with the neutral raised fill. The reduced-motion rule does the same, contrary to the self-check claim that state colours always remain visible.",
        "suggested_fix": "Preserve state backgrounds during flashing, using a neutral outline or shadow as the navigation indicator, and cover state-coloured linked targets.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Decorative stripes are removed, links use normal text colours, and the tests pass. One required state is missed: approved tickets without a recorded build exit can lack the purple cue that tells the user they need to ship them."
  }
}
```

</details>
