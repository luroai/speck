---
id: "0263"
title: "Ship a fix ticket while shipping is on hold for a failing base branch"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T08:53:19.305Z"
approved: "2026-10-17T08:55:26.721Z"

---
# 0263 · Ship a fix ticket while shipping is on hold for a failing base branch

**Status:** 👍 approved

## Problem
When a ship finds the base branch's own tests failing, `speck run`'s ship queue holds every ship until the base branch has a new commit. The fix ticket that would give it that commit waits behind the hold too, so nothing ships until someone ships the fix by hand. This happened with 0262 on 2026-10-17: it was approved and covered by `auto_ship`, but it sat unshipped.

## Outcome
While shipping is on hold for a failing base branch, speck run still ships an approved fix ticket that `auto_ship` covers, so a broken base branch is mended without anyone stepping in.

## Acceptance criteria
1. While the ship queue is on hold for the base branch's commit, an approved ticket with `type: fix` that `auto_ship` covers is shipped on the queue's next check, without the base branch getting a new commit first.
2. While the hold is on, approved tickets of any other type still aren't shipped until the base branch has a new commit, as today.
3. When the fix ticket's own ship ends without shipping, the hold stays on, and that fix ticket isn't tried again until the base branch or its branch has a new commit.
4. When speck run ships a fix ticket during a hold, it prints a line saying it's shipping that fix ticket despite the hold.

## Out of scope
- Which tests a refusal blames on the base branch: 0264.
- Making fix tickets automatically. The build's "Base branch failing" steps already do that.

## Notes
- The hold is in `scripts/ship-queue.mjs` (`hold`, set on exit 14 in `ended`, checked first in `check`). `shipOrder` already puts fix tickets first.
- Seen on 2026-10-17: 0257's ship exited 14, the hold went on, and 0262 (type fix) was approved at 07:09 but not shipped.
- Failing before this build: none
- Self-check: the line putting shipping on hold now says a fix ticket still ships, as it otherwise said no ship would start; test added.

## In plain words
When the main branch's own tests start failing, speck run pauses shipping until the main branch changes. Before, that pause also held back the fix ticket meant to mend it, so nothing shipped until someone shipped the fix by hand. Now an approved fix ticket ships during the pause, and everything else still waits.

To see it: while shipping is paused, approve a fix ticket that auto-ship covers. speck run prints a line saying it's shipping that fix despite the pause, and once the fix lands, shipping resumes for everything else. If the fix's own ship fails, the pause stays on and the fix waits for a new change before it's tried again.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 91,312
- Elapsed since build started: 2 min
- Changed lines: 10 (limit 5000)
Follow-ups: none.

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
    "reviewed_sha": "541dc1155ea3ce1d6e72ceb069401c00c5824795",
    "thread_id": "01a14912-5fa5-7403-93c8-1b246e8dd77a",
    "seconds": 16,
    "usage": {
      "input_tokens": 90696,
      "cached_input_tokens": 51712,
      "cache_write_input_tokens": 0,
      "output_tokens": 616,
      "reasoning_output_tokens": 87
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T08:55:19.422Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/ship-queue.mjs check() allows fix tickets through the hold while shipOrder() retains approval and auto_ship checks. Both AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "check() skips every non-fix ticket while hold remains set. The passing AC2 test checks continued blocking after a fix refusal and resumption after main gains a commit."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "ended() retains the hold after refusal, and check() compares last-attempt branch commits before retrying. Passing AC3 tests cover exits 1 and 14, unchanged commits, and retries after either branch advances."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "check() prints the fix ticket ID and 'shipping it despite the hold' before launch. Passing AC4 tests cover this message, its absence without a hold, and the updated hold announcement."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Approved fixes can now proceed while ordinary shipping is paused for a failing base branch. Other tickets remain paused, and refused fixes wait for a new commit before retrying. The change is narrowly scoped; all 54 reported tests passed, with no blocking concerns found."
  }
}
```

</details>
