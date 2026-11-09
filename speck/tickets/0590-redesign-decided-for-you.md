---
id: "0590"
title: "Redesign Decided for you"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0589","0588","0580"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T21:37:00.355Z"

---
# 0590 · Redesign Decided for you

**Status:** 🔍 reviewing

## Problem
Decided for you (0568) is a plain list. In the redesign it's where speck reports to you: in its own voice, with its face, showing what it decided, what it didn't choose, and what's waiting for you because of it.

## Outcome
Decided for you reads as speck's report, as in the mock.

## Acceptance criteria
1. Under the bar, when speck made a call in the last 7 days, a line shows speck pleased and says "I made 4 calls for you this week" (the count), with Review, which opens Decided for you.
2. Decided for you opens with speck pleased beside a short speech bubble saying it went with its recommendation and that you can change any you'd have called differently, then lists the calls under Today and Earlier.
3. Each call shows its ticket's id and title, the question, "Went with" and the option, "Not chosen" and the others, and when; one that changed a criterion shows speck sheepish beside "I changed criterion 2, so this one waits for you at Ship."
4. Change does what it does today, for a ticket still waiting to ship.
5. Tests that checked the old look of what this changes are updated to the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Recording the calls (0589).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: `#decided-open` under the header and `renderDecided`, `decidedRow` in `templates/panel-popups.js`. speck speaks in the first person wherever its face is beside the words, and is called by its chosen name elsewhere (0575, 0576).
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: a call that changed a criterion now says "waited" once shipped and drops the Ship clause once cancelled, as neither still waits; the speech bubble is left out when the list empties while open; the list regroups when the day changes.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Tests updated from the old look:
- `0568 AC2: the line says how many, and pressing it opens the list…`: now looks for the sheepish sentence instead of "changed a criterion".
- `0568 AC4: at 320 px the list and its line fit the width…`: its calls now have a long question and other options too, as the rows show them.
- `0576 AC2: the Decided for you line names its face…` (was "…says the name…"): the line speaks in the first person now, so the name is on the face beside it.

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
    "reviewed_sha": "a7581abe10b864b11f5e87748d916e87a15dbb9e",
    "session": "fresh",
    "thread_id": "01a1c244-4175-7393-8948-ae3550572f41",
    "builder_response": "Round 1.\n\n- Tests run: test/panel-decided-0590.test.mjs test/panel-decided-0568.test.mjs test/speck-name-0576.test.mjs, with --related (which also ran every existing test file naming a changed file).\n- Tests updated from the old look: 0568 AC2 (the \"changed a criterion\" text is now the sheepish sentence), 0576 AC2 (the line's words are first person now; the name is on the face beside them, as 0576 says for words beside the face). 0568's 320 px test now also has a long question and other options.\n- Moved: board, D, buttons, rows and openList from the 0568 test to test/support/decided.mjs, shared with 0590's tests.\n- Choices the ticket leaves open: \"Today\" is the viewer's local day (sameDay, as elsewhere in the panel). A shipped ticket says \"waited\" and a cancelled one drops the Ship clause, as neither still waits. Status doesn't give which criterion changed on a done or cancelled ticket, so those say \"its criteria\".\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 156646,
      "cached_input_tokens": 110080,
      "cache_write_input_tokens": 0,
      "output_tokens": 793,
      "reasoning_output_tokens": 43
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 46566,
      "cached": 110080,
      "write": 0,
      "output": 793
    },
    "cost_usd": 0.11207,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T21:44:03.875Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-popups.js drawDecidedLine and renderDecided show the count, pleased face and Review control. Passing 0590 AC1 tests cover rendering and opening; scripts/foreman-took.mjs decidedFor supplies the seven-day list."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "renderDecided and decidedDays render the pleased face, speech bubble and local-day groups. Passing 0590 AC2 tests cover grouping, midnight updates and an emptied list."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "decidedRow and decidedChanged render the ticket, question, chosen and rejected options, time and sheepish criterion message. Passing 0590 AC3 tests cover these, legacy records, text escaping and completed or cancelled tickets."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "decidedRow retains the Change handler and renderDecided restricts it to approved tickets that are not shipping. Passing 0590 AC4 and existing 0568 AC3 tests cover opening the review pack and removing unavailable actions."
      },
      {
        "id": 5,
        "status": "fail",
        "evidence": "The old presentation assertions were updated in panel-decided-0568.test.mjs and speck-name-0576.test.mjs. The recorded run has 242 passes, zero failures and three skips. However, the ticket's Delivery log contains only its placeholder and does not list the updated tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0590-redesign-decided-for-you.md",
        "issue": "Criterion 5 explicitly requires the Delivery log to list tests updated from the old presentation, but that section is empty. The builder response lists them, which does not satisfy the ticket record requirement.",
        "suggested_fix": "Add the updated 0568 AC2 and 0576 AC2 tests, and the expanded 0568 phone-width test, to the Delivery log with brief explanations of their changes.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The redesigned report works in the reviewed code and passing tests: it shows speck's faces, groups calls by day, explains choices and preserves Change. Approval is held only because the required list of updated tests is missing from the ticket's Delivery log."
  }
}
```

</details>
