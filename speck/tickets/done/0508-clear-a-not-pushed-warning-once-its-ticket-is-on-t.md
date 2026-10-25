---
id: "0508"
title: "Clear a not-pushed warning once its ticket is on the remote"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T22:05:42.084Z"
approved: "2026-10-25T22:08:49.522Z"
finished: "2026-10-25T22:12:51.304Z"

---
# 0508 · Clear a not-pushed warning once its ticket is on the remote

**Status:** ✅ done

## Problem
A ship that merged but couldn't push leaves a record naming the commit it merged, and the panel shows that ticket at the top of Shipped as "Merged, but not pushed" until that commit is on the remote's copy of the base branch (0204). If the commit stops existing, because the history was rewritten or the remote squashed it, the warning comes back for good, though the ticket is on the remote. On 2026-10-25 a history rewrite brought back eight warnings from 22 October, for tickets that had been pushed long before.

## Outcome
A not-pushed warning clears once its ticket is on the remote as done, whatever happened to the commit it recorded.

## Acceptance criteria
1. A ticket's not-pushed warning doesn't show, in the panel or in what `speck ship` and `speck run` read of the ship, when the remote's copy of the base branch, as git last fetched it, has that ticket's file in `speck/tickets/done/` with `status: done`, even when the commit its record names no longer exists in the repo or isn't on that branch.
2. When the remote's base branch has neither the recorded commit nor the ticket as done, the warning shows as it does today, including when the recorded commit no longer exists. With no copy of the remote's base branch, it shows as today.
3. A record whose commit has reached the remote clears as it does today. No test that passed before this change fails.

## Out of scope
- Deleting old ship records from `speck/.cache/runs/`.
- Pull request ships' records (`scripts/pr-ship.mjs`) beyond what they share with local ships.

## Notes
- Asked for by the user on 2026-10-25, after the eight warnings for 0262 and 0361 to 0367 reappeared once the history rewrite gave their commits new ids. Their stale records were moved out of `speck/.cache/runs/` by hand that day.
- Today: `shipState` and `notPushed` in `scripts/ship.mjs` (0204), which check `git merge-base --is-ancestor <sha> refs/remotes/<remote>/<base>`.
- Failing before this build: none
- Self-check: no changes. `ls-tree` lists only the current folder's part of a tree unless given `--full-tree`, found while making the tests pass; the check moved to `scripts/not-pushed.mjs` to keep `scripts/ship.mjs` under 600 lines.
- Pictures: none, because nothing changes how the panel looks: a warning that should have cleared now clears.

## In plain words
When a ship merged a ticket but couldn't push it, the panel warns "Merged, but not pushed" at the top of Shipped. That warning now also goes away once the remote has the ticket marked as done, so rewriting the history or squashing on the remote no longer brings old warnings back for tickets that were pushed long ago.

To see it: a ticket whose warning came back after a history rewrite drops out of the warning once git has fetched the remote. A ship that really hasn't reached the remote still warns as before.

Worth knowing: speck goes by the remote as git last fetched it, so the warning clears only after a fetch or push.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 166,393
- Elapsed since build started: 3 min
- Changed lines: 42 (limit 5000)
Follow-ups: none.

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
    "reviewed_sha": "e9ed15b7eb6b3d35128728da0924c31324c503e9",
    "session": "fresh",
    "thread_id": "01a1751b-7bb1-70f2-9871-57778099f14e",
    "builder_response": "- Tests run: test/ship-0508.test.mjs, with --related: test/kind-0492.test.mjs test/pr-done-0315.test.mjs test/repo-copy-0230.test.mjs test/ship-0204.test.mjs test/ship-0355.test.mjs, and the commands.checks files.\n- The not-pushed check moved from scripts/ship.mjs to scripts/not-pushed.mjs, unchanged apart from the new done-ticket check, to keep ship.mjs under 600 lines (0078).\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 165733,
      "cached_input_tokens": 126976,
      "cache_write_input_tokens": 0,
      "output_tokens": 660,
      "reasoning_output_tokens": 31
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-25T22:08:41.820Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/not-pushed.mjs checks the fetched remote branch for the matching done-ticket file with status done after the ancestry check fails. Both AC1 tests in test/ship-0508.test.mjs passed, covering missing and unpushed commits. scripts/ship.mjs shipState supplies this result to status/panel, ship and ship-queue callers."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The AC2 tests passed for absent tickets, wrong folders, other ticket numbers, non-done statuses, malformed files, missing commits and missing remote refs. notPushed retains the warning when neither remote condition holds."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The AC3 test passed for a recorded commit already on the remote branch. The existing ancestry check remains intact. Verified test output reports 164 passed, 0 failed and 3 skipped across 167 tests, including the existing 0204 coverage."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The warning now clears when the fetched remote branch contains the ticket as done, even after its original commit disappears. It still shows when the ship has not reached the remote. The tests cover both behaviours and passed; no blocking concerns found."
  }
}
```

</details>
