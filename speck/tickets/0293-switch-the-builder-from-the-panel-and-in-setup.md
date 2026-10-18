---
id: "0293"
title: "Switch the builder from the panel and in setup"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0292", "0290"]               # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T12:14:23.327Z"

---
# 0293 · Switch the builder from the panel and in setup

**Status:** 🔨 building

## Problem
`builder` is read-only in the panel, because changing it needs a `build_command` that starts that agent, and setup asks the user to write one. Someone with Codex or Cursor can't switch to it without editing `speck/config.yml` by hand.

## Outcome
You can switch the builder in the Settings view and in setup, and speck sets everything that goes with it.

## Acceptance criteria
1. The Settings view's `builder` offers the builders that are installed and signed in (0288), and saving a change sets `build_command` blank so speck run uses that builder's own command (0289, 0290), in the same commit.
2. Saving a builder in the same family as the reviewer, without `allow_same_model_review`, is refused with a message suggesting a reviewer from another family, such as `claude` (0292) for a Codex or Cursor builder.
3. When `build_command` was set by hand to something other than the old builder's own command, the view says it will be replaced and asks you to confirm.
4. Setup offers each installed and signed-in builder, recommends Claude Code, and sets the builder this way. (checked by review)
5. A ticket keeps the builder it was made with: switching changes who builds tickets made from then on, and the view says so.

## Out of scope
- A different builder per ticket.

## Notes
- From `speck/ideas/2026-10-17-build-with-any-agent.md`. `builderMismatch` in `scripts/install.mjs` checks today that `build_command` matches `builder`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
