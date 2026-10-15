---
id: "0199"
title: Make the header button just the Auto-build switch                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T13:42:58.248Z"
approved: "2026-10-15T13:54:15.291Z"

---
# 0199 · Make the header button just the Auto-build switch

**Status:** 👍 approved

## Problem
Since 0163 the header's Auto-build button names one ticket in flight and where it has got to, or a ticket that needs you. With two builds at once and a ship queue (0193, 0194), one ticket's status there is partial and repeats what the Build list already shows, and its tooltip still says builds go one at a time.

## Outcome
The header button is only the Auto-build switch: it says whether Auto-build is on or off, and switches it.

## Acceptance criteria
1. While `speck run` is on, the button says "Auto-build on", and while it's off, "Auto-build off", whatever tickets are building, shipping, blocked or waiting. While it's switching it says "Starting…" or "Pausing…", as today.
2. The button never names a ticket, a build step or that something needs you, and its colour shows only whether Auto-build is on or off.
3. Its builder figure hops while any build or ship is at work and stands still otherwise.
4. Its tooltip says only what a click does: "Pause Auto-build: ready tickets wait" while on, and "Start Auto-build: build ready tickets" while off. Clicking it switches Auto-build as today, and it stays in place and keeps focus.
5. No test that passed before this change fails, except checks of 0163's ticket and step labels on the button, which change to check AC1 to AC4.

## Out of scope
- The Build list and its cards.
- How `speck run` is started or stopped.

## Notes
- Asked for 2026-10-15: "the status button in the header is redundant now because we're allowing multiple parallel builds, and can ship things in a queue. It just needs to be an auto-build on/off button again."
- `runLabel()` and the button's render in `templates/panel.html` (0163, 0144, 0150).
- Failing before this build: none
- Self-check: no changes. The old "one at a time" tooltip in the 0144 and 0150 tests changes to AC4's wording, as AC4 requires.

## In plain words
The Auto-build button at the top of the panel is back to being a simple on/off switch. It says "Auto-build on" or "Auto-build off" and no longer names a ticket, its stage or that something needs you. That's what the Build list is for. Its little builder figure hops while any build or ship is at work, and stands still otherwise. Hovering over it says what a click will do. To see it, open the panel while a couple of builds are running: the button just says "Auto-build on", and the figure hops. Worth knowing: the figure also hops while Auto-build is off if a build that started earlier is still finishing.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 146,795
- Elapsed since build started: 11 min
- Changed lines: 37 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
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
    "reviewed_sha": "cb64f0299e1a9661b547fccf282d4d7c588996f7",
    "thread_id": "01a13fd6-f530-7423-bef9-61e3f076cc2a",
    "seconds": 32,
    "usage": {
      "input_tokens": 145941,
      "cached_input_tokens": 102016,
      "cache_write_input_tokens": 0,
      "output_tokens": 854,
      "reasoning_output_tokens": 27
    },
    "saved_at": "2026-10-15T13:54:06.314Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html render() uses only run.on and runSwitching for the label. Passing panel-0199 AC1 tests exercise on/off across ticket states and both switching labels."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "render() assigns only run-on/run-off classes; ticket-specific labels and colour rules are removed. Passing panel-0199 AC2 checks labels, tooltips and classes across ticket states."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "atWork() checks all in-flight tickets, excludes idle ship-queue entries and includes pending panel ships. Both panel-0199 AC3 tests pass, covering concurrent work, paused/stopped builds, waiting ships and Auto-build being off."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "render() supplies the exact tooltips and preserves the button element; switching handlers are unchanged. panel-0199 AC4 verifies POST requests and element identity. Existing passing browser tests cover keyboard operation, focus through refreshes and header placement."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Full /tmp/speck-0199-tests.txt confirms 1,875 tests: 1,872 passed, zero failed and three skipped. Changed historical assertions match the ticket's permitted label, animation and tooltip changes."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The header now consistently shows whether Auto-build is on or off, with the requested click tooltips. Its builder animates when any build or ship is working. Switching and layout remain intact, and the full test suite reports no failures. No blocking concerns found."
  }
}
```

</details>
