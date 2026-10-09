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
