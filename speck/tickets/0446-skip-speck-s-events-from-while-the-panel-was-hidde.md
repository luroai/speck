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

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "693105f46031cd6a8e89b045767be8c4211b3738",
    "session": "continued",
    "thread_id": "01a16ce7-49ca-7940-b4dd-f023e692ed61",
    "builder_response": "- Tests run: `speck test --related test/panel-0446.test.mjs` (the ticket's own file plus the related files, test/panel-0414.test.mjs and test/panel-0436.test.mjs among them). 2498 tests, 0 failing, 3 skipped.\n- F1: fixed. Each event now carries the time the board gives for it: a shipped ticket's `finished`, a blocked one's `blocked_at`, an approved one's `approved`, a ship's `ship.started` and a Foreman question's `at` (`play(..., when)` in noteBoard). Its age is measured from that date (`latestMissed`), both for events heard while hidden and for the first board after the page is shown. Only an event the board gives no date for (the Foreman agent starting to look into a ticket, or a ticket missing its field) falls back to the time of the board before, which is the earliest it can have happened, so an undated one plays only when that is known to be under a minute. New tests: a ship dated 10 s before showing after 8 h asleep plays (and beats an older, dated question); one dated 2 min before doesn't; an event heard while hidden but dated 90 s back doesn't.\n- F2: fixed. In the first board after showing, a change the board dates at or after the moment the page was shown is not treated as missed: it plays as usual, after the one missed event kept (`later` in noteBoard). New test: 8 h asleep, board arrives 10 s after showing with a ship and a question from before and an approval dated after showing: the latest missed (the question) plays, then the approval, then the pipeline's state. An undated change in that first board still can't be told apart from one before showing; the board normally arrives within a second of showing, as connect() reconnects at once.\n",
    "seconds": 72,
    "usage": {
      "input_tokens": 292363,
      "cached_input_tokens": 248832,
      "cache_write_input_tokens": 0,
      "output_tokens": 2386,
      "reasoning_output_tokens": 494
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T08:02:14.008Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The new passing AC1 tests exercise dated shipments and blocked tickets. However, noteBoard still creates the Foreman's LOOKING INTO event without a timestamp and substitutes wasAt after reconnection. A recent Foreman start after a long sleep is therefore discarded."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The new passing AC2 test verifies dated approvals after return. Foreman starts remain undated and are classified as missed even when they happen while visible. A direct execution of noteBoard after an eight-hour hide and a ten-second visible interval returned WATCHING 1 BUILD instead of LOOKING INTO 1."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.js",
        "issue": "The timestamp fix covers ticket transitions and questions, but not the Foreman starting to investigate a ticket. That event always lacks a timestamp, so a start ten seconds before returning after eight hours asleep is still discarded. scripts/foreman-agent.mjs stores running.started internally but omits it from the board's running object.",
        "suggested_fix": "Expose the Foreman start timestamp in the board and use it for the LOOKING INTO event. Add a recent-start-after-long-sleep regression test.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.js",
        "issue": "A Foreman investigation starting after visibility resumes is still treated as hidden activity when reported in the first returning board. After a long sleep it is discarded; multiple undated visible events can also be collapsed. The new test covers only dated ticket transitions.",
        "suggested_fix": "Use the Foreman start timestamp to classify this event relative to visibility resuming, and test a start occurring while visible before the first returning board arrives.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The fixes correctly handle dated shipments, questions and approvals. One existing animation remains affected: the Foreman starting an investigation has no timestamp in the board, so recent starts and starts after returning can still disappear. Both findings remain open for that case."
  }
}
```

</details>

<details><summary>Round 3 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "284977805329174f11cbb676c9148ce812900d92",
    "session": "continued",
    "thread_id": "01a16ce7-49ca-7940-b4dd-f023e692ed61",
    "builder_response": "- Tests run: `speck test --related test/panel-0446.test.mjs test/foreman-agent-0287.test.mjs` (both files plus every related file, including those that name scripts/foreman-agent.mjs). 2506 tests, 0 failing, 3 skipped.\n- F1: fixed. The Foreman agent's board now gives `running.started` (scripts/foreman-agent.mjs agentView, from the start time speck run already records), and the LOOKING INTO event takes its date from it. The 0287 test that compared the running object exactly now checks the same fields and that `started` is a date. New tests: agentView gives `started`; after 8 h asleep, a Foreman start dated 10 s before showing plays.\n- F2: fixed by the same change: the Foreman start is now dated, so one dated after the page was shown counts as a later change and plays as usual. New test: 8 h asleep, the first board comes 10 s after showing with a start dated 3 s after showing, and it plays. Every event speck plays now has a date on the board; only a ticket missing its own field (for example an old ticket file with no `finished`) falls back to the time of the board before.\n",
    "seconds": 54,
    "usage": {
      "input_tokens": 389153,
      "cached_input_tokens": 339712,
      "cache_write_input_tokens": 0,
      "output_tokens": 3384,
      "reasoning_output_tokens": 589
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T08:07:33.982Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The passing AC1 tests now cover dated Foreman starts. However, noteBoard discards newer hidden events when back.kept has already started playing. This means the event shown can be an older one rather than the latest."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "noteBoard now dates LOOKING INTO using ag.running.started, supplied by agentView. Passing AC2 tests cover normal visible playback, dated changes after returning, and a Foreman start after returning before the first board arrives."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.js",
        "issue": "Recent Foreman starts now carry their recorded start time through agentView into the animation's age check. The new passing tests cover the previously missing case.",
        "suggested_fix": "",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.js",
        "issue": "Foreman starts occurring after visibility resumes are now dated and preserved as visible events. The new passing regression test exercises this case.",
        "suggested_fix": "",
        "state": "resolved"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "templates/panel.js",
        "issue": "If an animation frame runs between speckShown(true) and the returning board arriving, the retained event starts playing and leaves the queue. noteBoard then finds kept === -1 and discards all newly discovered hidden events, even one with a newer timestamp. I reproduced the retained celebration playing while a newer hidden question was discarded. The existing replacement test receives the board before drawing, so it misses this race.",
        "suggested_fix": "Delay playback of the retained hidden event until the returning board has been reconciled, then select the latest eligible hidden event. Add a regression test that draws a frame after showing the page and before receiving a board containing a newer hidden event.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Both earlier findings are fixed. One remaining timing bug can show an older celebration and discard a newer question if an animation frame runs before the refreshed board arrives. That fails the requirement to show only the latest hidden event."
  }
}
```

</details>
