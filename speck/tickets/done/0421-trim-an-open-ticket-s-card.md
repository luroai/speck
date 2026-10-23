---
id: "0421"
title: "Trim an open ticket's card"                # one outcome, no "and"
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: [] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T17:53:55.291Z"
approved: "2026-10-23T18:00:57.524Z"
finished: "2026-10-23T18:07:02.309Z"

---
# 0421 · Trim an open ticket's card

**Status:** ✅ done

## Problem
An open ticket's card shows its worktree's full path, which nobody uses, and its Full ticket, Review pack and Stop build buttons are big boxed buttons that take a row of their own above the build log.

## Outcome
An open ticket's card has no worktree line, and its buttons are small.

## Acceptance criteria
1. An open ticket's card doesn't show its worktree path.
2. Full ticket, Review pack and Stop build, whichever the card has, are small text buttons on one line, with Stop build last. With a mouse as the main pointer, each is no more than 28 px tall.
3. Stop build still asks first, then stops the build as today, and still shows why if the server refuses.

## Out of scope
- The build log under the buttons (0422).
- Whether Stop build should exist: it stays, as it's the panel's only way to end a build that's going wrong.

## Notes
- The user asked for this on 2026-10-23.
- Today: the `act path` line and the `full-open` and `stop-build` buttons in `templates/panel.html`.
- Builds alongside 0420, 0422 and 0423 (the user, 2026-10-23): each changes a different part of `templates/panel.html`. This one changes the open card's buttons and worktree line.
- Failing before this build: none
- Tests changed: 0053 AC2 and AC4 and 0069 AC1 asserted the worktree line this ticket removes (AC1), so they now check it's gone; 0053's test that the path is put in as text went with the line.
- Self-check: no changes

## In plain words
When you open a ticket's card in the Build lane, it no longer shows the long worktree folder line. Its Full ticket, Review pack and Stop build buttons are now small underlined words on one line, with Stop build last, so the build log starts higher up. To see it, open a building or approved ticket's card in the panel. Stop build works as before: it asks first, and says why if it can't stop the build. On a touch screen the buttons still keep their large tap areas.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 97,187
- Elapsed since build started: 7 min
- Changed lines: 8 (limit 5000)
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
    "reviewed_sha": "1d11c8648d37bff1955338721a3c094474dd9f62",
    "session": "fresh",
    "thread_id": "01a169eb-e5eb-75b2-8d38-9ebf4ae8a98e",
    "builder_response": "- Tests run: test/panel-0421.test.mjs test/panel-0053.test.mjs test/panel-0069.test.mjs test/panel-0073.test.mjs test/panel-0145.test.mjs test/panel-0161.test.mjs test/panel-0417.test.mjs (plus the commands.checks files speck adds)\n- 0053 and 0069 asserted the worktree line AC1 removes; they now check it's gone. 0053's \"path is put in as text, not HTML\" test went with the line, as nothing is shown any more.\n- The card's buttons keep a thin underline in var(--line) as their edge, so 0161's rule that every control has a visible edge in a token still holds; they have no box.\n- The 44 px touch-screen minimums (0417) are unchanged; AC2's 28 px applies with a mouse, checked in a real browser in test/panel-0421.test.mjs.\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 96699,
      "cached_input_tokens": 57472,
      "cache_write_input_tokens": 0,
      "output_tokens": 488,
      "reasoning_output_tokens": 23
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T18:00:50.412Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html queueItem() no longer renders the worktree line. Passing test '0421 AC1' checks open building, approved, reviewing and blocked cards."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The .q .full-open and .q .stop-build CSS removes boxed borders and reduces padding. queueItem() places Stop build last. Passing browser test '0421 AC2: with a mouse...' measures button heights, alignment, order and absence of boxed borders."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "stopButton() and stopBuild() retain confirmation, POST request and refusal messages. Passing '0421 AC3' exercises cancellation, confirmation and a server refusal."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Open ticket cards now hide the worktree path and show compact, underlined action buttons together. Stop build still asks for confirmation and explains server refusals. The relevant tests passed, including browser measurements; no blocking issues found."
  }
}
```

</details>
