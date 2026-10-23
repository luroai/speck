---
id: "0414"
title: "Show the pipeline through speck's animations on the screen"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0413"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T15:09:04.633Z"

---
# 0414 · Show the pipeline through speck's animations on the screen

**Status:** 🔍 reviewing

## Problem
After 0413, speck sits on the screen in the same idle animation whatever the pipeline is doing. A new ticket, a ship or a question looks the same as nothing happening.

## Outcome
speck, the Foreman, plays an animation for each thing that happens in the pipeline, with a short caption under it, and otherwise shows the pipeline's current state, changing only when that state does. It never acts out the builders' and reviewers' work.

## Acceptance criteria
1. While tickets are being created, speck is at the laptop with `WRITING <id>`, naming the newest. That starts when a draft ticket that wasn't on the board appears, or a draft's text changes, while the page is open, and ends 30 seconds after the last such change. Drafts already on the board when the page loads don't count.
2. When one of these happens while the page is open, speck plays its animation once, with its caption under it, then goes back to what criterion 3 says:
   - a ticket starts shipping: one push of the boat, `SHIPPING <id>`
   - a ticket ships: celebrating for 6 seconds, `<id> SHIPPED`
   - a ticket is blocked or the Foreman agent asks you something: the question mark for 6 seconds, `<id> HAS A QUESTION`
   - a ticket is approved and waits for you to ship it: the flag for 6 seconds, `<id> IS READY TO SHIP`
   - the Foreman agent starts looking into a ticket: thinking for 6 seconds, `LOOKING INTO <id>`
3. Between events, what speck does follows the Foreman's status word, and stays the same until that word changes or an event plays:
   - `Off`: asleep, `SPECK RUN IS OFF`
   - `Building <n>` or `Shipping <id>`: watching with a clipboard, `WATCHING <n> BUILDS` (or `WATCHING 1 BUILD`, or `WATCHING THE SHIP`)
   - `Needs you <n>`: the question mark, `<n> NEEDS YOU`
   - `Waiting`: grumpy, `WAITING`
   - `Idle`: one of tea, chess, messy or sweeping, picked at random when the word becomes `Idle`, with its caption from a fixed set. After 15 minutes of `Idle`, speck falls asleep, `NAPPING`, and stays asleep until the word changes or an event plays.

   No model is asked, and no ticket's building, self-check or review stage changes what speck does.
4. When two events happen at once, both animations play, one after the other. An event that happened before the page was loaded doesn't play.
5. Every caption fits on the screen without scrolling. With reduced motion on, each animation is one still frame, and the captions still change.

## Out of scope
- The screen's layout, frame and status word (0413).
- The pipeline log (0415).
- The ticket tiles' animations (0416).
- Captions written by a model.

## Notes
- No timed cycling: speck changes only when the pipeline does, and a nap lasts until something happens (the user, 2026-10-23).
- speck is the Foreman: building, reviewing and shipping are the work of other models, so speck shows them only as events (the user, 2026-10-23). The laptop now means writing tickets.
- The animations are the ones in console.html in https://claude.ai/artifact/R5CQDZJfMZ2rYcTmZK1B8z and `templates/lcd.js`: the landing page's states (`STATES`, whose `building` is the laptop), the panel's `ship`, `wait` and `bad` poses (`PANEL`), and the mock's new clipboard pose (`watch` in console.html). "One push" is one 3.2-second loop of `PANEL.ship`.
- Waits for 0413: both change `templates/panel.html`.
- Failing before this build: none
- Self-check: the brief's line on the screen now says what speck shows.
- The screen is 72 dots tall rather than 64 (0413's layout), to fit the caption's row under speck, as the console mock has it.
- 0413's test that speck idles whatever the word now checks only that speck is cast: 0414 replaces that behaviour.

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
    "reviewed_sha": "251c7b92d63d38206cfeaae4ff71ff6faadc469e",
    "session": "fresh",
    "thread_id": "01a16955-b6b5-7782-9f1b-4aec72a0ccc5",
    "builder_response": "- Tests run: test/panel-0414.test.mjs test/panel-0413.test.mjs\n- Round 1. Notes for the reviewer:\n  - templates/lcd.js is pinned byte for byte by existing tests (0302, 0308, 0320), so the mock's clipboard pose (`watch`) and the event logic live in templates/panel.html, as they do in the console mock.\n  - The screen grows from 160 × 64 to 160 × 72 dots, as in the console mock, to give the caption a row under speck. The Screen always draws each frame; reduced motion holds the cast (still poses) and the word, while captions still change.\n  - 0413's AC2 test asserted speck idles whatever the word; 0414 replaces that, so that one assertion now only checks speck is cast.\n  - Pictures of the screen in both looks are with the review pack.\n",
    "seconds": 63,
    "usage": {
      "input_tokens": 226538,
      "cached_input_tokens": 175488,
      "cache_write_input_tokens": 0,
      "output_tokens": 1028,
      "reasoning_output_tokens": 210
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T15:17:29.787Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: noteBoard detects new and changed drafts; speckNow applies the 30-second writing window. The two AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "noteBoard queues the specified poses and captions; speckNow applies 3.2-second shipping and 6-second event durations. The AC2 event tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "speckRests maps the Foreman's word to the required poses, chooses a fixed idle mood and implements the nap. The AC3 status, idle and build-stage tests passed."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "noteBoard discards queued events beyond eight and deduplicates simultaneous events by caption. The final AC4 test explicitly expects two of ten observed shipping completions to be dropped, contrary to playing all events sequentially."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "screenFrame renders captions in a fixed row and screen.cast.still holds poses under reduced motion. The AC5 caption-fit and reduced-motion tests passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Observed events can disappear without playing. noteBoard drops the oldest queued event after eight, even on a visible page. Its caption deduplication also collapses a ticket becoming blocked and the Foreman asking about that same ticket in the same update. Criterion 4 requires both animations to play sequentially; it provides no exception for these cases. The new queue-limit test enshrines the contrary behaviour.",
        "suggested_fix": "Preserve each distinct observed event until it plays, removing the queue truncation and caption-based deduplication. Replace the dropping-events test with coverage that all queued events play, including simultaneous blocked and Foreman-question events for one ticket.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The animations, captions, status poses and reduced-motion behaviour are covered by passing tests. However, the implementation silently skips some events instead of showing each in turn. Fix event delivery before presenting this for merge."
  }
}
```

</details>
