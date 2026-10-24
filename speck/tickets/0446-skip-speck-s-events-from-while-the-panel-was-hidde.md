---
id: "0446"
title: "Skip speck's events from while the panel was hidden"                # one outcome, no "and"
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
source: "speck/ideas/done/2026-10-23-skip-speck-s-events-from-while-the-panel-was-hidden.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T07:45:23.994Z"

---
# 0446 · Skip speck's events from while the panel was hidden

**Status:** 🔍 reviewing

## Problem
When the panel's tab has been hidden or the screen asleep, speck plays every pipeline event it missed, one after another, when you come back. After a night's builds that's a long queue of celebrations and question marks about things already past.

## Outcome
Coming back to the panel plays at most the latest event, and only a recent one.

## Acceptance criteria
1. When the panel's page becomes visible again after being hidden, speck plays at most one of the events that happened while it was hidden: the latest, and only if it happened less than 60 seconds before the page became visible. Then speck shows the pipeline's state as 0436 sets.
2. While the page stays visible, every event plays as 0414 sets.

## Out of scope
- Which events play and their animations (0414).

## Notes
- For release 0.15.0 (0452). The user asked on 2026-10-24 for everything relevant to the release to be ticketed.
- From the builder's self-check on 0414. The reviewer held that 0414's criterion 4 asked for every event to play, so this needed a product decision: the latest only, under a minute old.
- speck's screen code is in `templates/panel.js`.
- Waits for nothing.
- Failing before this build: none
- Self-check: no changes

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
    "reviewed_sha": "fac658743e97e933770686edd1ba44daac775ff8",
    "session": "fresh",
    "thread_id": "01a16ce7-49ca-7940-b4dd-f023e692ed61",
    "builder_response": "- Tests run: `speck test --related test/panel-0446.test.mjs` (the ticket's own file plus 269 related test files that name templates/panel.js through test/support/panel.mjs, which includes test/panel-0414.test.mjs and test/panel-0436.test.mjs). 2494 tests, 0 failing, 3 skipped.\n- Design: each event is dated when its board is noted. On hiding, the page notes when; on showing again, of the events dated since then (queued or playing), only the latest is kept, and only if it is under 60 s old. When the stream died while hidden (screen asleep), the page reconnects on showing, and the first board then holds changes whose times aren't known beyond \"after the board before\"; so only that board's latest event plays, replacing the one kept on showing, and only if the board before came under 60 s before the page was shown. A kept event that has already started playing stays the only one.\n- No visual change to how anything looks, so no pictures.\n- Changed test/support/screen-speck.mjs only to let speckPage take extra globals (a manual EventSource).\n",
    "seconds": 59,
    "usage": {
      "input_tokens": 124579,
      "cached_input_tokens": 90112,
      "cache_write_input_tokens": 0,
      "output_tokens": 1260,
      "reasoning_output_tokens": 352
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T07:55:18.411Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The eight passing 0446 tests cover queued events and reconnect handling, but noteBoard uses the previous board's receipt time (wasAt) to decide event age. A recent event after a long sleep is therefore discarded, contrary to the criterion."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The passing AC2 tests consume an unchanged first board after return. noteBoard treats every change in that first board as hidden activity, including events that happened after the page became visible."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.js",
        "issue": "The reconnect age check measures the age of the previous board rather than the event. After eight hours asleep, a shipment that happened ten seconds before returning is discarded because wasAt is eight hours old. The test expecting no event after a night asleep encodes this approximation without establishing when the events happened.",
        "suggested_fix": "Use reliable event timing to select the latest hidden event and apply the 60-second cutoff. Add coverage for a recent event after a long sleep and an old event after a long sleep.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.js",
        "issue": "d.back remains set until the next fresh board, so events occurring while visible can be suppressed or collapsed. I reproduced hiding for eight hours, showing the page, then receiving a shipment ten seconds later: speck showed its idle pastime instead of celebrating. There is no distinction between changes before and after visibility resumed.",
        "suggested_fix": "Distinguish hidden events from events occurring after visibility resumes, preserving normal playback for the latter. Add a delayed-first-board regression test with events occurring while visible.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change handles the tested hidden queues, but reconnect handling guesses when events happened. It can discard a recent shipment after a long sleep and suppress new events after the user returns. These gaps need fixing before merge."
  }
}
```

</details>
