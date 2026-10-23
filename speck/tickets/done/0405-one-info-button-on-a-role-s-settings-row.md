---
id: "0405"
title: "One info button on a role's Settings row"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-one-info-button-on-a-role-s-settings-row.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0404"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T12:10:16.120Z"
approved: "2026-10-23T12:17:07.011Z"
finished: "2026-10-23T12:20:03.034Z"

---
# 0405 · One info button on a role's Settings row

**Status:** ✅ done

## Problem
When a role's effort sits beside its model in Settings, that one row shows two info buttons: one for the role and one for the effort. Two "i" buttons on a single row is confusing.

## Outcome
A role's Settings row has one info button.

## Acceptance criteria
1. When builder, reviewer or Foreman shows an effort control in the same row as its model list, that row has exactly one info button, not one for the role and one for the effort.
2. Pressing that button shows an explanation that covers both the role and the effort (checked by review). Hover, click, keyboard focus and Escape behave as 0371 left them for a setting's explanation.
3. A role whose agent takes no effort still has one info button, as today. Other Settings rows that aren't a role with effort nested in are unchanged.
4. No test that passed before this change fails, except a check that the effort has its own info button in the role's row, which is changed to check criterion 1.

## Out of scope
- Changing what the effort list offers, or where it sits.
- The builder's effort setting itself: 0402.

## Notes
- Asked for 2026-10-23 from the Foreman row's `About foreman_effort` button beside the role's own info button.
- Checked 2026-10-23: `ROLE_PAIRS` in `templates/panel.html` nests `reviewer_effort` and `foreman_effort` into the role's row as a `.setting.model`, and `settingRow` gives that nested row its own info button (0400). 0402 will add `builder_effort` the same way.
- Waits for 0404: both change `templates/panel.html`.
- Failing before this build: none
- Self-check: an effort with no explanation of its own no longer adds "undefined" to the role's; the combined builder explanation ran off a 320px view (0371's browser test), so an explanation now scrolls inside itself above 60vh.

## In plain words
In Settings, the builder, reviewer and Foreman rows now have one "i" button each, even when the effort list sits beside the agent list. Its explanation covers the role and its effort together, and says once where a change is saved. If this machine has its own effort value, that's said there too, with its button to clear or keep it.

To see it, open Settings and press the "i" beside reviewer. A role whose agent takes no effort, such as Cursor, explains only the role.

Worth a look: a very long explanation, such as the builder's in a narrow window, now scrolls inside its box rather than running off the screen.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 141,607
- Elapsed since build started: 7 min
- Changed lines: 40 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (known limits, no inbox notes):
  - An explanation taller than 60% of the view scrolls inside itself, but one opened by hovering closes as the pointer leaves the "i" button, so it can only be scrolled once clicked open.
  - The role's and the effort's explanations run on as one paragraph; a line break between them might read better.

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
    "reviewed_sha": "1bfc0a9bfae4a8b5626b67a084f39d24d0a545e7",
    "session": "fresh",
    "thread_id": "01a168b0-ddce-7cd2-9d0a-9a657d67a3e9",
    "builder_response": "- Tests run: test/settings-info-0405.test.mjs test/panel-0371.test.mjs (plus the commands.checks files speck runs with them)\n- Round 1. In a role's row (builder, reviewer, Foreman) with your agents' models, the nested effort no longer gets its own info button or explanation; the role's explanation adds the effort's, saying the shared last sentence (where a change is saved) once, and this machine's own effort value with its Clear/Keep button goes in it too, keeping the role's explanation open. Rows without your agents' models (effort and model as their own settings) are unchanged.\n- 0371's narrowest-width browser test failed on the combined builder explanation (638px tall at 320px wide, its middle off screen), so `#settings .setting p.explain` now has max-height: 60vh with overflow-y: auto. That test passes again; I also ran 0277, 0281 and 0385's browser tests and the 44 Settings test files by hand, all passing.\n- Pictures: the reviewer's one explanation open, light and dark.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 140959,
      "cached_input_tokens": 108800,
      "cache_write_input_tokens": 0,
      "output_tokens": 648,
      "reasoning_output_tokens": 86
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T12:16:56.348Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html settingRow suppresses nested effort info buttons. Passing 0405 AC1 tests check all three roles and agent changes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Reviewed the actual role and effort explanations in scripts/settings.mjs: the combined text covers both. settingInfo retains the existing interaction handlers; passing 0405 AC2 and 0371 tests cover hover, click, focus and Escape."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0405 AC3 tests check agents without effort, standalone effort/model rows and an unrelated setting. settingRow limits explanation merging to paired role rows."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded test output reports 127 passed, zero failed and three skipped. Existing tests were not weakened or changed. The implementation shows no identified regression; shipping will run the whole suite."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Each role now has one info button explaining both the role and its effort, including controls for this machine’s effort override. Existing interactions are preserved, and long explanations scroll. The reviewed tests pass, with no blocking concerns found."
  }
}
```

</details>
