---
id: "0383"
title: "Read a reviewer's verdict after a line of prose"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-read-a-reviewer-s-verdict-after-a-line-of-prose.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T20:07:36.894Z"
approved: "2026-10-22T20:10:32.170Z"
finished: "2026-10-22T20:13:14.985Z"

---
# 0383 · Read a reviewer's verdict after a line of prose

**Status:** ✅ done

## Problem
A reviewer that speck runs as a command can open its reply with a line of prose and then give an unfenced JSON verdict. Cursor on grok-4.7-high replied `I'll review ticket 0374 …{"round":1,"verdict":"approve",…}`. speck refuses such a reply with "didn't return a verdict" and records nothing, so a build can't get past review. 0374's builder recorded the verdict by hand to get through.

## Outcome
speck reads a JSON verdict that comes before, after or between prose in a reviewer's reply, and records the round.

## Acceptance criteria
1. A reviewer that speck runs as a command is Claude, Cursor or a command under `reviewer_options`. When one replies with prose before or after an unfenced JSON verdict object, or both, speck records that verdict as the round, exactly as it would the bare JSON. This holds whether the reply is its whole output or the `result` string of a JSON envelope. For example, `I'll review ticket 0374 first.{"round":1,"verdict":"approve",…}` records an approve.
2. When a reply holds more than one unfenced JSON object, speck uses the last one that has a `verdict` key. An object without a `verdict` key, such as `{"ok":true}` in the prose, is never taken as the verdict. Braces and escaped quotes inside the verdict's strings, such as code quoted in `evidence`, don't stop it being read.
3. `speck record` accepts a saved reply with prose before or after an unfenced JSON verdict in the same way.
4. Every reply speck reads today gives the same verdict as before: bare JSON, a ```` ```json ```` fence, and an envelope whose `result` is either. A reply with no JSON verdict anywhere fails with today's message, and nothing is recorded.
5. No test that passed before this change fails.

## Out of scope
- Telling the reviewer more firmly to reply with JSON only. That's a prompt change, and this ticket makes speck read the reply it gets.
- The Codex reviewer, which writes its verdict to a file against an output schema.
- 0384, which lets a review round run past the builder's 10-minute shell limit.

## Notes
- Checked 2026-10-22: `jsonIn` in `scripts/reviewers.mjs` tries only the whole text and fenced blocks, and `verdictFromOutput` applies it to an envelope's `result` too. The parser for `speck record` in `scripts/review.mjs` (near "A subagent often wraps its JSON verdict") accepts only bare JSON or a fence.
- Checked 2026-10-22: Cursor's CLI (`agent -p --mode ask --trust --output-format json --model grok-4.7-high`) printed an envelope whose `result` was two sentences of prose followed straight away by the verdict object, with no fence and no newline. Source: 0374's build log, `speck/.cache/runs/0374.log`.
- A priority 0 fix: with Cursor reviewing, no build gets past review.
- Failing before this build: none
- Self-check: brought the brief's sentence on command reviewer output in line with what speck now reads.
- Pictures: none, because nothing anyone sees changes.

## In plain words
When a reviewer such as Cursor starts its answer with a sentence or two before giving its verdict, speck now finds the verdict and records the review round, instead of saying the reviewer gave no verdict and stopping the build. The same goes for a reply saved by hand and recorded afterwards. If a reply holds several pieces of data, speck takes the last one that is a verdict. To see it, run a build with Cursor as the reviewer: its rounds are recorded without help. Replies with no verdict at all are still refused with the same message as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 93,647
- Elapsed since build started: 3 min
- Changed lines: 45 (limit 5000)
- Known limit: the verdict search tries each opening brace in turn, so a very long reply full of unclosed braces takes longer to read. Reviewer replies are small, so no follow-up.
- Follow-ups: none.

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
    "reviewed_sha": "bced175ebd8bf28cdf62aceb5a4e55d15c47de60",
    "thread_id": "01a1653c-1c7c-7e02-9fa1-66d0939298d7",
    "seconds": 23,
    "usage": {
      "input_tokens": 93019,
      "cached_input_tokens": 55296,
      "cache_write_input_tokens": 0,
      "output_tokens": 628,
      "reasoning_output_tokens": 52
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T20:10:23.201Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/reviewers.mjs uses verdictInProse through jsonIn for command output and envelope result strings. Passing 0383 AC1 tests cover surrounding prose, envelopes and recording a command review round."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/review.mjs verdictInProse retains the last object with an own verdict key; objectEnd skips braces and escaped quotes within strings. Both 0383 AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/review.mjs parseReply falls back to verdictInProse. The passing 0383 AC3 test exercises speck record with prose before, after and around verdicts."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Existing whole-text and fenced parsing remain first. Passing 0383 AC4 tests and test/review-command.test.mjs cover existing formats, unchanged error messages and no round recorded on failure."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0383-tests.txt reports 128 passed, 3 skipped and zero failures across 131 tests. The limited parser change and reviewed regression tests show no regression in the exercised behaviour."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Speck now reads and records reviewer verdicts surrounded by prose, including replies inside JSON envelopes and saved replies. Tests cover multiple objects, quoted braces, existing formats and failure handling. No blocking issues found."
  }
}
```

</details>
