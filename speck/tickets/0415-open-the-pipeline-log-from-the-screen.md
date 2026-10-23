---
id: "0415"
title: "Open the pipeline log from the screen"                # one outcome, no "and"
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
after: ["0414"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T15:21:38.601Z"

---
# 0415 · Open the pipeline log from the screen

**Status:** 🔍 reviewing

## Problem
The Foreman's detail says what's waiting and why, but not what speck run has done. To see that, you read `speck/.cache/runs/run.log` by hand.

## Outcome
Pressing speck's screen opens the pipeline log, which takes the place of the Foreman's detail.

## Acceptance criteria
1. Pressing the screen opens a pop-up titled `Pipeline`, and the Foreman's detail is gone. The pop-up starts with a `Right now` section that shows everything the Foreman's detail shows today, in the same order. The Foreman's questions keep their Answer and Dismiss buttons, and a stale page keeps its Reload page button.
2. Under it, a `Log` section shows speck run's output from `speck/.cache/runs/run.log`, newest line first, up to the latest 200 lines. Lines speck run writes while the pop-up is open appear within the panel's 2-second refresh. A reader who has scrolled down the log stays where they are. With no `run.log`, it says speck run hasn't written anything yet.
3. The pop-up closes with its Close button, Escape or a click outside it, and the focus goes back to the screen, as with the Foreman's detail today.
4. The panel's server reads only `speck/.cache/runs/run.log` for the log, and no request can make it read any other file.
5. At 320 px wide, the pop-up fits without the page scrolling sideways, and long log lines wrap.

## Out of scope
- Filters by kind of line, and times on each line (`run.log` has none).
- The screen and its animations (0413, 0414).

## Notes
- Design: the Pipeline sheet in console.html in https://claude.ai/artifact/R5CQDZJfMZ2rYcTmZK1B8z.
- The Foreman's detail is `renderForeman` (0285, 0287, 0317, 0318, 0328, 0366). `run.log` is written by `scripts/panel-run.mjs` (0220).
- Waits for 0414: both change `templates/panel.html`.
- Failing before this build: none
- Design: the linked artifact isn't shared with this account, so the build follows the criteria. The pop-up keeps today's full-panel shape, and "a click outside it" is a click beside its centred column, as with Settings (0368).
- Self-check: a failed request for the log was sent again at once, in a loop; it now waits for the next redraw (test added). The page-wide `section` style drew a border round the two parts, so they're plain blocks.

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
    "reviewed_sha": "ce7910bff25c549b2e4f9bcd8d90638ad231232d",
    "session": "fresh",
    "thread_id": "01a16963-4c01-7db3-b14d-5c93aae8f69f",
    "builder_response": "- Tests run: test/pipeline-0415.test.mjs test/panel-0413.test.mjs (plus the commands.checks files, which speck test --files adds)\n- Round 1. Notes for the reviewer:\n  - The linked design artifact isn't shared with this account, so the build follows the criteria. The pop-up keeps today's full-panel shape; \"a click outside it\" is a click beside its centred column (pointerdown and click both beside it), as Settings does (0368), reusing besideColumn.\n  - The board carries `run_log` (size:mtime of run.log, from runLogPart). A write to run.log already makes the board watcher read again after BOARD_LOG_MS (2 s), so the stamp change is announced on that refresh; the page then asks GET /api/run-log, only while the pop-up is open and only when run_log changed. No run_log on the board means no run.log, so the page says so without asking.\n  - /api/run-log takes nothing from the request: the route matches the exact path and reads path.join(runs, 'run.log'). A run.log that is a symlink or not a plain file is treated as missing (lstat + O_NOFOLLOW + fstat).\n  - test/panel-0413.test.mjs: one assertion changed from the old title \"The Foreman\" to \"Pipeline\", since AC1 replaces that title.\n  - scripts/panel.mjs is at the repo's 600-line limit, so the route and board part live in scripts/run-log.mjs, imported through scripts/panel-run.mjs.\n",
    "seconds": 38,
    "usage": {
      "input_tokens": 200382,
      "cached_input_tokens": 154752,
      "cache_write_input_tokens": 0,
      "output_tokens": 1454,
      "reasoning_output_tokens": 90
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T15:31:55.612Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html renderForeman preserves the existing detail under Right now. Passing AC1 tests cover title, section order, Answer/Dismiss buttons and Reload page."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "Live updates and missing-file behaviour have passing tests, but drawRunLog preserves position using total height changes, which fails when the 200-line window replaces equal-height lines. runLogTail also silently discards lines beyond its 256 KiB read window."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 tests exercise Close, Escape and clicks beside the column, including focus returning to the screen."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/panel.mjs matches /api/run-log exactly; runLogAnswer takes only the server's runs directory. Passing AC4 tests cover request parameters, traversal attempts, symlinks and directories."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The passing real-browser AC5 test checks horizontal overflow and long-line wrapping at 320 px in both themes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:4225",
        "issue": "Scroll preservation fails once the log contains 200 lines. Adding a line removes the oldest line, so equal-height lines leave scrollHeight unchanged and scrollTop is not adjusted. A read-only fakePage reproduction changed the visible row from 'line 175' to 'line 176' while scrollTop remained 500. The existing test only covers a growing list below the cap.",
        "suggested_fix": "Anchor the viewport to a retained log line and its offset rather than the total height difference. Add coverage for updates to an already full 200-line log, including wrapped lines.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/run-log.mjs:34",
        "issue": "The fixed 256 KiB read window silently omits recent output. For example, a latest line longer than that window is discarded entirely by lines.shift(), potentially showing an empty log despite existing output. Multiple long lines can also yield fewer than the latest 200 lines. The added long-file test explicitly accepts this omission.",
        "suggested_fix": "Read backwards in chunks until 200 complete lines or the beginning of the file is reached, preserving long lines. Test a latest line exceeding 256 KiB and 200 lines whose combined size exceeds that limit.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The Pipeline pop-up preserves the existing controls and adds live output with a working mobile layout. Two issues need fixing: updates move the reader's place once the log reaches 200 lines, and long output can disappear from the displayed log."
  }
}
```

</details>
