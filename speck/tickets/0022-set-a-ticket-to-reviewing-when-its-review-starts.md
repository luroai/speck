---
id: "0022"
title: "Set a ticket to reviewing when its review starts"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T10:44:06.399Z"

---
# 0022 · Set a ticket to reviewing when its review starts

**Status:** 👍 approved

## Problem
Before the first review round, the builder runs `speck set <id> status reviewing` and makes a separate commit, every ticket. It's a manual step and an extra commit that the first review could do itself.

## Outcome
Starting a ticket's first review round sets it to `reviewing`, with no separate step.

## Acceptance criteria
1. When `speck review <id>` starts round 1 on a ticket in `building`, the ticket is set to `reviewing` before the reviewer runs. The change is left uncommitted alongside the new round, as round results are today.
2. If the round fails (the reviewer errors, or the tree isn't committed), the status is left as it was.
3. `speck record` for round 1 does the same for reviewers the builder runs itself.
4. The build skill no longer asks for a separate `speck set <id> status reviewing` and commit.

## Out of scope
- Setting `building` automatically.

## Notes
- Pre-check: no ambiguities found, and no external facts. Note that `speck review` already lets the ticket's Review rounds section stay uncommitted. The status change will be committed with the builder's next fix commit.
- Round 2's clean-tree check now also accepts the uncommitted building → reviewing change (and its header line) next to round 1, so a builder who commits only code between rounds isn't refused. Any other uncommitted ticket edit is still refused.
- The 0023 self-check test anchored on the removed `speck set <id> status reviewing` sentence. It now anchors on the sentence that replaces it, with the same check.
- Self-check: no changes. Known gap: if `speck review` is interrupted (Ctrl-C) while the reviewer runs, the ticket stays `reviewing` with no round. Re-running the review, or `speck set <id> status building`, puts it right.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 209,419
- Elapsed since build started: 5 min
- Changed lines: 40 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up idea (F1, minor): restore the ticket's status on SIGINT/SIGTERM while `speck review` waits for the reviewer. The limit is documented in product.md for now.

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
    "reviewed_sha": "5bf88f79627bd1572eac6812d7a1f6feca859972",
    "thread_id": "01a12047-61f6-7ab2-b37c-44bc3497c2c9",
    "seconds": 41,
    "usage": {
      "input_tokens": 208539,
      "cached_input_tokens": 160128,
      "cache_write_input_tokens": 0,
      "output_tokens": 880,
      "reasoning_output_tokens": 110
    },
    "saved_at": "2026-10-09T10:49:12.746Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs: reviewRound sets reviewing before invoking either adapter. The 0022 AC1 command-review test observes reviewing inside the reviewer process and verifies the status and round remain uncommitted; the Codex test covers that adapter."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "reviewSetup rejects dirty work before changing status; reviewRound restores the original ticket on exceptions. The 0022 AC2 test covers command errors, malformed verdicts, Codex errors and an uncommitted tree."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "saveRound validates the verdict before writing round 1 and the status together. The 0022 AC3 test exercises successful recording, refused replies and unchanged status in later rounds."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "skills/speck-build/SKILL.md removes the separate status command and commit. The 0022 AC4 test checks the replacement instruction."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "minor",
        "file": "scripts/speck.mjs: reviewRound",
        "issue": "Interrupting speck with Ctrl-C bypasses exception rollback, leaving reviewing without a recorded round. This limitation is explicitly acknowledged in the ticket, but omitted from product.md.",
        "suggested_fix": "Document the interruption limitation and recovery steps in product.md; consider signal handling in a follow-up ticket.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The added capability matches the implementation for completed and erroring reviewer runs. The acknowledged interruption limitation would be useful under Known limits."
    },
    "escalation_question": "",
    "summary": "The first review now updates the ticket automatically, removing the extra status command and commit. Tests exercise the real CLI paths and ordinary failure recovery. The change stays within scope. Approval has one minor caveat: cancelling a running review can leave its status changed until recovery. I inspected the tests and supplied passing output; I did not rerun tests in this read-only environment."
  }
}
```

</details>
