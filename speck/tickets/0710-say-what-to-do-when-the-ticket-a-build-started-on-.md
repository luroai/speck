---
id: "0710"
title: "Say what to do when the ticket a build started on is cancelled"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-15-say-what-to-do-when-a-ticket-s-base-ticket-is-cancelled.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0709"]                # ticket ids that must be done first
created: 2026-11-24
built_on: "0709"
started: "2026-11-24T12:56:04.886Z"
approved: "2026-11-24T13:47:56.285Z"

---
# 0710 · Say what to do when the ticket a build started on is cancelled

**Status:** 👍 approved

## Problem
When a ticket was started on another ticket's approved work and that ticket is then cancelled, `speck ship` tells you to ship the cancelled ticket first, which can never happen. The ticket is stuck, with no way out but editing `built_on:` by hand.

## Outcome
speck says the base ticket was cancelled and names a way on that works.

## Acceptance criteria
1. When a ticket's `built_on:` ticket is cancelled, `speck ship <id>` refuses, saying the ticket it was built on was cancelled, and never tells you to ship the cancelled ticket.
2. The refusal names two ways on, each with the command that does it: rebuild the ticket from the base branch, or keep the cancelled ticket's work in this ticket and have all of it reviewed as this ticket's. Following either leaves the ticket able to be built or reviewed again without editing the ticket file by hand.
3. Auto-ship and speck run's ship queue say the same rather than that the ticket waits for its base ticket to ship, and the panel doesn't show it as shipping after the cancelled ticket.
4. A ticket whose `built_on:` ticket is done or still approved is handled as today.
5. No test that passed before this change fails.

## Out of scope
- Changing `after:` handling of cancelled tickets (0686).

## Notes
- `builtOnWaiting` (`scripts/built-on.mjs`) only checks `status === 'done'`, so a cancelled base reads as waiting; `builtOnCheck`, `autoShipWhyNot` (`scripts/ship.mjs`) and `scripts/ship-queue.mjs` give the "ship it first" wording.
- Refuse and name the ways out, as `after:` does for a cancelled ticket (`goneWhy`), rather than blocking with a question: an approved ticket has no build running to ask.
- Reviews measure only the ticket's own change from the base ticket (`ownBase`), so keeping the cancelled work means reviewing it again as part of this ticket.
- Failing before this build: not checked
- Self-check: `--rebuild` now marks the ticket's run record as committed since its build ended still ready, so a speck run that launched it before launches it again; `--rebuild` refuses in the main checkout before the "you're in its worktree" check; `--keep` adds a Review log heading when a ticket has none.
- Pictures: none, because nothing anyone sees changes in how the panel looks: it already shows the auto-ship reason, which now names the ways on.
- Waits for the ticket that keeps a ticket waiting on its base ticket out of Needs you: both change `built-on.mjs` and `ship.mjs`.

## In plain words
A ticket can start on top of another ticket's approved work. If that other ticket is then cancelled, speck used to tell you to ship the cancelled one first, which could never happen, so the ticket was stuck. Now speck says the ticket it was built on was cancelled and gives two ways on: start it again from scratch, or keep the cancelled ticket's work in it and have the reviewer look at all of it. Shipping, auto-ship, the status list and the panel all say the same, and the panel no longer shows it as waiting to ship after the cancelled ticket.

To see it, cancel a ticket that another was started on, then try to ship the second one: the message names both commands. Worth keeping an eye on: starting again deletes the ticket's old work, though the message prints where it was so it can be brought back.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 rebuild only calls markStillReady when the base ticket's text changes.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 390,370
- Elapsed since build started: 52 min
- Changed lines: 212 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Known limit: `speck built-on --rebuild` deletes the ticket's branch; its message prints the commit and the `git branch` command that brings it back.
- Known limit: `--keep` on an approved ticket that speck run didn't build (no resumable run record) can't be handed back by itself; the message says to run `/speck-build <id>`.
- Note: `speck test --related` chose 575 files, as `docs/brief.md` and `scripts/speck.mjs` are named by most tests; 7 browser and timing tests failed under that load and passed on their own.
- Follow-ups to the inbox: none.

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
    "reviewed_sha": "4bbec58eec0bbfafb27f445f6459cd2ed72323c7",
    "session": "fresh",
    "thread_id": "01a20dcc-949c-7492-aae0-c13eea3d2133",
    "builder_response": "- Tests run: `speck test --related test/built-on-0710.test.mjs` (575 files). 7 failed under load: house-rules-full-0657 (300 s timeout) and browser timing tests panel-0154/0159/0160/0182/0481, none touching changed code. Re-run as the run's last line said: test/built-on-0710.test.mjs test/house-rules-full-0657.test.mjs test/panel-0154.test.mjs test/panel-0159.test.mjs test/panel-0160.test.mjs test/panel-0182.test.mjs test/panel-0481.test.mjs, all passing (output attached).\n- Design: `builtOnWaiting` now reports `cancelled` (base branch, or committed so on that ticket's own branch, as 0686's build cancels). `speck ship`, `--auto`, `speck status` (text and `built_on_cancelled` in JSON, with `ships_after` null so the panel doesn't show \"ships after\") and the ship queue give one message naming `speck built-on <id> --rebuild` and `--keep`.\n- New command `speck built-on` (scripts/built-on-cancelled.mjs). --rebuild: drops branch and worktree, sets the ticket ready on the base branch without the cancelled id in after: (so 0686's after: refusal doesn't stop `speck start`), and marks its run record so a running speck run launches it again. --keep: clears built_on: and the after: entry on the branch, and for an approved ticket adds a changes-asked line so `speck next` says review and nothing ships it; reviewSince then gives the whole change against the base branch, as the ticket at the last reviewed commit had built_on: and now doesn't.\n",
    "seconds": 40,
    "usage": {
      "input_tokens": 222001,
      "cached_input_tokens": 171264,
      "cache_write_input_tokens": 0,
      "output_tokens": 1088,
      "reasoning_output_tokens": 336
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 50737,
      "cached": 171264,
      "write": 0,
      "output": 1088
    },
    "cost_usd": 0.1294804,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T13:44:40.008Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "builtOnCheck in scripts/built-on.mjs refuses cancelled bases with both recovery commands. The AC1 test passes for cancellation on either branch."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing --rebuild and --keep tests exercise restarting from the base branch, reviewing the whole retained change, and preventing shipment before another approval."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 tests cover auto-ship, status data, the ship queue and panel. Cancelled bases produce ships_after: null and the recovery explanation."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing AC4 test verifies the existing approved-base refusal and successful shipment after the base is done."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded rerun in /tmp/speck-0710-tests.txt reports 204 passes, zero failures and three skips. No existing tests were weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/built-on-cancelled.mjs",
        "issue": "rebuild only calls markStillReady when the base ticket's text changes. If its after: entry was already removed on the base branch, the base copy can already be ready with exactly the resulting text. The command then deletes the branch and worktree without marking the previous run record, so speck run continues treating this ticket as already launched and never rebuilds it. This is a supported situation: built_on still applies when after: no longer lists the base ticket.",
        "suggested_fix": "Ensure a successful rebuild records a new restart signal even when the base ticket already has the desired fields, for example by committing a recovery note and updating the run record. Add a test that removes the dependency from the base copy before recovery and verifies readyAgain becomes true.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The cancellation messages and both recovery paths work in the tested cases, including requiring review of retained work. One restart edge case remains: if the dependency was already removed, rebuilding can delete the old worktree while leaving speck run unable to launch the replacement build."
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
    "reviewed_sha": "caef8a40b585a43ab1ae906a7781534820de719f",
    "session": "continued",
    "thread_id": "01a20dcc-949c-7492-aae0-c13eea3d2133",
    "builder_response": "- Tests run: test/built-on-0710.test.mjs (with commands.checks).\n- F1: fixed. `rebuild` (scripts/built-on-cancelled.mjs) now always adds a dated line to the ticket's Notes on the base branch (\"Rebuilt from <base> … as ticket <id>, which its build started on, was cancelled\"), so there is always a commit, and then always marks the run record with the commit before it (markStillReady), so readyAgain is true. New test `0710 AC2 F1` removes the after: entry on the base branch first, then checks the commit, the Notes line and readyAgain. The brief says it adds that line.\n",
    "seconds": 20,
    "usage": {
      "input_tokens": 388680,
      "cached_input_tokens": 315520,
      "cache_write_input_tokens": 0,
      "output_tokens": 1690,
      "reasoning_output_tokens": 336
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 22423,
      "cached": 144256,
      "write": 0,
      "output": 602
    },
    "cost_usd": 0.0652916,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T13:47:44.223Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/built-on.mjs: builtOnCheck refuses cancelled bases with the cancellation explanation and recovery commands. Passing AC1 tests cover cancellation on the base branch and the cancelled ticket's branch."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/built-on-cancelled.mjs implements both recovery commands; reviewSince in scripts/review.mjs includes the whole retained change. Passing AC2 tests verify restarting, mandatory re-review and subsequent shipment. The new F1 regression test verifies readyAgain when after: was already cleared."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "autoShipWhyNot, statusData and shipQueue use the cancellation reason. Passing AC3 tests verify both recovery commands, no queue launch, ships_after: null and no panel indication of shipping after the cancelled ticket."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing AC4 test verifies the existing refusal for an approved base, then successful shipment after that base is done."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The latest /tmp/speck-0710-tests.txt reports 152 passes, zero failures and three skips, including all nine ticket tests and configured checks. Earlier related-test failures passed on rerun; existing tests were not weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/built-on-cancelled.mjs",
        "issue": "Rebuild previously omitted the restart signal when the base ticket already had the desired fields. This is fixed: rebuild always appends a Notes entry, commits it and marks the preceding commit in the run record. The passing AC2 F1 regression test covers the original failure.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Approved. Cancelled base tickets now produce useful recovery instructions. Users can rebuild from the base branch or retain the work for a full review. The restart edge case is fixed and covered by a passing regression test."
  }
}
```

</details>
