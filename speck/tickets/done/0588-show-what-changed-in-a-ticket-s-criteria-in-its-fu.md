---
id: "0588"
title: "Show what changed in a ticket's criteria in its full view"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0583","0585"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T21:24:55.435Z"
approved: "2026-11-09T21:32:35.211Z"
finished: "2026-11-09T21:36:46.557Z"

---
# 0588 · Show what changed in a ticket's criteria in its full view

**Status:** ✅ done

## Problem
When a build changes a ticket's acceptance criteria, it waits for you at Ship (0565), and its review pack lists what changed. Its full view and its row don't say so, so you can't see why it's waiting without opening the pack.

## Outcome
A ticket whose criteria changed says so in its row and its full view, with what each was and is now.

## Acceptance criteria
1. `speck status --json` gives each open ticket whose criteria changed, for each changed, added or removed criterion, its text when the ticket was set ready and its text now.
2. Its full view shows, above the facts, a callout with speck's face, sheepish: "I changed criterion 2 while building", each change as Was and Now, and a line saying it won't ship by itself.
3. Each changed criterion in its list is marked "changed".
4. Its Build row reads "Approved · waiting at Ship: a criterion changed".
5. No test that passed before this change fails.

## Out of scope
- Stopping a build from changing its criteria.

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- 0565 added `criteria_changed` to `statusData` in `scripts/speck.mjs` and the "Criteria changed" part of the review pack in `scripts/pack.mjs`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes. Text that isn't what status gives (older status, odd values) was already covered by tests written with the feature.
- `--related` doesn't pick up the panel test files, which reach the page through a support module, so this build also ran every test file that uses the Build row or the full view.
- Marks: an added criterion is marked "added" rather than "changed", matching what the callout says about it. The 0565 sentence that a criterion changed moved from the live section into the callout, so it says it once.

## In plain words
When a build changes a ticket's acceptance criteria, you no longer have to open its review pack to see why it's waiting. Its Build row says "Approved · waiting at Ship: a criterion changed". Its full view has a callout above the facts, with speck looking sheepish, saying which criteria it changed, each one's old and new wording, and that it won't ship by itself. Each changed criterion in the list is marked too, and a new one is marked "added".

To see it, open any ticket whose criteria were edited during its build. Worth a look: the callout shows while the ticket is still being built as well, not only once it's approved.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 143,781
- Elapsed since build started: 8 min
- Changed lines: 68 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "f2436ae6a99365eaf89cd830f309eca7fa3b06e0",
    "session": "fresh",
    "thread_id": "01a1c239-b1fb-7ca1-9a41-5771335c6ccb",
    "builder_response": "- Tests run: --related with test/criteria-0588.test.mjs test/criteria-0565.test.mjs and every other test file that names the Build row, the full view or criteria_changed (127 files in all). --related alone doesn't pick up panel test files, as they reach the page through a support module.\n- AC5: the 0565 tests are unchanged and pass: the row's tooltip is still 0565's sentence (the row's own words are the new ones), and 0565's full-view sentence moved from the live section into the callout, so it's said once.\n- An added criterion is marked \"added\" in the list, not \"changed\", to match the callout; a removed one is no longer in the list, so only the callout shows it.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 143131,
      "cached_input_tokens": 102144,
      "cache_write_input_tokens": 0,
      "output_tokens": 650,
      "reasoning_output_tokens": 46
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 40987,
      "cached": 102144,
      "write": 0,
      "output": 650
    },
    "cost_usd": 0.0986884,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T21:32:27.363Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs statusData exposes criteria_changes using criteriaChanges. Passing AC1 tests exercise CLI JSON, changed, added, removed and layout-only changes."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel-popups.js criteriaCallout and paneSteps place the sheepish face, change heading, Was/Now text and shipping explanation above the facts. Passing AC2 tests cover these and updates to an open view."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "fullTicket marks changed criteria as 'changed' and additions as 'added'. The passing AC3 test verifies the marks and leaves unchanged criteria unmarked."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "templates/panel-model.js SHORT supplies the required Build row wording. The passing AC4 test checks it for an approved ticket whose criteria changed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified the saved test output: 2,398 passed, zero failed and three skipped across the reported related panel and criteria tests. Existing tests were not modified."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The ticket now explains what changed in its criteria, shows the previous and current text, and clearly says it is waiting for you to ship it. The tests exercise the requested behaviour and report no failures. No blocking concerns found."
  }
}
```

</details>
