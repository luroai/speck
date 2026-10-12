---
id: "0139"
title: "Time a build up to its approval, not its ship"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-12
started: "2026-10-12T21:40:24.386Z"
approved: "2026-10-12T21:43:54.348Z"

---
# 0139 · Time a build up to its approval, not its ship

**Status:** 👍 approved

## Problem
The panel times a build from when it started to when it shipped. A ticket that waits for the user to ship it, such as a high-risk one, keeps counting the whole time it waits: 0128 shows 89 minutes when the build itself took about 6. That makes the time look wrong and skews the Shipped section's median.

## Outcome
A build's time in the panel runs from when it started to when it was approved, so time spent waiting for the user to ship isn't counted.

## Acceptance criteria
1. When a ticket's status is set to `approved`, speck records the time in the ticket's frontmatter as `approved:`, in the same format as `started:`. If the ticket is approved again later, the field holds the latest approval.
2. In the queue, an approved ticket's timer shows the time from `started` to `approved` and stops counting. A building or reviewing ticket's timer counts as it does today.
3. In the Shipped section, a done ticket with both `started` and `approved` shows the minutes from `started` to `approved`, and the median minutes uses the same figure.
4. A done ticket with no `approved` (shipped before this change) shows the minutes from `started` to `finished`, as it does today. A ticket missing `started` shows no time, as it does today.
5. No test that passed before this change fails, except checks of a done or approved ticket's time that assume it runs to `finished` or to now, which are changed to the new rule.

## Out of scope
- Leaving out other waits, such as time a ticket spends blocked on a question or a paused build.
- Filling in `approved` for tickets already shipped.
- The timer skipping or repeating seconds (`speck/ideas/2026-10-11-keep-build-timers-counting-smoothly.md`).

## Notes
- Today `started` is written when status becomes `building` and `finished` when it becomes `done` (`writeField` in `scripts/core.mjs`). The Shipped minutes are `finished - started` (`panelModel` in `templates/panel.html`).
- 0128: started 19:49:52, review approved 19:55:37, shipped 21:19:13 (UTC, 2026-10-12).
- Failing before this build: none
- Self-check: an `approved` time that is unreadable or earlier than `started` is ignored, so the time falls back to today's rule rather than going negative (tested). An approved ticket with no `approved` time, approved before this change, keeps counting as today.

## In plain words
A build's time in the panel now stops when the reviewer approves it, so waiting for you to ship it no longer adds to it. An approved ticket's timer in the queue stands still at its build time, and the Shipped list and its median minutes use the time up to approval. To see it, let a high-risk ticket be approved and wait a few minutes before shipping: its timer stays put. Tickets shipped before this change still show their time up to shipping, because they never recorded an approval time.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 129,571
- Elapsed since build started: 3 min
- Changed lines: 16 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-up: the review pack's "Elapsed since build started" line still counts to now (`speck/ideas/2026-10-12-stop-the-review-packs-elapsed-time-at-approval.md`).
- Known limit: an approved ticket from before this change has no approval time, so its queue timer keeps counting as before.

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
    "reviewed_sha": "f17542a0de65518ade640723bb918ffbf898a09c",
    "thread_id": "01a13211-c5dd-79c1-b40e-41b74d34f67c",
    "seconds": 28,
    "usage": {
      "input_tokens": 128885,
      "cached_input_tokens": 88704,
      "cache_write_input_tokens": 0,
      "output_tokens": 686,
      "reasoning_output_tokens": 20
    },
    "saved_at": "2026-10-12T21:43:35.744Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/core.mjs writeField records a fresh ISO timestamp whenever status is set to approved. Passing test '0139 AC1' exercises the CLI, timestamp format and replacement on re-approval."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html panelModel stops approved timers at approved_at; render excludes them from startCounters. Passing '0139 AC2' tests exercise rendered counters with an advancing clock and confirm building/reviewing timers continue."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelModel derives both shipped minutes and median inputs from approved minus started. Passing '0139 AC3' verifies the model, median and rendered Shipped row."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panelModel falls back to finished when approved is absent or invalid and returns no duration without started. Passing '0139 AC4' tests cover missing timestamps, unreadable approval and approval before started."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0139-tests.txt: 1240 tests, 1237 passed, 3 skipped and zero failures. Existing tests were not modified; all six new ticket tests passed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Build times now stop at approval, excluding the wait for shipping from queue timers and shipped-time medians. Older tickets retain their previous timing behaviour. The tests exercise the actual timestamp writes and panel behaviour, and the full suite reports no failures. No blocking concerns found."
  }
}
```

</details>
