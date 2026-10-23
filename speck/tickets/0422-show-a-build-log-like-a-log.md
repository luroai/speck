---
id: "0422"
title: "Show a build log like a log"                # one outcome, no "and"
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
after: [] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T17:53:56.021Z"

---
# 0422 · Show a build log like a log

**Status:** 🔍 reviewing

## Problem
The build log is how you see that a build is really moving, like watching the model work. But it's one block of plain monospace text: times, tool calls, the agent's messages and failures all look the same, and a long line that wraps starts again at the left edge, so it reads as a new entry.

## Outcome
The build log reads like a log: times in a column of their own, each kind of entry in its own colour, and wrapped lines indented under their entry.

## Acceptance criteria
1. Each entry's time (`HH:MM:SS`) is in a column of its own, in the muted colour, and the entry's text starts after it.
2. Tool calls (lines starting `→`), the agent's messages, failures (`✗ exit code <n>` and `Build ended: …`) and speck's own note that earlier lines aren't shown each have a colour of their own. Each colour has a contrast of at least 4.5:1 against the log's background, in both the light and the dark look.
3. When an entry's text wraps, and when an agent message runs over several lines, every line after the first starts where the entry's text starts, past the time column, so the entry reads as one block. A blank line between two messages shows as one gap.
4. Selecting and copying the log still gives its plain text with the times, and the log keeps its scroll place through the refresh, as today.

## Out of scope
- What goes into the log (`scripts/build-log.mjs`).
- The pipeline log (0415).

## Notes
- The user asked for this on 2026-10-23. It's what they use most to trust that work is moving.
- The lines come from `readableLog` in `scripts/build-log.mjs` (0291, 0340, 0341, 0342). The panel shows them with `logText` and `showLog` in `templates/panel.html`.
- Builds alongside 0420, 0421 and 0423 (the user, 2026-10-23): each changes a different part of `templates/panel.html`. This one changes the log's rendering and styles. `.q .log` sits a few lines from 0421's `.q .stop-build`, so the second of the two to ship may need a merge round.
- Failing before this build: none
- Self-check: the log's own notes (No log yet. and the like) start at the left edge rather than past the time column; turned off the browser's scroll anchoring on the log so dropping rows at the top keeps its scroll place as before. Two existing browser tests (0052) selected text in the box's single text node and one fake-page check (0361) counted nodes by their own text: both now find the line's text node, checking the same thing.

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
    "reviewed_sha": "21cb4f1e7675d84c3b3bba5de16c8eb33519a69b",
    "session": "fresh",
    "thread_id": "01a169ec-49ce-7253-86cc-e73cd9f99cb0",
    "builder_response": "- Tests run: test/panel-0422.test.mjs test/panel-0052.test.mjs test/panel-0361.test.mjs\n- The log box now holds one block row per line (`logRow`), its time in a `.at` span and its text in a text node, with each row but the last ending in its newline, so the box's text is the log's plain text as before. `setLogText` works by lines: it adds new rows at the bottom, takes the fewest rows out at the top when the tail moves on, and makes only the last row again when that line grew, so a selection in other rows stays.\n- Two existing tests changed only to find the text they select or count, now that the text isn't one text node: test/panel-0052.test.mjs (two real-browser selections) and test/panel-0361.test.mjs (counting the node that holds the log's text). What they check is unchanged.\n- `.q .log` has `overflow-anchor: none`, so taking rows out at the top keeps the box's scroll place as it did with one text node (0052's real-browser test checks it).\n- Pictures of the open log in the light and dark looks are in the review pack.\n",
    "seconds": 49,
    "usage": {
      "input_tokens": 140272,
      "cached_input_tokens": 100352,
      "cache_write_input_tokens": 0,
      "output_tokens": 1185,
      "reasoning_output_tokens": 200
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T18:01:43.608Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html logRow and .at styles separate and mute timestamps. Passing 0422 browser test checks their position."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "logRow assigns distinct tool, msg, fail and note classes. Passing 0422 tests check classification and at least 4.5:1 contrast in both themes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0422 browser test measures wrapped text, message continuation alignment and a single blank-line gap."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "Copying and scroll preservation are tested, but setLogText replaces the final row when its text grows, destroying a selection in that row. The browser test selects an earlier, unchanged row."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "setLogText removes and replaces the final row whenever that line grows. Selecting text in the latest line therefore loses the selection on refresh, even when the selected characters remain unchanged. Previously, appendData preserved that text node and selection. A read-only reproduction confirmed that updating '12:00:01 working' to '12:00:01 working more' removes the original row and text node.",
        "suggested_fix": "Update the existing final row's text node in place when its text grows. Add a browser regression test that selects existing characters in the final line, extends that line, and verifies the selection remains.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The timestamps, colours and wrapping meet the requirements, and the reported tests pass. One refresh regression needs fixing: selected text in the latest line loses its selection when that line grows, which can interrupt copying."
  }
}
```

</details>
