---
id: "0699"
title: "Fix the full suite failing on main at efde0c4"                # one outcome, no "and"
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
created: 2026-11-15
started: "2026-11-15T22:37:34.256Z"
approved: "2026-11-15T22:43:27.685Z"
finished: "2026-11-15T22:48:10.855Z"

---
# 0699 · Fix the full suite failing on main at efde0c4

**Status:** ✅ done

## Problem
The full suite fails on main at commit efde0c4 (efde0c4030ec6432cdec87bac42191fddd58b5a1). Failing tests:
- 0476 AC2: a sideways scroll on a trackpad and the arrow keys change lane in the same time; with reduced motion, without sliding
- 0624 AC3: every fact is still shown with the same value, for a draft, a build and a shipped ticket

## Outcome
The full suite passes on main again.

## Acceptance criteria
1. Each of these tests passes on main again: 0476 AC2: a sideways scroll on a trackpad and the arrow keys change lane in the same time; with reduced motion, without sliding, 0624 AC3: every fact is still shown with the same value, for a draft, a build and a shipped ticket.
2. No test that passed before this change fails.

## Out of scope
- Changes the failing tests don't need.

## Notes
<!-- Constraints, links and decisions. Optional. -->
Failing before this build: not checked (the recorded result, from f049820, is the quick suite's and passed; the full suite's failures are the two tests this ticket names)
Causes found:
- 0624 AC3: 0694 (AC4) added a Built with fact to a shipped ticket's full view, so the list of facts the test expects was out of date. The fix adds Built with, Not recorded (the fixture has no recorded build models), in the place the panel shows it.
- 0476 AC2: passes on its own; in full-suite runs it failed on and off since 2026-11-09 with "the slide ends within 120 ms (120.001 to 120.05 ms)". The slide lasts exactly 120 ms, and one that has only just started can read a fraction of a millisecond over, so the check now allows under 121 ms. A slide taking longer than 120 ms still fails it.
No code outside the tests changes: no test is written for this ticket beyond the two it names, which check it.
Self-check: no changes

## In plain words
Nothing changes in speck itself. Two of speck's own checks were out of step: one still expected the full ticket view without the new Built with figure, and one measuring how fast the lanes slide failed now and then by a fraction of a millisecond. Both now match how the panel really behaves, so the full set of checks on main should pass again. Keep an eye on the next full run: if the slide check still fails now and then, the cause is something else.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 163,462
- Elapsed since build started: 6 min
- Changed lines: 0 (limit 5000)
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
    "reviewed_sha": "3228720f4456621ef107738ae31e045fc08dd02e",
    "session": "fresh",
    "thread_id": "01a1e160-a4d3-7330-a665-8b95e5244b67",
    "builder_response": "- Tests run: test/panel-0476.test.mjs test/panel-0624.test.mjs (with --related, which found no other test file naming a changed file; the commands.checks files ran too)\n- This is a type: fix ticket: it changes only the two failing tests its acceptance criteria name, and no code.\n- 0624 AC3: 0694 AC4 added a Built with fact to a shipped ticket's full view (templates/panel.js, before Builder cost). The expected list now has ['Built with', 'Not recorded'] there; the fixture records no build models, so Not recorded is what 0694's own tests expect.\n- 0476 AC2: the full-suite failures since 2026-11-09 read \"the slide ends within 120 ms (120.001 … 120.05 ms)\" (speck/.cache/runs/0595, 0604, 0621 ship logs). SLIDE_MS is 120, so a slide that has only just started reads a fraction of a millisecond over when its start time is a frame ahead of the page's clock. settles now allows left < 121; a slide longer than 120 ms (e.g. the 200 ms before 0517) still fails it.\n",
    "seconds": 31,
    "usage": {
      "input_tokens": 162711,
      "cached_input_tokens": 124288,
      "cache_write_input_tokens": 0,
      "output_tokens": 751,
      "reasoning_output_tokens": 8
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 38423,
      "cached": 124288,
      "write": 0,
      "output": 751
    },
    "cost_usd": 0.0967848,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T22:43:20.086Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The full recorded output in /tmp/speck-0699-tests.txt shows both named tests passing (tests 66 and 89). panel-0624.test.mjs retains all existing fact assertions and adds the Built with fallback rendered by templates/panel.js:924–925. panel-0476.test.mjs allows less than 1 ms of timing tolerance while retaining lane, resting-position and reduced-motion checks; templates/panel-header.js sets SLIDE_MS to 120."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The recorded run reports 159 passed, zero failed and three skipped. The diff changes only the two named test files and ticket metadata/notes, with no production changes. Whole-suite regression checking remains the ship gate."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The two failing tests now pass. One expectation catches up with the existing “Built with” field; the other allows a small browser timing tolerance while keeping the movement checks. The changes are narrowly scoped, with no blocking concerns."
  }
}
```

</details>
