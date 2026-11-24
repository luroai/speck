---
id: "0704"
title: "Show a cancelled after: ticket as cancelled in the panel"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: "bug"                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-15-show-a-cancelled-after-ticket-as-cancelled-in-the-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0703"]                # ticket ids that must be done first
created: 2026-11-24
built_on: "0703"
started: "2026-11-24T12:41:02.053Z"

---
# 0704 · Show a cancelled after: ticket as cancelled in the panel

**Status:** 🔍 reviewing

## Problem
speck run and `speck start` say a cancelled ticket must come out of `after:`, but the panel still shows a ticket waiting on it with a lock and "Waiting on <id>", so someone reading only the panel waits for a ticket that will never ship.

## Outcome
The panel says an `after:` ticket was cancelled and should be taken out of `after:`.

## Acceptance criteria
1. A ticket whose `after:` names a cancelled ticket says, on its card and in its full view, that that ticket was cancelled and should be taken out of `after:`, naming it, instead of showing a lock with "Waiting on <id>" or "after <id>".
2. Its chain or Waits on facts show the cancelled ticket as cancelled, not as queued or waiting.
3. A ticket whose `after:` names both a cancelled ticket and an unfinished one still says it waits for the unfinished one.
4. A ticket whose `after:` names no cancelled ticket reads as it does today.
5. No test that passed before this change fails.

## Out of scope
- Changing `after:` for you, or how speck run treats a cancelled `after:` ticket (0686).

## Notes
- 0686 added `after_cancelled` to `speck status --json`; nothing in `templates/` reads it yet. `chainIcon`, `whereLine`, `DEP_WORDS` (`templates/panel.js`) and `depsOf` (`templates/panel-model.js`, which counts a cancelled ticket as queued) are where it shows.
- Waits for the Plan card chain ticket, which changes the same chain and Waits on facts.
- Failing before this build: not checked
- Failing at the start point, 0703's approved work this build started on, and unchanged by this build: 0469 AC1, AC2 at 390 px and at 600 px, and 0613 AC3 (touch-screen layout of a Plan card's chain facts). Checked by running them at commit cfb4a32f.
- Self-check: gave the cancelled note the warning colour after seeing it in the real panel; dropped a `cancelled` count from the Waits on model so a ticket without a cancelled after: keeps its model as before (0467 AC1).
- speck (2026-11-24 13:18 UTC) told you: Nothing is stuck: the build is in review, making round 1's one fix. The time went on a heavily loaded machine and on a lot of work: tests, several test reruns, six light and dark pictures in a real panel, then the review. Separately, three layout tests (0469 at 390 and 600 px, and 0613 AC3's 44 px link height) already fail on 0703's approved work, which this build starts from. The builder checked that they fail at the starting point too, and 0703's review should catch them before it ships. Why: The log shows steady steps with no test hanging, the load average is 82, and the builder's base check (log line 163) found those three failures before its own change.

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
    "reviewed_sha": "0563fdd1822e14ea70a0ce8215b32e59285825c3",
    "session": "fresh",
    "thread_id": "01a20dad-ae80-71f0-8eb3-c63bb2ee6658",
    "builder_response": "- Tests run: test/panel-0704.test.mjs test/panel-0467.test.mjs test/panel-0469.test.mjs test/panel-0613.test.mjs (with commands.checks). First run was `speck test --related test/panel-0704.test.mjs`; its only failures outside 0469/0613 was 0467 AC1, fixed by not adding a `cancelled` count to the Waits on model.\n- The three failing tests (0469 AC1, AC2 at 390 and 600 px; 0613 AC3) fail identically at cfb4a32f, the start point carrying 0703's approved work, before any change of this ticket: noted in the ticket's Notes. This build doesn't touch them.\n- Pictures of the Plan card, Build row and full view, light and dark, are kept with the review pack.\n",
    "seconds": 35,
    "usage": {
      "input_tokens": 449922,
      "cached_input_tokens": 354048,
      "cache_write_input_tokens": 0,
      "output_tokens": 1089,
      "reasoning_output_tokens": 94
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 95874,
      "cached": 354048,
      "write": 0,
      "output": 1089
    },
    "cost_usd": 0.2380428,
    "tests": {
      "failing": 3,
      "second_try": []
    },
    "saved_at": "2026-11-24T13:10:50.614Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The 0704 AC1 tests cover draft and ready tickets. templates/panel.js whereLine suppresses the cancellation message for every inFlight ticket. A fake-page check with a blocked ticket naming a cancelled dependency rendered only 'Has a question · <1 min', without the cancellation instruction."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel-model.js depsOf assigns the cancelled state; DEP_WORDS renders it. Both 0704 AC2 tests passed and exercise chain and Waits on facts."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "0704 AC3 passed, checking that a mixed dependency list retains 'after 0691' and 'Waiting on 0691' while identifying 0690 as cancelled."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "0704 AC4 passed, checking unchanged ready-row wording, Plan lock and full-view chain facts without cancelled dependencies."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The reported run passed 166 tests. Its three failures are documented as present at the approved 0703 starting point; the diff against cfb4a32f leaves their tests and relevant CSS unchanged."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.js",
        "issue": "whereLine hides the cancellation instruction when t.inFlight is true, including blocked and approved tickets. These tickets can still name a cancelled dependency, but their Build card does not explain that it must be removed from after:, contrary to criterion 1.",
        "suggested_fix": "Show goneSay(t) regardless of inFlight status, preserving the existing stage information. Add a panel test covering a blocked or approved ticket with a cancelled dependency.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Draft and ready tickets correctly identify cancelled dependencies and preserve other waiting relationships. One gap remains: blocked, building, reviewing and approved tickets hide the cancellation instruction on their Build cards."
  }
}
```

</details>
