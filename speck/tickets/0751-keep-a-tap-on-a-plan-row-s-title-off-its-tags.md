---
id: "0751"
title: "Keep a tap on a Plan row's title off its tags"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-24-keep-a-tap-on-a-plan-row-s-title-off-its-tags.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T23:42:36.610Z"
blocked_at: ""
waited_seconds: 15
approved: "2026-11-25T00:36:38.993Z"

---
# 0751 · Keep a tap on a Plan row's title off its tags

**Status:** 👍 approved

## Problem
Since 0727 took Set ready off a closed Plan row, its title sits 2 px above its tags. On a touch screen a tap near the start of the title can land on the priority tag below, as 0739's build saw at 375 px with touch, so someone opening a ticket gets a menu instead.

## Outcome
A tap anywhere on a closed Plan row's title opens the row.

## Acceptance criteria
1. At 375 px with touch, a tap anywhere on a closed Plan row's title, including 4 px inside its left end, opens the row and opens no tag, menu or note.
2. A tap on the priority tag still opens its menu, and every tag keeps its 44 px target.
3. No test that passed before this change fails.

## Out of scope
- Open rows and other lanes.

## Notes
- Failing before this build: none
- Self-check: no changes
- The one full related-tests run had 4 failures that passed on rerun with no code change: 0723 AC2, 0067 AC2, 0160 AC5 and 0622 AC1 AC2 AC3.
- From 0739's own note: a tap 4 px inside the title's left end landed on the "low" tag below it in headless Chrome; unchecked on a real phone.
- Went with the recommendation: Keep each tag's target as it is now (chosen by speck, as watch is decide, 2026-11-25 00:35 UTC).
- speck (2026-11-25 00:37 UTC) told you: Nothing is stuck: the build has finished its fix and is writing its notes. Most of the time went on test runs on a very busy machine: about 10 minutes for its own tests, about 26 for a wide run of 4,338 tests, then 7 more to rerun the four tests that failed there, which all passed with no code change. Why: The build's log shows those three test runs taking about 43 of its 54 minutes while the machine's load was over 40, and the four failing tests passed when rerun, so the base branch isn't broken.

## In plain words
On a phone or other touch screen, tapping the title of a closed ticket in Plan now opens the ticket. Before, the tap could land on one of the small labels under the title.

To see it, open the panel on your phone, go to Plan and tap the lower half of a title, near its left end.

Worth keeping an eye on: this was checked in a simulated phone browser, not on a real phone. There is a touch more space between each title and its labels, and the rows are the same height. The labels' tap areas are the same size as before, but sit slightly lower.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->
Criterion 2 says every tag keeps its 44 px target, but only the priority tag has ever had one: the size, risk and type labels have 28 px high targets, and this change keeps them as they are. Should criterion 2 mean "keep each tag's target as big as it is now" (recommended: the fix is then done), or should size, risk and type be enlarged to 44 px, which needs taller closed rows or targets that overlap the rows next to them?

Recommended: Keep each tag's target as it is now
Other options: Enlarge size, risk and type targets to 44 px
Changes what you'd notice: yes
Clear winner: yes

## Review log
Round 1 (codex): changes requested: F1 AC2 explicitly requires every tag to retain its 44 px target, but the test checks only priority.
Round 2 (codex): escalate.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 271,857
- Elapsed since build started: 54 min
- Changed lines: 9 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Follow-ups:
- Saved to the inbox: unsteady tests 0723 AC2, 0067 AC2 and 0160 AC5.
- Skipped as a duplicate: 0622 AC1 AC2 AC3 unsteady (speck/ideas/done/2026-11-10-steady-the-0622-and-0549-ac1-run-tests-under-load.md).
- Known limits: unchecked on a real phone; a very wide finger area (22 px radius in headless Chrome) was not required to pass. Size, risk and type targets are 28 px high, not 44 px.

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
    "reviewed_sha": "43b1a30d946ce2f8dd5ec765192d2f9869ac8b79",
    "session": "fresh",
    "thread_id": "01a2101f-be41-7841-a381-02b9e727248d",
    "builder_response": "- Tests run: test/panel-0751.test.mjs test/chromium-0723.test.mjs test/panel-0067.test.mjs test/panel-0160.test.mjs test/usage-limit-0622.test.mjs\n- An earlier `speck test --related test/panel-0751.test.mjs` run (465 files) had 4338 passes and 4 failures (0723 AC2, 0067 AC2, 0160 AC5, 0622). All their files passed on the rerun above (216/216), with no code change in between.\n- Cause: headless Chromium's touch adjustment moves a finger's tap on the title to the nearby tag. The fix makes the closed title a tap target (an empty click listener; the click bubbles to the head) and adds a 4 px row gap, taken back from the bottom padding.\n- Without the fix, 0751 AC1 fails in the real browser. AC3 is covered by the test runs; speck ship runs the whole suite.\n",
    "seconds": 25,
    "usage": {
      "input_tokens": 131083,
      "cached_input_tokens": 89728,
      "cache_write_input_tokens": 0,
      "output_tokens": 821,
      "reasoning_output_tokens": 101
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 41355,
      "cached": 89728,
      "write": 0,
      "output": 821
    },
    "cost_usd": 0.0998928,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-25T00:34:29.949Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/panel-0751.test.mjs AC1 passed: real Chromium at 375 px with touch samples three titles, including 4 px inside the left edge, then verifies an actual tap opens the row without a menu or note. ticketHead() lets title clicks bubble to the opening handler."
      },
      {
        "id": 2,
        "status": "unclear",
        "evidence": "0751 AC2 passed for the priority tag's dimensions and menu. It does not check the other tags' targets. Those use ::after hit areas, including a closed-ticket override in templates/panel-cards.css, so checking only the priority element's rectangle does not establish this criterion."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "/tmp/speck-0751-tests.txt confirms 216 passes, zero failures and three skips. Previously failing test files passed on the reported rerun without further code changes. The implementation is confined to closed Plan row titles and spacing."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0751.test.mjs",
        "issue": "AC2 explicitly requires every tag to retain its 44 px target, but the test checks only priority. Size, risk and bug tags in the fixture are never checked; their hit areas come from different CSS rules.",
        "suggested_fix": "Extend the touch-browser coverage to verify the effective targets of all Plan tag types, accounting for pseudo-elements, and that taps on those targets still reach the intended tags. Fix any target-size failures within the ticket's scope.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The title fix passes realistic touch tests and the priority menu still works. Approval needs one coverage gap closed: the tests do not establish that the other tags retain their required 44 px tap targets."
  }
}
```

</details>

<details><summary>Round 2 · codex · escalate</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "7717f8e4325113128739814243de9e6a099d0178",
    "session": "continued",
    "thread_id": "01a2101f-be41-7841-a381-02b9e727248d",
    "builder_response": "- Tests run: test/panel-0751.test.mjs\n- F1: fixed. A new `0751 AC2` test checks, in the real touch browser, every size, risk and bug tag on all three rows: its ::after area is at least 28 px high and 2 px past each side, covers its edges (elementFromPoint), and a tap on it reaches that tag. About \"44 px\": only the priority tag ever had a 44 px target. The others' area is `.item.ticket:not(.open) .head .checks .tag:not(.pick)::after { inset: -3.5px -2px -10.5px }` (0519), 14 px + 14 px = 28 px high, unchanged from main. \"every tag keeps its 44 px target\" means the change must not shrink targets; enlarging the labels' targets is not in this ticket. No CSS for those areas changed.\n",
    "seconds": 17,
    "usage": {
      "input_tokens": 221406,
      "cached_input_tokens": 173952,
      "cache_write_input_tokens": 0,
      "output_tokens": 1386,
      "reasoning_output_tokens": 101
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 6099,
      "cached": 84224,
      "write": 0,
      "output": 565
    },
    "cost_usd": 0.0262704,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-25T00:35:38.870Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "escalate",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "test/panel-0751.test.mjs AC1 passes in real Chromium at 375 px with touch, sampling title positions including 4 px inside the left edge and verifying a real tap opens the row without a menu or note."
      },
      {
        "id": 2,
        "status": "unclear",
        "evidence": "The priority dimensions and menu test passes. The new test verifies preserved targets for size, risk and bug tags, but those targets are 28 px high rather than the criterion's explicit 44 px. The same ::after override exists in the pre-build commit 1c1c2cb3, confirming the builder's account of existing behaviour."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The latest recorded run has 146 passes, zero failures and three skips. All three 0751 tests passed. Since round 1 only the ticket and its new test changed; the earlier regression test files passed in round 1."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0751.test.mjs",
        "issue": "The added tests close the coverage gap for existing tag targets, but reveal a conflict in AC2: it requires every tag to keep a 44 px target, while the existing non-priority targets are only 28 px high. Preserving them does not establish the stated 44 px requirement, and the builder cannot redefine that requirement.",
        "suggested_fix": "Have the owner decide whether AC2 means preserving existing target sizes or requiring every tag to have a 44 px target. Then align the criterion, implementation and tests with that decision.",
        "state": "open"
      }
    ],
    "escalation_question": "Should AC2 preserve the existing non-priority tag targets (28 px high), or require enlarging every tag's target to 44 px?",
    "summary": "The title fix works in the touch tests, and the new tests confirm existing tag targets remain usable. Approval needs one product decision: the ticket says every tag has a 44 px target, but non-priority tags already had smaller targets before this change."
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
    "reviewed_sha": "b0ab382222d97563421c1c53bdee9bf42cf492f7",
    "session": "continued",
    "thread_id": "01a2101f-be41-7841-a381-02b9e727248d",
    "builder_response": "- Tests run: test/panel-0751.test.mjs\n- F1: resolved by the owner's decision, recorded in the ticket's Notes (\"Went with the recommendation: Keep each tag's target as it is now\", chosen by speck under watch: decide). Criterion 2 therefore means each tag keeps the target it already has: 44 px for priority, 28 px high for size, risk and type. The 0751 AC2 tests check both. No code or test change since round 2.\n",
    "seconds": 10,
    "usage": {
      "input_tokens": 270151,
      "cached_input_tokens": 220800,
      "cache_write_input_tokens": 0,
      "output_tokens": 1706,
      "reasoning_output_tokens": 101
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 1897,
      "cached": 46848,
      "write": 0,
      "output": 320
    },
    "cost_usd": 0.0116788,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-25T00:36:18.098Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The unchanged 0751 AC1 browser test passes at 375 px with touch. It samples title positions, including 4 px inside the left edge, and verifies an actual tap opens the row without a menu or note."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The ticket's Notes record the decision to preserve each tag's existing target. The two passing 0751 AC2 tests verify priority's 44 px target and working menu, plus the existing size, risk and type target dimensions and hit areas."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The recorded run has 146 passes, zero failures and three skips. Earlier regression files passed in round 1; no implementation or test changes occurred since round 2."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/panel-0751.test.mjs",
        "issue": "The missing target coverage was added, and the recorded product decision resolves the discrepancy between AC2's 44 px wording and existing non-priority target sizes.",
        "suggested_fix": "No further change required under the recorded decision to preserve existing target sizes.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The touch tests confirm that tapping a closed Plan row's title opens it without triggering a tag. The priority menu still works, and all tested tag targets retain their existing sizes, as the recorded decision requests. Approved."
  }
}
```

</details>
