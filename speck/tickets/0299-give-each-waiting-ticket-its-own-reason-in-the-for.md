---
id: "0299"
title: "Give each waiting ticket its own reason in the Foreman's detail"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0294"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T14:08:11.858Z"
approved: "2026-10-18T14:14:18.518Z"

---
# 0299 · Give each waiting ticket its own reason in the Foreman's detail

**Status:** 👍 approved

## Problem
While speck run waits to switch to new code, the Foreman's detail gives that as the reason for every ready ticket, though most are waiting for other tickets in their `after:` list, and its Shipping section says "Nothing is waiting to ship" while an approved ticket shows "Approved · waiting to ship" on the board. Seen on 2026-10-18: 0295, 0296 and 0298 all said "speck run is switching to new code once the build of 0287 ends", while 0295 was waiting for 0294 and 0287, and 0294 was approved and held.

## Outcome
The Foreman's detail gives each waiting ticket its own reason, says once what is holding everything up, and lists every approved ticket waiting to ship with why it isn't shipping yet.

## Acceptance criteria
1. A ready ticket that is waiting for tickets in its `after:` list shows that reason, naming the tickets not yet done, whatever else is going on, such as speck run switching to new code or all build slots being in use.
2. When something holds up all builds or ships (speck run switching to new code, or shipping on hold for a failing base branch), the detail says so once, above its sections, and a ticket's line gives that reason only when nothing of its own holds it up.
3. Every approved ticket that `auto_ship` covers and isn't shipping now is listed under Shipping, with why it's waiting: another ship is running, shipping is on hold, speck run is switching to new code, its last ship was refused (with the message), or it's next.
4. "Nothing is waiting to ship" shows only when no approved ticket that `auto_ship` covers is waiting.
5. `speck status` gives the same reasons as the panel's detail.

## Out of scope
- Showing tickets' titles in the detail: the user wants the ids only.

## Notes
- The reasons are recorded by speck run (`run.foreman.json`) and read by `foremanView` in `scripts/foreman.mjs`. The detail is drawn in `templates/panel.html` (search for "Ready, not building").
- Failing before this build: none
- Self-check: no changes. Reordered speck run's own-reason checks (after, unstarted, stopped, uncommitted) ahead of the build-slots check, so a ticket's own reason wins over all slots in use too. Changed two 0285 tests for the new behaviour: the ship state now also has `waiting`, and `speck status` gives the hold once, first.

## In plain words
When you open the Foreman's detail, each ready ticket now says what is really holding it up: a ticket waiting for others in its list names them, even while speck run is switching to new code or every build slot is busy. Anything that holds up everything, such as switching to new code or shipping being on hold, is said once at the top instead of on every line. Under Shipping, every approved ticket that ships by itself is listed with why it hasn't shipped yet, or that it's next, so "Nothing is waiting to ship" no longer shows while one is waiting. `speck status` gives the same reasons. To see it, open the Foreman's detail while speck run is on with tickets waiting.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 154,130
- Elapsed since build started: 6 min
- Changed lines: 117 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "037706f2d9b29e78eac800c589d3187725089e94",
    "thread_id": "01a14f5c-7a89-7701-8197-cb5663f25507",
    "seconds": 29,
    "usage": {
      "input_tokens": 153243,
      "cached_input_tokens": 105856,
      "cache_write_input_tokens": 0,
      "output_tokens": 887,
      "reasoning_output_tokens": 107
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T14:14:11.551Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/run.mjs ownWait checks waiting_on before shared delays and supplies switchingReady during code switching. Passed 0299 AC1 covers switching; the existing 0285 run-record test covers dependencies while build slots are full."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "foremanView collects shared holds in held; renderForeman places them above the sections. Ticket-specific checks precede shared waiting reasons. Passed 0299 AC2 checks placement, repetition and individual reasons."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/ship-queue.mjs state includes all covered approved tickets except the current ship, including those whose builds still run. Both passed 0299 AC3 tests exercise queue order, switching, running ships, refusals and holds."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "renderForeman renders ship.waiting under Shipping and uses the empty message only when the section has no entries. Passed 0299 AC4 checks waiting and empty cases."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "scripts/speck.mjs and scripts/panel.mjs both use foremanView. foremanLines prints the same held and waiting reasons that renderForeman displays. Passed 0299 AC5 compares both outputs; existing 0285 AC5 exercises speck status."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The detail now preserves each ticket’s own waiting reason, explains shared delays above the sections, and lists approved tickets waiting to ship. The command-line status uses the same reasons. The reported tests passed, and code review found no blocking issues. Tests were not rerun in the read-only review."
  }
}
```

</details>
