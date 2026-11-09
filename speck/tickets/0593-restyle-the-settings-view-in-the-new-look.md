---
id: "0593"
title: "Restyle the Settings view in the new look"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0577","0575"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T18:38:04.469Z"
blocked_at: ""
waited_seconds: 3810

---
# 0593 · Restyle the Settings view in the new look

**Status:** 🔍 reviewing

## Problem
The Settings view still uses the LCD-era boxes and borders. It should match the rest of the redesign, and its engineering manager group should show who it's about.

## Outcome
The Settings view is in the redesign's look, with speck's face beside its name.

## Acceptance criteria
1. Settings groups are plain sections with a heading and a divider, without card borders, and each setting is a row with its label, its control and its explanation in muted text; info buttons stay.
2. The Save bar at the bottom uses the redesign's look, with Save in the accent colour.
3. The Your engineering manager group (0575) shows speck's face, watching, beside its name setting.
4. The view works at 320 px wide and in both looks.
5. Tests that checked the old look of what this changes are updated to the new one, and the Delivery log lists them; no other test that passed before this change fails.

## Out of scope
- Which settings there are, or what they do.

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Today: `templates/panel-settings.js` (`renderSettings`, `settingRow`, `saveBar`) and `templates/panel-settings.css`. Waits for 0575, which renames the group.
- Relies on nothing outside this repo.
- Failing before this build: none
- Went with the recommendation: Wait for 0578, then build as written (chosen by the user in the panel, 2026-11-09 19:42 UTC).
- AC1's "its explanation in muted text; info buttons stay": the explanation stays behind the info button and is now drawn in muted text. 0268 put explanations behind the button on purpose ("no setting's explanation shows until it's asked for"), and each is several sentences long.
- AC1: Appearance and Auto-build, at the top, have no heading of their own (0396 tests that they have none) and sit under the view's own divider.
- AC2: a Save with nothing to save stays greyed out, so the accent says it can be pressed.
- AC3: 0578 left `speck-face.js` unloaded, so this ticket loads it and counts it in the page's out-of-date stamp. 0580 makes the same change for the header, so the two will meet when one merges.
- AC5 has no test of its own: its first half is the Delivery log, which a reviewer reads, and its second half is the whole suite, which `speck ship` runs.
- Self-check: the groups kept the box every section has until the real-browser pictures showed it, because the reset had been taken out; `border: 0` is back and the browser test now measures each group's drawn border.

## In plain words
Settings now matches the rest of the new design: each group is a plain section with a heading and a line under it, instead of a box. The Save button at the bottom turns blue once you've changed something, and speck's new face, watching, sits beside the box where you name it.

To see it, open Settings, look under Your engineering manager, then change a setting and watch Save light up. Switch between Light and Dark to compare the two looks. The "i" buttons work as before, and the explanations they open are now in softer grey text.

Worth keeping an eye on: the grey explanation text is a little quieter than it was. The question that asks about unsaved changes still has its older plain Save button.

## Blocked question
Criterion 3 needs speck's face, watching, but the new face comes from 0578, which isn't finished, and this ticket doesn't wait for it (0579 and 0594, which also use the face, do). Should 0593: (1) wait for 0578 and then build as written, which I recommend, because it's the only option that shows the real face with no throwaway work, and it only delays this ticket; (2) build now with a temporary copy of the face drawn just for Settings, to be swapped later; or (3) ship the restyle now without the face, and move criterion 3 to its own ticket after 0578?

Recommended: Wait for 0578, then build as written
Changes what you'd notice: yes
Clear winner: yes

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Tests updated for the new look:
- `test/panel-0428.test.mjs`: Settings' groups and switches no longer have a 12 px corner radius, and a button's border may be the accent (Save).
- `test/panel-0432.test.mjs`, `test/panel-0433.test.mjs`, `test/panel-0473.test.mjs`, `test/panel-0474.test.mjs`: the page's list of scripts now has `speck-face.js`.

Follow-ups:
- The Save button in the question about unsaved changes keeps its plain look; only the Save bar was in scope.

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
    "reviewed_sha": "442a0b7bd5ab9422d4781c7ba01fc5bc1ddddf60",
    "session": "fresh",
    "thread_id": "01a1c1e6-3cf4-7ef0-9d03-0126eedd4614",
    "builder_response": "- Tests run: test/panel-0593.test.mjs test/panel-0428.test.mjs test/panel-0432.test.mjs test/panel-0433.test.mjs test/panel-0473.test.mjs test/panel-0474.test.mjs, with --related (every existing test file naming a changed file) and the checks files.\n- Readings of the criteria are in the ticket's Notes: explanations stay behind the info button (0268) and are drawn muted; Appearance and Auto-build keep no heading (0396); a disabled Save isn't accent.\n- Pictures of both looks are with the review pack.\n",
    "seconds": 24,
    "usage": {
      "input_tokens": 165264,
      "cached_input_tokens": 116096,
      "cache_write_input_tokens": 0,
      "output_tokens": 637,
      "reasoning_output_tokens": 13
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 49168,
      "cached": 116096,
      "write": 0,
      "output": 637
    },
    "cost_usd": 0.1163156,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T20:01:18.056Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "panel-settings.css makes groups borderless sections with heading dividers and muted explanations. panel-0593.test.mjs AC1 tests passed, including browser checks of drawn borders; labels, controls and info buttons remain."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel-settings.css styles the savebar with the redesign's divider and accent Save button, retaining a muted disabled state. All three AC2 tests passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panel-settings.js settingRow calls nameFace for speck_name, drawing SpeckFace in watching mood beside the control. AC3 tests passed for placement, redraw and blank-name fallback."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The real-browser AC4 test passed at 320 px in light and dark looks, checking overflow, face placement, usable input width and theme colours."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The Delivery log lists all five updated existing test files. Verified /tmp/speck-0593-tests.txt reports 392 passes, zero failures and three skips; all 11 ticket tests passed. Test changes match the restyle and added script."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Settings now uses plain sections, muted help text and an accent Save button, with speck's watching face beside its name. Tests confirm the layout fits at 320 px in both looks. No blocking issues found."
  }
}
```

</details>
