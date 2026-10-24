---
id: "0440"
title: "Tell a ticket waiting for you from one that needs you"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-23-tell-waiting-for-you-from-needs-you-at-a-glance.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T07:32:34.098Z"
approved: "2026-10-24T07:44:56.144Z"

---
# 0440 · Tell a ticket waiting for you from one that needs you

**Status:** 👍 approved

## Problem
Since 0426, a ticket waiting for you to ship it is Cursor's magenta and one that needs you is Cursor's red. They're only about 30° apart in hue, so at a glance they look the same, and 0138's check that they differ was eased from 60° to 20° to let them through.

## Outcome
A ticket waiting for you to ship it and one that needs you are clearly different colours.

## Acceptance criteria
1. A ticket waiting for you to ship it (approved, and not covered by auto-ship) shows in Cursor's green (`#70B489` dark, `#1F8A65` light, or the nearest shade that meets 0161's contrast) wherever it shows in magenta today: its edge, its tint and its words. A ticket that needs you stays in Cursor's red.
2. 0138's check that those two states differ in hue is back to at least 60°, in both looks, and passes.
3. Every colour that changes still meets 0161's contrast, and no test that passed before this change fails, except checks of the old magenta, which change to match.

## Out of scope
- Other state colours.

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- Green already means passing checks and shipping in 0426, so "approved, ready to ship" sits with them.
- Waits for nothing: the colour tokens are in `templates/panel.css`.
- Failing before this build: none
- Words and edge use `--ok`, the green 0426 already sets at the shade 0161's 7:1 needs; the tint is a new `--ok-bg`, Cursor's green 8% over `--panel`, in place of `--idea-bg`, which only this card used. `--idea` stays for the document tag.
- Self-check: no changes. Only comments that still called this card purple were brought up to date.

## In plain words
A ticket that's approved and waiting for you to ship it is now green in the Build lane: its edge, its light fill and its words. A ticket that needs you, because it's blocked or its build stopped, stays red, so you can tell the two apart at a glance. To see it, open the panel with an approved ticket that auto-ship doesn't cover next to a blocked one, in both the light and the dark look. Worth a look: a ticket being shipped also has a green edge, though a thicker one with no fill.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 121,198
- Elapsed since build started: 12 min
- Changed lines: 27 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (Delivery log only, none to the inbox):
  - A ticket being shipped has a 2 px edge in Cursor's own green (`--green`), and one waiting for you a 1 px edge in the darker or lighter text green (`--ok`) with a green tint. They're told apart by the tint and the edge's width. If that turns out too close, give the shipping edge another colour.
  - The design mockup `docs/design/lcd/panel-mock.html` still draws "waiting" in `--idea`. It's a design record, not the panel, so it was left as it was.

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
    "reviewed_sha": "907c503ffdba49f59bbd8abdb3ff1e8a749bdf89",
    "session": "fresh",
    "thread_id": "01a16cde-2852-79f0-82f1-e2601c5b9cf3",
    "builder_response": "- Tests run: `speck test --related` with test/panel-0440.test.mjs (new) and the existing test files this ticket changed: test/panel-0136, 0138, 0147, 0155, 0156, 0161, 0167, 0171, 0185, 0416, 0418 and 0426 (.test.mjs). As the change edits comments in templates/panel-model.js, --related also brought in every test file that loads it through test/support/panel.mjs: 2491 tests, 2488 passed, 0 failed, 3 skipped.\n- Approach: a ticket waiting for you to ship it (`.to-ship`) now uses `--ok`, the green 0426 already sets at the nearest shade of Cursor's green (#1F8A65 light, #70B489 dark) that meets 0161's 7:1, for its words and edge. Its tint is a new `--ok-bg`, Cursor's green 8% over `--panel`, which replaces `--idea-bg`, as only this card used it. `--idea` (magenta) stays for the document tag, which is out of scope.\n- 0138's hue check now compares `--ok` with `--bad` at 60°, in both looks (it was 20°).\n- Changes to existing tests (AC3) only move checks of the old magenta (`--idea` on `.to-ship`, `--idea-bg` and its values) to the green, and list `--ok-bg` among the surfaces 0161 and 0426 check contrast on in place of `--idea-bg`.\n- Comments that still called this card purple were updated in templates/panel.js and templates/panel-model.js. No code changed there.\n- Pictures of the Build lane in light and dark are with the review pack.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 120621,
      "cached_input_tokens": 72704,
      "cache_write_input_tokens": 0,
      "output_tokens": 577,
      "reasoning_output_tokens": 18
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T07:44:44.443Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.css uses --ok for all six to-ship edge and text rules and --ok-bg for the tint. Red state rules remain unchanged. Passing tests in panel-0440, panel-0138 and panel-0167 cover the colours and ticket states."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/panel-0138.test.mjs restores the --ok versus --bad hue threshold to 60° in both looks. It and panel-0440's independent hue checks passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panel-0440 checks 7:1 text contrast across the surfaces and the new tint. Updated panel-0161 and panel-0426 checks preserve contrast coverage. The full supplied test log confirms 2488 passed, 0 failed and 3 skipped."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Tickets waiting for you to ship now have green edges, tints and words, clearly distinct from tickets needing attention in red. Both looks meet the colour separation and contrast requirements. The tests passed, and I found no blocking issues or unrelated implementation changes."
  }
}
```

</details>
