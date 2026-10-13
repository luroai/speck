---
id: "0145"
title: Remove the build pause icon from the panel                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-13
started: "2026-10-13T08:23:28.509Z"

---
# 0145 · Remove the build pause icon from the panel

**Status:** 🔍 reviewing

## Problem
Each running build in the panel's Build queue has its own pause and play icon. With the Auto-build switch in the header, the user doesn't need to hold individual builds from the panel, and the icon adds clutter to every row and can be confused with the header switch.

## Outcome
Build queue rows no longer have a pause or play icon; the Stop build button and the `speck pause` and `speck play` commands stay.

## Acceptance criteria
1. No row in the Build queue shows a pause or play icon, whether its build is running, paused or neither.
2. A build that's paused (for example with `speck pause <id>`) still shows "Paused" on its row, with the command that carries it on: `speck play <id>`.
3. An opened building or reviewing row still has its Stop build button, which works as before.
4. The panel server no longer accepts `POST /api/tickets/<id>/pause` or `/play`: it answers 404 and changes nothing. `speck pause <id>` and `speck play <id>` work as before.
5. No test that passed before this change fails, except tests of the panel's pause and play icon and its pause and play requests, which are removed or changed to check AC1, AC2 and AC4.

## Out of scope
- Removing the `speck pause` and `speck play` commands.
- The header's Auto-build switch (0144).
- Stop build.

## Notes
- The icon is `toggleIcon()` in `templates/panel.html`, and its requests are handled by `panelPausePlay()` in `scripts/panel.mjs`.
- The README's panel section and `docs/brief.md`'s `speck panel` row mention pausing and playing from the panel; they need updating to match, in British English.
- Failing before this build: none
- Tests changed under AC5: `test/panel-0081.test.mjs` is removed (it only placed the icon, and its AC5 needs the icon's style rules); `history-0085`'s check that 0081's AC5 runs goes with it; `panel-0071` keeps only its "Paused" and `status --json` tests, and its stand-in build moved to `test/support/build-panel.mjs`; `panel-0140` no longer lists the icon among the controls it measures; `split-0018` no longer expects `panelPausePlay`.
- A paused row shows "Paused · carry it on with speck play <id>" under its progress bar, beside the "Paused" by its counter.
- Self-check: POST to /pause or /play now falls through to the server's existing 404 rather than its own, as a second 'Not found.' broke 0067's restart tests, which mark that reply.

## In plain words
Builds in the panel's Build queue no longer have their own pause and play icon, so each row is a little tidier and there's nothing to mix up with the Auto-build switch in the header. A build you've paused from the command line still says "Paused" on its row, and now also shows the command that carries it on. Opening a running build still gives you its Stop build button.

To see it, open the panel while a build is running: its row has no icon on the left. Pause it with the pause command and the row says it's paused and how to carry on.

Worth knowing: pausing and playing a single build is now only possible from the command line.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox. Tidy-up: the comment at the top of the panel's server code still says it has "two writes"; it has had more for a while.

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
    "reviewed_sha": "259ac9881f1a0972d9c42118d4d4ee6ccc3036ec",
    "thread_id": "01a13463-26b3-7031-94f0-b4d542a5a846",
    "seconds": 73,
    "usage": {
      "input_tokens": 183833,
      "cached_input_tokens": 141568,
      "cache_write_input_tokens": 0,
      "output_tokens": 788,
      "reasoning_output_tokens": 31
    },
    "saved_at": "2026-10-13T08:32:28.193Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html queueItem() no longer creates an icon; icon code and styles are removed. Passing test '0145 AC1' exercises running, paused and other rows, both closed and open."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "queueItem() adds 'Paused · carry it on with speck play <id>'. Passing '0145 AC2' checks the paused counter, resume command and their removal after play."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "stopButton(), stopBuild() and panelStop() retain their behaviour. '0145 AC3' passes for building and reviewing rows; unchanged panel-0073 integration tests pass for stopping running and paused builds, confirmation and request authentication."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/panel.mjs panelServer() removes pause/play handlers and sends their POST requests to the existing 404 response. Passing '0145 AC4' uses the real server and CLI, verifies unchanged process state and pause marker after rejected requests, and verifies CLI pause/play still work. scripts/run.mjs is unchanged."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Inspected /tmp/speck-0145-tests.txt: 1,268 passed, zero failed, three historical split tests skipped. Test removals and adjustments concern the removed icon and endpoints; retained Stop build and panel restart tests pass."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The pause and play icons are removed from build rows. Paused builds still show their state and the command to resume them. Stop build and command-line pause/play continue to work, while the removed panel requests return 404 without changing builds. The full test report shows no failures, and I found no blocking concerns."
  }
}
```

</details>
