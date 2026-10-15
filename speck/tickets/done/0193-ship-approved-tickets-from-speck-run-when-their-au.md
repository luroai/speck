---
id: "0193"
title: "Ship approved tickets from speck run when their auto-ship didn't finish"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T09:41:50.165Z"
approved: "2026-10-15T10:07:58.732Z"
finished: "2026-10-15T10:10:31.116Z"

---
# 0193 · Ship approved tickets from speck run when their auto-ship didn't finish

**Status:** ✅ done

## Problem
When a build's auto-ship can't finish (the base branch's tests were failing, the tests stalled, or staged files were in the way), its ticket stays approved until the user runs `/speck-ship`, even after the cause has gone. On 14 October approved tickets sat waiting after `main` was fixed, until they were shipped by hand.

## Outcome
While `speck run` is on, it ships each approved ticket that `auto_ship` covers, one at a time, once whatever stopped its last ship has changed, so no such ticket waits for the user.

## Acceptance criteria
1. While `speck run` is on, an approved ticket that `auto_ship` covers (as `speck ship --auto` decides it) is shipped by `speck run` running `speck ship <id> --auto` for it. It starts no ship while any ship is running in the repo, whoever started it, so at most one ship runs at a time. When more than one ticket is waiting, fix tickets (`type: fix`) go first, then the one approved earliest.
2. `speck run` tries a ticket again only when something has changed since its last try: the base branch or the ticket's branch has a new commit. A ticket whose last try refused, with neither changed, isn't tried again, however long `speck run` keeps running, and the refusal is printed in `speck run`'s output once, not on every check.
3. When a ship that `speck run` started exits 14 (the base branch's own tests are failing), `speck run` starts no other ship until the base branch has a new commit, and says once in its output that shipping is on hold until the base branch passes.
4. `speck run` never ships an approved ticket that `auto_ship` doesn't cover (its risk isn't in `auto_ship_risk`, or `auto_ship` is off), nor a ticket in any other status. Turning `speck run` off doesn't stop a ship it started: the ship carries on to its end, as builds do.
5. No test that passed before this change fails.

## Out of scope
- Builds still run `speck ship <id> --auto` themselves and handle conflicts and a failing base branch as now. Moving every ship to `speck run` is 0194.
- Showing the queue in the panel (0105 was cancelled; the panel's existing "Shipping…" and "Auto-ship didn't finish" states stay as they are).
- Retrying flaky tests (0195).

## Notes
- Asked for 2026-10-15: "those two tickets are essentially creating a separate single shipping process which handles the shipping of all things in its own queue? This was an idea we discussed a few days ago but opted to go with a single WIP limit instead. If this is correct, then start those 2 tickets."
- This revives part of the ship queue cancelled on 11 October (0102 to 0105) when speck moved to one build at a time (0111). The causes given then (leaked processes running the machine out of memory, builds inheriting a broken `main`) have since been fixed by 0175 and 0192. The brief's section 7 is updated in 0194, once builds no longer ship themselves.
- `speck ship` already keeps a record of a ship in progress (`takeShip` in `scripts/ship.mjs`), which the panel reads; "any ship running" in AC1 can use it.
- The builder decides how `speck run` remembers its last try per ticket; it must survive a restart of `speck run` only as far as AC2 needs (a restart may try each waiting ticket once more).
- Failing before this build: none
- speck run remembers each ticket's last try in memory. After a restart, an earlier auto-ship that ended without shipping (its ship record in speck/.cache/runs/) counts as the last try when neither the base branch nor the ticket's branch has a commit since it started, so a restart doesn't re-try those.
- A ticket whose build is still running is left to that build, which ships it itself.
- Self-check: the integration test waited only for the ticket to be done, not for its branch to be deleted, which ship does last; it now waits for both.

## In plain words
While `speck run` is on, an approved ticket that was meant to ship on its own but didn't (because the main branch's tests were failing, the tests stalled, or something was in the way) now ships by itself once something has changed, instead of waiting for you. It ships one ticket at a time, fixes first, then the one approved earliest. If main's own tests are failing, it says once that shipping is on hold and waits for a new commit on main. It doesn't keep retrying a ticket when nothing has changed, and it says why a ticket didn't ship only once.

Only one ship runs at a time now, whoever starts it: a ship you start while another is running waits for it to finish and says so.

To see it: with `speck run` on, an approved low-risk ticket whose own ship didn't finish ships within a few seconds of a new commit on main or on its branch, and `speck run`'s output says "Shipping …" then "Shipped …". Worth watching: a ship waiting for another one waits as long as that one takes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Checking ship records and launching are separate operations.; F2 The exit-14 hold uses the base hash from before shipping began.
Round 2 (codex): changes requested.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 941,956
- Elapsed since build started: 26 min
- Changed lines: 183 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- The 0153 test "a second speck ship for the same ticket refuses…" takes its snapshot before the first ship reaches its tests, so it can fail under load: speck/ideas/2026-10-15-fix-the-race-in-the-0153-second-ship-test.md.
- Skipped (covered by 0194): a build run outside `speck run` can find `speck run` already shipping its freshly approved ticket, so its own `speck ship --auto` refuses with "A ship is already running"; the ticket still ships.
- Known limit: a ship waiting for the repo's ship lock waits as long as the other ship runs, with no time limit; a ship whose process has gone frees the lock.
- Known limit: `speck run` keeps each ticket's last try in memory. After a restart it relies on the ship record of the last auto-ship, so a ticket may be tried once more when a commit landed in the same second the earlier ship started.

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
    "reviewed_sha": "eddcb584bec0f73d4de55c2cfb9883c0dd01cd5a",
    "thread_id": "01a13efa-e744-7920-8d8e-aa419c4b2462",
    "seconds": 53,
    "usage": {
      "input_tokens": 190601,
      "cached_input_tokens": 141952,
      "cache_write_input_tokens": 0,
      "output_tokens": 1588,
      "reasoning_output_tokens": 261
    },
    "saved_at": "2026-10-15T09:54:05.722Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "shipOrder and the passing AC1 tests cover eligibility, ordering and waiting for an existing record. However, shipQueue.check checks records before spawning without an atomic repository-wide reservation. ship.mjs takeShip locks only the individual ticket, so simultaneous ships of different tickets can overlap."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "shipQueue.check remembers base and ticket branch hashes in last and suppresses unchanged retries. The passing AC2 tests exercise both branch changes, repeated checks, refusal reporting and earlier failed auto-ship records."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "shipQueue.ended sets hold to the base hash captured before launch. shipTicket can observe and test a newer base during shipping. The AC3 test passes but never changes the base before the ship exits 14, missing premature release of the hold."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "shipOrder filters approved status and statusData's auto_ship eligibility. launchShip uses detached processes. Passing AC4 tests cover excluded risks, disabled auto-ship, other statuses and a real ship completing after speck run stops."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "/tmp/speck-0193-tests.txt confirms 1735 tests, 1732 passed, zero failures and three skipped. No pre-existing failures were listed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/ship-queue.mjs:111",
        "issue": "Checking ship records and launching are separate operations. Another manually started or build-started ship can begin between them. Since takeShip in ship.mjs reserves only a ticket, ships of different tickets can both proceed, violating AC1's single-ship guarantee. The test creates the other ship's record before checking and does not exercise concurrent starts.",
        "suggested_fix": "Coordinate ship starts through an atomic repository-wide reservation shared by queue, manual and build-started ships. Add a concurrent-start test with different ticket ids proving that only one ship proceeds.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/ship-queue.mjs:88",
        "issue": "The exit-14 hold uses the base hash from before shipping began. For example, shipping starts at A, a user commits B while tests run, shipTicket reruns tests against B and finds B's own tests failing. The queue stores A as the hold, immediately sees B as a change and starts another ship without any commit after the failure. This violates AC3.",
        "suggested_fix": "Record a base reference appropriate to the failure rather than the pre-launch snapshot, and require a subsequent change before releasing the hold. Add a test where the base advances before the ship reports exit 14 and verify repeated checks launch nothing until another base commit.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The queue handles normal retries, ordering and shutdown correctly, and the full suite passes. Two gaps need fixing: simultaneous starts can allow overlapping ships, and a failing-base hold can clear immediately when the base changed during shipping."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "ed68d2f3f910985c7d23e1b66e798a8f9fc91036",
    "thread_id": "01a13efa-e744-7920-8d8e-aa419c4b2462",
    "seconds": 28,
    "usage": {
      "input_tokens": 304955,
      "cached_input_tokens": 244736,
      "cache_write_input_tokens": 0,
      "output_tokens": 2459,
      "reasoning_output_tokens": 326
    },
    "saved_at": "2026-10-15T09:58:32.456Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "shipOrder and passing AC1 tests cover eligibility, ordering and existing ships. However, cmdShip checks otherShipRunning only when SPECK_SHIP_ALONE is set. A manual or build-started ship can register after that check and proceed alongside the queue's ship."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "shipQueue.check compares remembered base and ticket branch hashes. Passing AC2 tests exercise unchanged refusals, changes to either branch and earlier failed auto-ship records. The new exit-15 test verifies a concurrency refusal does not consume a retry."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "shipQueue.ended now captures headOf(repo, base) when exit 14 is received. Both passing AC3 tests verify the hold, including a base commit made while shipping, and release only after a subsequent base commit."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "shipOrder filters approved status and statusData's auto_ship eligibility. Passing AC4 tests cover disabled auto-ship, excluded risks and other statuses. The integration test verifies a detached ship completes after speck run stops."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "/tmp/speck-0193-tests.txt confirms 1739 tests: 1736 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/ship.mjs:515",
        "issue": "The fix checks only queue-started ships, so mutual exclusion remains incomplete. A queue ship can take its record and finish otherShipRunning before a concurrent manual or build-started ship takes another ticket's record. That other ship never checks for the queue ship because alone is false, so both enter shipTicket. The claim that at least one sees the other requires both participants to check. The new test covers only an already registered competing ship.",
        "suggested_fix": "Use shared atomic coordination that every ship entry point honours, preserving builds' existing responsibility for shipping. Add a concurrent-start regression covering the ordering where the queue ship checks first and the manual or build-started ship registers second.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/ship-queue.mjs:81",
        "issue": "The hold now records the base commit when the ship ends, preventing commits made during shipping from immediately lifting it.",
        "suggested_fix": "No further change required; the new AC3 regression covers the reported case.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The failing-base hold is fixed, and all tests pass. Concurrent shipping still needs fixing: a manual or build-started ship can bypass the queue ship's check and run alongside it."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "5f3b2578c22ea8e9609dd8287ea33cfe6a0ec5c1",
    "thread_id": "01a13efa-e744-7920-8d8e-aa419c4b2462",
    "seconds": 28,
    "usage": {
      "input_tokens": 439078,
      "cached_input_tokens": 368512,
      "cache_write_input_tokens": 0,
      "output_tokens": 3275,
      "reasoning_output_tokens": 437
    },
    "saved_at": "2026-10-15T10:07:36.219Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "shipOrder selects eligible approved tickets, fixes first and then earliest approval. Every cmdShip now takes the atomic shared takeShipLock before entering shipTicket. Passing AC1 tests cover waiting, queue refusal, stale-lock recovery, ordering and actual shipping."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "shipQueue.check compares remembered base and ticket branch hashes and reports refusals once. Passing AC2 tests cover unchanged checks, commits on either branch and earlier failed attempts. Exit 15 restores the previous retry state."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "shipQueue.ended captures the base hash on exit 14 and check blocks shipping until it changes. Both passing AC3 tests cover the hold, including commits made during shipping, and subsequent release."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "shipOrder uses approved status and statusData's shared auto-ship eligibility decision. Passing AC4 tests cover excluded risks, disabled auto-ship and other statuses. The integration test confirms a detached ship completes after speck run stops."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "/tmp/speck-0193-tests.txt confirms 1741 tests: 1738 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/ship.mjs",
        "issue": "Resolved: all ship entry points now acquire the same atomic repository-wide lock before shipping, preventing the concurrent-start overlap.",
        "suggested_fix": "No further change required. Tests cover competing ships waiting or refusing, lock release and stale-lock recovery.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/ship-queue.mjs",
        "issue": "Resolved: the failing-base hold records the base commit when shipping ends, so commits made during shipping do not immediately lift it.",
        "suggested_fix": "No further change required; the AC3 regression covers this case.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Approved. Eligible tickets ship in order, unchanged failures are not repeatedly retried, and a failing base pauses shipping. Both earlier issues are fixed, and the full test suite passes."
  }
}
```

</details>
