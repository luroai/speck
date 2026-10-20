---
id: "0338"
title: "Keep a handed-back ticket out of red while speck run is handling it"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-20
started: "2026-10-20T12:54:58.974Z"
approved: "2026-10-20T13:01:12.718Z"

---
# 0338 · Keep a handed-back ticket out of red while speck run is handling it

**Status:** 👍 approved

## Problem
When an auto-ship fails, the ticket's row in the Build list turns red and says "Ship it from its review pack", even when speck run has already handed it back to its build and will ship it again by itself. On 2026-10-20, 0335 sat red, asking the user to act, through two failed ships while its build looked into them and a fix ticket (0337) mended main, then shipped with nobody's help. Red should mean the user is needed.

## Outcome
A ticket whose auto-ship failed is red only when nothing in speck run will carry it on, and otherwise shows that speck run is handling it.

## Acceptance criteria
1. An approved ticket whose last auto-ship didn't finish, and whose build speck run has resumed and is still running, isn't red, shows no Ship hint, and says it was handed back to its build, which is working on it.
2. Once that build has ended with the ticket still approved, while speck run is on and at least one other ticket is ready, building, reviewing or approved, the ticket isn't red, shows no Ship hint, and says it will be shipped again when main or its branch has a new commit.
3. It's red, with the Ship hint as today, when speck run is off, when no other ticket is ready, building, reviewing or approved, or when the ticket is blocked.
4. In every case above, the failed ship's own message is still shown on the ticket.
5. No test that passed before this change fails.

## Out of scope
- Why the ships failed (a test that fails by chance under load: `speck/ideas/2026-10-17-leave-chance-failures-out-of-a-hand-back.md`).
- The Foreman's detail and `speck status`, which already say "waiting to ship: its build is still running".

## Notes
- The row's state is worked out in `templates/panel.html` (around `auto_failed`, `exit_label`, `red` and `ship_hint`, line 868 on). `build_running` is on every ticket in `speck status --json` (`scripts/speck.mjs`), and `runOn` says whether speck run is on. speck run records a hand-back as `handed_back` and `hand_backs` in the ticket's run record (`scripts/hand-back.mjs`).
- AC2's rule, another ticket ready or in flight, stands for "a new commit on main is on its way": when one ships, speck run's queue tries this ticket again. With none, nothing will change, so the user is needed.
- Test it with the fake page from `fakePage()` in `test/support/panel.mjs`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes (the run-record reader went into `scripts/hand-back.mjs` rather than `scripts/speck.mjs`, which the 600-line check caps)

## In plain words
When an automatic ship fails and speck run has already handed the ticket back to its build, the ticket's row in the Build list no longer turns red or tells you to ship it yourself. It says its build is working on it. Once that build has finished, the row says the ticket will be shipped again when main or its branch gets a new commit. The row only says that while speck run is on and another ticket is still on its way. In every case the failed ship's own message stays on the row. The row is red, with the hint to ship it yourself, only when speck run is off or nothing else is coming. A ticket that gets blocked after a failed ship is red as before, asks its question and now keeps showing the ship's message too. Worth watching: if two approved tickets both fail to ship, each counts the other as on its way, so neither turns red (saved as an idea).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 carried_by ignores runOn while build_running is true, so turning speck run off leaves the ticket non-red with no Ship hint, contrary to AC3.; F2 auto_failed only recognises approved tickets.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 350,402
- Elapsed since build started: 6 min
- Changed lines: 41 (limit 5000)
- Follow-ups:
  - Count only tickets that can ship as on their way: two approved tickets whose auto-ships both failed keep each other out of red (`speck/ideas/2026-10-20-count-only-tickets-that-can-ship-as-on-their-way.md`).
  - Known limit: a hand-back that speck run has kept but not yet started, because no build slot is free, still shows red with the Ship hint until its build starts.
  - Known limit: the row says "main" whatever `base_branch` is, as the panel's "broken main" tag already does.

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
    "reviewed_sha": "9e1cd597da2fbee46dcf2e292c82106f1a733eaf",
    "thread_id": "01a15964-7b4f-7da2-9f6e-f64c89f2e06e",
    "seconds": 50,
    "usage": {
      "input_tokens": 130364,
      "cached_input_tokens": 93184,
      "cache_write_input_tokens": 0,
      "output_tokens": 1171,
      "reasoning_output_tokens": 123
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T12:59:29.533Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panelModel and queueItem implement the running-build state; the passing 0338 AC1 fake-page test checks colour, hint and explanation."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing 0338 AC2 test exercises each other-ticket status: ready, building, reviewing and approved."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "Direct panelModel reproduction shows an approved running build remains non-red without a Ship hint when run.on=false. A blocked ticket is red but also has no Ship hint."
      },
      {
        "id": 4,
        "status": "fail",
        "evidence": "Direct panelModel reproduction with a blocked ticket and a failed auto-ship message returns exit_message=null and exit_label=null. The AC4 test omits blocked tickets."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The saved test output confirms 145 passed, zero failed and three skipped across the reported tests and checks. No existing tests were changed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "carried_by ignores runOn while build_running is true, so turning speck run off leaves the ticket non-red with no Ship hint, contrary to AC3. The AC1 test explicitly asserts this conflicting behaviour.",
        "suggested_fix": "Require speck run to be on before suppressing red and the Ship hint. Update the running-build/run-off test to verify AC3.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "auto_failed only recognises approved tickets. Once a handed-back ticket becomes blocked, its failed ship message and Ship hint disappear, violating AC3 and AC4. The blocked tests check only red and carried_by.",
        "suggested_fix": "Retain the failed ship message and required Ship hint for blocked tickets, while keeping them red. Extend the fake-page tests to verify both are actually displayed for blocked tickets with running and ended builds.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The two automatic recovery states work and the reported tests pass. Two required fallback cases need fixing: switching speck run off can still hide the need for user action, and blocked tickets lose the failed ship explanation and Ship hint."
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
    "reviewed_sha": "70629be0a9e9eb408111a90bf433824a59ccc121",
    "thread_id": "01a15964-7b4f-7da2-9f6e-f64c89f2e06e",
    "seconds": 23,
    "usage": {
      "input_tokens": 216953,
      "cached_input_tokens": 134656,
      "cache_write_input_tokens": 0,
      "output_tokens": 1914,
      "reasoning_output_tokens": 123
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-20T13:00:53.135Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panelModel sets carried_by for a running handed-back build while speck run is on. The passing AC1 fake-page test verifies no red, no Ship hint and the working explanation."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing AC2 fake-page test checks the retry explanation, absence of red and absence of the Ship hint for all four qualifying other-ticket statuses."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "carried_by now requires runOn. AC3 tests cover run off with running and ended builds, no qualifying other tickets, and blocked tickets. Accepted the blocked-hint dispute: 'as today' preserves the existing question prompt; shipChecks refuses blocked tickets and queueItem provides no review-pack button for them."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panelModel now retains the ship message through blocked_failed. The passing AC4 fake-page test verifies the message in both recovery states, run-off cases, no-other-ticket cases and blocked cases with running and ended builds."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The fresh saved test output reports 145 passed, zero failed and three skipped across the reported test files and checks. Existing tests were not weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "The running-build recovery state previously hid the need for user action when speck run was off.",
        "suggested_fix": "Implemented: require runOn for carried_by, with running-build/run-off coverage.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "Blocked tickets previously lost the failed ship message. The message is now retained. Accepted the dispute over adding a Ship hint: blocked tickets cannot ship, and retaining their existing question prompt fits 'as today'.",
        "suggested_fix": "The message fix and expanded blocked-state tests address the actionable defect; no Ship hint change is required.",
        "state": "dispute_accepted"
      }
    ],
    "escalation_question": "",
    "summary": "The recovery states now show when speck run is handling a failed ship, while cases needing user action remain red. Blocked tickets retain the failure explanation and their existing question prompt. All reported tests pass."
  }
}
```

</details>
