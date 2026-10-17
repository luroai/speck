---
id: "0262"
title: "Make the README tests pass again after the README revision"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
created: 2026-10-17
started: "2026-10-17T07:03:30.339Z"
approved: "2026-10-17T07:09:31.216Z"

---
# 0262 · Make the README tests pass again after the README revision

**Status:** 👍 approved

## Problem
Seven README tests fail on main, so `speck ship` refuses every approved ticket, 0257 included, and nothing can ship. They started failing after the README was revised on GitHub (commit 1041577, merged into main as 9ffa622). The failing tests are 0249 AC1, 0250 AC1, 0251 AC1, AC2, AC3 and AC5, and 0255 AC1. 0250 AC1 and 0255 AC1 expect the README's plain line to read "…the same way every time, so you can set them going, walk away and trust what you come back to." but it now ends at "every time.". 0249 AC1 says "the picture comes after the opening paragraph", and the 0251 tests say "the plain line comes before the image".

## Outcome
main's whole test suite passes again, and the README keeps what the revision on GitHub meant to say.

## Acceptance criteria
1. On main, `test/readme-0249.test.mjs`, `test/readme-0250.test.mjs`, `test/readme-0251.test.mjs` and `test/tagline-0255.test.mjs` all pass.
2. The README's opening keeps the intent of the revision in commit 1041577. Where a test checks wording or an order that the revision changed on purpose, the test is updated to the new README and says so in a comment, rather than the README being put back as it was.
3. No test is deleted or skipped to get there, and no other test starts failing.

## Out of scope
- Any other change to the README.
- Changes outside the README and these four test files.

## Notes
- The seven tests above failed in the full run recorded for main at 9ffa622 on 2026-10-17. Fixing them is this ticket's whole purpose.
- Which side to change, the README or a test, depends on what the revision meant. Read `git show 1041577` before changing either.
- Failing before this build: 0249 AC1, 0250 AC1 (the README opens with the tagline…), 0251 AC1, AC2, AC3 and AC5, and 0255 AC1. The recorded result for 9ffa622 failed (exit code 1); its saved output is cut short, so these seven come from running the four README test files. They are this ticket's subject, so unlike other failures from before a build they are fixed here, as the ticket's Notes say.
- The revision rewrote the opening on purpose (shorter plain line, the two-decisions paragraph reworded and moved before the trust paragraph, the why paragraph no longer carrying the trust points), so the README is left as it is and only the four test files change, each with a `0262:` comment where it does. The comments name the revision as "made on GitHub" rather than by its commit id, which 0085 AC3 forbids in tests.
- Self-check: no changes
- No test file of this ticket's own: its scope allows changes only to the README and the four test files (review round 1, F1). AC1 is checked by running those four files. AC2 and AC3 are checked by reading the diff: the README is unchanged, each changed check has a `0262:` comment, and all 20 tests are still there with none skipped.

## In plain words
The README's checks had fallen behind the new README wording, so every approved ticket was refused at ship time. The checks now follow the new wording, and the README itself is unchanged. Once this ships, approved tickets, 0257 included, can ship again. To see it, read the top of the README: it reads just as the revision on GitHub left it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 This new file breaches the ticket's explicit scope: changes outside README.md and the four named test files are excluded.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 354,185
- Elapsed since build started: 6 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups (Delivery log only, no inbox notes):
  - The README now says you can let speck ship low-risk tickets on its own, while `auto_ship_risk` can also cover high-risk ones. Narrower than the setting, not wrong.
  - `docs/brief.md` still opens with the old "You own two decisions… Everything in between is automated." wording. It no longer matches the README word for word, though nothing checks that they match.

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
    "reviewed_sha": "7de94d5157fec4119eb0751a8c108d0048af77b6",
    "thread_id": "01a148b1-0ccc-7572-89b6-f1b3da877545",
    "seconds": 19,
    "usage": {
      "input_tokens": 130793,
      "cached_input_tokens": 89984,
      "cache_write_input_tokens": 0,
      "output_tokens": 622,
      "reasoning_output_tokens": 32
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T07:09:03.485Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "/tmp/speck-0262-tests.txt records all 20 tests in the four specified files passing."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "git show 1041577 confirms the intentional wording and paragraph changes. README.md is unchanged; the four existing test files update their assertions accordingly and explain the changes with 0262 comments."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The diff preserves every existing test without skips. The recorded run passes all 23 tests, with no failures or skips. Changes to existing assertions follow the intentional README revision; whole-suite verification remains the shipping gate."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/readme-0262.test.mjs",
        "issue": "This new file breaches the ticket's explicit scope: changes outside README.md and the four named test files are excluded. It also contradicts the builder's note that only those four test files change.",
        "suggested_fix": "Remove the newly added test/readme-0262.test.mjs from this change and rerun the four permitted test files. Their existing tests directly exercise the revised README.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The updated tests correctly follow the intentional README revision, and all specified tests pass. Approval is held because the change adds a fifth test file despite the ticket explicitly limiting changes to four. Remove that extra file before merge."
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
    "reviewed_sha": "fb717305b910dfa12c3baffaa721b119fc6a020b",
    "thread_id": "01a148b1-0ccc-7572-89b6-f1b3da877545",
    "seconds": 10,
    "usage": {
      "input_tokens": 221739,
      "cached_input_tokens": 173824,
      "cache_write_input_tokens": 0,
      "output_tokens": 1031,
      "reasoning_output_tokens": 32
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T07:09:22.085Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "/tmp/speck-0262-tests.txt records all 20 tests in the four specified files passing, with zero failures."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "README.md remains unchanged. The four test files check the wording and order intentionally introduced by commit 1041577, with 0262 comments explaining the updates. Their passing assertions exercise the revised opening."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The diff preserves all 20 pre-existing tests without skips. All pass in the recorded run. Only the four permitted test files and the ticket's review records differ from main; whole-suite verification remains the shipping gate."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/readme-0262.test.mjs",
        "issue": "The added fifth test file exceeded the ticket's explicit scope. It has now been removed from the change.",
        "suggested_fix": "No further action required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The tests now follow the intentional README revision without changing the README. All 20 tests in the four specified files pass. The extra file has been removed, resolving the scope concern. The change is ready for the owner's merge decision."
  }
}
```

</details>
