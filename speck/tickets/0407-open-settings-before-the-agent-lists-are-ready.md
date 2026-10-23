---
id: "0407"
title: "Open Settings before the agent lists are ready"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-open-settings-before-the-agent-lists-are-ready.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0406"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T12:25:48.528Z"

---
# 0407 · Open Settings before the agent lists are ready

**Status:** 🔍 reviewing

## Problem
Opening Settings sits on "Loading the settings…" until speck has finished asking every agent CLI whether it is signed in and which models it offers. Cursor's model list alone often takes a few seconds, so the view feels stuck even though the config is ready at once.

## Outcome
Settings opens from this machine's and the project's config straight away, and the agent catalogues fill in afterwards.

## Acceptance criteria
1. Opening Settings shows every settings group and the values speck reads from config within about half a second on a normal machine, without waiting for Codex's or Cursor's model list, or for each agent's install and sign-in check. The whole view no longer stays on "Loading the settings…" for that wait.
2. While those catalogues are still loading, each role's model list and Your agents say they are loading in place. When a list arrives, that control updates to the real entries without closing Settings, without clearing what you have typed or picked, and without jumping the scroll or the keyboard focus.
3. If a catalogue fails or times out, that control shows why in one line, as today when models can't be read, and the rest of Settings stays usable. Saving a setting that does not need a fresh catalogue still works while a list is loading.
4. No test that passed before this change fails, except a check that Settings stays on loading until every agent answer is back, which is changed to check criteria 1 and 2.

## Out of scope
- Making the agent CLIs themselves faster.
- Changing which models each role offers once the lists have arrived: 0400 and 0403.

## Notes
- Asked for 2026-10-23 after timing the wait: on this machine Cursor's `agent models` took about 2.4s; each CLI may take up to 10s (`AGENTS_TIMEOUT_MS`, `CODEX_MODELS_TIMEOUT_MS`).
- Checked 2026-10-23: `openSettings` / `loadSettings` in `templates/panel.html` fetch `/api/settings` once and only then draw the ok view. `settingsAnswer` in `scripts/settings.mjs` awaits `findAgentsAsync` (sign-in checks) and `yourModels` (Codex and Cursor model lists for your agents) before returning.
- Prefetching when the panel starts, or caching the last lists, is fine as how, so long as criteria 1–3 hold.
- Failing before this build: none
- Self-check: Your agents changed by an add or a removal while the lists are read again after a Save now stays as changed, rather than being overwritten by the older answer (test added).
- AC4: no existing test checked that Settings stays on loading until every agent answers, so none was changed. The 39 existing test files that open Settings or read /api/settings pass with the change.
- Waits for 0406: both change Settings loading and grouping (`templates/panel.html`, `scripts/settings.mjs`, `scripts/panel.mjs`).

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
    "reviewed_sha": "78450de1e8d33188a74e8cde5959a1eb1e4c1b4d",
    "session": "fresh",
    "thread_id": "01a168c0-9e5d-7ed1-8849-93a022fb4164",
    "builder_response": "- Tests run: test/settings-0407.test.mjs (with the commands.checks files, which speck test --files adds)\n- Round 1. GET /api/settings?quick=1 answers from the config alone (settingsQuick) with `loading: true`; the page draws it at once, then reads GET /api/settings (unchanged settingsAnswer) and fills the role lists and Your agents in place (fillCatalogues: redrawSettings with each key kept, and drawAgents, which restores focus). A first answer without `loading` is drawn as before, with no second read, so existing tests and views keep working.\n- AC4: no existing test checked that Settings stays on loading until every agent answers, so none was changed. I also ran the 39 existing test files that open Settings or read /api/settings: all 342 tests pass.\n- Pictures: four, of Settings loading and filled, light and dark, from a real panel with the full read held back in the browser.\n",
    "seconds": 41,
    "usage": {
      "input_tokens": 197012,
      "cached_input_tokens": 148352,
      "cache_write_input_tokens": 0,
      "output_tokens": 1076,
      "reasoning_output_tokens": 190
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T12:34:17.688Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/settings.mjs settingsQuick reads config without agent checks; panel.mjs exposes the quick endpoint. The three AC1 tests passed, covering response time and drawing settings before the full answer."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "fillCatalogues updates controls in place, with passing tests for preserved edits and focus. However, roleEntries always offers the Foreman's inherited-builder entry, so roleEditor never adds a loading label for the usual blank Foreman configuration. The AC2 loading test checks only builder and reviewer."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "fillCatalogues and drawAgents display catalogue errors while retaining settings. Both AC3 tests passed, covering error messages and saving an unrelated setting during loading."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The supplied round output reports 118 passed, zero failed and three skipped. Existing tests were not weakened; the builder also reports 342 passing tests across the existing Settings-related files. Whole-suite verification remains the shipping check."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html",
        "issue": "The Foreman model control does not indicate loading when Foreman inherits the builder's agent. roleEntries includes the selected '|' entry even with an empty catalogue, while roleEditor adds loading text only for values absent from the entries. This violates the requirement that each role's list indicate loading.",
        "suggested_fix": "Show a loading indicator for every role independently of whether its selected value already exists. Extend the deferred-answer test to check Foreman with its default inherited-builder value.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Settings now opens promptly and fills in agent information afterwards while preserving edits. Error handling and saving during loading are covered. One required detail remains: the default Foreman control gives no indication that its model list is still loading."
  }
}
```

</details>
