---
id: "0397"
title: "Say where a setting is saved in its explanation"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-rehash-the-settings-screen.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0396"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T10:24:22.591Z"

---
# 0397 · Say where a setting is saved in its explanation

**Status:** 🔨 building

## Problem
Settings marks rows "repo", "repo default", "default" and "this machine", and opens with a paragraph starting "What speck uses now…". The marks and the paragraph confuse more than they explain.

## Outcome
Each setting's explanation says where a change to it is saved, and the rows and the top of Settings carry no such marks.

## Acceptance criteria
1. No setting's row shows a "repo", "repo default", "default" or "this machine" mark.
2. Each setting's explanation ends by saying where a change to it is saved: for your machine only, without a commit, or for the project in speck/config.yml, with a commit. It also says what speck uses when the setting is left blank.
3. When a setting's value is this machine's own, over the project's, its explanation says so and offers to clear it back to the project's value, as the row does today (0261).
4. The paragraph starting "What speck uses now" is gone, and nothing replaces it.
5. No test that passed before this change fails, except checks of the marks and the paragraph, which are changed to check these criteria.

## Out of scope
- The agent and model lists: 0399 and 0400.

## Notes
- Checked 2026-10-23: the marks come from `span.default` in each row in `templates/panel.html` (0261, 0273), and the paragraph from the text beginning "What speck uses now" (0387).
- This covers `speck/ideas/2026-10-22-keep-settings-still-when-a-setting-s-button-is-pressed.md`, whose buttons go here, which the user dropped on 2026-10-23.
- Waits for 0396: both change Settings in `templates/panel.html`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
