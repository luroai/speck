---
id: "0615"
title: "Show a cut-off details line whole in its tooltip"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-11-10-show-a-cut-off-details-line-whole-in-its-tooltip.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0614"]                # ticket ids that must be done first
created: 2026-11-10
started: "2026-11-10T11:35:40.534Z"

---
# 0615 · Show a cut-off details line whole in its tooltip

**Status:** 🔍 reviewing

## Problem
Since 0599 a closed row's details line stays on one line, cut off with an ellipsis when it doesn't fit. A Shipped row's details have a tooltip, but a Build or Plan row's don't, so the end of a long line, such as "Ready · after 0599, 0600, …", can only be read by opening the ticket.

## Outcome
A cut-off details line shows its whole text in its tooltip, in every lane.

## Acceptance criteria
1. In every lane, a closed row's details line has its whole text as its tooltip, as a Shipped row's has.
2. A screen reader reads the whole details line.
3. Rows look as they do today.
4. Tests that checked the old behaviour are changed to check the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- The title's tooltip, which 0599 added.

## Notes
- Asked for 2026-11-10 for release 1.0.0: "Create them all, set them all ready", from the follow-ups builders filed during the redesign.
- From 0599's build: a Build row's line has a tooltip only when its sentence differs from what it says. Today: `queuedLine`, `titleLine` in `templates/panel.js`. Waits for 0614.
- Relies on nothing outside this repo.
- Failing before this build: none
- A Build row's tooltip is its whole line, then, on a line of its own, its sentence when that says more than the line (as before 0615, when the sentence was the whole tooltip). A tag in a details line keeps only its own tip, so hovering it doesn't show the line's tooltip as well.
- Self-check: a Build row's tooltip now follows its minutes as the clock moves them (test added); tags in the line no longer show the line's tooltip on top of their own tip.
- Pictures: none, because nothing on the page looks different; the change is only hover tooltips, which a screenshot doesn't show.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Tests changed for the new behaviour (AC4): a Build row's tooltip is now its whole line, then its sentence on a line of its own, so these read the sentence with the new `tipSentence` helper in `test/support/panel.mjs` rather than the whole tooltip:
  - `test/panel-0156.test.mjs` (0156 AC3), `test/panel-0168.test.mjs` (0168 AC1), `test/panel-0196.test.mjs` (0196 AC1, AC2, AC4), `test/panel-0201.test.mjs` (0201 AC1, AC4), `test/panel-0416.test.mjs` (0416 AC2), `test/panel-0419.test.mjs` (0419 AC2), `test/panel-0434.test.mjs` (0434 AC1), `test/panel-0443.test.mjs` (0443 AC1, AC2), `test/panel.test.mjs` (0034 AC3, 0045 AC3, 0045 AC4), `test/foreman-0317.test.mjs` (0317 AC2), `test/review-running-0223.test.mjs` (0223 AC1, AC2), `test/run-provider-0391.test.mjs` (0391 AC1), `test/speck-name-0485.test.mjs` (0485 AC2), `test/speck-name-0576.test.mjs` (0576 AC2).
  - `test/panel-0058.test.mjs` (0058 AC3): the counter's tick may now change its own line's tooltip, which follows the minutes; every other tooltip must still stay as it was.

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
    "reviewed_sha": "074ad96d7647bbd69ddc6d53e2354d435f11c247",
    "session": "fresh",
    "thread_id": "01a1c548-7736-7243-af1d-31e410c27c60",
    "builder_response": "- Tests run (with --related, which also ran every test file importing test/support/panel.mjs): test/panel-0615.test.mjs test/panel-0058.test.mjs test/panel-0156.test.mjs test/panel-0168.test.mjs test/panel-0196.test.mjs test/panel-0201.test.mjs test/panel-0416.test.mjs test/panel-0419.test.mjs test/panel-0434.test.mjs test/panel-0443.test.mjs test/panel.test.mjs test/foreman-0317.test.mjs test/review-running-0223.test.mjs test/run-provider-0391.test.mjs test/speck-name-0485.test.mjs test/speck-name-0576.test.mjs\n- One failure in that run, 0476 AC2 (test/panel-0476.test.mjs), is a real-browser timing test under load: it passes run alone (twice), passed in the previous --related run on this same code, and this change touches no lane-swipe code.\n- Design: a Build row's tooltip used to be only its sentence, when the sentence differed from its words. AC1 asks for the whole line, so it is now the whole line, then the sentence on a line of its own when it says more. Tests that read the sentence from `where.title` (AC4) now read it with a shared `tipSentence` helper in test/support/panel.mjs; the Delivery log will list them. Shipped rows are unchanged (they already have it). Pictures: none, as only hover tooltips change.\n",
    "seconds": 39,
    "usage": {
      "input_tokens": 155247,
      "cached_input_tokens": 111232,
      "cache_write_input_tokens": 0,
      "output_tokens": 940,
      "reasoning_output_tokens": 120
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 44015,
      "cached": 111232,
      "write": 0,
      "output": 940
    },
    "cost_usd": 0.1085532,
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-11-10T11:47:41.796Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js wholeTip(), ticketHead(), noteItem() and whereLine() supply the complete details tooltip. Passing panel-0615 tests cover every lane, supplementary Build sentences and advancing counters."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing panel-0615 AC2 test checks that complete details text remains in the DOM without aria-hidden. Existing clipping CSS affects presentation only."
      },
      {
        "id": 3,
        "status": "unclear",
        "evidence": "The implementation appears to preserve presentation, but panel-0615 AC3 only checks that two CSS files do not contain '0615'; it does not exercise unchanged row appearance or structure."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "Existing sentence-tooltip assertions were updated through tipSentence(), but the ticket's Delivery log remains an empty placeholder. The reported 0476 timing failure is unrelated to the changed tooltip paths."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/tickets/0615-show-a-cut-off-details-line-whole-in-its-tooltip.md",
        "issue": "AC4 explicitly requires the Delivery log to list the updated tests, but it contains only its placeholder.",
        "suggested_fix": "List the existing tests changed to accommodate the new tooltip behaviour in the Delivery log.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/panel-0615.test.mjs",
        "issue": "The AC3 test provides false assurance: arbitrary visual changes would pass provided the CSS does not contain the ticket number.",
        "suggested_fix": "Replace this assertion with a meaningful check that representative rows retain their rendered text, classes and structure while gaining tooltips.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The tooltip change appears to work across all lanes, including moving Build timers, and keeps the full text available to screen readers. Before approval, record the updated tests in the Delivery log and replace the ineffective appearance test."
  }
}
```

</details>
