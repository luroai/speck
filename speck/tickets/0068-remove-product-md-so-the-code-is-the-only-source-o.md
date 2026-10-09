---
id: "0068"
title: "Remove product.md so the code is the only source of truth"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0063"]             # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T20:42:50.070Z"

---
# 0068 · Remove product.md so the code is the only source of truth

**Status:** 👍 approved

## Problem
`speck/product.md` has grown to about 400 lines that restate in prose what the code already does, and almost every ticket has to edit it. That costs each build and review round time on wording, and because every branch touches the same file, an uncommitted edit to it in the base checkout blocks ships (as it did for 0058).

## Outcome
speck no longer has a living spec. The code, the tickets and the tests are the record of what the product does, and nothing in speck creates, reads, updates or reviews `product.md`.

## Acceptance criteria
1. `speck init` in a repo with no `speck/product.md` doesn't create one, and the speck section it writes to `AGENTS.md` doesn't mention `product.md`. In a repo that already has `speck/product.md`, `speck init` leaves that file byte-for-byte unchanged. `templates/product.md` no longer exists.
2. A reviewer verdict with no `product_md` field passes verdict validation, and `templates/review-verdict.schema.json` doesn't list `product_md`. The reviewer prompt, for round 1 and for later rounds, contains no `product.md` content and asks for no `product.md` check. The review summary has no `product.md` line, and a review round stored before this change, which has a `product_md` field, still shows without an error.
3. No file in `skills/`, `templates/`, `README.md`, `AGENTS.md`, `docs/brief.md` or `docs/HANDOFF.md` mentions `product.md` or a "living spec". The build skill has no step to update a spec, and the capture and ticket skills' overlap checks compare against idea notes and tickets only (in `speck/ideas/`, `speck/ideas/done/`, `speck/tickets/` and `speck/tickets/done/`).
4. `speck/product.md` is deleted from this repo, no test reads it, and `npm test` passes.

## Out of scope
- Rewriting finished tickets, idea notes or review logs that mention `product.md`: they're history.
- Draft tickets 0016 and 0024, which have criteria or notes about `product.md`: the user rewords them separately.
- Deleting `product.md` from other projects that already use speck: `speck init` leaves it there, and those projects can delete it themselves.
- Changing how `speck ship` handles uncommitted edits in the base checkout.

## Notes
- Decision (user, 2026-10-09): the code is the source of truth; remove the living spec rather than trim it.
- Where a skill or doc said to check `product.md` for a product question, point to the ticket and the code instead.
- Tests that only check the wording of `product.md` (0032, 0036 AC5, 0037, 0042 AC5, 0048 AC5) go. Tests that use `speck/product.md` only as a handy tracked file to edit should use another file.
- `after: 0063` because 0063 is still building and edits `product.md`.
- Self-check: no changes. Checked an old round with `product_md` (kept and shown without error), `init --force` over an existing `product.md` (left alone) and a rebuilt round-1 prompt (no `product.md`).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Updating speck during an existing review leaves the old cached round-1 prompt active.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 880,782
- Elapsed since build started: 8 min
- Changed lines: 155 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - Existing projects keep an AGENTS.md speck section that says to read `speck/product.md` first, because `speck init` doesn't rewrite a section an older version wrote. Saved to the inbox: `speck/ideas/2026-10-09-refresh-an-old-speck-pointer-in-agents-md.md`.
  - Draft tickets 0069 to 0073 have a note saying `product.md` needs updating. Those notes are now out of date, so reword them before setting the tickets to ready (not saved to the inbox: it's an edit to existing drafts).
  - Codex keeps its session between rounds, so a Codex review that started before this change still has the old `product.md` text from its round 1. Only the new rounds' prompts leave it out. Known limit, not saved.

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
    "reviewed_sha": "b9783e8a6875824e0b6a4d93a66be47e1f300aa8",
    "thread_id": "01a1226b-f79c-7e12-8a9c-90f33abeb8a3",
    "seconds": 27,
    "usage": {
      "input_tokens": 293391,
      "cached_input_tokens": 190592,
      "cache_write_input_tokens": 0,
      "output_tokens": 855,
      "reasoning_output_tokens": 59
    },
    "saved_at": "2026-10-09T20:48:10.603Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs cmdInit copies only config.yml and writes a pointer without product.md. test/product-0068.test.mjs covers fresh installs, existing AGENTS.md, byte preservation including --force, and template deletion; builder reports all passing."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "Validation, schema, new prompts and reviewPack are updated and tested. However, roundOnePrompt at scripts/speck.mjs:635 returns an existing cached prompt unchanged, and historyPrompt resends it. An older cached prompt therefore still sends the spec and requests its review. The later-round test starts round 1 with the new implementation and misses this upgrade case."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Repository search found no prohibited mentions in the specified files. The AC3 tests inspect these documents and verify that overlap checks retain all four ideas and tickets folders; builder reports them passing."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The diff deletes speck/product.md and replaces or removes tests dependent on that repository file. The AC4 test checks deletion and other test files. Supplied npm test output reports 501 passing tests, zero failures. Tests were not rerun because they write temporary files and this review is read-only."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs:635",
        "issue": "Updating speck during an existing review leaves the old cached round-1 prompt active. Later command-review rounds resend its product.md content and living-spec check, violating AC2. Recording this as a known limit in Notes does not satisfy the criterion.",
        "suggested_fix": "Detect legacy cached prompts and rebuild them using the current template without the spec section or check, while preserving historical records. Add an upgrade regression test with an old cached prompt containing a distinctive spec marker and review instruction, then verify neither reaches the later reviewer.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The separate spec is removed from installation, documentation and new reviews, and all 501 reported tests pass. One upgrade case remains: reviews already underway can still send the old spec and ask reviewers to check it. Fix that before merge."
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
    "reviewed_sha": "34270a45a6fbd440f69cb37dd80fe23ef8d81e3a",
    "thread_id": "01a1226b-f79c-7e12-8a9c-90f33abeb8a3",
    "seconds": 21,
    "usage": {
      "input_tokens": 584955,
      "cached_input_tokens": 437376,
      "cache_write_input_tokens": 0,
      "output_tokens": 1581,
      "reasoning_output_tokens": 59
    },
    "saved_at": "2026-10-09T20:50:50.661Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs cmdInit copies only config.yml and writes an AGENTS.md pointer without product.md. The AC1 tests cover fresh installation, preservation of existing product.md bytes with and without --force, and template deletion; all pass in the supplied output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "validateVerdict, reviewerPrompt, roundOnePrompt and reviewPack remove the spec requirement and content while retaining compatibility with old verdicts. test/product-0068.test.mjs covers validation, fresh and rebuilt prompts, legacy cached prompts, and displaying old rounds; all pass. The F1 regression exercises the actual later-round command-review path and checks preservation of saved test output."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Search of all specified skills, templates and documents found no prohibited mentions. AC3 tests verify the build skill has no spec-update step and overlap checks cover both ideas folders and both tickets folders; all pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "speck/product.md and templates/product.md are deleted. AC4 checks repository-file deletion and removal of other tests' dependencies on it. Supplied npm test output reports 502 passing tests and zero failures. Tests were not independently rerun because this review is read-only and the suite writes temporary files."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs:641",
        "issue": "Legacy cached prompts previously resent the removed spec and its review instruction. roundOnePrompt now detects those copies and rebuilds them using the current template, preserving saved test output. The new AC2 (F1) regression covers this upgrade case.",
        "suggested_fix": "Implemented; no further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The separate spec is removed from installation, documentation and review requirements. The upgrade issue is fixed, existing spec files in other projects remain untouched, and historical reviews still display. All 502 reported tests pass. No blocking concerns remain."
  }
}
```

</details>
