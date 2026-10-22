---
id: "0369"
title: "Show the chosen agent's models before saving"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: cursor
reviewer_model: grok-4.7-high       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-calm-the-settings-view-down.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0368"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T20:55:11.777Z"

---
# 0369 · Show the chosen agent's models before saving

**Status:** 🔍 reviewing

## Problem
Picking Cursor as the builder or the reviewer leaves the model list as it was. The reviewer's model becomes a box that says to save Cursor and open Settings again, and the builder's model keeps showing the saved builder's models. You can't pick a Cursor model, such as a Grok model, until you've saved and reopened.

## Outcome
Choosing a builder, reviewer or Foreman agent that can list its models fills that agent's model list straight away, before you save.

## Acceptance criteria
1. Choosing `cursor`, `codex` or `claude` as the builder, while another builder is saved, makes `builder_model` a list of that agent's models, each shown as it is when that builder is already saved. Nothing is saved, and Settings stays open.
2. Choosing `cursor` or `codex` as the reviewer, while another reviewer is saved, does the same for `reviewer_model`. The line that says to save it and open Settings again no longer shows. Choosing `claude` or `claude-subagent` still offers Claude's model names, as today.
3. Choosing another Foreman agent does the same for `foreman_model`, and no longer says to save it and open Settings again.
4. While that list is being read, the model setting says so in one line. When the list can't be read, the setting is a box to type in, with why in one line, as when the saved agent's models can't be read today. A value already chosen that the new list doesn't offer still shows, marked as not offered, and stays until you change it.
5. No test that passed before this change fails, except checks that choosing another reviewer or Foreman agent says to save and open Settings again, which are changed to check criteria 2 and 3.

## Out of scope
- Opening Settings as a full-panel pop-up: 0368.
- Keeping the rest of the view still while the list appears: 0370. This ticket may redraw the view, as changing the reviewer does today.
- Passing the chosen model to a build or a review. Saving still writes the settings as today.

## Notes
- Checked 2026-10-22: `reviewerModels` and `builderModels` in `scripts/settings.mjs` read models only for the reviewer and builder saved in `speck/config.yml`. `modelsWhy` in `templates/panel.html` shows "Save cursor as the reviewer, then open Settings again to pick from its models." when the chosen reviewer isn't the one those models were read for (0347, criterion 4). `foremanModelsWhy` says the same for the Foreman (0348, criterion 4). `builderModelList` keeps showing the saved builder's models when another builder is chosen. Cursor's models come from `agent models`, as `speck agents` reports (`docs/brief.md`).
- The Foreman is included: it has the same save-and-reopen line, on the same view.
- 0370 and 0371 wait for this: they change `templates/panel.html` too. This one also changes `scripts/settings.mjs`.
- Failing before this build: none
- Self-check: the new models request now always answers, with why in one line, when reading an agent's models fails (it could have hung), with a test.
- `scripts/panel.mjs` was at the 600-line limit, so the GET /api/settings model reading moved, unchanged, into `settingsAnswer` in `scripts/settings.mjs`.

## In plain words
In Settings, picking a different builder, reviewer or Foreman agent now fills its model list straight away, so you can pick, say, a Grok model for a Cursor reviewer without saving and reopening Settings first. While the list is being fetched, the model setting says so in one line. If it can't be fetched, you get a box to type the model's name in, with a line saying why. A model you'd already chosen that the new agent doesn't offer stays, marked "not offered", until you change it.

To see it: open Settings, change the reviewer to cursor and open the reviewer_model list. Worth a look: fetching Cursor's or Codex's list can take a few seconds the first time you pick that agent in an open Settings view.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · cursor · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "cursor",
    "reviewer_model": "grok-4.7-high",
    "reviewer_effort": "default",
    "reviewed_sha": "1e2794fa04d5c969a319f93adc245112dfd08b46",
    "session": "fresh",
    "thread_id": "320c1180-78b6-4dfd-acfc-0b2ff205cd56",
    "builder_response": "- Tests run: test/settings-models-0369.test.mjs (this ticket's), test/settings-cursor-0347.test.mjs and test/settings-foreman-0348.test.mjs (changed for AC5), and every other test file that opens the Settings view: test/agents-0288.test.mjs test/build-model-0279.test.mjs test/builder-switch-0293.test.mjs test/foreman-fix-0286.test.mjs test/builder-model-0311.test.mjs test/panel-0275.test.mjs test/panel-0258.test.mjs test/panel-0368.test.mjs test/panel-0259.test.mjs test/panel-0257.test.mjs test/panel-0261.test.mjs test/panel-0268.test.mjs test/panel-0274.test.mjs test/panel-0273.test.mjs test/review-claude-0292.test.mjs test/run-builder-0324.test.mjs test/settings-0276.test.mjs test/settings-0278.test.mjs (plus the commands.checks files, which speck test --files always runs).\n- How it works: the panel has a new GET /api/agent-models?agent=<id> (agentModels in scripts/settings.mjs). The Settings view asks it the first time codex or cursor is chosen as the reviewer, builder or Foreman agent and the server's read for the saved one doesn't cover it, keeps the answer for as long as the view is open (reset when it reloads or closes), says \"Reading <agent>'s models…\" meanwhile, and redraws when it lands. Claude's names are used as before for claude and claude-subagent.\n- scripts/panel.mjs was exactly at the 600-line check (test/split-0078), so GET /api/settings's model reading moved unchanged into settingsAnswer in scripts/settings.mjs.\n- AC5: the two changed tests are 0347 AC4 and 0348 AC4, which checked the \"save, then open Settings again\" line; they now check that line is gone and the models are asked for.\n- Pictures checked in a real browser against the real endpoint: choosing cursor as builder and reviewer lists Cursor's models, with \"Reading cursor's models…\" first and a saved Codex model marked \"not offered\".\n",
    "seconds": 657,
    "usage": {
      "inputTokens": 119051,
      "outputTokens": 40499,
      "cacheReadTokens": 1915008,
      "cacheWriteTokens": 0
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T21:14:37.753Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html builderModelList and modelsRead switch the list to the chosen builder (Claude names from claude_models, Codex or Cursor from GET /api/agent-models via askAgentModels) without posting a save. Test '0369 AC1: choosing cursor, codex or claude as the builder lists its models, as when it is saved, without saving' compares those options with a view opened with that builder already saved, and checks Settings stays open and nothing is posted. scripts/settings.mjs agentModels reads the same Codex and Cursor sources as builderModels."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.html reviewerModelList and modelsWhy load Codex or Cursor when the chosen reviewer is not the saved one, and drop the save-and-reopen line. Claude and claude-subagent still use claude_models and do not call the new endpoint. Test '0369 AC2: choosing cursor or codex as the reviewer lists its models, without the line to save and open Settings again' checks the option text against a saved reviewer, Codex efforts, Claude's names, and that nothing is saved. The updated '0347 AC4' test checks the old line is gone and /api/agent-models?agent=cursor is requested."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html foremanModelList and foremanModelsWhy use the same modelsRead path, including when a blank Foreman follows the builder (foremanAgentChosen). Test '0369 AC3: choosing another Foreman agent lists its models, without the line to save and open Settings again' covers switching to Codex and Cursor, and one shared Cursor read when the builder changes under a blank Foreman. The updated '0348 AC4' test checks the old line is gone, the request is made, and switching back to Claude lists fable, opus, sonnet and haiku."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "askAgentModels stores {reading:true} and readingWhy shows 'Reading <agent>'s models…' in one paragraph while the request is open; a failure or a non-OK response becomes a text input plus one why line (agentModels always returns {why} on a thrown read). settingEditor still keeps a current value that is not in the new choices as a disabled '<value> (not offered)' option until the value changes. Tests '0369 AC4: while the list is read…' and '0369 AC4: a value chosen that the new list doesn't offer…' cover the reading line, a signed-out why, HTTP 500, an unreachable panel, and the not-offered mark for builder and reviewer. '0369: agentModels reads the models…' covers thrown errors and unknown agents."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The only changed existing tests are 0347 AC4 and 0348 AC4, which AC5 names: they no longer require the save-and-reopen line and now check that line is absent and the models are requested. The builder's run of the ticket tests, those two files, and the other Settings-view tests was 300 passed, 0 failed, 3 skipped. The move of GET /api/settings into settingsAnswer keeps the same per-role catch and the same Codex-once and Cursor-once reads, and scripts/panel.mjs and scripts/settings.mjs stay under the 600-line split."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "In Settings, picking a different builder, reviewer, or Foreman now fills in that agent's model list before you save. While the list is loading, the model field says so in one line. If the list cannot be read, it becomes a box to type a model name, with one line saying why. A model you had already chosen that the new list does not include stays selected and is marked not offered until you change it. Claude still offers its usual model names. Nothing is saved until you press Save, and Settings stays open. The checks cover those cases, including the two older checks that used to expect a \"save and open Settings again\" message. I found nothing that should hold this back."
  }
}
```

</details>
