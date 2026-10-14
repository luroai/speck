---
id: "0190"
title: "Fix the 0165 phone tag-size test failing on main"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T20:59:04.574Z"
approved: "2026-10-14T21:07:59.697Z"
finished: "2026-10-14T21:10:36.908Z"

---
# 0190 · Fix the 0165 phone tag-size test failing on main

**Status:** ✅ done

## Problem
One test fails on main every time: "0165 AC1: at 375 px, every tag in Plan, the Build queue and the full ticket pane has the same visible size and even gaps, with a 44 by 44 px tap area each". It reports "queue P0: these points of its 44 px tap area miss it", at two points (x 76.9 and 55.4, y 630.5). Because main's tests fail, no ticket can ship automatically: 0175 is approved and waiting on this.

## Outcome
The full test suite passes on main again.

## Acceptance criteria
1. The test "0165 AC1: at 375 px, every tag in Plan, the Build queue and the full ticket pane has the same visible size and even gaps, with a 44 by 44 px tap area each" passes on main.
2. No other test that passed before this change fails.

## Out of scope
- Changing what 0165 asked for (same-size tags with a 44 by 44 px tap area on a phone).

## Notes
<!-- Constraints, links and decisions. Optional. -->
- Seen on main at 59fc8d0 on 2026-10-14, and in every full run during 0175's build that day. The cause hasn't been looked into: the test output shows only that two points of the P0 queue tag's tap area miss it.
- Failing before this build: 0165 AC1: at 375 px, every tag in Plan, the Build queue and the full ticket pane has the same visible size and even gaps, with a 44 by 44 px tap area each. This is the test this fix ticket exists to make pass, so this build fixes it, without changing the test or what 0165 asks for.
- Cause: 0164 gave the queue's Queued line its own stacking layer (`.act { isolation: isolate; }`), so it now sits above the tags' tap areas. On a phone that line starts 6 px below the tags, but each tag's tap area reaches 7.5 px below it, so the line covers the bottom 1.5 px of the tap areas of the tags above it.
- Fix: on a phone, the line under a queue row's top starts 8 px below it rather than 6 px, clear of the tags' tap areas. The line keeps its own layer, so 0164's id taps are unchanged.
- Self-check: the comment on the new rule said it was only for the Queued line, but it covers any line straight under a queue row's top (a paused or blocked ticket's line too, which sits under its badge row and so just gets 2 px more space on a phone), so the comment now says so.

## In plain words
On a phone, the line under a waiting ticket in the Build queue (the one that says "Queued") now sits a touch lower, 2 px, under the ticket's tags. Before, it covered the bottom edge of each tag's tap area, so a tap there did nothing. That broke one of speck's own checks and stopped any ticket from shipping by itself. With that check passing again, approved tickets can ship on their own once more.

To see it, open the panel on a phone and tap just under a tag on a queued ticket: its meaning still shows. Worth keeping an eye on: when that line also names another ticket ("unlocks …" or "waiting on …"), the ticket number can still catch taps on the bottom edge of the tags above it. That's saved to the inbox as a follow-up.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 89,658
- Elapsed since build started: 9 min
- Changed lines: 3 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - On a phone, a linked id in a queued ticket's Queued line ("unlocks …", "waiting on …") still takes taps from the bottom edge of the tags above it: its tap area reaches about 14 px up. Saved to the inbox as speck/ideas/2026-10-14-keep-a-queued-ticket-s-tags-tappable-above-a-linked-id.md.

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
    "reviewed_sha": "a11b06ea26fd23e123b24cbe2dbfdaa586cf73fd",
    "thread_id": "01a13c3d-9f64-7881-9c6e-b92a8cdb8ec2",
    "seconds": 24,
    "usage": {
      "input_tokens": 89126,
      "cached_input_tokens": 50688,
      "cache_write_input_tokens": 0,
      "output_tokens": 532,
      "reasoning_output_tokens": 0
    },
    "saved_at": "2026-10-14T21:07:37.898Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The full output in /tmp/speck-0190-tests.txt records the unchanged 0165 AC1 test at 375 px passing. templates/panel.html adds a phone-only margin of 8 px below the queue top row; test/panel-0190.test.mjs additionally checks actual browser hit targets around all tags on two queued tickets."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The full suite records 1,641 passes, zero failures and three unrelated legacy skips. The original tests are unchanged. The new 0190 test also verifies that the dependency id in the Queued line remains reachable."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The fix adds 2 px of space below queue tags on phones so the line beneath them no longer blocks their tap areas. The original failing test and the full suite pass, with no tests weakened. I found no blocking concerns."
  }
}
```

</details>
