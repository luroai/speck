---
id: "0128"
title: Toggle speck run from the panel                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0127"]              # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-12T19:49:52.296Z"

---
# 0128 · Toggle speck run from the panel

**Status:** 🔍 reviewing

## Problem
To start or stop `speck run` today, the user has to go to a terminal on the box. From the panel, often opened remotely, they can see the queue but can't set it going or stop it.

## Outcome
The panel has one button that turns `speck run` on when it's off and off when it's on.

## Acceptance criteria
1. While speck run is off, the panel shows a button to turn it on. Clicking it starts `speck run` for the repo, and the panel then shows speck run as on.
2. A `speck run` started from the panel keeps running after the page is closed and after the `speck panel` process stops.
3. While speck run is on, the panel shows a button to turn it off. Clicking it stops `speck run` the same way Ctrl-C does: builds already running carry on, and the panel then shows speck run as off. This works for a `speck run` started from a terminal as well as one started from the panel.
4. If `speck run` refuses to start (for example, no `build_command` in `speck/config.yml`, or the checkout isn't on the base branch), the panel shows speck run's own error message and speck run stays off.
5. A request to turn speck run on or off without the panel's token, or from another origin, is refused with 403 and changes nothing, as the panel's other writes are.

## Out of scope
- Showing `speck run`'s on/off state: that's 0127, which this builds on.
- Showing `speck run`'s own output in the panel. It's written to a file under `speck/.cache/runs/` so it isn't lost.
- Changing what `speck run` does once started (max_parallel_builds, which tickets it picks).

## Notes
- Risk is high because this starts a process that launches agents with `build_command` (by default with every permission prompt skipped) from an HTTP request. It must use the same token and Origin checks as the existing panel writes.
- `speck run` already stops cleanly on SIGINT or SIGTERM and leaves its builds running (`scripts/run.mjs`).
- Checked 2026-10-11: a child started with `spawn(..., { detached: true })` and `child.unref()`, with stdio not piped to the parent, keeps running after the parent exits on Linux (Node.js `child_process` docs, `options.detached`; installed Node v22.23.3).
- Failing before this build: none
- Self-check: no changes

## In plain words
The panel's header now has a button next to the "speck run on/off" label. When speck run is off it says "Turn on", and clicking it starts speck run, which then builds each ready ticket. When it's on it says "Turn off", and clicking it stops speck run without stopping any builds that are already going, whether speck run was started from the panel or from a terminal. A speck run started from the panel keeps going after you close the page or stop the panel. To see it, open the panel, click "Turn on" and watch the label change to "speck run on", then click "Turn off". If speck run can't start, for example because the checkout isn't on the main branch, its own message appears in a red line under the header. Worth keeping an eye on: what speck run prints when started from the panel goes into one file in speck's cache folder, which keeps growing.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (known limits, no inbox notes):
- `speck/.cache/runs/run.log` is appended to on every start from the panel and never trimmed.
- Turning off checks that the lock's process is `speck run` with `ps`; where `ps` can't run, the panel refuses to stop it and says the process isn't speck run, which is misleading but changes nothing.

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
    "reviewed_sha": "ec4222901c6e25fc1be9acccdd1b17b1d4b0103b",
    "thread_id": "01a131ae-c0b9-7370-b16f-e2f7a1617729",
    "seconds": 39,
    "usage": {
      "input_tokens": 155343,
      "cached_input_tokens": 107904,
      "cache_write_input_tokens": 0,
      "output_tokens": 815,
      "reasoning_output_tokens": 55
    },
    "saved_at": "2026-10-12T19:55:37.578Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/panel.mjs panelRunOn starts the real CLI and waits for its lock; templates/panel.html render and switchRun update the button and state. Passing AC1 integration and page tests in test/panel-0128.test.mjs exercise these behaviours."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelRunOn uses detached spawn, file-backed output and child.unref(). The passing AC2 test stops the panel's whole process group with SIGINT, verifies the runner survives, and checks its state through a new panel."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/panel.mjs panelRunOff sends SIGINT to the runner alone; scripts/run.mjs cmdRun handles it without stopping builds. Passing AC3 tests cover terminal and panel starts, surviving builds, repeated toggles, and the page's off state."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panelRunOn returns the child's logged refusal; switchRun displays it using textContent. Passing AC4 tests exercise missing build_command, the wrong branch, an existing runner, and visible error persistence."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "panelServer checks the existing Origin allowlist and sameToken before either switch action. The passing AC5 integration test verifies 403 responses and unchanged processes and files for missing or invalid tokens and disallowed origins."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel can start and stop speck run, preserves running builds when stopped, and shows startup errors. Background runs survive the panel closing, and requests use the existing security protections. The tests exercise real runner processes; the full test log confirms 1,218 passes and no failures. No blocking issues found."
  }
}
```

</details>
