---
id: "0661"
title: "Set each build level from the team page"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-set-up-your-team-instead-of-settings.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0660"]                # ticket ids that must be done first
created: 2026-11-12
started: "2026-11-12T12:10:00.215Z"

---
# 0661 · Set each build level from the team page

**Status:** 🔍 reviewing

## Problem
After 0660, changing what Quick, Balanced and Deep build with, or adding a level such as Graphics, means editing `speck/config.yml` by hand. The team page is where you set up the builder, so the levels belong there too, where you can change them from your phone.

## Outcome
The team page shows the project's build levels, and you can change, add and remove them there.

## Acceptance criteria
1. The builder's card on the team page lists each of the project's levels in the order `speck/config.yml` gives them, each with its builder, model and effort, or "settings" for one it leaves out.
2. Changing a level's builder, model or effort there saves it to that level in `speck/config.yml`, offering the same choices the builder's own settings offer, and the next build of a ticket at that level uses it.
3. Adding a level with a name and any of the three values saves it to `levels:` in `speck/config.yml`. A name that isn't lowercase letters, digits and hyphens, or that's already a level, is refused with a message saying why, and nothing is saved.
4. Removing a level deletes it from `speck/config.yml`, except when a ticket that isn't done or cancelled names it: then it's refused with a message naming those tickets, and nothing is saved.
5. When `speck/config.yml` has no `levels:`, the page shows the three default levels, and the first change saves all three with the change to `levels:` in `speck/config.yml`.

## Out of scope
- Picking a ticket's level: 0662.
- Levels for the reviewer or QA.
- Saving levels for this machine only.

## Notes
- Follow how the team page saves `builder_model` and `builder_effort` today (`scripts/settings.mjs`, `templates/panel-settings.js`), keeping the page as narrow as it is now (one column on a phone).
- Failing before this build: none
- Self-check: saving the values a level already has now answers without an empty commit, and a level a ticket couldn't be built at (the reviewer sharing its model) is refused, each with a test.

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
    "reviewed_sha": "0d36a34b01a486c90c6ed5329a924e9e4a6aa9df",
    "session": "fresh",
    "thread_id": "01a1cfb3-fb53-7103-9955-54843f015323",
    "builder_response": "- Tests run: test/settings-levels-0661.test.mjs, with `speck test --related`, which also ran every existing test file naming a changed file (856 pass, 0 fail).\n- Round 1. Notes for the reviewer:\n  - Server: `scripts/levels-panel.mjs` (`panelLevelRequest`, `setLevelsText`), routed from `scripts/panel.mjs` as POST /api/levels/<name>/set|add|remove with the same origin and token check as /api/agents. `panelSettings` now gives `levels` (`levelsShown` in `scripts/levels.mjs`).\n  - It rewrites only the last top-level `levels:` block (the one speck reads), so comments inside that block aren't kept; everything else in the file is. Commits on the base branch, refusing a dirty config or another branch, as Settings' Save does.\n  - Beyond the ACs: a level that a ticket couldn't be built at (the reviewer would share its model, as `speck check` would refuse) is refused, and saving unchanged values commits nothing.\n  - Page: a Build levels block at the foot of the builder's card; each change saves at once by itself, not via the Save bar. Builder and effort offer the builder/builder_effort rows' own choices, with blank shown as \"settings\"; the model is typed, with the level's builder's models offered in a datalist. A real-browser look found `input.list` is read-only, which the fake page hid; fixed before this round. Pictures in the review pack.\n",
    "seconds": 49,
    "usage": {
      "input_tokens": 172752,
      "cached_input_tokens": 121088,
      "cache_write_input_tokens": 0,
      "output_tokens": 1049,
      "reasoning_output_tokens": 102
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 51664,
      "cached": 121088,
      "write": 0,
      "output": 1049
    },
    "cost_usd": 0.1259268,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-12T12:21:29.830Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "levelsShown and drawLevels list levels with their values and settings fallbacks. The reported passing AC1 test exercises order and displayed values."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "Saving and build resolution have passing tests, but levelControl uses rowChoices for effort instead of the model-aware choices used by settingChoices. Supported efforts such as ultra can be missing."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panelLevelRequest validates names and duplicates before writing. Passing AC3 tests cover additions, invalid names, duplicate refusal and page messages."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "panelLevelRequest checks listTickets and refuses removal when an active ticket names the level. Passing AC4 tests cover deletion, blocking ticket names and page refusals."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "levelsShown supplies defaults; panelLevelRequest materialises them on the first edit. Passing AC5 tests cover changing, adding and removing."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel-settings.js",
        "issue": "levelControl builds effort options from the static settings row. The builder's own settingChoices instead derives them from the chosen agent and model catalogue. Consequently a level cannot select supported catalogue efforts such as ultra unless already saved, and offers efforts the selected model may not support. The new choices test compares against static server metadata, so misses this AC2 failure.",
        "suggested_fix": "Derive effort choices from the level's effective builder and model using the same catalogue rules as the builder settings, including inherited values. Apply this to existing levels and the add form. Test a Codex model offering ultra and a second model with different supported efforts.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The team page can list, save, add and safely remove build levels, with relevant passing tests. One fix is needed: effort choices must follow the selected builder and model, so users can choose all supported efforts."
  }
}
```

</details>
