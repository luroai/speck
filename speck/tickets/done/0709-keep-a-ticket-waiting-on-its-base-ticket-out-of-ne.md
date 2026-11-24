---
id: "0709"
title: "Keep a ticket waiting on its base ticket out of Needs you"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-15-don-t-say-ready-to-ship-while-the-base-ticket-hasn-t-shipped.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T11:55:03.915Z"
approved: "2026-11-24T12:45:44.482Z"
finished: "2026-11-24T12:57:14.596Z"

---
# 0709 · Keep a ticket waiting on its base ticket out of Needs you

**Status:** ✅ done

## Problem
An approved ticket built on another ticket that hasn't shipped has auto-ship turned off until that ticket ships, so the panel puts it under Needs you as Ready to ship. You're asked to act when shipping it now would only have to wait.

## Outcome
Such a ticket stays under Building, saying it ships after its base ticket, and asks you only once it can really ship.

## Acceptance criteria
1. An approved ticket whose `built_on:` ticket hasn't shipped is shown in the panel's Build lane under Building, not under Needs you, and its line says it is approved and ships after that ticket, naming it.
2. It isn't counted in the panel's Needs you count, in the bridge's Needs you, or as waiting for you to ship in `speck status`.
3. Once the base ticket has shipped, the ticket ships by itself when auto-ship covers it, and otherwise shows under Needs you as Ready to ship, as today.
4. An approved ticket with no `built_on:`, or whose `built_on:` ticket has shipped, reads and counts as it does today.
5. No test that passed before this change fails.

## Out of scope
- A `built_on:` ticket that was cancelled: that has a ticket of its own.

## Notes
- Failing before this build: none
- Self-check: tightened the speck status test to read each ticket's own lines, so a ships-after line under the wrong ticket fails it; checked an auto-ship that didn't finish still shows under Needs you.
- `autoShipWhyNot` (`scripts/ship.mjs`) turns auto-ship off while `built_on` hasn't shipped, so the board sets `auto_ship: false` and `ships_after`. `buildGroup` and `doingNow` (`templates/panel-model.js`), `atShip` (`scripts/panel-summary.mjs`) and the status line (`scripts/foreman.mjs`, the speck-status skill) are where it shows. A ticket speck will act on (`foreman_will`) is already grouped under Building, which this follows.
- speck (2026-11-24 12:25 UTC) told you: The build is slow because the machine is overloaded, not because of the ticket or a broken base branch. Its real-browser tests keep timing out at startup, and the failures move between reruns. The build is now waiting for the load to drop before it re-runs them. Why: The load average reached about 150 on 16 cores while other builds ran, and every failure was a 'panel didn't start' timeout, with different tests failing on each run, including tests that had passed before.

## In plain words
When a ticket was built on top of another ticket that hasn't shipped yet, the panel used to list it under Needs you as Ready to ship, even though shipping it then would only have to wait. Now it stays under Building, with a line saying it's approved and ships after the ticket it was built on, naming it. It isn't counted in Needs you, on the bridge, or as waiting for you in speck status, which says the same thing on a line under it.

To see it: approve a ticket that was started on another approved ticket. While that first one is unshipped, the second sits under Building. Once the first ships, the second ships by itself if auto-ship covers it, or moves to Needs you as Ready to ship as before.

Worth a look: while the other builds were running, the browser tests timed out a lot from the machine being busy. They passed when re-run, but a full suite run on a busy machine may show the same.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 281,319
- Elapsed since build started: 51 min
- Changed lines: 24 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none for the inbox. The related run's 50 failures were real-browser and real-panel tests timing out at a load average over 150 from other builds; all passed on re-runs apart from 0517's 50 ms frame timing, which passed alone.

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
    "reviewed_sha": "759742e1afe09143c00fe9bc824067d812380e8c",
    "session": "fresh",
    "thread_id": "01a20d96-7eb2-7a13-a73e-69458fd3851c",
    "builder_response": "- Tests run: `speck test --related test/panel-0709.test.mjs` once (519 files). Its 50 failures were all real-browser or real-panel tests timing out (\"panel didn't start\", \"timed out waiting\") while the machine's load average was over 150 on 16 cores from other builds; none is about approved tickets or ships_after.\n- Re-ran the failed files plus test/panel-0709.test.mjs (speck's suggested --files line): 302 pass, 2 fail (0481, 0517: browser timing). Re-ran those with 0161, 0427, 0543 and tmp-cleanup: 160 pass, 1 fail (0517's 50 ms frame timing on the Shipped lane). Re-ran test/panel-0709.test.mjs test/panel-0517.test.mjs: all 159 pass (the attached output).\n- Pictures: Build lane with the new state in light and dark looks, from a fixture repo (0002 approved under Needs you, 0001 built on it under Building, \"Approved · ships after 0002, which it was built on\").\n",
    "seconds": 38,
    "usage": {
      "input_tokens": 280378,
      "cached_input_tokens": 226816,
      "cache_write_input_tokens": 0,
      "output_tokens": 941,
      "reasoning_output_tokens": 70
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 53562,
      "cached": 226816,
      "write": 0,
      "output": 941
    },
    "cost_usd": 0.1392156,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T12:45:33.655Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-model.js suppresses to_ship and the exit warning for ships_after, and doingNow names the base ticket. Passing 0709 AC1 tests exercise rendered Building rows with and without a finished build, including high risk."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing 0709 tests verify absence of Needs you grouping, zero bridge needs_you via projectSummary, and ticket-specific ships-after output from speck status. scripts/speck.mjs excludes waiting tickets from its waiting-for-you total."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "0709 AC3 tests cover the manual-shipping display after the dependency ships. Existing test/run-after-0675.test.mjs exercises the ship queue launching and shipping the dependent ticket on its first check after the base ships; that path is unchanged."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Passing 0709 AC3 AC4 test checks normal Ready to ship grouping and bridge counts with no dependency or a shipped dependency, plus automatic-shipping display. The new model and summary conditions apply only when ships_after is present."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0709-tests.txt: 159 passed, zero failed, three skipped. The committed change is limited to the ticket's presentation, status guidance and tests; no remaining regression is evident."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Approved tickets waiting for their base ticket now stay under Building, name that ticket and stop asking you to ship prematurely. Normal shipping behaviour returns once the base ships. The tests cover the changed behaviour, and I found no blocking issues."
  }
}
```

</details>
