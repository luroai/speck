---
id: "0749"
title: "Say in Needs you when the main checkout isn't a work tree"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-24-say-in-needs-you-when-the-main-checkout-isn-t-a-work-tree.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T23:40:46.626Z"
approved: "2026-11-25T00:35:52.360Z"
finished: "2026-11-25T00:53:27.975Z"

---
# 0749 · Say in Needs you when the main checkout isn't a work tree

**Status:** ✅ done

## Problem
When the main checkout's `core.bare` is true, builds fail before starting and the panel can't load its data, as on 2026-11-24. Since 0740 speck run says so only in its log and as the ship queue's hold, so nothing tells you it needs you.

## Outcome
A bare main checkout shows under Needs you, in the panel and `speck status`, with the command that sets it back.

## Acceptance criteria
1. While the main checkout's `core.bare` is true, `speck status` lists it first under what needs you, with the command that sets it back (`git config core.bare false`).
2. The panel shows it as a Needs you row in Build and counts it in the bar's Needs you, and the bridge counts it for that project.
3. Once `core.bare` is false again, it's gone from all three.
4. No test that passed before this change fails.

## Out of scope
- Setting it back for you.

## Notes
- `bareMain()` in `scripts/bare-main.mjs` (0740).
- Failing before this build: none
- A bare main checkout counts under Needs you while speck run is off too (the bar's word is then `Needs you 1` rather than Off), as builds started by hand fail and nothing ships until it's set back. Other things that need you still aren't counted while it's off.
- Self-check: narrowed the real panel test's name to what it checks (its state, not the bridge summary, which the summary tests cover)

## In plain words
When your project's main folder stops working as an ordinary checkout (a git setting gets switched so that git treats it as bare), speck now tells you straight away instead of only noting it in its log. It shows first under Needs you in `speck status`, as the first row under Needs you in the panel's Build lane and in the black bar's count, and on the All projects view for that project, each time with the one command that puts it right. This happens even while speck run is off, because nothing can be built or shipped until it's fixed.

To see it, run that git setting on a spare project, open its panel or run `speck status`, then switch it back: the warning goes away. The panel's row shows the whole command, wrapping onto a second line on a narrow screen rather than cutting it off.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 A project with no tickets still hides the bare checkout problem: cmdStatus exits with 'No tickets yet' before producing the Needs you warning.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 264,388
- Elapsed since build started: 55 min
- Changed lines: 69 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups, not saved to the inbox:
  - 0476 AC2 (the real-browser swipe test) failed once in this build's related run with "the browser dropped the end of the touch 3 times in a row" at a load average over 50, and passed on its own. Skipped as a duplicate: it's already named in speck/ideas/done/2026-10-26-steady-two-browser-tests-under-a-busy-run.md and tickets 0542 and 0738.
  - The panel picks up a change to core.bare at its keep-alive's next board check, as nothing it watches changes. Quick enough for something this rare.

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
    "reviewed_sha": "ac7578a606d21fddfe554587dd2a8447271eb4f7",
    "session": "fresh",
    "thread_id": "01a2101e-f1a4-7e01-82a6-248c91dc3365",
    "builder_response": "- Tests run: test/bare-needs-0749.test.mjs test/panel-0476.test.mjs test/split-0078.test.mjs test/split-0270.test.mjs (plus the commands.checks files speck adds). Before this, one `speck test --related test/bare-needs-0749.test.mjs` run (519 files): 4988 passed, 3 failed. Two were scripts/panel.mjs at 601 lines (0078 AC2, 0270 AC2), fixed by joining the new import onto an existing line. The third, 0476 AC2 (a real-browser swipe), failed with \"the browser dropped the end of the touch 3 times in a row\" at a load average over 50 from parallel builds; it passes alone and in the run above, and this change touches nothing in swiping.\n- Design: foremanView takes `bare` (bareMain(repo), passed by speck status and the panel server) and gives back `bare_main: { path, command, says }`, counted under Needs you. It's counted while speck run is off too (word `Needs you 1` rather than Off), as builds by hand fail and nothing ships until it's set back; see the ticket's Notes. projectSummary puts it first in the bridge's needs as why `bare_main`; the bridge card opens the project as the full-suite card does. The Build lane shows a non-pressable row first under Needs you; its command wraps rather than being cut off (pictures in the review pack).\n",
    "seconds": 28,
    "usage": {
      "input_tokens": 159076,
      "cached_input_tokens": 124416,
      "cache_write_input_tokens": 0,
      "output_tokens": 704,
      "reasoning_output_tokens": 85
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 34660,
      "cached": 124416,
      "write": 0,
      "output": 704
    },
    "cost_usd": 0.0888016,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-25T00:33:41.366Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/speck.mjs: cmdStatus returns 'No tickets yet' before checking bareMain(repo) when there are no tickets. The passing status integration test uses panelRepo(), which creates a ticket, so it misses this case."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel.mjs passes bareMain into foremanView; panel.js adds the Build row; projectSummary counts it for the bridge. Passing 0749 tests cover the row, count, bridge card and real panel state."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0749 AC3 tests cover removal from real status and panel state, the rendered Build lane, foreman count and bridge summary after the condition clears."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded review run reports 161 passed, 0 failed and 3 skipped, including the previously failing test files. No regression is evident in the supplied change."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "A project with no tickets still hides the bare checkout problem: cmdStatus exits with 'No tickets yet' before producing the Needs you warning. This violates the requirement to show the warning while core.bare is true.",
        "suggested_fix": "Check and display the bare checkout warning before the empty-ticket return. Add a status integration test with no tickets and core.bare true, then verify that the warning disappears after it becomes false.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The warning appears in the panel and bridge and clears when the checkout is repaired. Tests pass, but terminal status still hides the warning in projects with no tickets. Fix that missing case before merge."
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
    "reviewed_sha": "712bc86d0a7ea1089915611b715143dc6ed0d305",
    "session": "continued",
    "thread_id": "01a2101e-f1a4-7e01-82a6-248c91dc3365",
    "builder_response": "- Tests run: test/bare-needs-0749.test.mjs (plus the commands.checks files speck adds).\n- F1: fixed. cmdStatus in scripts/speck.mjs reads bareMain(repo) before the no-tickets return and returns early only when the checkout isn't bare; with no tickets and a bare checkout it prints the SPECK lines (Needs you 1, then the bare line with the command) and then \"No tickets yet\". New test \"0749 AC1 AC3: with no tickets yet, speck status still says it, and only says there are none once it's set back\" removes every ticket, sets core.bare true, checks the warning, then sets it false and checks the output is only the no-tickets line.\n",
    "seconds": 18,
    "usage": {
      "input_tokens": 263187,
      "cached_input_tokens": 221952,
      "cache_write_input_tokens": 0,
      "output_tokens": 1201,
      "reasoning_output_tokens": 85
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 6575,
      "cached": 97536,
      "write": 0,
      "output": 497
    },
    "cost_usd": 0.0278736,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-25T00:35:16.656Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs: cmdStatus now checks bareMain before returning for no tickets. Passing status tests cover warning order, the repair command, run being off and an empty project."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "foremanView counts bare_main; panel.js renders its Build Needs you row; projectSummary counts it for the bridge. Passing 0749 tests cover these behaviours and bridge navigation."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing 0749 AC3 tests verify removal from real status and panel state, rendered Build rows, the bar count and bridge summary after core.bare becomes false."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded round reports 152 passed, 0 failed and 3 skipped. The previous round also passed the existing test files affected by earlier failures; this round introduces only the focused status fix and regression test."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Terminal status previously hid the bare checkout warning when the project had no tickets.",
        "suggested_fix": "Completed: cmdStatus checks the checkout before its empty-project return, and a passing integration test covers the warning and its removal.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The warning now appears in terminal status, the panel and bridge, including projects with no tickets. It includes the repair command and disappears once repaired. All criteria pass, with no blocking concerns remaining."
  }
}
```

</details>
