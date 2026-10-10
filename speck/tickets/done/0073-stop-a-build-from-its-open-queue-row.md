---
id: "0073"
title: "Stop a build from its open queue row"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0063", "0071", "0072"]                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-10T07:37:17.637Z"
finished: "2026-10-10T07:44:59.105Z"

---
# 0073 · Stop a build from its open queue row

**Status:** ✅ done

## Problem
Stopping a build for good with `speck stop` (0072) means leaving the panel for a terminal. It's also the one control that ends a build, so it shouldn't sit where a stray click hits it.

## Outcome
An open queue ticket with a running or paused build has a Stop build button, which asks first and then stops it.

## Acceptance criteria
1. An open `building` or `reviewing` ticket in the queue whose build `speck run` launched and is running or paused shows a **Stop build** button among its open details. A closed row, and any other ticket, has none.
2. Clicking it asks the user to confirm. Confirming stops the build exactly as `speck stop <id>` does, and cancelling changes nothing. Neither opens nor closes the row.
3. The server accepts the stop request only with the same `Origin` and `X-Speck-Token` checks as Set ready; anything else gets 403 and changes nothing. When the server refuses, the reason shows under the button until the next click on it.

## Out of scope
- Throwing the work away and building the ticket again from scratch.

## Notes
- After 0063, which adds a Full ticket button to the same open details, 0071, which adds the pause and play requests this follows, and 0072, which does the stopping.
- product.md's Queue description needs updating.
- product.md no longer exists (removed by 0068), so README's `speck stop` row says what the panel's Stop build button does instead.
- The server stops the build in its own process, as `speck stop` does, so it answers other requests only once the stop is done (a few seconds at most).
- Self-check: a refused stop's reason is now dropped once its ticket has no Stop build button, so building it again later doesn't show the old reason; test added.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 242,593
- Elapsed since build started: 6 min
- Changed lines: 77 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Known limit: the panel server stops a build in its own process, so while a stop runs (a few seconds at most) it answers no other request, and the page's polls wait. No inbox note.

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
    "reviewed_sha": "adc178ed26d2acc214bd737588600745db2a1039",
    "thread_id": "01a124c3-d45d-7381-9f00-9e34a6a1e5f2",
    "seconds": 29,
    "usage": {
      "input_tokens": 241936,
      "cached_input_tokens": 152960,
      "cache_write_input_tokens": 0,
      "output_tokens": 657,
      "reasoning_output_tokens": 76
    },
    "saved_at": "2026-10-10T07:43:25.330Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html: panelModel restricts pausable to building/reviewing tickets with a running build and no exit; queueItem adds stopButton only in open details. Both AC1 tests in test/panel-0073.test.mjs exercise eligible and ineligible rows and passed in the supplied output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html: stopButton stops click propagation; stopBuild confirms before sending and returns unchanged on cancellation. scripts/speck.mjs: panelStop and cmdStop call the same stopBuild implementation. AC2 tests cover confirmation, cancellation, duplicate clicks, process termination, blocking and committing the ticket, and paused builds; all passed in the supplied output."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/speck.mjs: panelServer checks the same origins and sameToken as Set ready before calling panelStop. templates/panel.html stores and renders refusal reasons under the button. AC3 tests cover missing/incorrect credentials, unchanged processes and repository state, refusal persistence, replacement and cleanup; all passed in the supplied output."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The open queue row now offers a confirmed Stop build action for running and paused builds. It uses the existing command’s stopping behaviour and the panel’s request protections. The tests exercise the interface and real process termination; I found no blocking issues or unrelated changes. Tests were inspected alongside the supplied passing results, rather than rerun in this read-only review."
  }
}
```

</details>
