---
id: "0211"
title: "Stop speck run starting Claude Code for another builder"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-match-build-command-to-the-chosen-builder.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T13:54:45.172Z"

---
# 0211 · Stop speck run starting Claude Code for another builder

**Status:** 🔨 building

## Problem
When the user picks Codex, Cursor or Gemini as the builder in `/speck-setup`, `build_command` still starts Claude Code, so `speck run` builds every ticket with an agent they didn't choose, or fails if Claude Code isn't installed. Nothing says so, and a non-technical user won't spot it.

## Outcome
`speck run` never starts one agent's builds when another is set as the builder, and setup leaves a build command that matches the builder.

## Acceptance criteria
1. When `builder` in `speck/config.yml` is `codex`, `cursor` or `gemini` and the first word of `build_command` is `claude`, `speck run` refuses to start, changing nothing, with a plain message naming both and saying how to fix it: set a `build_command` that starts the chosen builder, or set `builder` back to `claude`.
2. `speck doctor` reports the same mismatch with the same advice, and reports nothing about it when they match.
3. When the user chooses a builder other than Claude Code in `/speck-setup`, the skill explains that `build_command` must start that builder without anyone watching, asks the user for the command or offers to leave it blank (builds then start with `/speck-build <id>`), and never leaves Claude's default in place. The copies of the skill that `speck init` installs say the same as `skills/`.
4. With `builder: claude`, or a `build_command` that doesn't start with `claude`, everything works as before.
5. No test that passed before this change fails.

## Out of scope
- Shipping ready-made build commands for each builder, since their flags change between versions.
- Checking that a non-Claude build command works.

## Notes
- Asked for 2026-10-15, for release 0.4.0.
- Decided 2026-10-15: speck flags the mismatch rather than shipping known commands per builder, which settles the note's open question.
- Builder names and their commands: `claude` (`claude`), `codex` (`codex`), `cursor` (`cursor-agent`), `gemini` (`gemini`), from `skills/speck-setup/SKILL.md` section 5. `speck run`'s check of `build_command` is in `cmdRun` in `scripts/run.mjs`; `speck doctor` is in `scripts/install.mjs` (`doctorChecks`).
- No other open ticket changes these files.
- Failing before this build: none
- AC2 and AC5 clashed on one test: `0014 AC1` in `test/core.test.mjs` ran doctor with builder codex, cursor or gemini and Claude Code's default `build_command`, and expected it to pass. That is the mismatch AC2 says doctor must report, so the test now gives those builders a blank `build_command`. Every 0014 assertion is unchanged.
- "Starts with claude" also matches a path to it, such as `/usr/local/bin/claude`.
- Self-check: no changes

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
