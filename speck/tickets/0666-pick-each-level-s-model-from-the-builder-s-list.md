---
id: "0666"
title: "Pick each level's model from the builder's list"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 🔨 building

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
