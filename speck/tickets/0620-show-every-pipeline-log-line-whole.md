---
id: "0620"
title: "Show every Pipeline log line whole"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-10-show-a-cut-off-pipeline-log-line-whole.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0612"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T11:10:35.401Z"

---
# 0620 · Show every Pipeline log line whole

**Status:** 🔍 reviewing

## Problem
In the Pipeline log view a long line is cut off with an ellipsis, such as "speck run will try it again once main or its br…", and there's no way to read the rest from the panel. The cut-off part is often the bit that matters, such as why a ship failed.

## Outcome
Every line in the Pipeline log view shows in full.

## Acceptance criteria
1. A long line in the Pipeline log view wraps onto as many lines as it needs, under its own text, rather than being cut off.
2. Lines still read one to a row, with the time and speck's face where they are today.
3. The bar's one-line summary of the latest line may still be cut short.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- A ticket's build log (0602).

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- Decided: long lines wrap, now that the log is a full view with room for them, rather than opening when pressed.
- Today lines are shortened by `runCut` in `templates/panel-model.js`, to `RUN_LOG_WIDTH` characters. Waits for 0612, which changes `templates/panel-popups.js` and its styles.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes. A long refused ship's reason, which used to be dropped, now shows whole; the privacy stripping is unchanged. The id-first rule from 0459 now also finds an id in a later sentence.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Tests changed from the old behaviour to the new one:
  - `test/pipeline-0459.test.mjs`: "any other line shows its first sentence, cut to 48 characters" now expects the whole line; the privacy test no longer checks that a summary is at most 48 characters; a long refused ship's reason is now expected whole rather than dropped.
  - `test/first-person-0591.test.mjs`: the manager's line that was cut with … is now expected whole.

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
    "reviewed_sha": "ed770f485d8c7feb0764bb8c7244487390d8ee3f",
    "session": "fresh",
    "thread_id": "01a1c52b-7ea2-7173-b9a1-4a5150eb2c98",
    "builder_response": "- Tests run: --related test/pipeline-0620.test.mjs test/pipeline-0459.test.mjs test/first-person-0591.test.mjs (it added test/panel-0431, 0432, 0433, 0473, 0474, 0543 and test/status-0501 for templates/panel-model.js). While building I also ran every test file about the log view (build-log-0602, build-log-0548, panel-0427, panel-0577, pipeline-0592, pipeline-0479, panel-0584, panel-0600, panel-0603, pipeline-0470, pipeline-0458, pipeline-0415, speck-name-0485): all pass.\n- Change: runLogSummary in templates/panel-model.js no longer cuts a line to 48 characters (runCut, RUN_LOG_WIDTH removed) or to its first sentence (runFirst removed), and a refused ship's reason is no longer dropped when it's long. The privacy stripping (runPlain), the short forms for known lines and the \"a conflict\" / \"tests failed\" reasons stay as they are. The view's CSS already wraps .log-text (pre-wrap, overflow-wrap: anywhere) in the grid's third column, so no CSS change was needed.\n- AC3: no bar shows the latest log line today; the bar's one line (.bar-more) still ends in an ellipsis, and the test checks that it still does.\n- AC4: old tests changed: pipeline-0459 (the \"first sentence, cut to 48\" test, the 48-character limit in the privacy test, and the long didn't-ship form) and first-person-0591 (a manager's line that was cut). They'll be listed in the Delivery log.\n- Pictures: the real Pipeline log, light and dark, with the problem's own example line (\"speck run will try it again once main or its branch has a new commit.\") now whole.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 136844,
      "cached_input_tokens": 108800,
      "cache_write_input_tokens": 0,
      "output_tokens": 806,
      "reasoning_output_tokens": 57
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 28044,
      "cached": 108800,
      "write": 0,
      "output": 806
    },
    "cost_usd": 0.075028,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-10T11:15:57.601Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-model.js runLogSummary removes character and first-sentence truncation. Existing panel-popups.css .log-text wraps within column 3. Passing 0620 AC1 tests exercise full text, rendered rows and wrapping styles."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel-popups.js runLogRow retains separate time, face and text elements. Passing 0620 AC2 test checks row count, element positions and existing grid columns."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panel-header.css .bezel .bar-more retains nowrap and ellipsis; passing 0620 AC3 test verifies both."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "pipeline-0459 and first-person-0591 expectations correctly reflect full text. Recorded test output confirms 192 passes, zero failures and three skips. However, the ticket's Delivery log contains only its placeholder and does not list the changed tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0620-show-every-pipeline-log-line-whole.md",
        "issue": "Acceptance criterion 4 requires the Delivery log to list the tests changed from the old behaviour. That section is empty; the builder response only promises to add them later.",
        "suggested_fix": "Add a Delivery log entry naming test/pipeline-0459.test.mjs and test/first-person-0591.test.mjs and briefly describing the changed expectations.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Long Pipeline messages now display fully and wrap beneath their own text, while timestamps and faces retain their positions. The tests pass. Before approval, record the updated tests in the Delivery log as the ticket requires."
  }
}
```

</details>
