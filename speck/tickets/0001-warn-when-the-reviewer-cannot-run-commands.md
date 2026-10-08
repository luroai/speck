---
id: "0001"
title: "Warn when the reviewer cannot run commands"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | done
priority: 1              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-08
started: "2026-10-08T20:14:21.551Z"

---
# 0001 · Warn when the reviewer cannot run commands

**Status:** 🔍 reviewing

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

## Delivery log

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
