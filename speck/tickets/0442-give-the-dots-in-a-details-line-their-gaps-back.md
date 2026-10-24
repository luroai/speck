---
id: "0442"
title: "Give the dots in a details line their gaps back"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-23-give-the-dots-in-a-details-line-their-gaps-back.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0441", "0450"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T08:37:18.185Z"

---
# 0442 · Give the dots in a details line their gaps back

**Status:** 🔍 reviewing

## Problem
In the interface font, the " · " between the parts of a details line nearly touches the words either side, as in "18:56·20 min", because its spaces were narrowed to suit the old monospace font.

## Outcome
Every " · " in a details line has a clear gap on each side.

## Acceptance criteria
1. Each " · " between the parts of a ticket's status line, a shipped ticket's second line and the shipped stats has a gap of at least 4 px between the dot and the text on each side, in the interface font, in both looks.
2. Collapsed tickets still fit on two rows at 390 px, as 0434 and 0420 set, and no test that passed before this change fails.

## Out of scope
- What the lines say (0443).

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- From the builder's note on 0427: the narrowing couldn't come out while the tests measured a monospace font, which 0441 fixes.
- Failing before this build: none
- Self-check: no changes. The gap is measured from the dot's ink to the box of the text either side of it, with a mouse; on a touch screen the dots keep their own padding.
- Waits for 0441 (the font the tests measure) and 0450, which comes after 0440 and 0444: all change `templates/panel.css`.

## In plain words
The dots between the parts of a ticket's small second line no longer crowd the words beside them. "18:56·20 min" now reads "18:56 · 20 min", with a clear gap on each side. That covers Plan and Build cards, shipped tickets and the shipped stats line. To see it, open any lane in the panel and look at a ticket's second line, in either look. Everything still fits on two rows on a phone. Keep an eye on very long status lines on narrow screens, as each dot now takes a few pixels more room.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
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
    "reviewed_sha": "2bd56bfb48ea6b7ef78af31cd16087733496f84e",
    "session": "fresh",
    "thread_id": "01a16d13-b6ff-77e2-af92-05a7f0bfed90",
    "builder_response": "- Tests run: test/panel-0442.test.mjs, test/panel-0419.test.mjs, test/panel-0420.test.mjs, test/panel-0434.test.mjs, test/panel-0443.test.mjs, test/panel-0441.test.mjs, test/panel-0427.test.mjs, plus every file `--related` chose for templates/panel.css (panel-0281, 0416, 0430, 0444) and the commands.checks files. The 0419, 0420, 0434 and 0443 layout tests were added by hand because they don't name panel.css, and AC2 relies on them.\n- The change removes the three `letter-spacing: -3px` rules on `.sep`, plus the coarse-pointer `letter-spacing: 0` that only undid one of them. The gap is measured in a real browser from the dot's ink, using canvas actualBoundingBox in the dot's computed font, to the box of the nearest non-space character either side of it on the same line, in the light and dark looks.\n- Pictures: the Plan, Build and Shipped lanes at 420 px, in both looks.\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 148164,
      "cached_input_tokens": 99328,
      "cache_write_input_tokens": 0,
      "output_tokens": 643,
      "reasoning_output_tokens": 9
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T08:43:17.726Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.css removes the negative letter-spacing from all three details-line separator rules and retains touch padding. test/panel-0442.test.mjs AC1 measures rendered dot ink against adjacent text in Plan, Build and Shipped, including shipped stats, in both looks; the recorded browser test passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/panel-0442.test.mjs AC2 passed for collapsed Build and shipped cards at 390 px. Existing panel-0434 browser tests passed at 390 px with touch and mouse; panel-0420 layout coverage also passed. The recorded run reports 163 passed, zero failed and three unrelated skips. Existing tests were not changed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The dots now have clear gaps beside the surrounding text in both looks. Browser checks confirm the spacing and show that collapsed tickets still fit on two rows at 390 px. The change stays within scope, and the tests run found no regressions."
  }
}
```

</details>
