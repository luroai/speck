---
id: "0439"
title: "Refuse a status change on a done ticket"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-24T07:32:35.385Z"

---
# 0439 · Refuse a status change on a done ticket

**Status:** 🔍 reviewing

## Problem
`speck set <id> status <value>` accepts a ticket that's already done. Setting it ready moves the shipped ticket out of `speck/tickets/done/` and back into the queue. On 2026-10-23 that reopened 0436 after it had shipped: `speck run` wouldn't build it again, and every ticket waiting on it stalled until the commit was reverted.

## Outcome
A done ticket's status can't be changed by `speck set` or the panel, so shipped work stays shipped.

## Acceptance criteria
1. `speck set <id> status <value>` on a ticket whose status is `done` refuses with a message saying the ticket is done and shipped, so its status can't change, and exits non-zero. Nothing changes: the file stays in `speck/tickets/done/` with `status: done`, and nothing is committed.
2. The panel's Set ready and Back to Plan refuse a done ticket the same way, with the same message, as they share `speck set`'s checks.
3. Status changes on tickets that aren't done work as before, and `speck ship` still sets a ticket done and files it in `speck/tickets/done/`.
4. `docs/brief.md`'s `speck set` row says it refuses to change a done ticket's status.

## Out of scope
- Changing other fields of a done ticket, such as its title or priority.
- Cancelled tickets, which `speck set` treats as today.

## Notes
- The check belongs in `checkSetTicket` in `scripts/speck.mjs`, which `speck set` and the panel (`scripts/panel.mjs`) both call. `speck ship`, PR ship and install file a ticket as done with `placeTicket` directly, so they're unaffected.
- `speck cancel` already refuses a done ticket: "delivered work is part of the record".
- Waits for nothing: no open ticket changes these files.
- Failing before this build: none
- AC4 has no test: it's a sentence in `docs/brief.md`'s `speck set` row, checked by reading it.
- Self-check: no changes. `scripts/speck.mjs` and `scripts/panel.mjs` were both at the 600-line limit, so the checks share existing lines; the panel's Set ready and Back to Plan are exported so the tests call them directly.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "219b54aa2274bfccf826893d9d82f22746eae094",
    "session": "fresh",
    "thread_id": "01a16cdc-00ed-7252-8311-be7ec0caf04d",
    "builder_response": "- Tests run: test/set-0439.test.mjs test/ship.test.mjs test/ready-0108.test.mjs test/quick-waits-0232.test.mjs test/review-wait-0384.test.mjs test/ship-0264.test.mjs (plus the commands.checks files, which speck test adds).\n- The `--related` run before this round (380 files) failed 6: three were existing tests asserting the old behaviour this ticket removes (a done ticket set back to work): `test/ship.test.mjs` AC1/AC2 and `test/ready-0108.test.mjs` \"a ticket set ready from speck/tickets/done/ is committed as moved\". I changed them to the new rule while keeping what else they cover: a ticket filed in done/ that isn't done (status edited to draft/blocked) still moves back out and is committed as moved; a done ticket's priority can still be set; set ready on a done ticket now refuses and it stays in done/.\n- `0232 AC3` and `0264 AC3` failed only under the load of the 380-file run and pass in this run.\n- `0384 AC3: the panel shows the round as running through every exit 12` fails in this run, and fails the same way with this ticket's changes stashed (on the base code), so it isn't caused by this change; it's left unchanged and listed as a follow-up.\n- `scripts/speck.mjs` and `scripts/panel.mjs` were both at exactly 600 lines (the 0078 check), so the new checks share existing lines rather than adding any. `panelSetReady` and `panelBackToPlan` are exported so the AC2 test calls them directly instead of starting a real panel.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 175213,
      "cached_input_tokens": 134656,
      "cache_write_input_tokens": 0,
      "output_tokens": 784,
      "reasoning_output_tokens": 35
    },
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-10-24T07:42:23.731Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs checkSetTicket rejects status changes before writes. Six passing AC1 tests verify the message, non-zero exit, unchanged file and unchanged commit."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelSetReady and panelBackToPlan call the shared checks for done tickets. Passing AC2 test exercises both functions and verifies identical refusals with no changes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 tests exercise ordinary status changes and actual shipping into tickets/done/. Updated ship and ready tests retain coverage of moving non-done tickets between folders. The reported 0384 failure concerns unrelated review-process behaviour."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md's speck set row explicitly says it refuses to change a done ticket's status; the passing AC4 test checks this, although its wording assertions require correction."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/set-0439.test.mjs:74",
        "issue": "The documentation test requires the specific prose words “done” and “refuses”. In particular, requiring “refuses” checks wording rather than a technical fact: an equivalent edit such as “cannot change a completed ticket's status” would fail. The review rules explicitly prohibit new tests of document wording.",
        "suggested_fix": "Remove the prose-word assertions. Verify this documentation criterion by review, or restrict automated assertions to technical facts such as the command signature.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The change prevents reopening shipped tickets through the command or panel, while ordinary status changes and shipping remain covered. One documentation test unnecessarily locks in wording and must be corrected before approval."
  }
}
```

</details>
