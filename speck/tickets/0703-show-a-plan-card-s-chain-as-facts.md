---
id: "0703"
title: "Show a Plan card's chain as facts"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-show-a-plan-card-s-chain-as-facts.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T11:55:04.332Z"

---
# 0703 · Show a Plan card's chain as facts

**Status:** 🔍 reviewing

## Problem
An open Plan card still shows a ticket's chain in the old Chain box, a bordered box of circles over ids, while the full view shows it as facts since 0603. Since 0613 a Plan card shows Waits on as plain facts, so cards with a chain still look different.

## Outcome
An open Plan card shows its chain as the facts Waits for and Waiting on it, as the full view does.

## Acceptance criteria
1. An open Plan card for a ticket with a chain (tickets it waits for, or tickets waiting on it) shows them as the facts "Waits for" and "Waiting on it", as the ticket's full view does, and no Chain box with circles.
2. Pressing a ticket id in those facts on a Plan card goes to that ticket on the page, as the Chain box's ids do today, rather than opening its full view.
3. After the panel redraws the card (a state refresh), the card has exactly one set of chain facts.
4. An open Plan card for a ticket with no chain shows no chain facts and no Chain box.
5. No test that passed before this change fails.

## Out of scope
- The full view's chain facts, which stay as they are.

## Notes
- `depsBox` in `templates/panel.js` calls `chainFacts` only for the full view (`inPane`); the card gets `div.deps.deps-chain`. `chainFacts` links with `depNode(…, true)`, which opens the full view. `isDeps` matches `deps` and `waits-facts` only, so a card redraw would add a second box unless it learns the new one.

- Self-check: no changes
- Pictures: none, because this repo's board has no open Plan card with a chain to photograph; the real-browser tests (panel-0467 AC3, panel-0154) cover its layout and tap size.
- Failing before this build: none

## In plain words
An open card in the Plan lane now shows what a ticket waits for and what waits on it in the same plain two-part layout as the full ticket view, instead of the old boxed chain of circles. To see it, open a Plan card that has a chain. Pressing a ticket number still jumps to that ticket on the page. The old chain styling is now unused and could be tidied later.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
- Follow-up (tidy-up, no idea written): the old `.deps` / `.deps-slots` chain-box CSS and its test checks are now unused.
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
    "reviewed_sha": "d8b9774c5eb31b27d730edd65006ce9b09b826d1",
    "session": "fresh",
    "thread_id": "01a20d87-4611-7611-be44-c25eb97218d0",
    "builder_response": "- Tests run: test/panel-0703.test.mjs test/panel-0041.test.mjs test/panel-0140.test.mjs test/panel-0154.test.mjs test/panel-0467.test.mjs test/panel-0472.test.mjs test/run-0110.test.mjs test/run-lock-0321.test.mjs test/run-settings-0549.test.mjs test/run-switch-0301.test.mjs test/seen-builds-0300.test.mjs (via --related; the 0154 file was fixed and re-run after)\n",
    "seconds": 40,
    "usage": {
      "input_tokens": 304337,
      "cached_input_tokens": 220160,
      "cache_write_input_tokens": 0,
      "output_tokens": 1364,
      "reasoning_output_tokens": 198
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 84177,
      "cached": 220160,
      "write": 0,
      "output": 1364
    },
    "cost_usd": 0.20401,
    "tests": {
      "failing": 1,
      "second_try": []
    },
    "saved_at": "2026-11-24T12:28:58.438Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "panel-0703 AC1 checks the generated facts, but templates/panel-cards.css:307–311 gives them three narrow columns and clips their values. Chain states and '+n more' can disappear."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "depsBox passes inPane=false through chainFacts to depNode, whose click handler calls goTo. Existing panel-0154 AC2 tests check navigation and highlighting from Plan links."
      },
      {
        "id": 3,
        "status": "unclear",
        "evidence": "isDeps now recognises chain-facts, but panel-0703 AC3 repeatedly supplies the same board. It does not exercise replacement after dependency state changes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "depsBox returns null without dependencies; panel-0703 AC4 exercises an open ticket with no chain and checks that neither presentation appears."
      },
      {
        "id": 5,
        "status": "unclear",
        "evidence": "The supplied output reports one failure in panel-0154 AC4. Its assertion has since been updated, but the claimed successful rerun's output is absent."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-cards.css:307",
        "issue": "The chain facts inherit the ordinary three-column facts table's nowrap and overflow:hidden rules. At phone widths, their narrow cells truncate states and additional-chain counts. The revised browser test measures only id rectangles, so it misses clipped surrounding text.",
        "suggested_fix": "Add Plan-specific chain-facts styling that gives both facts sufficient space and allows their values to wrap. Check that labels, ids, states and '+n more' remain visible at 320 px, without changing the full view.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/panel-0703.test.mjs:43",
        "issue": "The refresh test uses an unchanged board throughout. It does not test the redraw path that previously duplicated dependency boxes.",
        "suggested_fix": "Supply successive boards with changed chain dependencies or states. Assert that the existing open card shows the updated content and exactly one set of chain facts.",
        "state": "open"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "/tmp/speck-0703-tests.txt",
        "issue": "The review's test evidence still contains a failure and predates the final assertion change.",
        "suggested_fix": "Rerun the required review test files against the final changes and provide fresh passing output.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Plan cards now generate chain facts and retain page navigation. However, their styling can hide chain information on narrow screens. The redraw test needs a real state change, and fresh passing test results are required."
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
    "reviewed_sha": "ca57550e4dec928a16b1cd8e09bb0911f02f04c2",
    "session": "continued",
    "thread_id": "01a20d87-4611-7611-be44-c25eb97218d0",
    "builder_response": "- Tests run: test/panel-0703.test.mjs test/panel-0041.test.mjs test/panel-0154.test.mjs test/panel-0467.test.mjs test/panel-0472.test.mjs test/panel-0140.test.mjs test/panel-0161.test.mjs test/panel-0543.test.mjs (one at a time, `node --test --test-concurrency=1`, because the machine's load was about 70 and the real-browser tests timed out under `speck test --files`; all pass)\n- F1: fixed. templates/panel-cards.css: an open card's chain facts are two cells with wrapping values (the full view is unchanged). New browser test at 320 px checks no value is clipped.\n- F2: fixed. AC3 test now supplies a second board where a ticket in the chain changes to building, and checks the open card shows it in exactly one set of facts and no Chain box.\n- F3: fixed. Fresh output of the files above is attached, all passing.\n",
    "seconds": 31,
    "usage": {
      "input_tokens": 575063,
      "cached_input_tokens": 481792,
      "cache_write_input_tokens": 0,
      "output_tokens": 2234,
      "reasoning_output_tokens": 217
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 9094,
      "cached": 261632,
      "write": 0,
      "output": 870
    },
    "cost_usd": 0.0530512,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T12:40:13.173Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "depsBox renders chainFacts for Plan cards. panel-0703 AC1 verifies both labels and absence of the Chain box; the passing 320 px browser test checks wrapping without clipped values."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "chainFacts passes inPane=false to depNode for Plan cards, which calls goTo. Passing panel-0703 AC2 and existing panel-0154 navigation tests cover this behaviour."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "putDeps recognises and replaces chain-facts. The revised passing panel-0703 AC3 changes a chain ticket from queued to building and verifies updated content in exactly one set of facts."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "depsBox returns null without dependencies. Passing panel-0703 AC4 checks that an unconnected open Plan card has neither chain facts nor a Chain box."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Fresh /tmp/speck-0703-tests.txt contains two passing runs totalling 75 tests, with no failures or skips, including the previously failing panel-0154 AC4."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-cards.css:379",
        "issue": "Chain facts previously inherited narrow columns and clipped values.",
        "suggested_fix": "Completed: Plan chain facts now use two columns and wrapping values, covered by a passing browser test at 320 px.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/panel-0703.test.mjs:43",
        "issue": "The original refresh test did not change dependency state.",
        "suggested_fix": "Completed: successive boards change a linked ticket to building, and the test checks updated content without duplicate facts.",
        "state": "resolved"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "/tmp/speck-0703-tests.txt",
        "issue": "The previous test evidence contained a failure and predated the final assertion change.",
        "suggested_fix": "Completed: fresh passing output includes the corrected test and all five ticket tests.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Plan cards now show readable chain facts, navigate to linked tickets on the page, and update without duplicates. All previous findings are resolved, and the reviewed tests pass."
  }
}
```

</details>
