---
id: "0301"
title: "Switch speck run to new code without waiting for builds to end"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0300"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T13:59:17.014Z"
approved: "2026-10-18T14:11:25.134Z"
finished: "2026-10-18T14:13:24.173Z"

---
# 0301 · Switch speck run to new code without waiting for builds to end

**Status:** ✅ done

## Problem
When a shipped ticket changes speck's own code, speck run starts no new build or ship until every build it's running has ended, so it can switch to the new code. A ticket that's approved and ready to ship can wait a whole build for that. On 2026-10-18 it held up shipping most of the day: 0294 waited for 0300's build, and 0268 and 0269 waited for 0265's.

## Outcome
speck run switches to new code as soon as no ship is running, without waiting for builds, and carries on watching the builds that were running.

## Acceptance criteria
1. When speck run's code changes, it switches to the new code once any ship it's running has ended, whether or not builds are running. It doesn't wait for builds.
2. After the switch, every build that was running is counted towards `max_parallel_builds`, shown as building in the panel, and watched as speck run's own builds are, until it ends.
3. When such a build ends, speck run handles it as it would have before the switch: a ticket left approved goes to the ship queue, and a ticket left building or reviewing is treated as a build that stopped partway.
4. While it waits for a ship to end, speck run starts no new ship, and says so once, naming the ship. New builds may start meanwhile.
5. Nothing that's running is stopped or started again by the switch.

## Out of scope
- Seeing builds speck run didn't start: 0300.

## Notes
- The switch is in `scripts/run-switch.mjs` (0247), and builds are picked up after it by `adoptEarlierBuilds` in `scripts/run.mjs`, which 0300 makes run on every check.
- Failing before this build: none
- Self-check: added a test that a build ending while new code fails to start is handled once the switch has failed; narrowed the brief to say a carried build's end is handled as for any build speck run watches but didn't start, since its exit code can't be known after the switch.

## In plain words
When a shipped ticket changes speck itself, speck run now moves to the new version as soon as no ship is in progress, instead of waiting for every running build to finish. So an approved ticket no longer sits waiting for an unrelated build before it ships.

Builds that were running carry on untouched: they still take up a build slot, still show as building in the panel, and when each one ends speck run deals with it as usual. If a ship is running when the change lands, speck run says once that it's waiting for that ship, and new builds can still start meanwhile.

To see it, ship a ticket that changes speck while another build is running: speck run's log says it switched to the new code straight away, and the other build keeps going.

Worth keeping an eye on: once speck run has switched, it can't tell how a carried-over build ended, only that it ended, so one that crashes partway is resumed once rather than handed to the Foreman.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 391,786
- Elapsed since build started: 12 min
- Changed lines: 114 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Known limit: after the switch, the new code isn't a carried build's parent, so it can't know its exit code. A build that exits by itself without writing a result to its log (a crash) is resumed once, as a killed build, where the old code would have handed it to the Foreman agent.
- Follow-ups: none sent to the inbox.

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
    "reviewed_sha": "1110b4543897b801d560c6350eb4f5bf3b4f0774",
    "thread_id": "01a14f56-8ff0-73d1-99b8-28841cac671f",
    "seconds": 27,
    "usage": {
      "input_tokens": 126200,
      "cached_input_tokens": 75520,
      "cache_write_input_tokens": 0,
      "output_tokens": 709,
      "reasoning_output_tokens": 155
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T14:07:42.717Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/run-switch.mjs codeSwitch waits only for busy()'s ship, then hands over running build IDs. Passing 0301 AC1 tests exercise switching during a build and after a ship ends."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/run.mjs handedOver/adoptEarlierBuilds adopts carried builds into running and adopted; checkAdopted watches their completion. Passing 0301 AC2 tests check build-slot limits and the Foreman building record used by the panel."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/run.mjs checkAdopted handles carried builds through the existing completion path. Passing 0301 AC3 tests exercise approved-ticket shipping, a stopped build left building, and completion while successor startup fails."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "codeSwitch returns without handing over while a ship runs; shipQueue.check refuses another ship while current is set. Passing 0301 AC4 integration test checks the named message occurs once and a new build starts before the ship ends."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The handover passes build IDs without signalling or relaunching their processes. The passing 0301 AC5 integration test verifies the original build remains alive through the switch and is launched only once."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change switches speck run to updated code without waiting for builds, while preserving their capacity limits, visibility and completion handling. The relevant tests passed, including recovery when the new code cannot start. I found no blocking issues."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "33a5d68174cc5ebed58cfa08d3fc6f60699af846",
    "merge": true,
    "thread_id": "01a14f56-8ff0-73d1-99b8-28841cac671f",
    "seconds": 17,
    "usage": {
      "input_tokens": 263684,
      "cached_input_tokens": 193024,
      "cache_write_input_tokens": 0,
      "output_tokens": 1193,
      "reasoning_output_tokens": 155
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T14:11:22.600Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/run-switch.mjs codeSwitch waits only for the running ship before handing over. Passing 0301 AC1 integration tests verify switching while builds remain alive and after a ship ends."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/run.mjs adoptEarlierBuilds adds carried builds to running and adopted; checkAdopted watches them. Passing 0301 AC2 tests verify capacity limits and the building record used by the panel."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0301 AC3 tests exercise shipping an approved ticket after its carried build ends, handling a stopped build left building, and handling completion when successor startup fails. scripts/run.mjs preserves these completion paths."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "codeSwitch waits while ships.running() names a ship; shipQueue.check prevents concurrent ships. The passing 0301 AC4 integration test verifies one named waiting message and a new build starting while the ship runs."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The handover adopts existing processes without signalling or relaunching them. The passing 0301 AC5 test verifies the original process survives and its build launches once."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The merged change retains the intended behaviour and passes the relevant tests. The updated 0300 test preserves its original purpose: an outside conversation can continue after approval without occupying a build slot. No blocking issues found."
  }
}
```

</details>
