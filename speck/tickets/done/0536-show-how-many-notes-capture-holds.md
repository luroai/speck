---
id: "0536"
title: "Show how many notes Capture holds"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-27
started: "2026-10-27T23:32:44.719Z"
approved: "2026-10-27T23:36:37.554Z"
finished: "2026-10-28T09:47:39.440Z"

---
# 0536 · Show how many notes Capture holds

**Status:** ✅ done

## Problem
Capture lists every idea and inbox note, but nothing says how many there are, so you have to scroll the whole lane to know how big the backlog is. Build and Shipped already show a count under their titles.

## Outcome
Capture shows how many notes it lists, under its title, as Build and Shipped do.

## Acceptance criteria
1. With notes in Capture, a line under the lane's title says how many it lists: "1 note" for one and "<n> notes" for more, such as "35 notes". It counts the notes Capture shows (status `idea` or `inbox`), not ticketed or dropped ones.
2. With no notes in Capture, the count line is hidden and the lane says "Nothing captured." as today.
3. When a note is added to Capture, or leaves it (ticketed or dropped), the count changes with the next board update, without reloading the page.
4. The count line looks like Build's and Shipped's count lines, in the same place under the title and in the same style, in the light and dark looks (checked by review).
5. No test that passed before this change fails.

## Out of scope
- Counts on the lane strip's tabs.
- Splitting the count into ideas and inbox notes.
- The order of the list (0537) and starring notes (a later ticket).

## Notes
- Asked for by the user 2026-10-27: "there is no kind of indication of how many tickets there are in the list".
- Today: Build's count is `#queue-n` and Shipped's `#shipped-n`, both `.lane-n` in `templates/panel.html`, filled in `render()` / `renderFull()` in `templates/panel.js`. Capture's list is `m.capture` from `templates/panel-model.js`.
- Failing before this build: none
- Self-check: no changes

## In plain words
The Capture lane now says how many notes it holds, at the right of its title, as Build and Shipped already do: "1 note" or, say, "34 notes". It counts only the ideas and inbox notes the lane lists, not ones already ticketed or dropped. Open Capture in the panel to see it; capture or drop a note and the number changes on the next update. When Capture is empty the number disappears and the lane says "Nothing captured." as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 119,659
- Elapsed since build started: 4 min
- Changed lines: 3 (limit 5000)
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
    "reviewed_sha": "573d0fcfc25d2e5901933cebe39c0474656451a0",
    "session": "fresh",
    "thread_id": "01a17fb8-aefb-7c03-895c-afa18f7212a4",
    "builder_response": "- Tests run: `speck test --related test/panel-0536.test.mjs`, which ran test/panel-0536.test.mjs and the 18 related test files it lists at the top of the output (plus the checks files). Separately, every test file naming `lane-n` or `capture-section` passed too.\n- Pictures of Capture with its count, in the light and dark looks, are in the review pack.\n- AC4 is checked by review: the count line is the same `.lane-n` element, in the same place in the section, as Build's `#queue-n` and Shipped's `#shipped-n`, with no style of its own.\n",
    "seconds": 18,
    "usage": {
      "input_tokens": 119053,
      "cached_input_tokens": 82432,
      "cache_write_input_tokens": 0,
      "output_tokens": 606,
      "reasoning_output_tokens": 0
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 36621,
      "cached": 82432,
      "write": 0,
      "output": 606
    },
    "cost_usd": 0.0875452,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-27T23:36:30.449Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.js render() counts m.capture, filtered to idea/inbox in templates/panel-model.js. Passing AC1 tests cover singular, 35 notes and excluded statuses."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "render() hides capture-n when empty and retains 'Nothing captured.'. Passing AC2 test checks both."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 test runs the actual page scripts through successive board updates, covering additions, ticketing, dropping, emptying and repopulating Capture."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Reviewed templates/panel.html: capture-n uses the same lane-n class and placement after the title as queue-n and shipped-n. templates/panel-cards.css applies shared layout and theme colours through var(--muted), with no Capture-specific count styling."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Recorded test output confirms 240 passed, zero failed and three skipped across 243 tests, including the ticket tests and related tests. The small implementation change presents no evident regression."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Capture now shows the number of idea and inbox notes, hides the count when empty, and updates it as notes enter or leave. It shares the existing lane count styling. Tests cover the required behaviour and pass; no blocking concerns found."
  }
}
```

</details>
