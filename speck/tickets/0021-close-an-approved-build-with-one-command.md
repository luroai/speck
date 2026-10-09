---
id: "0021"
title: "Close an approved build with one command"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T10:31:46.814Z"

---
# 0021 · Close an approved build with one command

**Status:** 👍 approved

## Problem
When the reviewer approves, the builder closes out by hand every time. It writes one review log line per round, copies the rounds, tokens and elapsed time from `speck pack` into the delivery log, counts changed lines, sets `approved` and commits. Nearly all of that is data speck already has, and doing it by hand is slow and easy to get wrong.

## Outcome
One command closes out an approved build: it writes the review log and delivery log figures, sets `approved` and commits the ticket.

## Acceptance criteria
1. `speck close <id>` refuses, changing nothing, unless `speck next <id>` says `ship` and the working tree has no changes outside the ticket file.
2. It replaces the contents of `## Review log` with one line per round: the round number, the reviewer, the verdict, and the id and first sentence of each blocking finding that first appears in that round. A finding carried over from an earlier round isn't repeated.
3. It adds to `## Delivery log` the number of review rounds, the reviewer and model, reviewer tokens, the elapsed time since the build started, and the changed lines with the limit, all from the same data as `speck pack`. Anything already in the Delivery log (for example follow-up ideas the builder wrote) is kept.
4. It sets the status to `approved` and commits only the ticket file, with the message `speck(<id>): approved`.
5. The build skill's approved step uses `speck close <id>` (after the builder adds any follow-up ideas), then `speck ship <id> --auto` as now.

## Out of scope
- Shipping: `speck close` never merges or pushes.
- Writing follow-up ideas, which stay the builder's job.

## Notes
- Pre-check: AC2's "raised in that round" could mean new findings or every finding listed. It now says findings first appearing in that round, and that the Review log is replaced, not appended to.

- Self-check: no changes beyond a guard for a finding with no id or issue text; edge cases (built-in names as ids, repeated close, missing log headings, dirty tree, failed commit) are covered or handled.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The dirty-tree guard ignores the source of a rename or copy.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 835,942
- Elapsed since build started: 10 min
- Changed lines: 116 (limit 5000)
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
    "reviewed_sha": "86f10930d6953a810eee9125011e5d713b64c4b3",
    "thread_id": "01a1203d-e3db-7fb2-953e-3604f448756a",
    "seconds": 55,
    "usage": {
      "input_tokens": 338767,
      "cached_input_tokens": 274944,
      "cache_write_input_tokens": 0,
      "output_tokens": 1315,
      "reasoning_output_tokens": 85
    },
    "saved_at": "2026-10-09T10:39:03.778Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "cmdClose uses nextAction and checks dirty files; test '0021 AC1' exercises ordinary refusals. However, changesOutside (scripts/speck.mjs:1482) discards rename source paths. Evaluating its actual parser with a rename from other.md into the ticket returned [], allowing changes outside the ticket."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "reviewLogLines and replaceSection implement replacement, first sentences and deduplication. Both '0021 AC2' tests exercise these behaviours with recorded rounds."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdClose shares reviewTotals, who and changedLines with reviewPack and retains existing delivery content. '0021 AC3' tests compare pack figures and cover missing start time."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "'0021 AC4: it sets approved and commits only the ticket file' verifies status, rendered header, commit message, changed paths and subsequent shipping. cmdClose never merges or pushes."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md approved step adds follow-up ideas before close, then ship --auto. '0021 AC5' checks that ordering."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs:1482",
        "issue": "The dirty-tree guard ignores the source of a rename or copy. When its destination is the ticket file, changesOutside returns no outside changes even though another tracked path was removed or changed. This violates AC1 and can leave an outside deletion staged after approval.",
        "suggested_fix": "Check both paths in rename records, and add a regression test proving that a rename from another tracked file into the ticket refuses without changing the ticket, HEAD or index.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "minor",
        "file": "scripts/speck.mjs:1528",
        "issue": "Failed commits restore the ticket contents but reset its index entry to HEAD. Any ticket changes staged before close become unstaged, despite the message claiming nothing changed. There is no close-specific failed-commit test.",
        "suggested_fix": "Preserve and restore the ticket's original index entry on failure, and test a rejecting commit hook with pre-existing staged ticket changes.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The capability description otherwise matches the implementation, but its claim that all outside staged changes prevent close is false for rename source paths."
    },
    "escalation_question": "",
    "summary": "The command automates the logs and approval commit, and the normal paths have meaningful tests. A rename can bypass its required clean-tree check, so that guard needs fixing before merge. I inspected the tests and supplied results; I did not rerun the write-producing suite in this read-only review. The apparent unrelated idea-note difference comes from main advancing, not this ticket."
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
    "reviewed_sha": "ac82756ecbc47f6c2436262cc769085f9bf717c5",
    "thread_id": "01a1203d-e3db-7fb2-953e-3604f448756a",
    "seconds": 29,
    "usage": {
      "input_tokens": 493748,
      "cached_input_tokens": 413312,
      "cache_write_input_tokens": 0,
      "output_tokens": 2112,
      "reasoning_output_tokens": 85
    },
    "saved_at": "2026-10-09T10:41:34.323Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "cmdClose checks nextAction and changesOutside before writing. Existing AC1 integration tests cover refusal without changes; the new rename/copy test exercises pathsOutside, which now checks both paths. Independent read-only parser checks passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "reviewLogLines and replaceSection replace the review log with round, reviewer, verdict and first sentences of newly appearing blocking findings. Both 0021 AC2 tests cover replacement and findings carried between rounds."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdClose uses the same reviewTotals, who and changedLines data as reviewPack, preserving existing delivery content. The 0021 AC3 tests compare pack figures, retain follow-up ideas and cover an absent start timestamp."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The 0021 AC4 integration test verifies approved status, header, exact commit message and ticket-only commit. The new rejecting-hook test covers restoration of staged and unstaged ticket edits after failure. Supplied results show both passing."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md instructs the builder to add follow-up ideas, run close, then ship --auto. The 0021 AC5 test checks this ordering."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs:1482",
        "issue": "The dirty-tree guard previously ignored rename source paths. pathsOutside now checks both paths, with regression coverage.",
        "suggested_fix": "Implemented; no further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "minor",
        "file": "scripts/speck.mjs:1528",
        "issue": "Failed commits previously discarded the ticket's staged state. cmdClose now saves and restores its index entry; a rejecting-hook test covers staged and unstaged edits.",
        "suggested_fix": "Implemented; no further change required.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The close capability and approved build workflow match the current implementation."
    },
    "escalation_question": "",
    "summary": "Approved. The command fills in the logs, preserves follow-up ideas and commits the approved ticket. Both previous findings are fixed, with meaningful regression tests. All 151 supplied tests passed; I independently checked the rename parser but did not rerun the write-producing suite in this read-only review."
  }
}
```

</details>
