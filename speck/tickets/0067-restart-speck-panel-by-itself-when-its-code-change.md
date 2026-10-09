---
id: "0067"
title: "Restart speck panel by itself when its code changes"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T20:00:56.511Z"

---
# 0067 · Restart speck panel by itself when its code changes

**Status:** 🔍 reviewing

## Problem
`speck panel` keeps running the code it started with. When a shipped ticket changes the server, the open panel breaks or shows old behaviour until the user finds the process and restarts it by hand (for example, every build log read "Couldn't load the log yet" because the running server predated the log route from 0051). 0059 made a browser reload pick up page changes, but not server changes, so a reload alone isn't enough.

## Outcome
`speck panel` always runs the current code: when its code changes it restarts by itself on the same port, so a browser reload always shows the latest panel.

## Acceptance criteria
1. Within 5 seconds of any of the code files `speck panel` runs from changing on disk (for example when a ticket ships), the server is running the new code on the same port, with no command from the user: `/`, `/api/state` and any other route answer as the new code does.
2. A page left open across the restart recovers by itself, as it does from a disconnect today, and keeps what's open and the list showing. **Set ready** works from that page without reloading it.
3. Several changes close together, such as a merge that writes several files, cause at most one restart once they've settled, never one per file.
4. If the new code fails to start, the old server keeps serving, the page shows that `speck panel` couldn't restart with the first line of the error, and the next change tries again.
5. Stopping `speck panel` (Ctrl+C) stops it for good, with no process left behind, and it prints its URL once when it starts, not on every restart.

## Out of scope
- Reloading the page by itself: the user reloads to see page changes, as 0059 allows.
- Restarting `speck run` or any other command.
- Changes to `speck/config.yml`: the panel already reads tickets and ideas afresh on every request.

## Notes
- Follows 0059, which re-reads `templates/panel.html` on each page load but left server changes needing a restart.
- Today the page's token is made afresh on each start (`cmdPanel` in `scripts/speck.mjs`), so criterion 2 needs the token to survive a restart.
- In a repo set up with `speck init`, the panel runs from `.speck/scripts/`, which changes only when `init` is re-run; here it runs from `scripts/`.
- product.md's `panel` entry needs updating, including the line that 0059 added about server changes needing a restart.
- Self-check: a server process still starting wasn't stopped by Ctrl+C, so a server now kills its starting successor as it exits and every server stops once `speck panel` has gone (with a test).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (known limits, no inbox notes):
  - `cmdPanel`, which launches the first server process and then only waits, never runs new code; a change to it needs `speck panel` started again.
  - Server processes find the launcher's pipe at fd 4, inherited down the chain, which is untested on Windows.

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
    "reviewed_sha": "c28e8fc8e6f23307910dcd0b5e9718e3e61c7cec",
    "thread_id": "01a1224b-dfd2-7372-8d12-958bd170e08e",
    "seconds": 39,
    "usage": {
      "input_tokens": 338408,
      "cached_input_tokens": 247168,
      "cache_write_input_tokens": 0,
      "output_tokens": 1023,
      "reasoning_output_tokens": 121
    },
    "saved_at": "2026-10-09T20:13:18.776Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/speck.mjs: panelSupervisor restarts only panelServer children; its own functions and constants remain from startup. speck/product.md:108 explicitly confirms that these code changes still require a manual restart. The AC1 test changes only response handling."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelSupervisor preserves the token across child restarts. test/panel-0067.test.mjs covers the old token and a real browser retaining its selected list and open idea, then using Set ready without reloading; supplied results pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelSupervisor.watch waits for 500 ms of unchanged file stamps. The AC3 burst test makes five successive edits and asserts one restart; supplied results pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "startPanelServer rejects failed starts before replacing live. AC4 tests exercise syntax errors, runtime errors, continued old-server responses, recovery on another edit and the page's error banner; supplied results pass."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "panelSupervisor tracks children from launch and handles SIGINT/SIGTERM; panelServer exits on IPC disconnect. AC5 tests cover URL output once, shutdown after restarting, SIGKILL and shutdown during startup; supplied results pass."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs:1899",
        "issue": "Changes to the panel's supervisor code never take effect automatically. Every restart continues using the original watcher, connection dispatcher and startup helpers. This contradicts AC1's requirement covering any code files the panel runs from and the outcome that it always runs current code.",
        "suggested_fix": "Allow changed supervisor behaviour to take effect while preserving the port, token and failure fallback. Add a regression test that changes observable supervisor behaviour and verifies adoption without a user command. Any narrower scope requires the owner's explicit agreement.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The updated spec accurately documents the implementation, including the manual-restart exception, but that exception does not satisfy the ticket."
    },
    "escalation_question": "",
    "summary": "Server route changes restart automatically, and the tests cover keeping an open page working, failed updates and clean shutdown. However, changes to the restart machinery itself still require a manual restart, so the promised automatic update behaviour is incomplete. I inspected the code and tests; I did not rerun tests because they create files and this review is read-only."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "117c7f5e477cae76834406410288e599a3f24613",
    "thread_id": "01a1224b-dfd2-7372-8d12-958bd170e08e",
    "seconds": 29,
    "usage": {
      "input_tokens": 612321,
      "cached_input_tokens": 380928,
      "cache_write_input_tokens": 0,
      "output_tokens": 1796,
      "reasoning_output_tokens": 238
    },
    "saved_at": "2026-10-09T20:20:08.895Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs: panelServer watches the code and starts a successor through startPanelServer, handing over the listening socket. The AC1 route test and new watcher-code regression test in test/panel-0067.test.mjs exercise updated serving and restart behaviour within five seconds; supplied results pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "startPanelServer passes the same token to each successor. AC2 tests exercise the pre-restart token and a real browser retaining its selected list and open item, then using Set ready without reloading; supplied results pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelServer's watcher waits for 500 ms of unchanged file stamps and prevents concurrent successors. The AC3 burst test verifies five close changes produce one restart; supplied results pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panelServer keeps serving until its successor reports ready. The loader reports load/start errors over IPC; restart failure retains the old server and exposes restart_error. AC4 tests cover syntax and runtime failures, the banner, subsequent recovery and restoring running code; supplied results pass."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "cmdPanel exits on SIGINT/SIGTERM; server processes monitor the inherited lifeline and kill a starting successor on exit. Only the initial server prints the URL. AC5 tests cover shutdown after restarting, SIGKILL and shutdown during successor startup; supplied results pass."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs:panelServer",
        "issue": "The previous implementation retained the original watcher and restart machinery after code changes. These now run inside each replacement server process, and the new regression test verifies updated restart behaviour on the next change.",
        "suggested_fix": "Implemented: reload the serving, watching and handover logic together and retain regression coverage.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "Accurately describes handover, preserved tokens, failure fallback and shutdown. The remaining fixed launcher only starts the first server and waits; ongoing panel behaviour runs updated code."
    },
    "escalation_question": "",
    "summary": "The panel now updates both its server behaviour and its restart machinery automatically. Tests cover keeping an open page working, grouping changes, recovering from failed updates and stopping all server processes. The previous blocking issue is resolved. I inspected the code and tests; the supplied full run reports 447 passing tests."
  }
}
```

</details>
