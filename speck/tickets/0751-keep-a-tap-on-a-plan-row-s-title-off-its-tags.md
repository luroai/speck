---
id: "0751"
title: "Keep a tap on a Plan row's title off its tags"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0751 · Keep a tap on a Plan row's title off its tags

**Status:** 🔍 reviewing

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
- From 0739's own note: a tap 4 px inside the title's left end landed on the "low" tag below it in headless Chrome; unchecked on a real phone.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
