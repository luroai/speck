---
id: "0675"
title: "Start a waiting ticket once what it waits for is approved"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 4              # 1 (highest) to 5, or 0 on a fix ticket
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0674"]                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T15:15:19.904Z"

---
# 0675 · Start a waiting ticket once what it waits for is approved

**Status:** 🔍 reviewing

## Problem
Once `speck start` can build on an approved ticket (0674), `speck run` still skips a ready ticket until everything in its `after:` list has shipped, so the early start only happens by hand.

## Outcome
`speck run` starts a waiting ticket as soon as the one ticket it still waits for is approved, and ships the two in order.

## Acceptance criteria
1. `speck run` starts a ready ticket whose `after:` tickets are all done except one that's approved, as `speck start` allows. It still skips one whose `after:` ticket is in any other state, or with more than one not done.
2. With auto-ship on, `speck run` ships a ticket that was approved before the ticket it was built on shipped, on its first check after that ticket is done.
3. Until then, `speck status --json` still names that ticket in its `waiting_on`, and `speck run` says once that the ticket is approved and waits to ship after it.
4. The brief's `speck run` row says a ticket is skipped until its `after:` tickets have shipped, or all but one have and that one is approved.
5. No test that passed before this change fails.

## Out of scope
- The panel's wording for a ticket built on another.
- Starting on a ticket that's still building or reviewing.

## Notes
- `ownWait` in `scripts/run.mjs` holds back a ticket with anything in `waiting_on`, which `statusData` in `scripts/speck.mjs` works out.
- 0193 already has `speck run` ship approved tickets whose auto-ship didn't finish. This follows it.
- Failing before this build: none
- AC4 is about how the brief reads, so no test checks its wording: read the `speck run` row (and the workflow diagram's speck run line) in `docs/brief.md`.
- Self-check: no changes. Checked: a ready ticket whose one approved after: ticket's branch doesn't have it approved committed gets no starts_on (startWaits decides, as speck start does); odd waiting_on values read as nothing to wait for; the line about waiting to ship is said once per ticket per speck run.

## In plain words
When a ticket waits on another one that's approved but not yet shipped, `speck run` now starts building it straight away, on top of the approved work, instead of leaving it until the ship. The two still ship in order: the waiting one ships on speck run's first check after the other has shipped, and speck run says once, in its output, that it's approved and waiting to ship after the other.

To see it, have speck run going, approve a ticket and leave it unshipped, and set ready a ticket that lists it under after:. speck run starts the second one. The panel still shows it as waiting for the first: changing that is a separate idea in the inbox.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - The panel still says a ready ticket that can start on approved work is waiting: inbox `speck/ideas/2026-11-15-say-in-the-panel-when-a-waiting-ticket-can-start.md`.

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
    "reviewed_sha": "c8afe6e3f91800249b840c0e5923e68757d9b07d",
    "session": "fresh",
    "thread_id": "01a1dfd5-79ee-78f3-9b9c-a89ca6794d03",
    "builder_response": "- Tests run: `speck test --related test/run-after-0675.test.mjs` (2756 passed, 0 failed; attached).\n- AC1: `speck status --json` gives each ready ticket with exactly one after: ticket not done a `starts_on`: the id `startWaits` (speck start's own check, scripts/built-on.mjs) returns as `on`, or null. speck run's `ownWait` now holds a ticket back for its after: list through `afterWait`, which returns null when `starts_on` is set, so the build launches and its `speck start` starts on that approved work. Any other state, or two or more not done, gives no `starts_on`, so it waits as before.\n- AC2: nothing new was needed in the ship queue for this: auto_ship is false (0674's built-on reason) until the ticket it was built on is done on the base branch, then true, so `shipOrder` takes it on the next check. The test ships 0002 for real, then checks the queue launches 0001 on its next check and that `speck ship 0001 --auto` lands it.\n- AC3: `waiting_on` is unchanged. A new `ships_after` field gives the built-on ticket's id while it hasn't shipped (the same `builtOnWaiting` value `autoShipWhyNot` already used, now computed once). The ship queue's check says once per ticket per speck run: \"<id> is approved and waits to ship after <other>, which it was built on and which hasn't shipped yet.\"\n- AC4: the brief's `speck run` row, and the workflow diagram's speck run line, now name the exception. No test checks that wording.\n- scripts/run.mjs is at the 600-line limit, so the new import shares a line with an existing one.\n",
    "seconds": 32,
    "usage": {
      "input_tokens": 175122,
      "cached_input_tokens": 124160,
      "cache_write_input_tokens": 0,
      "output_tokens": 810,
      "reasoning_output_tokens": 91
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 50962,
      "cached": 124160,
      "write": 0,
      "output": 810
    },
    "cost_usd": 0.12244,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T15:31:43.931Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "statusData in scripts/speck.mjs uses startWaits to identify the approved dependency; ownWait in scripts/run.mjs uses afterWait to allow the build. Passing AC1 tests cover an approved dependency, building/reviewing/blocked dependencies, and multiple unfinished dependencies."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The passing AC2 test in test/run-after-0675.test.mjs ships the prerequisite, verifies shipQueue launches the dependent on its next check, then ships the dependent successfully."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "statusData preserves waiting_on and exposes ships_after. shipQueue.check reports the wait once per ticket. Passing AC3 tests verify the retained dependency, single message, shipping hold and cleared wait after shipping."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Reviewed docs/brief.md: both the workflow diagram and speck run command row describe starting when all dependencies have shipped except one that is approved."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0675-tests.txt: 2756 passed, zero failed, three skipped. The changes and reported tests show no regression."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Waiting tickets can now start on an approved prerequisite's work while shipping remains in dependency order. The pipeline explains the shipping wait once. The tests support the requested behaviour, and no blocking issues were found."
  }
}
```

</details>
