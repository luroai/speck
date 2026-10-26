---
id: "0511"
title: "Turn same-model review on or off in Settings"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-26
started: "2026-10-26T10:29:19.449Z"
approved: "2026-10-26T10:35:22.015Z"
finished: "2026-10-26T10:39:47.639Z"

---
# 0511 · Turn same-model review on or off in Settings

**Status:** ✅ done

## Problem
Settings shows `allow_same_model_review` but won't change it: since 0258 it's read-only there, because turning it on weakens the independent review. To pick a reviewer running the same model as the builder, the user has to edit `speck/config.yml` or run `speck config set`, which is the only setting in the builder and reviewer group that works that way.

## Outcome
`allow_same_model_review` can be turned on or off in Settings, with a warning before turning it on.

## Acceptance criteria
1. Settings shows `allow_same_model_review` as an on/off switch with the reviewer's settings, saved by the one Save button as one of your own settings for this machine, as `speck config set --machine` saves it, like the other settings there.
2. Turning it on opens a dialog on Save saying that the reviewer may then run the same model as the builder, so a review is no longer by a different model, and nothing is saved unless the user confirms. Turning it off needs no dialog.
3. With it on, in the same Save or an earlier one, a reviewer from the builder's own family running the same model as `builder_model` saves, where today Save refuses it. With it off, Save refuses it as today.
4. The panel accepts the change only from its own page with its token, as for every other setting. `speck config set allow_same_model_review` works as today. No test that passed before this change fails.

## Out of scope
- What the setting does to a build's review, and its default (`false`).

## Notes
- Asked for by the user on 2026-10-26: "I need the setting allow same model review to be toggle-able in the settings. Currently it is not."
- Today: `EDITABLE` in `scripts/settings.mjs` leaves it out on purpose (0258: "allow_same_model_review weakens the independent review"); its explanation is in `SETTING_GROUPS` there, and Save's same-model check near `cfg.allow_same_model_review` in the same file. The dialog can follow 0259's for `auto_ship`, which asks before a change that lets more tickets ship by themselves, in `templates/panel-settings.js`.
- Failing before this build: none
- Changed existing tests: three assertions in `test/panel-0258.test.mjs` pinned `allow_same_model_review` as read-only in the panel (the EDITABLE list, the editable check and the 403 list), which is the behaviour this ticket changes. Each now includes it, marked 0511; nothing else in them changed.
- The switch is a true/false list, as `auto_ship`'s is, from the server's choices.
- The dialog is the page's, as AC2 asks; the server doesn't ask for a confirmation token for it, unlike 0259's for `auto_ship`.
- Self-check: turning it off is now checked against the builder and reviewer as they'd be once saved, so it's refused while the two would run the same model, unless the same Save picks a reviewer from another family (test added). Clearing this machine's value when speck/config.yml's is true asks first too.

## In plain words
You can now turn same-model review on or off in Settings, next to the reviewer, instead of editing the config file. It's saved for your computer only, like the builder and reviewer choices. Turning it on asks first, because a reviewer on the same model as the builder tends to catch less. Turning it off doesn't ask, but Save refuses it while your builder and reviewer would run the same model, unless you pick another reviewer in the same Save.

To see it, open Settings, find allow_same_model_review under Building and reviewing, set it to true and press Save: a question appears, and nothing is saved if you cancel.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 189,386
- Elapsed since build started: 6 min
- Changed lines: 29 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Known limit: the question before turning it on is the page's own. A request sent to the panel with its token, outside the Settings view, can turn it on without one, unlike 0259's auto_ship check. No inbox note: the ticket asked only for the dialog.

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
    "reviewed_sha": "1ab76ce0b792f3fbcb7328978c62e7772d41c470",
    "session": "fresh",
    "thread_id": "01a177c6-d008-7d71-8d0b-478b52f6b221",
    "builder_response": "- Tests run: `speck test --related test/settings-same-model-0511.test.mjs test/panel-0258.test.mjs` (the ticket's own file, the changed 0258 file and every test file naming a changed file: 518 tests, all passing).\n- Round 1. `allow_same_model_review` joins EDITABLE with choices [true, false], as `auto_ship`'s are. It's already one of your own settings (MACHINE_SETTINGS), so Save keeps it for this machine. Save's same-model check now reads the setting as it will be once saved (`will`), so turning it on in the same Save lets a same-model reviewer through, and turning it off is refused while the two would run the same model.\n- The page asks with confirm() before a Save that turns it on, including clearing this machine's value when speck/config.yml's is true. Cancelling puts it back and sends nothing. Turning it off asks nothing.\n- Three assertions in test/panel-0258.test.mjs pinned it as read-only, the behaviour this ticket changes. Each now includes it, marked 0511 (see Notes).\n",
    "seconds": 32,
    "usage": {
      "input_tokens": 188736,
      "cached_input_tokens": 143232,
      "cache_write_input_tokens": 0,
      "output_tokens": 650,
      "reasoning_output_tokens": 31
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-26T10:35:12.006Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/settings.mjs exposes the setting in EDITABLE with boolean choices and existing machine-only persistence. Both 0511 AC1 tests passed, checking its reviewer group, control, Save request and persistence without a commit."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel-settings.js allowsSameModel() and sendSettings() request confirmation before enabling, including clearing a machine override to reveal true. The three AC2 tests passed: cancellation sends nothing and disabling asks nothing."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "scripts/settings.mjs panelSaveSettings() checks will.allow_same_model_review against the proposed builder and reviewer settings. Both AC3 tests passed, covering enabling in the same or an earlier Save and refusing same-model settings when disabled."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/panel.mjs guards settings routes with origin and token checks. The AC4 integration test passed for rejected unauthorised requests, an authorised save and the existing CLI command. The reported related run passed 515 tests, with three skipped and no failures; the full output confirms these totals."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Settings now lets you enable or disable same-model review for this machine. Enabling asks for confirmation before saving, and same-model reviewer choices are accepted only when allowed. The tests cover saving, cancellation, validation and access protection. No blocking concerns found."
  }
}
```

</details>
