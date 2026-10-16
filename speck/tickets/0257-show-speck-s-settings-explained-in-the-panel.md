---
id: "0257"
title: "Show speck's settings, explained, in the panel"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-09-edit-settings-from-the-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T20:29:54.810Z"
approved: "2026-10-16T20:38:12.798Z"

---
# 0257 · Show speck's settings, explained, in the panel

**Status:** 👍 approved

## Problem
Someone who has just set speck up can't tell which of the 30 or so lines in `speck/config.yml` matter, what each one does or what changing it would mean, so they leave settings as they are or change them blind. Some settings matter a lot: `auto_ship` decides whether approved tickets merge and push without them.

## Outcome
The panel has a Settings view that shows the settings people tune, grouped, each with its current value and a plain-English explanation of what it does.

## Acceptance criteria
1. The panel's header has a Settings button. Pressing it opens the Settings view. The view closes with its close button or Escape, and focus then returns to the Settings button.
2. The view lists these settings, in four groups in this order: "Shipping" (`auto_ship`, `auto_ship_risk`), "Building and reviewing" (`builder`, `reviewer`, `reviewer_model`, `reviewer_effort`, `allow_same_model_review`), "How much runs at once" (`max_parallel_builds`, `max_parallel_tests`) and "Ticket size limits" (`limits.max_acceptance_criteria`, `limits.max_changed_lines`, `limits.max_review_rounds`). Each shows its name as written in `speck/config.yml` and the value speck reads from the panel's checkout. A setting missing from the file shows speck's default value, labelled "default".
3. Each setting has an explanation of one or two sentences saying what it does and what changes if its value changes. The explanations of `auto_ship` and `auto_ship_risk` say that a ticket they cover is merged and pushed to the base branch without waiting for you.
4. After `speck/config.yml` changes, the next time the view is opened it shows the new values, without reloading the page.
5. The view has no control that changes a setting, and opening or using it sends the panel server no request other than a GET.

## Out of scope
- Changing settings from the panel: 0258, 0259 and 0261.
- Settings for this machine only: 0260 and 0261.
- Plumbing settings (`base_branch`, `build_command`, `commands.*`, timeouts and the rest), which stay in the file.

## Notes
- Panel files: `scripts/panel.mjs` (server, a GET for the settings or settings in the board state) and `templates/panel.html` (header and view). Read values with `loadConfig` in `scripts/core.mjs`, which supplies the defaults.
- Explanations live in one place so 0258–0261 can reuse them. Write them in British English, at a product-minded rather than technical level.
- Failing before this build: none
- Self-check: a value that's an object now reads as JSON rather than "[object Object]", and a test checks that an answer for a view closed and opened again since is dropped.
- Header: the Settings button made the header too tight at 700 px for the project's name. Rather than add a media query (0140 allows only the phone one), the header's gaps and sides narrow with the screen below 900 px and are unchanged from 900 px up. The header, layout, contrast and dark-look tests (0136, 0140, 0147, 0150, 0160, 0161, 0163) pass.

## In plain words
The panel's header has a new Settings button, just before the light/dark button. It opens a side pane listing the twelve settings people usually tune, in four groups: shipping, building and reviewing, how much runs at once, and ticket size limits. Each one shows its current value, marked "default" when your settings file doesn't set it, and a sentence or two on what it does and what changing it would mean. The two shipping settings say plainly that a ticket they cover is merged and pushed without waiting for you.

To see it, open the panel and press Settings. Close it with its Close button or Escape. Change a value in the settings file, then open the view again: it shows the new value without reloading the page. Nothing in the view changes a setting: you still edit the file to do that.

Worth a look: the header's spacing now narrows a little on screens between phone width and 900 px wide, to make room for the new button.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 113,707
- Elapsed since build started: 8 min
- Changed lines: 164 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (Delivery log only, none went to the inbox):
- The auto_ship explanation doesn't mention auto-ship's third condition, that the reviewer could inspect the repo in every round. It's left out to keep the explanation short. Revisit it if people are surprised that a covered ticket waits.
- The Settings pane copies the full-ticket pane's styles rather than sharing them. A tidy-up could give both panes one shared class.

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
    "reviewed_sha": "6a860ed0f98d92b7296e6a78b095a87e1f24557e",
    "thread_id": "01a1466f-41ca-7770-a945-245c3838071a",
    "seconds": 23,
    "usage": {
      "input_tokens": 113058,
      "cached_input_tokens": 70144,
      "cache_write_input_tokens": 0,
      "output_tokens": 649,
      "reasoning_output_tokens": 44
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-16T20:38:01.704Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html adds the header button, openSettings(), closeSettings() and Escape handling. The two AC1 tests passed and exercise opening, both closing methods and focus restoration."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/settings.mjs panelSettings() reads the checkout through loadConfig(), supplying the required groups, keys, values and default labels. Three passing AC2 tests cover server values, missing settings and page rendering."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "SETTING_GROUPS provides reusable explanations for all 12 settings, including the required merge-and-push warning for both shipping settings. Both AC3 tests passed; the explanations also satisfy manual inspection."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "openSettings() fetches /api/settings with cache disabled on every opening; panelSettings() rereads the file. Passing tests cover changed config, reopening, request failures and rejection of stale responses."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "renderSettings() provides only a Close control and fetches through GET. The server rejects other methods before routing /api/settings. Passing AC5 tests exercise page controls, request methods and server rejection of POST."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The panel now shows the requested settings in four explained groups, refreshes their values each time it opens, and offers no editing controls. The tests exercise all five criteria and passed. I found no blocking correctness or scope issues."
  }
}
```

</details>
