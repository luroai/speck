---
id: "0049"
title: "Mark bug tickets in the ticket list"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T17:03:46.145Z"

---
# 0049 · Mark bug tickets in the ticket list

**Status:** 🔍 reviewing

## Problem
Bugs and features look the same in the ticket list, so a bug that loses work (such as 0046) doesn't stand out from routine features when you choose what to set ready or build next.

## Outcome
A ticket can be marked as a bug, and bug tickets have a visible bug tag wherever tickets are listed.

## Acceptance criteria
1. A ticket's frontmatter can have `type: bug`. `speck lint` accepts a missing or blank `type` or `bug`, and gives an error naming the field for any other value. The ticket template has the field, blank, with a comment listing the values.
2. `speck new "<title>" --type=bug` creates the ticket with `type: bug`. Any other `--type` value is refused with a plain message, creating nothing.
3. `speck status` shows `bug` after the id of each bug ticket, and `speck status --json` has `type` for every ticket (`"bug"`, or `null` when missing or blank).
4. In the panel, a bug ticket shows a "bug" tag beside its id in Shaping, the queue and Shipped, in a colour of its own: not the tickets blue, the ideas purple, the blocked red (`--bad`) or the warning orange (`--warn`). Other tickets show no tag.
5. `/speck-ticket` says to create a ticket that fixes a defect with `--type=bug`.

## Out of scope
- Other types, such as chore or feature.
- Sorting or filtering by type.

## Notes
- 0046 and 0047 already have `type: bug` in their frontmatter, ahead of this ticket.
- No external facts: everything is in this repo.
- Self-check: `speck new` now refuses a bare `--type` and a second `--type` with any value but bug, which it had let through.

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
    "reviewed_sha": "c4d7c897d7ef6bdb1e72795f3fa6f37a1a5bc94e",
    "thread_id": "01a121a4-73de-7d13-bc7e-1646d5ff5205",
    "seconds": 45,
    "usage": {
      "input_tokens": 265563,
      "cached_input_tokens": 189824,
      "cache_write_input_tokens": 0,
      "output_tokens": 1165,
      "reasoning_output_tokens": 21
    },
    "saved_at": "2026-10-09T17:10:33.395Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/speck.mjs: parseYaml parses an unquoted blank `type:` as {}, which lintTicket rejects. Independently reproduced with `type: # blank or bug`. The AC1 tests cover quoted empty strings only. The template and bug validation otherwise meet the criterion."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/speck.mjs: cmdNew validates every --type argument before writing. test/type-0049.test.mjs AC2 exercises creation and invalid-value refusals, including bare and repeated flags; builder reports it passing."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "cmdStatus correctly prints bug after the id, covered by the AC3 test. However, statusData preserves {} for an unquoted blank `type:` instead of returning null. The test covers missing and quoted blank fields only."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html: bugTag is used by tags for Shaping and queue rows and directly by Shipped rendering. AC4 tests execute the actual page script and check placement, absence on other tickets and the distinct pink CSS colour; builder reports both passing."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "skills/speck-ticket/SKILL.md step 4 instructs adding --type=bug for defects. The AC5 test checks this instruction; builder reports it passing."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "An ordinary blank frontmatter field (`type:` or `type: # comment`) is parsed as {}, rejected by lint and emitted as {} in status JSON. This violates both blank-field requirements. Existing tests only exercise `type: \"\"`, so they miss this case.",
        "suggested_fix": "Handle unquoted blank type fields consistently in lint and status JSON without accepting non-empty mappings as valid types. Add regression tests for `type:` and `type: # comment`, verifying lint acceptance and JSON null.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The update otherwise matches the implementation, but its claims that blank type fields pass lint and become JSON null are false for unquoted blanks. Fixing F1 should make those claims accurate."
    },
    "escalation_question": "",
    "summary": "Bug creation and the visible pink tags are implemented with meaningful tests. One edge case needs fixing before merge: leaving the type field blank without quotation marks causes a lint error and incorrect JSON output."
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
    "reviewed_sha": "d421b8daeae61aeb773d62a6acfe13c61833c2d0",
    "thread_id": "01a121a4-73de-7d13-bc7e-1646d5ff5205",
    "seconds": 38,
    "usage": {
      "input_tokens": 474282,
      "cached_input_tokens": 367104,
      "cache_write_input_tokens": 0,
      "output_tokens": 2176,
      "reasoning_output_tokens": 104
    },
    "saved_at": "2026-10-09T17:12:45.103Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/speck.mjs: ticketType fixes bare blank fields, independently verified through parseTicket and lintTicket. However, explicit `type: {}` and `type: []` are also accepted: the former matches the empty-object check and the latter satisfies blank([]). These are values other than blank or bug. AC1 tests do not cover them."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdNew validates all --type arguments before writing. The AC2 CLI test exercises bug creation and refusal without creation for invalid, bare and repeated flags; supplied test output passes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdStatus adds bug after the id; statusData now uses ticketType to return null for missing, quoted blank and bare blank fields. The expanded AC3 CLI test exercises these cases and passes in supplied output."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html uses bugTag beside the id through tags in Shaping and the queue, and directly in Shipped. AC4 tests exercise page rendering, absence on ordinary tickets and a distinct pink colour; supplied output passes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "skills/speck-ticket/SKILL.md step 4 instructs using --type=bug for a defect. The AC5 instruction test passes in supplied output."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Bare blank type fields previously failed lint and produced an object in JSON. Both paths now normalise these fields, and regression tests exercise blanks with and without comments.",
        "suggested_fix": "No further action for the original blank-field defect.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Type validation accepts explicit empty collections (`type: {}` and `type: []`) despite the requirement to reject every value other than blank or bug. The helper cannot distinguish a bare blank from an explicit empty mapping, and blank([]) returns true.",
        "suggested_fix": "Distinguish genuinely blank type syntax from explicit collection values, avoiding broad string coercion for type validation. Add tests proving both explicit empty collections produce an error naming type while bare blanks still pass.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The blank-field claims are now correct, but the claim that lint accepts only missing, blank or bug remains inaccurate because explicit empty collections pass."
    },
    "escalation_question": "",
    "summary": "The original blank-field problem is fixed, and bug creation and visible tags work. Validation still lets empty lists and mappings through as ticket types; these need to be rejected before approval."
  }
}
```

</details>
