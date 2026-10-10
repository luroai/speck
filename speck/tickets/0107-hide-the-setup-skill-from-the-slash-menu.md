---
id: "0107"
title: "Hide the setup skill from the slash menu"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T22:40:08.804Z"

---
# 0107 · Hide the setup skill from the slash menu

**Status:** 🔨 building

## Problem
The `speck-setup` skill (0088) appears in Claude Code's `/` menu beside Capture, Ticket, Build and Ship. People only need it once, when the pasted setup prompt starts it, and every extra entry in the menu is one more thing to learn.

## Outcome
The setup skill is agent-only: it's hidden from the `/` menu, and the setup prompt still starts it.

## Acceptance criteria
1. The `speck-setup` skill's frontmatter has `user-invocable: false`, in the source and in both skill folders `speck init` installs.
2. Its description says it's started by the setup prompt in the README, not typed as a command.
3. The README's setup prompt still names the skill, and no test that passed before this change fails.

## Out of scope
- Other agents' menus, which speck can't control; the description covers them.

## Notes
- Decided 2026-10-10: new skills are agent-only; only Capture, Ticket, Build and Ship (plus the existing review and status) are for people.
- Checked 2026-10-10: `user-invocable: false` hides a skill from the `/` menu while Claude can still load it (Claude Code skills docs).
- Failing before this build: none
- Self-check: the description first had "starts it: it isn't", which isn't valid in a plain YAML scalar; reworded it and added a test that the frontmatter values have no ": ".
- Also noted the menu change in the `/speck-setup` rows of the README and the brief, so they don't suggest typing it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
