---
id: "0131"
title: "Print a plain-English review pack"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0129", "0130"]              # ticket ids that must be done first
created: 2026-10-11
started: "2026-10-12T19:09:23.084Z"

---
# 0131 · Print a plain-English review pack

**Status:** 👍 approved

## Problem
`speck pack <id>` is written for someone who reads code: evidence quoting files and tests, finding ids, session and token figures. A non-technical user deciding whether to ship needs to know what changed, whether it does what they asked, and whether anything needs a closer look.

## Outcome
`speck pack <id> --plain` prints a short review pack in plain English, that someone who doesn't read code can read before shipping.

## Acceptance criteria
1. `speck pack <id> --plain` prints, in this order: the ticket's id and title; one sentence saying whether the reviewer approved it ("The reviewer approved this change." or "The reviewer hasn't approved this change yet."); the ticket's Outcome; its `## In plain words` section; and each acceptance criterion as worded in the ticket, marked ✅ passed, ❌ failed or ⚠️ unclear from the latest review round.
2. Apart from text quoted from the ticket, the plain pack shows no file paths, finding ids, token counts, model names or session details.
3. When the ticket is `risk: high`, or the change touches files matching speck's sensitive file patterns, the plain pack says so in one sentence suggesting a closer look before shipping. Otherwise it says nothing about risk.
4. When the ticket's `## In plain words` section is missing or empty, the plain pack says "The builder didn't write this change up in plain words." where that section would be.
5. `speck pack <id>` without `--plain` prints exactly what it printed before this change.

## Out of scope
- Showing the plain pack in the panel.
- Changing the full review pack.
- Writing the `## In plain words` section: that's 0130.

## Notes
- Builds on 0130 (the section) and 0129 (the correct sensitive-files list).
- Failing before this build: none
- Self-check: no changes

## In plain words
There's now a short, plain-English version of the review pack for deciding whether to ship a change without reading code. It says whether the reviewer approved the change, what the change was meant to do, the builder's own plain write-up of it, and each thing the ticket asked for with a tick, a cross or a warning sign. If the change is marked high risk or touches sensitive areas such as sign-in, passwords, payments or deployment, it adds one sentence suggesting a closer look first. To see it, ask for the review pack of a ticket in its plain version. The usual, detailed review pack hasn't changed. Worth knowing: once a shipped ticket's work has been tidied away, the short version can no longer tell whether sensitive areas were touched, so it then warns only about tickets marked high risk.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The plain pack silently omits acceptance-criterion continuation lines.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 369,331
- Elapsed since build started: 6 min
- Changed lines: 36 (limit 5000)
- Follow-ups:
  - Inbox: `speck/ideas/2026-10-12-say-in-the-plain-pack-when-the-reviewer-couldn-t-see-the-code.md` (the plain pack leaves out the warning that the reviewer couldn't inspect the repo).
  - Known limit: once the ticket's branch is gone, the plain pack can't list changed files, so it only warns about `risk: high`, not sensitive files.

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
    "reviewed_sha": "76d1187644f43ec465bcd6a2b95dfdef91acfb01",
    "thread_id": "01a13188-4ee0-71b2-9e67-ce5a87c30ab8",
    "seconds": 36,
    "usage": {
      "input_tokens": 136760,
      "cached_input_tokens": 94976,
      "cache_write_input_tokens": 0,
      "output_tokens": 938,
      "reasoning_output_tokens": 44
    },
    "saved_at": "2026-10-12T19:13:35.138Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/pack.mjs plainPack uses lintTicket(...).acceptanceCriteria, which retains only numbered first lines and drops continuation lines. Read-only reproduction confirmed this. The passing AC1 tests in test/pack-0131.test.mjs cover only single-line criteria."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "plainPack prints ticket text and fixed explanatory text without review evidence or metadata. Both AC2 tests passed in the recorded full output."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "plainPack checks ticket risk and diff files against the shared RISKY pattern. Four passing AC3 tests cover high risk, sensitive files, both together and neither."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "sectionText removes comments and whitespace; plainPack supplies the required fallback. Three passing AC4 tests cover missing, empty, comment-only and written sections."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "git diff confirms reviewPack is unchanged and the default cmdPack branch still calls it identically. The AC5 regression test passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/pack.mjs",
        "issue": "The plain pack silently omits acceptance-criterion continuation lines. For example, a criterion beginning 'Export downloads a CSV.' followed by 'Include every booking and preserve accented names.' displays only the first sentence. This fails the requirement to show each criterion as worded in the ticket and hides requirements from the shipping decision.",
        "suggested_fix": "Read complete numbered criteria, preserving their continuation text, specifically for the plain pack without changing the full pack. Add a CLI regression test with a multiline criterion that asserts its complete wording and latest review result appear.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The plain pack provides the requested approval message, change description, results and risk warning, and the existing full pack remains unchanged. The recorded suite passed, but criteria spanning multiple lines lose part of their wording. Fix that omission before putting this in front of the owner for shipping."
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
    "reviewed_sha": "8e0c3fa592d3274fdf52ad49d380fafa9acf3b78",
    "thread_id": "01a13188-4ee0-71b2-9e67-ce5a87c30ab8",
    "seconds": 18,
    "usage": {
      "input_tokens": 230197,
      "cached_input_tokens": 181376,
      "cache_write_input_tokens": 0,
      "output_tokens": 1436,
      "reasoning_output_tokens": 44
    },
    "saved_at": "2026-10-12T19:15:20.786Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/pack.mjs plainPack prints the required content in order, selects the latest round and now includes criterion continuation lines. All AC1 CLI tests passed, including the new multiline wording and result regression."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "plainPack outputs ticket text and fixed explanatory text without review metadata or findings. Both AC2 CLI tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "plainPack checks high ticket risk and changed files against the shared RISKY pattern. All four AC3 tests passed, covering either risk trigger, both together and neither."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "sectionText strips comments and whitespace; plainPack prints the exact required fallback. All AC4 tests passed for missing, empty, comment-only and written sections."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "reviewPack remains unchanged, and cmdPack without --plain retains its original call. The AC5 regression test passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/pack.mjs",
        "issue": "The plain pack previously omitted acceptance-criterion continuation lines. The revised parser now includes them, and the new CLI regression verifies complete wording with the latest review results.",
        "suggested_fix": "Completed: continuation text is preserved specifically in the plain pack, with regression coverage.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The plain-English pack meets all five requirements, including complete wording for criteria spanning several lines. The full review pack remains unchanged. All 15 ticket tests passed; the recorded full suite had no failures. No blocking concerns remain."
  }
}
```

</details>
