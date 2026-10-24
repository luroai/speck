---
id: "0459"
title: "Show the pipeline log as a terminal of short lines"                # one outcome, no "and"
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
after: ["0457", "0458", "0460"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T10:17:36.223Z"

---
# 0459 · Show the pipeline log as a terminal of short lines

**Status:** 🔍 reviewing

## Problem
The Pipeline pop-up's log lists speck run's raw lines, newest first, on the page's own background, with no times. Many lines are long sentences with session ids and file paths, so it doesn't read as a log of what the pipeline is doing.

## Outcome
The pipeline log looks like a ticket's build log: a terminal of short, timed lines, the newest at the bottom.

## Acceptance criteria
1. The log is a box with the same black background, light text colours and four-sided border as a ticket's build log after 0455, in both looks.
2. Each line is laid out as a build log's line is (0422): its time in a column of its own and its text after it, with a line that wraps, and the lines after a message's first, starting under the text, not under the time. A line with no time, written before 0460, starts under the text too.
3. Each line's text is a summary of at most 48 characters, starting with the ticket's id when it names one. These kinds show as: `Launched <id> …` as `<id> build started`; `<id> build exited with code 0.` as `<id> build finished`; any other exit code as `<id> build failed (code <n>)`; `Shipping <id>: …` as `<id> shipping`; `Shipped <id>.` as `<id> shipped`; `<id> didn't ship: …` as `<id> didn't ship`, followed by a short reason if it fits; `Resumed <id> …` as `<id> build resumed`; `<id> build … stopped.` as `<id> build stopped`. Any other line shows its first sentence, cut to 48 characters with `…`. No summary shows a session id, a process id, a file path or a command.
4. The oldest line is at the top and the newest at the bottom, still the latest 200 lines. A new line appears within the panel's 2-second refresh and the box scrolls to show it, unless the reader has scrolled up, in which case they stay where they are. With no `run.log`, the box says speck run hasn't written anything yet, and the server still reads only `speck/.cache/runs/run.log` (0415). No test that passed before this change fails.

## Out of scope
- What's around the log in the pop-up (0458), and writing the times (0460).

## Notes
- Asked for by the user on 2026-10-24: "a nice looking kind of like terminal log … with timestamps. Everything's indented from the timestamp, just like all the individual ticket build logs", and earlier "summaries is fine". A first try, to be tuned once it's been used.
- Failing before this build: none
- Self-check: added a fallback height for browsers without dvh units; kept `speck run` as a name, not a command, so it isn't stripped from summaries; stripped `.git` file names before commands, so `speck.git denied` keeps its words.
- Changed tests: 0415's and 0458's checks of the newest-first order now expect the newest at the bottom, 0415's two checks of a reader's place as lines come in above them are replaced by 0459's in a box of its own, and 0415 AC5's long line is a sentence, now cut to 48 characters, checked on the newest line at the bottom.
- Today: `drawRunLog` and `runLogShift` in `templates/panel.js`, styled by `.foreman ol.run-log` in `templates/panel.css` (0415). It shows newest first, and 0415 keeps a scrolled reader's place by shifting the scroll as lines arrive at the top; with newest at the bottom, that logic changes. A build log's lines are laid out by `logParts` and `logRow` (0422).
- The line forms in criterion 3 are the ones in this repo's `run.log` on 2026-10-24, before 0460 adds times in front of them.
- Waits for 0457 (and so 0455, 0454 and 0453): all change `templates/panel.css`, and criterion 1 reuses 0455's look. Waits for 0458: both change `renderForeman` in `templates/panel.js`. Waits for 0460, whose times it shows.

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
    "reviewed_sha": "c22cd3457ecfbed0cdf2b7f603e8bd8e814c4135",
    "session": "fresh",
    "thread_id": "01a16d70-e5f3-7f20-bbb0-c92b1a5f70de",
    "builder_response": "- Tests run: `speck test --related test/pipeline-0459.test.mjs test/pipeline-0415.test.mjs test/pipeline-0458.test.mjs` (the related run added the files naming a changed file, and the repo's checks)\n- Round 1. The summaries are `runLogSummary`/`runLogLine` in templates/panel-model.js, drawn by `drawRunLog` and `runLogRow` in templates/panel.js. The API still gives newest first; the page reverses it.\n- Changed existing tests, as the ticket replaces what they checked: 0415 AC2's and 0458 AC4's order checks now expect the newest at the bottom; 0415's two tests of a reader's place as lines come in above them are replaced by 0459 AC4's tests of a reader scrolled up in the log's own box; 0415 AC5's long line is now a sentence (summaries are cut to 48 characters and drop paths), checked on the newest line, still wrapping at 320 px.\n- Pictures of the pop-up in both looks are in the review pack.\n",
    "seconds": 35,
    "usage": {
      "input_tokens": 118067,
      "cached_input_tokens": 84224,
      "cache_write_input_tokens": 0,
      "output_tokens": 981,
      "reasoning_output_tokens": 123
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-24T10:25:13.203Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.css reuses the build log's background, border, font and text colours. Passing 0459 AC1 tests check these styles."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "runLogRow and the .ln/.timed styles provide the timestamp column and hanging indentation. Passing 0459 AC2 tests exercise timed and untimed rows."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "runLogSummary and runPlain implement the required summaries and removal of technical details. Passing 0459 AC3 tests cover the specified forms, truncation and filtering."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "Ordering, retention and empty-state tests pass, and the server still reads only run.log. However, drawRunLog compares tagName to lowercase 'ol'; browsers return 'OL', so every update replaces the box and scrolls to the bottom, losing a scrolled-up reader's place."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.js:1998",
        "issue": "The existing log box is never reused in a real browser because HTML element tagName is uppercase ('OL'). Each new log update therefore creates a fresh box and forces it to the bottom. The scroll-preservation tests miss this because fakePage stores lowercase tagName values.",
        "suggested_fix": "Use a case-insensitive tag check or normalise tagName before comparing it. Add a regression check using browser-style uppercase tagName values, verifying that an update reuses the box and preserves a scrolled-up reader's position.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The terminal styling and short, timed summaries meet the ticket's requirements. One browser-specific bug needs fixing: new messages pull readers back to the bottom even when they have scrolled up. The current tests miss this because their fake elements use different tag names from a browser."
  }
}
```

</details>
