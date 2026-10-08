---
id: "0001"
title: "Warn when the reviewer cannot run commands"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | done
priority: 1              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-08
started: "2026-10-08T20:14:21.551Z"
finished: "2026-10-08T20:31:33.650Z"

---
# 0001 · Warn when the reviewer cannot run commands

**Status:** ✅ done

## Problem
On machines where the Codex sandbox can't start (for example, AppArmor blocking bubblewrap on Ubuntu), the reviewer silently reviews only the diff it's given and can't inspect the repo. Users don't know their review is weaker.

## Outcome
speck detects a reviewer that couldn't run commands and says so in the round output and the review pack.

## Acceptance criteria
1. `speck review` prints a warning when the Codex event stream shows a failed command caused by the sandbox (for example, an error containing "bwrap").
2. The round record stores `sandbox_ok: false` in `meta` when that happens.
3. The review pack shows "⚠️ Reviewer could not inspect the repo; reviewed the diff only" for any such round.

## Out of scope
- Fixing the host sandbox itself

## Notes

## Blocked question

## Review log
Round 1 (codex): changes requested: F1 the detector ignored a non-zero exit when the event's status said `completed`. Round 2: approved, with F1 resolved. Round 3: approved again after merging main (ticket 0008 shipped first and conflicted in `speck.mjs`, `product.md` and the tests). All rounds ran with a working sandbox.

## Delivery log
- Build: 13 changed lines excluding tests and `speck/` (limit 1000). 61 tests pass (4 new groups covering AC1 to AC3, plus a regression test from the review).
- Review rounds: 3 of 3 (round 3 re-checked the merge with main). Merge-conflict resolution: kept both sets of tests and both product.md entries; 74 tests pass. Elapsed since build started: see `speck pack 0001`.
- Follow-ups, not done here:
  - Later rounds resume the first round's Codex session. Ticket 0008's round 2 resumed a session that had seen the sandbox fail and simply repeated "inspection unavailable" without trying. A fresh session found a real bug. Consider starting a fresh session when a prior round has `sandbox_ok: false`.
  - A sandbox failure with no `bwrap` in its output (a different sandbox error) isn't detected.

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
    "reviewed_sha": "c524e4a4f1bc4e17182b28879aac414c926f7586",
    "thread_id": "01a11d27-d3de-77e3-ac69-09d12fd41067",
    "seconds": 58,
    "usage": {
      "input_tokens": 139019,
      "cached_input_tokens": 100352,
      "cache_write_input_tokens": 0,
      "output_tokens": 979,
      "reasoning_output_tokens": 124
    },
    "saved_at": "2026-10-08T20:16:09.471Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/speck.mjs sandboxFailed excludes status 'completed' even when exit_code is 1 and output contains a bwrap error. A read-only execution of the actual function confirmed this event is missed. The AC1 tests cover only status 'failed' for sandbox errors."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "runCodexReview saves sandbox_ok: false only when sandboxFailed returns true, so the same missed non-zero bwrap event leaves the round unflagged. The AC2 test exercises only the 'failed' status."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "reviewPack filters all rounds with meta.sandbox_ok === false and prints the required warning with each round number. The AC3 CLI test exercises saving a flagged round and rendering its pack; builder output reports it passing."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs:450",
        "issue": "The detector treats status 'completed' as success independently of exit_code. A completed command event with a non-zero exit code and bwrap error is ignored, suppressing both the warning and saved flag. The tests omit this combination.",
        "suggested_fix": "Detect terminal command events with a non-zero exit code and bwrap output without excluding 'completed'. Add a regression test for status 'completed', exit_code 1 and bwrap output, checking the warning and saved metadata.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The new documentation promises warnings for bwrap command failures, but the implementation excludes completed events with non-zero exit codes."
    },
    "escalation_question": "",
    "summary": "The warning, saved flag and review-pack display are connected correctly for the tested failure format. One detection condition can still hide sandbox failures, leaving users unaware that the review could not inspect the repository. Fix that condition and add coverage before merge."
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
    "reviewed_sha": "fbc2beb1d62c7bb7dc8d972e37a1fb31dcabfe05",
    "thread_id": "01a11d27-d3de-77e3-ac69-09d12fd41067",
    "seconds": 21,
    "usage": {
      "input_tokens": 226777,
      "cached_input_tokens": 181376,
      "cache_write_input_tokens": 0,
      "output_tokens": 1589,
      "reasoning_output_tokens": 124
    },
    "saved_at": "2026-10-08T20:16:50.736Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs sandboxFailed now detects bwrap failures with either failed status or a non-zero exit code; printRound prints the required warning. The AC1 CLI tests cover both failed and completed status labels and report passing. Independent read-only evaluation confirmed both are detected."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "runCodexReview saves meta.sandbox_ok: false when sandboxFailed detects a failure. The AC2 test and new completed-status regression test inspect the saved round metadata; both report passing."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "reviewPack selects every round with meta.sandbox_ok === false and renders the required warning with its round number. The AC3 CLI test checks the warning for a flagged round and its absence for an unflagged round; it reports passing."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs:450",
        "issue": "The previous detector ignored completed command events with non-zero exit codes and bwrap errors.",
        "suggested_fix": "Implemented: detect non-zero terminal command failures regardless of the completed status label, with regression coverage for the warning and saved metadata.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The sandbox warning description now matches the implementation, including saved metadata and warnings in the review pack."
    },
    "escalation_question": "",
    "summary": "The missed failure case is fixed and covered by a regression test. speck now warns about detected sandbox failures, records them and displays them in the review pack. All three criteria pass, with no blocking concerns remaining."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "54b0c5073cdfdc4f026fcd36834416f8921a1350",
    "thread_id": "01a11d27-d3de-77e3-ac69-09d12fd41067",
    "seconds": 22,
    "usage": {
      "input_tokens": 354465,
      "cached_input_tokens": 288000,
      "cache_write_input_tokens": 0,
      "output_tokens": 2064,
      "reasoning_output_tokens": 124
    },
    "saved_at": "2026-10-08T20:31:11.312Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs retains sandboxFailed and printRound's warning after the merge. AC1 CLI tests cover bwrap failures with both failed and completed status labels, plus successful commands and unrelated failures. Supplied merged test output reports all passing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "runCodexReview still saves sandbox_ok: false in meta for detected sandbox failures. The AC2 test and completed-status regression test check the persisted round metadata; both pass in the supplied merged test output."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "reviewPack still filters all rounds with meta.sandbox_ok === false and displays the exact warning with each round number. The AC3 CLI test checks flagged and unflagged output and passes in the supplied merged test output."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs:455",
        "issue": "The original detector ignored completed command events with non-zero exit codes and bwrap errors. The corrected detector and regression test remain intact after merging main.",
        "suggested_fix": "Completed in round 2; no further change required.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The merged living spec retains both the cancellation capability from main and this ticket's sandbox warning. The diff against current main contains only this ticket's intended changes and review records."
    },
    "escalation_question": "",
    "summary": "The merge preserves the sandbox warning, saved flag and review-pack display alongside the cancellation feature. All three criteria remain satisfied; the supplied results show all 74 tests passing. No blocking concerns remain."
  }
}
```

</details>
