---
id: "0747"
title: "Name each Settings control by its setting's plain name"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
source: "speck/ideas/done/2026-11-24-name-each-settings-control-by-its-setting-s-plain-name.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0746"]                # ticket ids that must be done first
created: 2026-11-24
built_on: "0746"
started: "2026-11-25T00:01:50.120Z"
approved: "2026-11-25T00:35:42.219Z"

---
# 0747 · Name each Settings control by its setting's plain name

**Status:** 👍 approved

## Problem
Since 0729, Settings shows each setting by a plain name, but its list, box or switch is still labelled with the key. A screen reader reads the Name box out as "speck_name", and voice control can't find a control by the name on screen.

## Outcome
Every Settings control's accessible name is its setting's plain name.

## Acceptance criteria
1. Each list, box and switch in Settings has its setting's plain name, as shown on its row, as its accessible name, such as "Name" or "Watch", not its key.
2. Where one row has two controls (such as an agent and its effort), each has a name saying which it is, such as "Builder" and "Builder effort".
3. No test that passed before this change fails, except tests that find a control by its key's label, which are changed to find it another way.

## Out of scope
- The rows' look.

## Notes
Failing before this build: not checked
Self-check: a control kept while its row is drawn again (as when picking another agent shows or hides its effort) is named again, so its name follows whether the row holds one control or two.
Pictures: none, because the change is only to controls' accessible names, which nothing on screen shows.
- From 0729's own note: tests find controls by their key labels; a data attribute holding the key would keep them findable.
- Waits for the machine-wide build limit ticket, which adds a Settings row.

## In plain words
Screen readers and voice control now know each setting by the name Settings shows for it, such as "Name" or "Builds at once", instead of its internal key. Where one row holds two pickers, each says which it is: "Builder" and "Builder effort", or "Reviewer" and "Reviewer model". Nothing on screen looks different. To hear it, open Settings with a screen reader on and move through the pickers and boxes. One thing to know: the engineering manager's picker takes the name you've given it, such as "Virgil" and "Virgil effort".

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 97,441
- Elapsed since build started: 34 min
- Changed lines: 64 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Skipped: test/panel-0476.test.mjs's swipe timing test failed once in the related run under load and passed on its own; it's already named by speck/ideas/done/2026-10-26-steady-two-browser-tests-under-a-busy-run.md and ticket 0542.
- Rows that share a plain name in different team cards (each card's Bench, or an Effort on a row of its own) still give their controls the same name, as AC1 asks; a later ticket could add the member's name to those too.

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
    "reviewed_sha": "485d00462c6521149139092cc5275d59f322885e",
    "session": "fresh",
    "thread_id": "01a21020-5776-7771-a8d5-07999c2d608a",
    "builder_response": "- Tests run: `speck test --related` with test/settings-names-0747.test.mjs test/foreman-fix-0286.test.mjs test/settings-0381.test.mjs test/panel-0593.test.mjs (469 related files: 4393 passed, 1 failed, 3 skipped). The one failure was test/panel-0476.test.mjs's swipe timing test, a lane swipe in a real browser that this change doesn't touch; it passed when re-run with the command that run printed: `speck test --files test/settings-names-0747.test.mjs test/foreman-fix-0286.test.mjs test/settings-0381.test.mjs test/panel-0593.test.mjs test/panel-0476.test.mjs` (182 passed, 0 failed), which is the output attached and also adds the AC2 self-check test written after the related run started.\n- Change: `controlName` in templates/panel-settings.js names each Settings control by its row's plain name; in a row with two controls the agent's list is named for its team member (\"Builder\", \"Reviewer\", the engineering manager by speck_name, \"QA\") and the one beside it \"<member> model\" or \"<member> effort\". auto_ship_risk's boxes are \"Auto-ship risks: low/high\". Each control keeps its key in `data-setting`.\n- AC3: three existing tests found controls by their key's label (foreman-fix-0286, settings-0381, panel-0593); they now find them by `data-setting`. The test helpers in test/support/settings.mjs already find rows by the row's `data-key`.\n- No pictures: nothing on screen changes, only accessible names.\n- This branch also carries ticket 0746's approved work (speck start merged it in, as 0747 is after 0746); 0747's own change is the commits after `speck(0747): start`.\n",
    "seconds": 20,
    "usage": {
      "input_tokens": 96881,
      "cached_input_tokens": 57344,
      "cache_write_input_tokens": 0,
      "output_tokens": 560,
      "reasoning_output_tokens": 47
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 39537,
      "cached": 57344,
      "write": 0,
      "output": 560
    },
    "cost_usd": 0.0904084,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-25T00:35:04.254Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-settings.js: settingEditor and roleEditor use nameControl to assign plain accessible names, including switches, disabled boxes and risk checkboxes. The three 0747 AC1 tests exercise these names in both agent catalogue modes; all passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "controlName, hostsPartner and memberWords distinguish paired agent/model or agent/effort controls. redrawSettings renames retained controls when pairing changes. Both 0747 AC2 pairing tests and the retained-control self-check passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The reported final run passed 182 tests with zero failures and three skips, including all changed test files and the previously failing swipe test. Existing selector changes preserve their assertions and use data-setting instead of key-based accessible labels."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Settings controls now announce their plain names, with distinct names for controls sharing a row. Names also update when an agent change shows or hides its effort control. The tests exercise these behaviours and pass. No blocking concerns found."
  }
}
```

</details>
