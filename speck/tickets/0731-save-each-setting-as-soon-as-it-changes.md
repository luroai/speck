---
id: "0731"
title: "Save each setting as soon as it changes"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0730"]                # ticket ids that must be done first
created: 2026-11-24
built_on: "0730"
started: "2026-11-24T19:20:50.859Z"
approved: "2026-11-24T19:52:06.546Z"

---
# 0731 · Save each setting as soon as it changes

**Status:** 👍 approved

## Problem
Settings makes you press a Save button fixed to the bottom of the view, and asks what to do with unsaved changes when you close it. Cursor's settings, which the panel sits beside, save each change the moment it's made, and the user found the Save step a let-down. Build levels already save straight away (0661).

## Outcome
Each setting saves the moment it changes, and Settings has no Save button and no unsaved-changes question.

## Acceptance criteria
1. Changing a switch or picking from a list saves that setting straight away; a text or number box saves when you press Enter or leave it with its value changed. Each saves only that setting, where it's saved today (for your machine only, or in `speck/config.yml` with a commit of only that file), and the row shows briefly that it saved.
2. A change speck refuses (an invalid value, a reviewer of the builder's own model, or a project setting while the checkout isn't on the base branch or `speck/config.yml` has uncommitted changes) is not saved: the row goes back to the saved value and shows the reason under it.
3. Turning `auto_ship` on, or adding a risk to `auto_ship_risk` while it's on, first opens today's dialog naming the approved tickets that would then ship without you, and saves only if you confirm; cancelling puts the control back. Unticking the last risk is refused as today.
4. Settings has no Save button, and closing it never asks about unsaved changes.
5. No test that passed before this change fails, except tests of the Save button, saving several settings in one commit, and the unsaved-changes question, which are changed to check saving each setting on its own.

## Out of scope
- How rows and controls look (the two tickets before this one).
- Build levels, which already save straight away.
- `speck config set`, which is unchanged.

## Notes
- Decided by the user on 2026-11-24: settings change instantly, as in Cursor, and the Save button goes.
- Each project setting saved is its own commit of `speck/config.yml`, rather than one commit per Save.
- Today: one Save (`save-all`) posts every change to `/api/settings/save` (`templates/panel-settings.js`, `scripts/settings.mjs` `panelSaveRequest`/`checkChange`), and `settings-unsaved` asks on closing. Levels save straight away through `/api/levels/…` (`levelAction`), which this can follow.
- A change made while an earlier save of the same setting is under way waits for it, so saves land in the order made.
- Failing before this build: not checked
- Self-check: a box drawn again while typed in (after another setting's save) had no change event to send when left, so leaving it now saves too (blur), with a test; the save queue is reset when the view closes, so a save still on its way from a closed view doesn't hold up the next one's.

## In plain words
Settings no longer has a Save button. Each setting saves the moment you change it: a switch, a list or a tick saves straight away, and a box you type in saves when you press Enter or click away from it. The row says "Saved." for a moment. If speck can't accept a change, for example a bad value, or a project setting while your checkout isn't on the main branch, the setting goes back to what it was and says why underneath. Turning auto-ship on, or adding a risk to it, still asks first. Closing Settings never asks about unsaved changes.

To see it, open Settings, change something like Builds at once, and click away: it saves and says so. Worth keeping an eye on: every project setting you change is now its own small commit. Swapping the builder and reviewer between Claude Code and Codex has to go through a third choice now, as each half of the swap is refused on its own.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 Queued saves capture only keys, then read mutable values when executed.; F2 Closing can discard a box's change even after its leave/change event requested a save.; F3 The change deletes three AC3 tests checking the engineering manager's face, its persistence after redraw and its default accessible name.
Round 2 (codex): changes requested: F4 Shipping confirmations ignore queued changes.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,139,473
- Elapsed since build started: 31 min
- Changed lines: 407 (limit 5000)
- Follow-ups:
  - Idea: let Settings swap the builder's and reviewer's families, as each half of the swap is refused on its own now that each setting saves by itself (speck/ideas/2026-11-24-let-settings-swap-the-builder-and-reviewer-families.md).
  - Skipped as a duplicate: run-settings-0549 AC1 failed once under load in the related run and passed alone twice. It matches speck/ideas/done/2026-11-10-steady-the-0622-and-0549-ac1-run-tests-under-load.md.
  - Known limit: a box typed in but not left when Settings closes by Escape isn't saved, as nothing tells the page the typing is done. A box left first (change or blur) is saved, even as Settings closes.
  - Known limit: the "Save key" and "Save provider and add" buttons under Your agents stay, as they send a secret once, on purpose. They aren't settings.

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
    "reviewed_sha": "7cbec751b7f0389f072372056fc1a00be504d8da",
    "session": "fresh",
    "thread_id": "01a20f18-65f1-7691-a562-be91a886500e",
    "builder_response": "- Tests run: test/settings-instant-0731.test.mjs test/build-model-0279.test.mjs test/builder-model-0311.test.mjs test/builder-switch-0293.test.mjs test/panel-0258.test.mjs test/panel-0259.test.mjs test/panel-0261.test.mjs test/panel-0274.test.mjs test/panel-0275.test.mjs test/panel-0368.test.mjs test/panel-0372.test.mjs test/panel-0426.test.mjs test/panel-0427.test.mjs test/panel-0428.test.mjs test/panel-0432.test.mjs test/panel-0453.test.mjs test/panel-0472.test.mjs test/panel-0593.test.mjs test/panel-0603.test.mjs test/panel-0612.test.mjs test/settings-0276.test.mjs test/settings-0278.test.mjs test/settings-0370.test.mjs test/settings-0381.test.mjs test/settings-0387.test.mjs test/settings-0397.test.mjs test/settings-0407.test.mjs test/settings-0409.test.mjs test/settings-0412.test.mjs test/settings-0700.test.mjs test/settings-builder-effort-0402.test.mjs test/settings-controls-0730.test.mjs test/settings-home-0707.test.mjs test/settings-info-0405.test.mjs test/settings-layout-0729.test.mjs test/settings-models-0369.test.mjs test/settings-roles-0400.test.mjs test/settings-roles-0403.test.mjs test/settings-same-model-0511.test.mjs test/settings-team-0652.test.mjs test/run-settings-0549.test.mjs\n- Round 1. First, `speck test --related` over this ticket's test file and the 41 existing test files it changes ran 4,784 tests: 4,780 passed, 3 skipped and 1 failed, `run-settings-0549` AC1/AC3/AC5, a timing check in speck run's own test (\"no build starts while the settings can't start one\", 3 !== 2). This ticket changes no speck run code, and that file passes alone, twice, with `speck test --files`. The attached output is the re-run that run printed (those files plus run-settings-0549): 485 pass, 0 fail, 3 skipped.\n- What changed: in templates/panel-settings.js, each setting saves through `saveSetting(keys)`, a queue so saves land in the order made. A switch, a list or a box ticked saves on change. A text or number box saves on Enter, on change (leaving it changed) and on blur, as a box drawn again mid-typing has no change event. Each save sends only that setting's keys (a role's agent and model together). A refusal, a cancelled dialog or the auto_ship_risk check puts the setting back to its saved value, with why under its row. After a save, the row shows \"Saved.\" for 2.5 s. The Save bar and the unsaved-changes question (settings-unsaved) are gone from the page, CSS and panel.js's Escape handler.\n- Server: unchanged except for the same-family refusal's words. It no longer says \"pick it as the reviewer in the same Save\", as there's no Save to pick it in.\n- Existing tests: AC5 lets me change the tests of the Save button, saving several in one commit and the unsaved-changes question to check saving each setting on its own. The shared settingsPage helper (and the page helpers in 0369, 0370 and 0381) now leaves a save the test gave no answer for on its way, so tests of what a change shows before it's saved still check that state. The saveButton helper is removed.\n- Pictures: the panel was run from this worktree, so project settings are refused (it isn't on main), which shows the refusal. Its \"this machine\" settings are shared with the main checkout, so the picture's \"Saved.\" line was drawn in by script rather than by changing a real setting.\n",
    "seconds": 45,
    "usage": {
      "input_tokens": 470533,
      "cached_input_tokens": 372736,
      "cache_write_input_tokens": 0,
      "output_tokens": 1737,
      "reasoning_output_tokens": 135
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 97797,
      "cached": 372736,
      "write": 0,
      "output": 1737
    },
    "cost_usd": 0.2502376,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T19:47:11.665Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "settings-instant-0731 tests cover ordinary saves and commits, but read-only reproductions show saveSetting/sendSettings drops intermediate changes and loses a box's change when immediately closed."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "Refusal tests cover reverting a single change. However, sendSettings deletes newer edits when an earlier request fails: submitting 0, then correcting to 5 while waiting, sends only 0 and resets the control to 3."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "shipsMore/sendSettings retain confirmation and cancellation handling. Passing 0731 AC3 and panel-0259 tests exercise enabling shipping, adding risks, cancellation and refusing the last risk's removal."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panel.html removes settings-unsaved; leaveSettings closes directly; Save-bar rendering is removed. Passing 0731 AC4 and panel-0275 tests cover these behaviours."
      },
      {
        "id": 5,
        "status": "fail",
        "evidence": "Reported targeted run passes 485 tests, but test/panel-0593.test.mjs removes three unrelated AC3 tests of the engineering manager's face rather than preserving their coverage."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-settings.js:1430",
        "issue": "Queued saves capture only keys, then read mutable values when executed. Reproducing low → medium → high while low waits sends only low and high. Worse, an earlier refusal deletes the later correction: 0 → 5 sends only 0 and restores 3.",
        "suggested_fix": "Capture each requested change and its view identity when queued. Preserve newer edits when an earlier request succeeds or fails. Add tests for multiple pending changes to the same setting and a correction following a refused request.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel-settings.js:closeSettings",
        "issue": "Closing can discard a box's change even after its leave/change event requested a save. saveSetting defers reading the value to a microtask, while closeSettings immediately clears the typed values and view. A reproduction dispatching change then Close sends no request.",
        "suggested_fix": "Ensure a save requested before closing retains its value and completes independently of the view. Test typing into a box and clicking Close with the browser's change/blur-before-click event sequence.",
        "state": "open"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "test/panel-0593.test.mjs",
        "issue": "The change deletes three AC3 tests checking the engineering manager's face, its persistence after redraw and its default accessible name. These are unrelated to removing Save and weaken existing coverage.",
        "suggested_fix": "Restore these tests, adapting save responses only where necessary for instant saving.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Ordinary instant saves and shipping confirmations work, but rapid edits and closing Settings can lose changes. An earlier rejected save can also erase a later correction. These bugs and the unrelated removal of existing tests need fixing before merge."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "5b0ed4247e84ff6e768b9fdf7d6361e5a53c2790",
    "session": "continued",
    "thread_id": "01a20f18-65f1-7691-a562-be91a886500e",
    "builder_response": "- Tests run: test/settings-instant-0731.test.mjs test/build-model-0279.test.mjs test/builder-model-0311.test.mjs test/builder-switch-0293.test.mjs test/panel-0258.test.mjs test/panel-0259.test.mjs test/panel-0261.test.mjs test/panel-0274.test.mjs test/panel-0275.test.mjs test/panel-0368.test.mjs test/panel-0372.test.mjs test/panel-0426.test.mjs test/panel-0427.test.mjs test/panel-0428.test.mjs test/panel-0432.test.mjs test/panel-0453.test.mjs test/panel-0472.test.mjs test/panel-0593.test.mjs test/panel-0603.test.mjs test/panel-0612.test.mjs test/settings-0276.test.mjs test/settings-0278.test.mjs test/settings-0370.test.mjs test/settings-0381.test.mjs test/settings-0387.test.mjs test/settings-0397.test.mjs test/settings-0407.test.mjs test/settings-0409.test.mjs test/settings-0412.test.mjs test/settings-0700.test.mjs test/settings-builder-effort-0402.test.mjs test/settings-controls-0730.test.mjs test/settings-home-0707.test.mjs test/settings-info-0405.test.mjs test/settings-layout-0729.test.mjs test/settings-models-0369.test.mjs test/settings-roles-0400.test.mjs test/settings-roles-0403.test.mjs test/settings-same-model-0511.test.mjs test/settings-team-0652.test.mjs test/run-settings-0549.test.mjs\n- F1: fixed. saveSetting (templates/panel-settings.js) now settles each save when the change is made: the changes it sends, and any question it asks (auto_ship, same-model, build_command), go into a job, and the queue sends the job later. settingPending holds the value of each key's latest save that hasn't been answered yet. settingChanges compares against that value while a save is on its way, so low → medium → high sends all three in order, and putting a value back to the saved one while a save waits is sent too. When the server refuses a save, sendSettings leaves alone a key that has a later save waiting (that save runs next and shows how it went). It also keeps a value typed since the save was sent. So 0 → 5 sends 0 and then 5, and ends at 5 with no refusal. New tests: \"0731 AC1: several changes to one setting…\" and \"0731 AC2: a refused save doesn't undo a correction…\".\n- F2: fixed. A job no longer reads the view when it's sent. It carries its own changes and its session (settingsSession, one more on each close), so a save asked for before closing is still sent after Settings closes, even behind an earlier save. Only what it shows is skipped once the view has gone. Closing resets the queue and settingPending for the next view, while saves already queued carry on. New test: \"0731 AC1, AC4: a box left changed and then Settings closed at once still saves…\", with Close and with Escape behind an earlier save.\n- F3: fixed. I restored test/panel-0593.test.mjs's three AC3 tests of the engineering manager's face unchanged, and they pass as they are.\n",
    "seconds": 36,
    "usage": {
      "input_tokens": 904326,
      "cached_input_tokens": 793600,
      "cache_write_input_tokens": 0,
      "output_tokens": 3117,
      "reasoning_output_tokens": 285
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 12929,
      "cached": 420864,
      "write": 0,
      "output": 1380
    },
    "cost_usd": 0.0817444,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T19:50:22.330Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "saveSetting now captures immutable jobs. Passing 0731 tests cover sequential changes to one setting, Enter/leave saves, saves after closing, saved indicators and commits of only speck/config.yml."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "sendSettings preserves later queued corrections while reverting refused changes. Passing 0731 AC2 tests cover refusals and corrections; existing settings tests cover validation, same-model review and checkout restrictions."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "shipsMore reads saved values through shippingNow, ignoring pending saves. Enabling auto_ship and adding high risk before its response produces only the initial low-risk confirmation; the queued risk request has no confirmation."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Save-bar and unsaved-dialog code remain removed. Passing 0731 AC4 and panel-0275 tests cover closing without questions."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The targeted run reports 491 passed, zero failed and three skipped. The three unrelated panel-0593 AC3 tests have been restored unchanged."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-settings.js",
        "issue": "Previously, queued saves lost intermediate changes and refusals erased later corrections. Captured jobs and pending-value tracking fix these cases.",
        "suggested_fix": "None; retain the new regression tests.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel-settings.js",
        "issue": "Previously, closing discarded saves already requested by a box's change event. Jobs now retain their values and continue after closing.",
        "suggested_fix": "None; retain the close-after-change regression test.",
        "state": "resolved"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "test/panel-0593.test.mjs",
        "issue": "The three unrelated tests of the engineering manager's face have been restored unchanged.",
        "suggested_fix": "None.",
        "state": "resolved"
      },
      {
        "id": "F4",
        "severity": "blocking",
        "file": "templates/panel-settings.js:shippingNow",
        "issue": "Shipping confirmations ignore queued changes. Reproduction: turn auto_ship on, confirm low-risk shipping, then tick high before the first response. No second dialog opens, and the risk request is sent without confirm. For machine settings, saveRepoSettings then refuses it because the earlier request has enabled shipping. The requested risk change therefore fails instead of opening the required confirmation.",
        "suggested_fix": "Evaluate shipping confirmations against the state preceding each queued job, accounting for pending changes and their outcomes. Add a regression test enabling auto_ship and adding a risk while the enable request waits, checking confirmation and successful saving.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The three earlier findings are fixed. One remaining timing bug affects shipping settings: adding a risk while auto-ship is still saving skips the required confirmation and causes the change to be refused. Fix that before merge."
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
    "reviewed_sha": "5ee7ea0ba7935ac3a8d86cf21f8702f75cc743be",
    "session": "continued",
    "thread_id": "01a20f18-65f1-7691-a562-be91a886500e",
    "builder_response": "- Tests run: test/settings-instant-0731.test.mjs test/build-model-0279.test.mjs test/builder-model-0311.test.mjs test/builder-switch-0293.test.mjs test/panel-0258.test.mjs test/panel-0259.test.mjs test/panel-0261.test.mjs test/panel-0274.test.mjs test/panel-0275.test.mjs test/panel-0368.test.mjs test/panel-0372.test.mjs test/panel-0426.test.mjs test/panel-0427.test.mjs test/panel-0428.test.mjs test/panel-0432.test.mjs test/panel-0453.test.mjs test/panel-0472.test.mjs test/panel-0593.test.mjs test/panel-0603.test.mjs test/panel-0612.test.mjs test/settings-0276.test.mjs test/settings-0278.test.mjs test/settings-0370.test.mjs test/settings-0381.test.mjs test/settings-0387.test.mjs test/settings-0397.test.mjs test/settings-0407.test.mjs test/settings-0409.test.mjs test/settings-0412.test.mjs test/settings-0700.test.mjs test/settings-builder-effort-0402.test.mjs test/settings-controls-0730.test.mjs test/settings-home-0707.test.mjs test/settings-info-0405.test.mjs test/settings-layout-0729.test.mjs test/settings-models-0369.test.mjs test/settings-roles-0400.test.mjs test/settings-roles-0403.test.mjs test/settings-same-model-0511.test.mjs test/settings-team-0652.test.mjs test/run-settings-0549.test.mjs\n- F4: fixed. The new valueAhead(key) gives a setting's value as the save on its way will leave it (settingPending, converted as savedAs converts it), or as the view read it. shippingNow, which shipsMore asks with, and allowsSameModel now read through it. So ticking high while turning auto_ship on is still saving asks again (\"approved low-risk and high-risk tickets\") and sends confirm=low,high. If the earlier save is refused, the server ignores a confirm it doesn't need. New test: \"0731 AC3: adding a risk while turning auto_ship on is still saving asks about it too, and sends its confirmation (review F4)\", which checks both questions and both requests.\n",
    "seconds": 23,
    "usage": {
      "input_tokens": 1135514,
      "cached_input_tokens": 1018368,
      "cache_write_input_tokens": 0,
      "output_tokens": 3959,
      "reasoning_output_tokens": 341
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 6420,
      "cached": 224768,
      "write": 0,
      "output": 842
    },
    "cost_usd": 0.0437368,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T19:51:46.740Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "saveSetting captures each change in a queued job. Passing 0731 AC1 tests cover immediate controls, Enter/leave saves, ordered repeated edits, saved indicators, machine storage and commits of only speck/config.yml."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "sendSettings reverts refused changes without erasing later corrections. Passing refusal tests and existing settings tests cover invalid values, same-model review, branch restrictions and uncommitted configuration."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "shippingNow now uses valueAhead to account for pending saves. The passing F4 regression checks both confirmations and request parameters when enabling auto_ship then adding a risk. Existing AC3 tests cover cancellation and refusing removal of the last risk."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Save-bar and unsaved-dialog rendering are removed. Passing 0731 AC4 and panel-0275 tests cover closing without questions, including saves queued before closing."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The targeted run reports 492 passed, zero failed and three skipped. Previously removed unrelated face tests remain restored."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-settings.js",
        "issue": "Queued changes and later corrections are now preserved by captured jobs and pending-value tracking.",
        "suggested_fix": "None.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel-settings.js",
        "issue": "Requested saves now retain their values and continue after Settings closes.",
        "suggested_fix": "None.",
        "state": "resolved"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "test/panel-0593.test.mjs",
        "issue": "The three unrelated face tests have been restored unchanged.",
        "suggested_fix": "None.",
        "state": "resolved"
      },
      {
        "id": "F4",
        "severity": "blocking",
        "file": "templates/panel-settings.js:shippingNow",
        "issue": "Shipping confirmations now account for pending changes through valueAhead; the regression test verifies the additional risk receives its own confirmation.",
        "suggested_fix": "None.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Settings now save individually, show confirmation briefly and restore refused values with an explanation. Rapid edits and closing preserve requested saves, and shipping changes retain their confirmation safeguards. All earlier findings are resolved; the change is ready for the owner's merge decision."
  }
}
```

</details>
