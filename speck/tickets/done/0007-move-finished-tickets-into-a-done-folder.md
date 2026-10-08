---
id: "0007"
title: "Move finished tickets into a done folder"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | done
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: ""       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0006"]                # ticket ids that must be done first
created: 2026-10-08
started: "2026-10-08T16:20:30.921Z"
finished: "2026-10-08T16:36:38.460Z"

---
# 0007 · Move finished tickets into a done folder

**Status:** ✅ done

## Problem
Finished tickets stay in `speck/tickets/` next to live work. Anyone browsing the repo or the code editor's file tree has to open each file to see what's still to do.

## Outcome
`speck/tickets/` holds only tickets still in progress, and finished ones sit in `speck/tickets/done/`. Every speck command still finds tickets wherever they are.

## Acceptance criteria
1. When a ticket's status is set to `done` (by `speck set` or `speck ship`), its file moves to `speck/tickets/done/` with the same name. Setting a done ticket to any other status moves it back to `speck/tickets/`.
2. Every command that takes a ticket id finds it in either folder, `speck status` still lists done tickets, and `speck new` never reuses a number that's in `speck/tickets/done/`.
3. Running `speck init` again moves any `done` tickets still in `speck/tickets/` into `speck/tickets/done/`, and leaves other tickets where they are.

## Out of scope
- Moving review rounds (`speck/reviews/<id>/`) or idea notes.
- Hiding done tickets from `speck status`.

## Notes
- Built after 0006 because both change how tickets reach `done`. It doesn't depend on local ship otherwise.
- Tickets refer to each other by id (`after:`), not by path, so moving files doesn't break those links.
- Update `speck/product.md` and `docs/brief.md` (the repo layout) to show the done folder.
- Build note: the tickets already `done` in this repo (0005, 0006) were moved into `speck/tickets/done/` on this branch, so the layout matches the outcome once this ships. `speck init` does the same job for anyone upgrading.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex, gpt-6.1-sol): changes_requested: F1 `speck init` could overwrite an archived ticket when the same file name was already in `speck/tickets/done/`. Round 2 (codex, gpt-6.1-sol): approved, AC1–AC3 pass and F1 resolved.

## Delivery log
- One sitting on `speck/0007-move-finished-tickets-into-a-done-folder`: tests first from the three acceptance criteria (4 new tests, 2 of them covering the round-1 finding), then the implementation.
- Review rounds: 2, both codex on `gpt-6.1-sol` (effort default). Round 1 asked for changes on F1; round 2 approved. No minor findings.
- Reviewer tokens: 179,325 (round 1: 54,757 in / 664 out, 33s; round 2: 122,762 in / 1,142 out, 24s).
- Wall time: 5 minutes from `building` to `approved`.
- Changed lines: 68 (limit 300), excluding tests, lockfiles and `speck/`. Test suite: 37 tests, all passing.
- The reviewer could not start its sandbox on this machine (the known limit in `speck/product.md`), so both rounds were judged from the diff and the test output.
- Migration on this branch: tickets 0005 and 0006 were moved into `speck/tickets/done/`, so this repo matches the new layout as soon as this ships. `speck init` does the same job for anyone upgrading.
- Follow-up ideas: the `speck-build` skill's pre-flight still spells the ticket path as `speck/tickets/<id>-*.md`, and could mention `speck/tickets/done/` for a finished ticket. Nothing else came up.

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
    "reviewed_sha": "3bad064351ec0e0ad9e680f9e144dfe56116ee50",
    "thread_id": "01a11c53-81f5-7413-8c76-7111f49891a7",
    "seconds": 33,
    "usage": {
      "input_tokens": 54757,
      "cached_input_tokens": 27136,
      "cache_write_input_tokens": 0,
      "output_tokens": 664,
      "reasoning_output_tokens": 143
    },
    "saved_at": "2026-10-08T16:23:49.627Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The supplied diff shows cmdSet and shipTicket calling placeTicket. Tests exercise moving to done, moving back, and committing the move during shipping; the supplied output reports these passing."
      },
      {
        "id": 2,
        "status": "unclear",
        "evidence": "Tests exercise archived-ticket lookup through set and lint, status listing, and number allocation. Other commands' lookup paths could not be verified: repository reads failed because the read-only sandbox could not start."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "The migration test covers ordinary moves and repeat init. However, cmdInit uses listTickets, which silently chooses the live copy when the same filename exists in both folders, then placeTicket calls renameSync over the archived destination. On Linux this overwrites the archived ticket."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Re-running init can silently destroy an archived ticket when a live done ticket has the same filename. listTickets hides the duplicate, and placeTicket overwrites the destination. The duplicate protection in findTicket is bypassed by this migration.",
        "suggested_fix": "Check for destination collisions before moving migration files and refuse with a clear error while preserving both copies. Add a regression test with different contents at the same filename in both folders, asserting neither is overwritten.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The supplied documentation accurately describes the intended ordinary behaviour and includes the done folder. Full repository verification was blocked by sandbox startup failure."
    },
    "escalation_question": "",
    "summary": "The supplied tests support the normal filing and reopening flows. However, upgrading with duplicate ticket files can silently overwrite an archived ticket; this needs fixing before merge. I could not independently inspect the repository or run checks because the sandbox failed to start."
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
    "reviewed_sha": "e00f2ef62f9d626e4ce3404bd572aae457b58751",
    "thread_id": "01a11c53-81f5-7413-8c76-7111f49891a7",
    "seconds": 24,
    "usage": {
      "input_tokens": 122762,
      "cached_input_tokens": 88192,
      "cache_write_input_tokens": 0,
      "output_tokens": 1142,
      "reasoning_output_tokens": 153
    },
    "saved_at": "2026-10-08T16:25:24.261Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs: cmdSet and shipTicket call placeTicket to relocate tickets according to status. Supplied passing tests cover setting done, reopening, preserving the filename and timestamp, and committing the move during ship."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The supplied findTicket implementation searches both folders; listTickets includes both for status and nextId. Passing integration tests exercise archived tickets through set, lint, pack and reviewer-settings, verify status still lists them, and verify new allocates the next number."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdInit migrates live-folder tickets whose status is done using placeTicket. Passing tests cover migration, repeat init, leaving draft tickets untouched, and refusing a destination collision while preserving both copies."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Init previously could overwrite an archived ticket when the same filename existed in both folders. The new destination check in placeTicket prevents that overwrite, and the regression test exercises distinct copies and verifies both survive.",
        "suggested_fix": "Implemented: destination collision guard and regression coverage.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The supplied product.md and docs/brief.md describe the done folder, reopening, migration, continued lookup and collision refusal consistently with the supplied code."
    },
    "escalation_question": "",
    "summary": "Finished tickets are filed away, reopened tickets return to the live folder, and commands continue to find archived work. The overwrite risk is fixed, with regression coverage. All 37 supplied tests pass. Approval is based on the supplied diffs and test output; independent repository access remains blocked by the sandbox startup failure."
  }
}
```

</details>
