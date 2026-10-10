---
id: "0087"
title: "Change a speck setting from the command line"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-set-up-speck-by-giving-your-agent-a-prompt.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T13:56:59.164Z"

---
# 0087 · Change a speck setting from the command line

**Status:** 🔨 building

## Problem
Changing a setting today means editing `speck/config.yml` by hand. An agent setting speck up for someone (0088) would have to edit YAML directly, where one wrong indent or unquoted value breaks every speck command, and nothing checks the value is one speck accepts.

## Outcome
`speck config set <key> <value>` changes one setting safely: it checks the value, keeps the rest of the file as it was, and refuses anything speck wouldn't accept.

## Acceptance criteria
1. `speck config set <key> <value>` changes that one setting in `speck/config.yml`, including nested ones named with dots (for example `commands.test` or `limits.max_review_rounds`). Every other line, comment and the order of settings stay exactly as they were, and it prints `<key>: <old> → <new>`.
2. A value that needs quoting in YAML (for example one containing `#`, `: ` or quotes, like `build_command`) is written so the file reads back with exactly that value.
3. Values are checked as speck reads them: an unknown key, `reviewer_effort` outside blank, low, medium, high, xhigh or max, a true/false setting given anything else, a limit that isn't a whole number of 1 or more, or `auto_ship_risk` not made of low and high, is refused with a plain message, and the file is unchanged.
4. A known key missing from an older config file is added under its section, so the file still loads.
5. It doesn't commit. Without `speck/config.yml`, it says to run `speck init` first and changes nothing.

## Out of scope
- Editing settings from the panel (`speck/ideas/2026-10-09-edit-settings-from-the-panel.md`), which could reuse this later.
- `reviewer_options` and other free-form maps.

## Notes
- Used by the setup skill (0088) for every choice the user makes.
- Self-check: added a test that a value holding a newline is written on one line and reads back exactly.
- Three tests in luro-0082 and private-words-0084 already fail on main: they read speck/ideas/2026-10-10-set-up-speck-by-giving-your-agent-a-prompt.md, which was filed into speck/ideas/done/. Not this ticket's change.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
