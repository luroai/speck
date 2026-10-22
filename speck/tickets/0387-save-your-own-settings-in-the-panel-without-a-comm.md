---
id: "0387"
title: "Save your own settings in the panel without a commit"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-change-your-own-settings-without-a-commit.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0386","0385"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T23:11:40.614Z"

---
# 0387 · Save your own settings in the panel without a commit

**Status:** 🔨 building

## Problem
The panel's Save commits speck/config.yml to `main` for every setting except the two this machine can hold. It refuses to save while that file has uncommitted changes, so a change made with `speck config set` blocks the panel until someone commits it.

## Outcome
Saving your own settings in the panel makes no commit.

## Acceptance criteria
1. In Settings, saving a change to one of your own settings (0386's list) saves it for this machine. It changes nothing in speck/config.yml, makes no commit, and doesn't ask where the change should go.
2. Saving only your own settings works while speck/config.yml has uncommitted changes, and leaves those changes as they are.
3. A change to any other setting is saved to speck/config.yml and committed as today, and is still refused while that file has uncommitted changes. A Save with both kinds saves each where it belongs, or saves nothing if either is refused.
4. Each of your own settings shows whether its value is this machine's or speck/config.yml's. One this machine holds can be cleared back to speck/config.yml's, as 0261 does for the parallel limits. The line at the top of Settings says which settings saving commits.
5. No test that passed before this change fails, except checks that your own settings are committed, or that you're asked where they go, which are changed to check criteria 1 and 4.

## Out of scope
- Which settings are your own, and how speck reads them: 0386.
- Editing speck/config.yml's defaults for your own settings from the panel.

## Notes
- Checked 2026-10-22: `panelSaveSettings` in `scripts/settings.mjs` commits speck/config.yml for every change not marked for this machine, and refuses with 409 while `git status` shows the file changed. In `templates/panel.html`, `settingScope` (0261) asks where a change to a setting this machine can hold goes.
- Waits for 0386, and for 0385, which also changes `templates/panel.html`.
- Failing before this build: none
- The panel now saves every one of your own settings (0386's list) for this machine, whatever the Save says for it, so a cached page sending `repo:` for one saves it for this machine too. `machine:<key>=` with a blank value still clears this machine's value (0261, as `speck config set --machine <key> ""`), so a blank value for this machine, such as reviewer_model left at the reviewer's default while speck/config.yml names one, is sent as `blank:<key>=`.
- Switching the builder now saves its build_command for this machine with it, as `speck config set builder` does (0386), and clearing this machine's builder clears that build_command too. The auto_ship confirmation (0259), the same-model check (0280) and the hand-set build_command confirmation (0293) all apply to your own settings, checked against the values speck uses.
- Existing tests changed under criterion 5, each because it checked that one of your own settings is committed or that you're asked where it goes: 0258 AC2, AC4 and AC5, 0259 AC1 (both) and AC2, 0261 AC1, AC2 (both) and AC4, 0274 AC2 (three), AC4 (three), 0275 AC2, 0276 AC2, 0293 AC1 and AC3, 0311 AC1 and AC1/3/4 (whose `setCfg` now also removes this machine's values, so the file's apply), and 0370 AC2. Where a test used one of your own settings only as an example of a committed setting, it now uses `ship_mode` or a `limits.` setting, keeping its checks; where it checked the commit itself, it now checks this machine's value and that git is unchanged.
- The brief's and README's description of the panel's Save now say your own settings are saved for this machine without a commit; they described the old question.
- Self-check: no changes.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
