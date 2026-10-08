---
id: "0009"
title: "Record which tickets an idea became"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | done
priority: 3              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-08
started: "2026-10-08T20:58:38.894Z"
finished: "2026-10-08T21:05:11.865Z"

---
# 0009 · Record which tickets an idea became

**Status:** ✅ done

## Problem
Idea notes have a `Status:` line, but nothing updates it when tickets are made from the idea. You can't tell from `speck/ideas/` which ideas are still waiting and which have already been ticketed, so the same idea can be ticketed twice.

## Outcome
Every idea note says which tickets were made from it, and `speck status` tells waiting ideas apart from ticketed ones.

## Acceptance criteria
1. `speck new "<title>" --source=speck/ideas/<file>.md` changes the idea's `Status:` value to `ticketed (<id>)`, for example `Captured: 2026-10-08 · Status: ticketed (0011)`. The rest of the note is unchanged.
2. A second ticket from the same idea adds its id to the list, for example `ticketed (0011, 0012)`. An id that's already listed isn't added again.
3. If the source file doesn't exist, `speck new` refuses and creates no ticket. If the file exists but has no `Status:` line, the ticket is still created and speck prints a warning that the idea's status couldn't be updated.
4. `speck status` shows ideas as waiting or ticketed, for example `IDEAS (3: 2 waiting, 1 ticketed) in speck/ideas/`. An idea counts as ticketed when its `Status:` value starts with `ticketed`.

## Out of scope
- Changing an idea's status when its tickets are cancelled or done.
- Finding overlaps between ideas and tickets (0010).
- Moving ticketed ideas into a separate folder.

## Notes
- Idea notes already use the `Captured: <date> · Status: <value>` line written by `/speck-capture`. `speck/ideas/2026-10-08-ship-locally-without-a-pr.md` was set to `ticketed (0006)` by hand, and this matches that format.
- `/speck-ticket` already passes `--source`, so the skill needs no change beyond mentioning that the idea is updated.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approved, with no findings. It checked the tests against the code but couldn't re-run the suite in its read-only environment.

## Delivery log
- Review rounds: 1 (codex, `gpt-6.1-sol`), with 121,310 reviewer tokens.
- Elapsed: about 3 minutes from start to approval (from `speck pack`).
- Changed lines: 30 (excluding tests and `speck/`), against a limit of 1,000.
- Follow-up ideas:
  - The idea's status only grows. If all of an idea's tickets are cancelled, it still reads `ticketed`, so it drops out of the waiting count. This was out of scope here and is listed under Known limits.
  - `--source` is resolved from the repo root, not the current folder. That's fine for the skills, which always pass `speck/ideas/…`, but could surprise someone typing a relative path from a subfolder.

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
    "reviewed_sha": "6b7e4126875626921171ef40b1a963c8258567e3",
    "thread_id": "01a11d52-508e-7d10-bdb0-8c6c777f8b72",
    "seconds": 29,
    "usage": {
      "input_tokens": 120563,
      "cached_input_tokens": 74240,
      "cache_write_input_tokens": 0,
      "output_tokens": 747,
      "reasoning_output_tokens": 69
    },
    "saved_at": "2026-10-08T21:02:05.247Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs cmdNew replaces only the matched status value. The 0009 AC1 integration test asserts the complete note remains otherwise unchanged, including CRLF line endings; builder output reports it passing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "ticketedStatus appends ids only when absent. The 0009 AC2 integration test exercises successive CLI calls and an already-listed id; builder output reports it passing."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdNew checks source existence before writing a ticket and warns when no status line matches. The 0009 AC3 integration test verifies refusal creates no ticket and a missing status produces a warning while preserving the note; builder output reports it passing."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "cmdStatus counts notes using ideaStatus(...).startsWith('ticketed'). The 0009 AC4 integration test checks the waiting/ticketed totals, including a note without a status; builder output reports it passing."
      }
    ],
    "findings": [],
    "product_md": {
      "accurate": true,
      "note": "Accurately describes source validation, status updates, idea counts and the additive-only limitation."
    },
    "escalation_question": "",
    "summary": "Ideas now record the tickets created from them, and status shows waiting and ticketed counts. The tests exercise the actual CLI behaviour and cover all four criteria. No blocking issues found. Integration results were verified against the test code and supplied output; the full suite was not rerun in the read-only environment."
  }
}
```

</details>
