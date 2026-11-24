---
id: "0739"
title: "Fix the full suite failing on main at ca0dfcb"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T17:46:15.632Z"
approved: "2026-11-24T17:53:42.990Z"
finished: "2026-11-24T17:56:35.733Z"

---
# 0739 · Fix the full suite failing on main at ca0dfcb

**Status:** ✅ done

## Problem
The full suite fails on main at commit ca0dfcb (ca0dfcb1c1f0915b47bdc98deacf395f57422cfb). Failing tests:
- 0058 AC3 and AC4: in a real browser the counter ticks between polls, and a selection in or across it stays
- 0164 AC3: in a browser whose pointer can't hover, a tapped card keeps its background, and an opened card keeps its opened colour

## Outcome
The full suite passes on main again.

## Acceptance criteria
1. Each of these tests passes on main again: 0058 AC3 and AC4: in a real browser the counter ticks between polls, and a selection in or across it stays, 0164 AC3: in a browser whose pointer can't hover, a tapped card keeps its background, and an opened card keeps its opened colour.
2. No test that passed before this change fails.

## Out of scope
- Changes the failing tests don't need.

## Notes
Failing before this build: 0058 AC3 and AC4 (in a real browser the counter ticks between polls, and a selection in or across it stays), 0164 AC3 (in a browser whose pointer can't hover, a tapped card keeps its background, and an opened card keeps its opened colour). The recorded output kept only its tail, so these come from the ticket.
Cause, 0058 AC3 and AC4: the test's build started 7 min 58 s ago and the counter shows whole minutes rounded down, so after the test's two one-minute steps it read 9 min or 10 min depending on whether the panel and browser started in under two seconds; the test expects two digits. Fixed in the test: the build starts 8 min 30 s ago, so it reads 10 min after two steps unless startup takes over 30 seconds.
Cause, 0164 AC3: since 0727 took Set ready off a closed Plan row, the title runs further left, right above the details line's tags. The test tapped 4 px inside the title's left end, 2 px above the "low" tag, and Chrome's touch adjustment moved the tap onto that tag (a focusable button), so the card didn't open. Found by bisecting: 61061405 passes, ca0dfcb (0727) fails. Fixed in the test: the tap is in the middle of the title, away from every button.
No product code changes: both were the tests' own assumptions. Pictures: none, because nothing anyone sees changes.
Self-check: no changes

## In plain words
Nothing changes in speck itself. Two of speck's own browser checks were failing on main because of how they were written, not because the panel was wrong: one depended on how quickly the panel started, and the other tapped so close to a tag that the browser counted the tap as on the tag. Both now check the same things without those assumptions, so the full suite passes again and the ship queue can carry on. Worth a look: on a phone, a tap near the start of a closed Plan row's title may land on a tag instead of opening the row (saved as an idea).

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 83,817
- Elapsed since build started: 7 min
- Changed lines: 0 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- On a touch screen, a tap near the start of a closed Plan row's title can land on the tag under it (speck/ideas/2026-11-24-keep-a-tap-on-a-plan-row-s-title-off-its-tags.md).
- 0058 AC3 and AC4 still rely on the panel and browser starting within 30 seconds of the test writing its ticket.

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
    "reviewed_sha": "eb5f6e3f7d34c86db1e7443608682e6bd905658d",
    "session": "fresh",
    "thread_id": "01a20eb0-969f-7390-b4fd-88df7c9b8530",
    "builder_response": "- Tests run: test/panel-0058.test.mjs test/panel-0164.test.mjs (speck test --related: no other test file names a file this branch changed)\n- This is a type: fix ticket. Only the two failing tests the criteria name are changed; no product code changes. Causes, and the bisect for 0164 (61061405 passes, ca0dfcb / 0727 fails), are in the ticket's Notes.\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 83228,
      "cached_input_tokens": 50304,
      "cache_write_input_tokens": 0,
      "output_tokens": 589,
      "reasoning_output_tokens": 13
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 32924,
      "cached": 50304,
      "write": 0,
      "output": 589
    },
    "cost_usd": 0.0767684,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T17:53:24.533Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Both named browser tests passed without skipping in /tmp/speck-0739-tests.txt. panel-0058.test.mjs retains its timer, selection and minimal text replacement assertions; panel-0164.test.mjs retains real touch events and open/closed background assertions."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The recorded run has 154 passes, zero failures and three unrelated skips. Changes are confined to the two named tests' setup and the ticket record; no product code or assertions changed. The whole suite remains the shipping check."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change fixes two brittle browser test assumptions while preserving their checks. Both affected tests ran and passed. No product behaviour changes or blocking concerns were found."
  }
}
```

</details>
