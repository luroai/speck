---
id: "0692"
title: "Keep the reviewer's usage limit on record while a stand-in reviews"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-11-remember-the-reviewer-s-limit-while-a-stand-in-reviews.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T21:06:23.996Z"

---
# 0692 · Keep the reviewer's usage limit on record while a stand-in reviews

**Status:** 🔍 reviewing

## Problem
When the reviewer is held by a usage limit and a stand-in from `reviewer_bench` takes a round, the recorded round clears that build's record of the limit. Once every build's round has run on a stand-in, no record is left, so each later round asks the limited reviewer first, is refused and only then switches, and speck run's status no longer says the reviewer is waiting for its reset.

## Outcome
A reviewer's usage limit stays on record until it resets, whoever takes the rounds meanwhile.

## Acceptance criteria
1. After a stand-in has taken a round for a limited reviewer, the next round, on any ticket, goes straight to the stand-in, without starting the limited reviewer, until the reviewer's limit resets.
2. Until then, speck run's status and the panel say the reviewer is held by its limit and when it resets, as they do before any stand-in round.
3. Once the limit has reset, the next round goes to the reviewer again.
4. A blocked build is still shown under Needs you while the reviewer is limited, and a build waiting only for the reviewer's reset is carried on as today.

## Out of scope
- A stand-in that's limited too: 0693.

## Notes
- From 0649. The per-build record also marks a build as waiting to be carried on (`reviewerWaiting`), so the limit may want a record of its own, apart from the per-build one.
- Failing before this build: none
- The reviewer's own limit is kept in `speck/.cache/runs/reviewer-held/<reviewer>.json`, written only when the reviewer itself refuses a round of a build speck run started, read with the builds' records wherever a limit holds a reviewer, and cleared when a round on the reviewer's own agent is recorded. It lapses at its carry-on time.
- Self-check: no changes

## In plain words
When your reviewer hits its usage limit and another of your agents stands in for it, speck now remembers the limit until it resets. Every review in the meantime goes straight to the stand-in instead of first asking the limited reviewer and being turned away, and speck run's status bar and the panel keep saying the reviewer is waiting for its reset, and when that is. Once the limit resets, reviews go back to your reviewer on their own.

To see it, let speck run build while your reviewer is out of usage: after the first stand-in review, the status should keep naming the reviewer's limit, and later reviews should say they ran on the stand-in. Worth watching: a limit whose message didn't say when it resets is retried every 30 minutes, as before.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Follow-ups:
- Tidy-up: a reviewer's own limit record that has lapsed is ignored but left on disk until the next refusal overwrites it or a round on that reviewer clears it.
- Known limit: a round you run by hand still asks the limited reviewer first and gets no stand-in, as before this ticket.
- test/ship-0264.test.mjs AC3 failed once in the related run (`Cannot read properties of undefined (reading 'done')`) and passed on rerun; it looks timing-dependent under load.

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
    "reviewed_sha": "1aaf53ea8a14afa85983e56b700401ec5d65cbd8",
    "session": "fresh",
    "thread_id": "01a1e123-f414-7f92-824f-3fb97f5a3e8a",
    "builder_response": "- Tests run: `speck test --related test/reviewer-held-0692.test.mjs test/review-stand-in-0649.test.mjs` (156 files, the changed scripts' related tests); one unrelated failure in test/ship-0264.test.mjs (AC3, \"Cannot read properties of undefined (reading 'done')\"), which passed when rerun with `speck test --files test/reviewer-held-0692.test.mjs test/review-stand-in-0649.test.mjs test/ship-0264.test.mjs` (appended at the end of the test output).\n- The change: a reviewer's own limit record (`runs/reviewer-held/<reviewer>.json`), apart from the per-build records in `runs/reviewer-limits/`. stopOnLimit writes it when the reviewer itself refuses a round of a build speck run started. heldBy, the queue's view() and reviewerHolds read it with the builds' records; readLimits, reviewerWaiting and check() still read only the builds' records, so it neither marks a build as waiting nor resumes one. A round recorded on the reviewer's own agent clears it; otherwise it lapses at its carry-on time.\n- holdOnLimit's refusal (from a record already kept) doesn't rewrite the reviewer's own record, so an older record can't be extended by a build that never asked the reviewer.\n- The 0649 test's fake agents moved to test/support/review-stand-in.mjs so the new tests share them; the 0649 tests themselves are unchanged.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 206952,
      "cached_input_tokens": 156800,
      "cache_write_input_tokens": 0,
      "output_tokens": 758,
      "reasoning_output_tokens": 31
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 50152,
      "cached": 156800,
      "write": 0,
      "output": 758
    },
    "cost_usd": 0.123564,
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-11-15T21:37:00.612Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "reviewer-limit.mjs: stopOnLimit saves the independent reviewer record; heldBy and holdOnLimit consult it. Both 0692 AC1 tests passed, including a second round that never starts the limited reviewer."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "reviewerLimitQueue.view reads both record types. The 0692 AC2 test passed for unknown and known reset times. Existing 0623 bar tests passed; panel.mjs and speck.mjs both use foremanView to display this status."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "holding ignores records after carry_on; cmdReview clears the reviewer record after its own successful round. Both 0692 AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "reviewerWaiting and the queue's check still use only per-build records. Both 0692 AC4 tests passed, covering Needs you and resuming a waiting build."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The reviewer’s limit now stays recorded while a stand-in handles rounds, preserving routing and status until the reset. Builds needing attention remain visible, and waiting builds still resume. Relevant tests passed; the unrelated shipping test passed on rerun. No blocking issues found."
  }
}
```

</details>
