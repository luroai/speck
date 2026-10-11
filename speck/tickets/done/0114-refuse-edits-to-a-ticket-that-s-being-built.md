---
id: "0114"
title: "Refuse edits to a ticket that's being built"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-11-one-build-at-a-time.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-11T10:42:56.503Z"
finished: "2026-10-11T10:49:21.820Z"

---
# 0114 · Refuse edits to a ticket that's being built

**Status:** ✅ done

## Problem
With one build at a time, the user keeps editing tickets on the base branch while a build runs. If they change the ticket being built, its file differs on both sides and the ship's merge conflicts, stopping a build that had nothing wrong with it.

## Outcome
speck refuses to change a ticket from the base branch's checkout while it's being built, and the ticket skill tells the agent not to edit one.

## Acceptance criteria
1. `speck set <id> <field> <value>`, run in a checkout other than the one where the ticket's branch is checked out, refuses when the ticket's branch is checked out in a worktree and its status there is `building`, `reviewing`, `blocked` or `approved`. It says the ticket is being built in that folder, to wait until it ships or to change it there, and changes nothing.
2. `speck set` run in the ticket's own worktree works as it does today, so builds can still set their own status.
3. `speck cancel <id>` refuses in the same case, with the same kind of message.
4. The `speck-ticket` skill says never to edit a ticket that's being built (any status from `building` to `approved`), and to put changes in a new ticket or wait until it ships.
5. A ticket whose branch isn't checked out anywhere can be changed as it is today.

## Out of scope
- Stopping someone editing a ticket's file by hand.
- Shipping around staged changes (0115).

## Notes
- The panel's writes only touch drafts, so they don't need changing.
- Failing before this build: none
- Self-check: `speck set` in a folder that isn't a git checkout no longer fails on the worktree lookup; ids are compared padded; moved `ticketsElsewhere` to core.mjs to keep speck.mjs under 600 lines.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 322,501
- Elapsed since build started: 5 min
- Changed lines: 38 (limit 5000)
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
    "reviewed_sha": "0551186270ee85aeb0a678df2882424884b47387",
    "thread_id": "01a12a93-734e-7213-b5ac-7ce9817bfe2c",
    "seconds": 28,
    "usage": {
      "input_tokens": 321784,
      "cached_input_tokens": 205696,
      "cache_write_input_tokens": 0,
      "output_tokens": 717,
      "reasoning_output_tokens": 54
    },
    "saved_at": "2026-10-11T10:48:16.827Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/core.mjs: checkNotBeingBuilt reads statuses from other worktrees; scripts/speck.mjs: cmdSet calls it before writes. test/set-0114.test.mjs AC1 tests cover all four statuses, the folder and guidance message, and unchanged checkout contents; supplied results pass."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/core.mjs: ticketsElsewhere excludes the current checkout using canonical paths. AC2 tests exercise status and priority changes from the ticket's own worktree and a subfolder; supplied results pass."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/speck.mjs: cmdCancel calls the same guard before writing or moving the ticket. AC3 tests cover all four protected statuses and verify refusal leaves the checkout unchanged; supplied results pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "skills/speck-ticket/SKILL.md Rules explicitly prohibit editing tickets in all four statuses and direct changes to a new ticket or waiting until shipment. The AC4 documentation test checks this wording and passes in supplied results."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "AC5 tests exercise tickets with no branch, an existing branch removed from its worktree, unrelated tickets, and a folder outside Git. The implementation only guards matching tickets checked out elsewhere; supplied results pass."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change prevents edits and cancellations from another checkout while a ticket is being built, while allowing the build to update its own ticket. Tests exercise real worktrees and verify refused commands change nothing. No blocking issues or unrelated changes found. I inspected the code and tests; I did not rerun tests because they create files and this review is read-only."
  }
}
```

</details>
