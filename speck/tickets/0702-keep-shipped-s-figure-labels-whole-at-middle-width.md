---
id: "0702"
title: "Keep Shipped's figure labels whole at middle widths"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-keep-shipped-s-figure-labels-whole-at-middle-widths.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T11:55:03.414Z"
approved: "2026-11-24T12:29:11.594Z"

---
# 0702 · Keep Shipped's figure labels whole at middle widths

**Status:** 👍 approved

## Problem
Between about 480 and 760 px wide, Shipped's figures switch to four columns that are too narrow for the longer labels ("median review rounds", "median builder tokens"), so they end in an ellipsis. A side-panel column or a small tablet often sits in that range.

## Outcome
Every label in Shipped's figures shows whole at every width.

## Acceptance criteria
1. At every window width from 375 to 800 px, every label in Shipped's figures shows its full text, with no ellipsis.
2. At window widths of 800 px and more, the figures show four columns, as they do today at the full 720 px column.
3. No test that passed before this change fails.

## Out of scope
- The By model table under the figures (0694).

## Notes
- The grid is `.stats` in `templates/panel-cards.css`, switching at 480 px through a clamp rather than a media query; `.stat .label` is `nowrap` with an ellipsis. `test/panel-0606.test.mjs` AC2 requires no media query of its own (0140), so prefer a fix that keeps to that, such as moving the clamp's width or letting labels wrap.
- speck (2026-11-24 12:27 UTC) told you: The build is slow because the machine is overloaded, not because anything is broken. Its change is small and in place, but its test runs keep taking 8 minutes or more, and the tests that start a real panel or browser time out with a different set failing each run. Why: The load average is near 100, and every failure in the log is a panel that didn't start or a browser that didn't answer in time, never a wrong result, and they change from run to run.

- Failing before this build: none
- Self-check: no changes; a two-column grid still cut labels at 375 px, so labels wrap too (0606 and 0157 tests updated). Pictures: none, because the panel was only checked by real-browser tests.

## In plain words
The figures at the top of Shipped now keep their full labels on narrower screens and side panels. Where a label is long, it wraps onto a second line instead of ending in dots. Four figures to a row now start at 800 px wide, rather than 480. Open Shipped in a narrow window to see it.


## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 126,244
- Elapsed since build started: 34 min
- Changed lines: 4 (limit 5000)
Follow-ups (tidy-ups, no note): the comment above `.stats` in panel-cards.css still says 480 px and one-line labels, and the panel-0157 test title still says one line.
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "1b59a1bb0a514cd5d4f1142d3eea99dd8279e89b",
    "session": "fresh",
    "thread_id": "01a20d87-a38c-7062-a0dc-5156eb6744d4",
    "builder_response": "- Tests run: test/panel-0702.test.mjs test/panel-0606.test.mjs test/panel-0157.test.mjs (plus the related files; unrelated real-panel start-up timeouts came from machine load and passed alone)\n- Labels wrap (overflow-wrap) instead of ellipsis, and four columns start at 800 px, because two columns still cut labels at 375 px. The 0606 and 0157 tests pinning nowrap, 480 px and one-line labels are updated.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 125647,
      "cached_input_tokens": 89344,
      "cache_write_input_tokens": 0,
      "output_tokens": 597,
      "reasoning_output_tokens": 12
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 36303,
      "cached": 89344,
      "write": 0,
      "output": 597
    },
    "cost_usd": 0.0875104,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T12:29:06.402Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-cards.css .stat .label removes nowrap and ellipsis and permits wrapping. The passing real-browser test in test/panel-0702.test.mjs checks all eight labels for horizontal clipping at widths from 375 to 800 px, including the column transition."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The .stats clamp switches to quarter-width tracks at 800 px. Passing browser tests in panel-0702 and panel-0606 verify four columns at 800 px; panel-0702 and panel-0157 also cover wider windows."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0702-tests.txt reports 163 passed, zero failed and three skipped. Updated existing assertions reflect the requested wrapping and breakpoint changes. The branch's changes are confined to this ticket."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "minor",
        "file": "templates/panel-cards.css:192",
        "issue": "The explanatory comment still describes a 480 px breakpoint and single-line labels. The panel-0157 test title also still says labels occupy one line.",
        "suggested_fix": "Update the comment and test title to describe the 800 px breakpoint and wrapping labels.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The figure labels now wrap instead of being cut off, and four columns begin at 800 px. Browser checks passed, with no failures in the reported test run. Only stale explanatory text needs tidying."
  }
}
```

</details>
