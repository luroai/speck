---
id: "0666"
title: "Pick each level's model from the builder's list"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-12
started: "2026-11-12T21:02:41.768Z"

---
# 0666 · Pick each level's model from the builder's list

**Status:** 🔍 reviewing

## Problem
The Build levels on the Builder's card (0661) are hard to use. Each level's model is a free-text box, where the Builder's own row above offers a list such as "Claude Code · Opus". "settings" fills every box and list and isn't explained, none of the boxes say what they're for, a line above each level repeats what its boxes already show, and each level's Remove button is as large as the page's main buttons.

## Outcome
Each level is set with the same choices as the Builder itself, labelled in words that say what they mean.

## Acceptance criteria
1. Each level, and the Add a level form, has a Builder list offering the same agent and model choices as the Builder's own row, in the same words (such as "Claude Code · Opus"), plus a first choice, "Default", that leaves the level's builder and model to the Builder's row and says what that is now, such as "Default (Claude Code · Opus)". Picking a choice saves both the level's `builder` and its `builder_model`, and "Default" blanks both. There's no free-text model box. A level whose saved builder and model aren't among the choices still shows them as its picked choice.
2. Each level, and the Add a level form, has an Effort list with "Default" first, saying the Builder's effort now, such as "Default (medium)", then the efforts the picked builder and model offer, as the Builder's own effort list does. "Default" blanks the level's `builder_effort`.
3. Every list and box in Build levels has a visible label (Builder, Effort, and Name on the add form), and the words "settings" and "speck/config.yml" don't appear in Build levels. The line above each level that repeats its builder, model and effort is gone.
4. Each level's remove control is a small text button that doesn't stand out more than the level's name, and the Add a level form's button sits after its fields. At 375 pixels wide, Build levels has no horizontal scroll, and each level's name, Builder and Effort fit the card's width.
5. Saving, adding and removing levels work as 0661 made them: what's saved to `speck/config.yml` for a given choice is unchanged, and the same refusals are given.

## Out of scope
- A ticket's Level menu: 0667.
- The rest of the Settings page, such as `builder_bench`'s raw name.
- Whether levels save straight away or with the page's Save button.

## Notes
- The Builder's row builds its agent and model list and its effort list in `templates/panel-settings.js`. Reuse them rather than making new ones. Levels are drawn by `drawLevels` and `levelControl` there.
- A level that leaves builder blank but names a model (possible by hand) shows as the Builder's agent with that model.
- Failing before this build: none
- Self-check: a level saved with an effort its builder doesn't list keeps it in its Effort list, and a built-in name such as constructor as a builder is shown as saved (tested). Error messages from the server are shown as before, and a few rare ones name speck/config.yml (AC5 keeps the same refusals).
- 0661's page tests changed to the new lists: the summary line, the "settings" choices and the model box they checked are what this ticket replaces.

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
    "reviewed_sha": "d1ceddd7215f3785c63af3c0daeb8d9daabbd7f9",
    "session": "fresh",
    "thread_id": "01a1d198-d44d-7310-b7c1-0f50305bea9a",
    "builder_response": "- Tests run: test/settings-levels-0666.test.mjs test/settings-levels-0661.test.mjs, with `speck test --related`, which added test/panel-0430, 0432, 0433, 0472, 0473, 0474, 0555, 0603, test/pipeline-0415, 0470, 0479 and test/subscriptions-0646 (they name the changed files).\n- Round 1. Each level, and the Add a level form, now has a labelled Builder list built from the Builder's own entries (`roleEntries('builder')`) after \"Default (<the Builder's saved agent · model>)\". There's also a labelled Effort list: \"Default (<saved builder_effort, or the agent's own>)\", then `levelEfforts` for the picked builder and model. The summary line, the model text box and its datalist are gone, and Remove is a small text button (`.ltextbtn`). The add button now comes after the fields.\n- Picking an entry sends `builder` and `builder_model` in one `set` request, which the server already accepted. Default sends both blank. The server (scripts/levels-panel.mjs) is unchanged, so what is saved and what is refused are the same as before (AC5).\n- AC3 covers the panel's own words. Error text the server sends back is shown as before, and a few rare errors name speck/config.yml (for example uncommitted changes in it). AC5 asks for the same refusals, so I left them as they are.\n- test/settings-levels-0661.test.mjs: its page tests checked the summary line, the \"settings\" options and the model box, which this ticket replaces. They now check the same things (order, saving, efforts per model, add, refusals) through the new lists. Its server tests are untouched.\n- AC4: a real-browser test at 375 px checks for no sideways scroll and that each level's name and lists fit the Builder's card. Pictures in both looks are with the review pack.\n",
    "seconds": 43,
    "usage": {
      "input_tokens": 165115,
      "cached_input_tokens": 127360,
      "cache_write_input_tokens": 0,
      "output_tokens": 1062,
      "reasoning_output_tokens": 262
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 37755,
      "cached": 127360,
      "write": 0,
      "output": 1062
    },
    "cost_usd": 0.098866,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-12T21:10:59.591Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "levelEntries and levelFields reuse roleEntries('builder'), add Default, retain unlisted saved values and save both fields. The five AC1 tests passed."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "levelFields normalises the saved model through levelEntry/asEntry before passing it to levelEfforts. An explicit agent-default model becomes blank, so levelEfforts can substitute the Builder row's different saved model and offer the wrong efforts. Existing AC2 tests do not cover this combination."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "levelField and drawLevels provide visible labels and remove the summary and old explanatory wording. AC3 passed; existing server refusals remain unchanged as AC5 requires."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panel-settings.css defines the small text Remove button and responsive fields; drawLevels places Add after the fields. Both AC4 tests passed, including the real-browser check at 375 pixels."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "levelAction retains the existing endpoint and request handling; server implementation is unchanged. AC5 tests cover persisted values, defaults, refusals and adding; existing 0661 coverage includes removing. Reported run had no failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-settings.js",
        "issue": "A saved explicit default model can display the wrong Effort choices. For example, with the Builder set to Codex model B and a level explicitly saved as Codex model A (Codex's default), levelEntry/asEntry changes A to a blank model for display. levelFields then passes that blank to levelEfforts, which substitutes B. The level still runs A, but its Effort list offers B's efforts.",
        "suggested_fix": "Calculate the effective model for efforts from the level's original saved builder_model, preserving an explicitly named default model. Use normalisation only for the Builder list's selected entry. Add a regression test with distinct effort lists for default model A and saved Builder model B.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The new labelled model lists and compact layout are covered by passing tests. One edge case needs fixing: a level explicitly using an agent's default model can show effort choices for a different model."
  }
}
```

</details>
