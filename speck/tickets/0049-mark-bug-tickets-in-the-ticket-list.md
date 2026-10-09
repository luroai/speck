---
id: "0049"
title: "Mark bug tickets in the ticket list"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 👍 approved

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
- Blocked after 3 review rounds with F2 (a nested mapping under a bare `type:`) fixed but unconfirmed. Answer (2026-10-09): the user allowed one more review round, beyond `max_review_rounds`, to confirm the fix.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 An ordinary blank frontmatter field (`type:` or `type: # comment`) is parsed as {}, rejected by lint and emitted as {} in status JSON.
Round 2 (codex): changes requested: F2 Type validation accepts explicit empty collections (`type: {}` and `type: []`) despite the requirement to reject every value other than blank or bug.
Round 3 (codex): changes requested.
Round 4 (codex): approve.

## Delivery log
- Review rounds: 4
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 2,816,311
- Elapsed since build started: 22 min
- Changed lines: 33 (limit 5000)
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

<details><summary>Round 3 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "5e14fcca9588058247255a25173e8c7b44d3fc25",
    "thread_id": "01a121a4-73de-7d13-bc7e-1646d5ff5205",
    "seconds": 38,
    "usage": {
      "input_tokens": 873294,
      "cached_input_tokens": 738304,
      "cache_write_input_tokens": 0,
      "output_tokens": 3262,
      "reasoning_output_tokens": 134
    },
    "saved_at": "2026-10-09T17:16:24.113Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "ticketType and lintTicket now reject explicit {} and [], independently verified. However, `type:\\n  name: feature` parses as a non-empty mapping and passes lint because ticketType treats the empty opening line as blank. AC1 tests cover inline collections but miss nested mappings. The template meets the requirement."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/speck.mjs cmdNew validates every --type argument before writing. The AC2 CLI test covers creation and invalid-value refusals without creation; supplied output passes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdStatus prints bug after the id, and statusData normalises missing and blank types to null. The AC3 CLI test covers missing, quoted blank and bare blanks with and without comments; supplied output passes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html bugTag appears beside the id in Shaping, queue and Shipped. AC4 tests execute page rendering and verify tag placement, absence on other tickets and a distinct colour; supplied output passes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "skills/speck-ticket/SKILL.md step 4 instructs adding --type=bug for defects. The AC5 test passes in supplied output."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "The original bare-blank lint and JSON defect remains fixed, with regression coverage.",
        "suggested_fix": "No further action for the original defect.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Collection validation is incomplete. Inline {} and [] are rejected, but a non-empty nested mapping such as `type:\\n  name: feature` now passes lint. Independently reproduced: the parsed type is {\"name\":\"feature\"}, yet lint returns no errors. ticketType checks the opening line without checking whether the mapping contains values.",
        "suggested_fix": "Treat a bare type line as blank only when its parsed value is an empty mapping. Reject non-empty mappings, and add a regression test for a nested mapping while retaining the existing blank and inline-collection tests.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The claim that lint accepts only missing, blank or bug remains inaccurate because nested mappings pass validation."
    },
    "escalation_question": "",
    "summary": "Bug creation and the visible tags work, and the earlier blank-field issue is fixed. One validation gap remains: a nested set of values is mistaken for a blank type and accepted. Rejecting that case will complete the requested validation."
  }
}
```

</details>

<details><summary>Round 4 · codex · approve</summary>

```json
{
  "meta": {
    "round": 4,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "261fd0aa918b29a2dd12bf5ded28255fbe8e3e58",
    "thread_id": "01a121a4-73de-7d13-bc7e-1646d5ff5205",
    "seconds": 29,
    "usage": {
      "input_tokens": 1192503,
      "cached_input_tokens": 897152,
      "cache_write_input_tokens": 0,
      "output_tokens": 4066,
      "reasoning_output_tokens": 134
    },
    "saved_at": "2026-10-09T17:25:23.054Z"
  },
  "verdict": {
    "round": 4,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs ticketType and lintTicket accept missing and blank types or bug, and reject other values. Independently verified bare blanks, inline collections and nested mappings. AC1 tests cover these cases and the blank template field with its values comment; supplied output passes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "cmdNew validates every --type argument before writing. The AC2 CLI test exercises bug creation and invalid-value refusals with nothing created, including bare and repeated flags; supplied output passes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdStatus prints bug after the id; statusData uses ticketType to normalise missing and blank values to null. The AC3 CLI test covers bug, missing, quoted blank and bare blanks with and without comments; supplied output passes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel.html bugTag is placed beside the id in Shaping, the queue and Shipped. AC4 tests execute the page script and verify placement, absence on ordinary tickets and a distinct pink colour; supplied output passes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "skills/speck-ticket/SKILL.md step 4 instructs adding --type=bug when fixing a defect. The AC5 test checks this instruction; supplied output passes."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Bare blank type fields now pass lint and become null in status JSON, with regression coverage.",
        "suggested_fix": "No further action required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Explicit empty collections and non-empty nested mappings now produce lint errors naming type. Independently verified both nested-mapping cases while confirming bare blanks still pass; regression tests cover them.",
        "suggested_fix": "No further action required.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The living spec accurately describes bug creation, validation, CLI output, JSON values and panel tags. Changes remain within the ticket's scope."
    },
    "escalation_question": "",
    "summary": "Tickets can now be marked as bugs and show a distinct pink bug tag throughout the panel, plus a bug label in CLI status. Both validation issues are fixed and covered by meaningful tests. All five criteria pass, with no outstanding blocking findings."
  }
}
```

</details>
