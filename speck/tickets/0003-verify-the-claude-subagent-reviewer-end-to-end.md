---
id: "0003"
title: "Verify the Claude subagent reviewer end to end"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | done
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-08
started: "2026-10-08T20:46:41.610Z"

---
# 0003 · Verify the Claude subagent reviewer end to end

**Status:** 🔍 reviewing

## Problem
The `claude-subagent` reviewer path (speck prompt, Agent tool, SendMessage, speck record) is written but has never been run, so it may not work.

## Outcome
A ticket can be reviewed end to end with `reviewer: claude-subagent` and `allow_same_model_review: true`.

## Acceptance criteria
1. A sample ticket with a deliberate bug gets `changes_requested` from the subagent in round 1, recorded via `speck record`.
2. Round 2 continues the same subagent through SendMessage and ends in `approve` after the fix.
3. Any instructions in skills/speck-review/SKILL.md that turn out wrong are corrected.

## Out of scope
- Adding other reviewer models

## Notes
**Live run (2026-10-08).** A throwaway repo had speck installed from this branch, `reviewer: claude-subagent` and `allow_same_model_review: true`. Its sample ticket 0001 asked for `slugify()` and had three criteria. The build had a deliberate bug: a trailing hyphen was left on (`"  Hello, World!  "` gave `hello-world-`), and an AC2 test only checked the leading end, so the tests passed. Each step followed `skills/speck-review/SKILL.md` as written. Model and effort were `default`, so neither was passed. The one extra was that the repo path went into the subagent's prompt, because the builder session was running from this repo rather than the sample one.
- Round 1: a fresh general-purpose subagent found the bug and the weak test (F1 and F2, blocking; F3 minor, about product.md) and returned `changes_requested`. Its reply came inside a ```` ```json ```` fence, and `speck record` crashed on it with a Node stack trace. Once the fence was stripped by hand, the round recorded, and `next` said `fix`. **(AC1)**
- Round 2: after the fix was committed, SendMessage to the same agent id resumed it with its round-1 findings. It marked F1–F3 `resolved` and returned `approve` (fenced again, and the crash happened again). Once recorded, `next` said `ship` and `speck pack` showed both rounds as `claude-subagent, model default, effort default`. The round-2 verdict was saved with its evidence and finding text shortened. The verdict, criteria statuses and finding ids and states were kept exactly. **(AC2)**

**What was wrong, and what's fixed (AC3).** The skill said to save the subagent's "JSON reply", but a real reply is fenced, so `speck record` failed every round. `speck record` now accepts a fenced reply, and gives a plain error with no round recorded when the reply isn't JSON, isn't a JSON object, or has a `criteria` or `findings` entry that isn't an object (round 1 F1). It doesn't check the fields inside each entry, which would mean validating the full schema. The skill now says to save the reply as it came back. It also says the agent id kept in round 1 is what round 2's SendMessage goes to, and gives the full `speck record` command for round 2. Everything else in the skill worked as written.

**Automated tests** (`0003 AC1`–`AC3` in `test/speck.test.mjs`) replay the same loop through the CLI, with the replies fenced as the real subagent sent them. A test can't start a real Claude subagent, so the live run above is the evidence for that part.

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
    "reviewed_sha": "5d93238bb2345bda45198e4add4147d167c7b9db",
    "thread_id": "01a11d49-50cc-7c42-8d50-16e6a6a6e546",
    "seconds": 61,
    "usage": {
      "input_tokens": 322643,
      "cached_input_tokens": 267776,
      "cache_write_input_tokens": 0,
      "output_tokens": 1399,
      "reasoning_output_tokens": 174
    },
    "saved_at": "2026-10-08T20:52:47.370Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The live sample at /tmp/speck-0003-smoke-hN7c records round 1 as claude-subagent changes_requested, with the trailing-hyphen bug and weak test identified. Test '0003 AC1: a claude-subagent round 1 records changes_requested from the reply as sent' exercises fenced reply recording."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The sample records round 2 as approve after fix commit f1996e1, resolving F1–F3. Ticket Notes document resuming the same agent through SendMessage. The AC2 CLI test exercises the fix diff, second recorded round and next=ship; agent continuity is supported by the manual run rather than automated coverage."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "skills/speck-review/SKILL.md now explains saving fenced replies and addressing the retained agent id through SendMessage, including the full round-2 record command. The AC3 test checks these instructions."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/product.md",
        "issue": "The new promise that anything other than a JSON verdict receives a plain error is inaccurate. parseReply accepts any JSON object, and validateVerdict crashes on nested malformed entries. Independently calling it with criteria:[null] produced TypeError: Cannot read properties of null (reading 'status'); cmdRecord reaches that function, and the CLI rethrows this error with a stack trace. The new rejection test only covers malformed JSON and non-object values.",
        "suggested_fix": "Either narrow the product and ticket claims to malformed JSON/non-object replies, or validate nested verdict entries and reject them with SpeckError before recording. Add coverage for a JSON object containing a null criterion or finding if retaining the broader promise.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The loop description matches the available sample records, but the new blanket promise about plain errors for invalid verdicts is false."
    },
    "escalation_question": "",
    "summary": "The sample review caught the deliberate bug, then approved the fix, and fenced replies can now be recorded. The review instructions have been clarified. One claim needs correcting before merge: some malformed verdicts still crash with a technical stack trace despite the product description promising a plain error."
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
    "reviewed_sha": "f36de89a3e19e300df3caebbcb8ba97c81c0cfa8",
    "thread_id": "01a11d49-50cc-7c42-8d50-16e6a6a6e546",
    "seconds": 38,
    "usage": {
      "input_tokens": 512912,
      "cached_input_tokens": 445824,
      "cache_write_input_tokens": 0,
      "output_tokens": 2316,
      "reasoning_output_tokens": 276
    },
    "saved_at": "2026-10-08T20:54:08.066Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Previously inspected live sample records show claude-subagent round 1 identifying the deliberate bug and returning changes_requested. The unchanged AC1 CLI test exercises recording a fenced reply and next=fix; supplied test output reports it passing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Previously inspected sample records show approval after fix commit f1996e1; ticket Notes document SendMessage to the same agent. The unchanged AC2 CLI test exercises the fix diff, second recorded round and next=ship; supplied output reports it passing. Agent continuity relies on the manual run."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "skills/speck-review/SKILL.md retains the corrected fenced-reply instructions, retained agent id, SendMessage continuation and full round-2 record command. The AC3 instruction test passes in supplied output."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "speck/product.md",
        "issue": "The reported null-entry crash is fixed, but the blanket claim that anything other than a JSON verdict is refused remains inaccurate. validateVerdict checks that entries are objects but does not validate their required fields. Independently passing criteria:[{status:\"pass\"}] and findings:[{}] returned approve unchanged, despite missing criterion evidence/id and every required finding field. These invalid verdict objects can therefore be recorded rather than refused.",
        "suggested_fix": "Narrow product.md and ticket Notes to the actual guarantee: malformed JSON, non-object replies and non-object criterion/finding entries receive plain errors without recording. Alternatively, validate required entry fields and allowed values, with regression tests for empty objects and invalid field values.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The review-loop description remains supported. The broad invalid-verdict rejection claim still exceeds the implemented validation."
    },
    "escalation_question": "",
    "summary": "The original crash is fixed, with meaningful regression coverage. The review loop still meets all three acceptance criteria. One documentation claim remains too broad: malformed verdict objects can still be accepted. Narrow that claim or complete the validation before merge."
  }
}
```

</details>
