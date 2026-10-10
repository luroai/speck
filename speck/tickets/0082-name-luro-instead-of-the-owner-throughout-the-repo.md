---
id: "0082"
title: "Name Luro instead of the owner throughout the repo's files"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
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
started: "2026-10-10T12:55:01.374Z"

---
# 0082 · Name Luro instead of the owner throughout the repo's files

**Status:** 🔨 building

## Problem
speck is moving to the `luroai` GitHub organisation under the brand Luro, and the owner wants to keep their own name out of it. Today the install command points at the owner's personal GitHub account, and the docs name the owner, so anyone reading the repo sees who they are.

## Outcome
The repo's files point to `luroai/speck` and refer to Luro or "the maintainer", never the owner's name, old GitHub handle or machine username.

## Acceptance criteria
1. `README.md`, `docs/brief.md` and the message speck prints when a copy can't install itself all give the install command as `npx github:luroai/speck init`. A test checks the message.
2. Apart from this ticket's own file, no tracked file contains the owner's old handle, machine username or first name (case-insensitive `git grep`).
3. `docs/HANDOFF.md` is deleted. It's the v0.1 handoff note and says nothing has been committed yet, so it's out of date.
4. Where the owner was named in a sentence that stays, it now says "the maintainer". Where an example used an absolute home folder path, it now uses a `~/` path. Each sentence otherwise reads as before.
5. `docs/panel-mockup.html` shows `luroai/speck`, and the full test suite passes.

## Out of scope
- Rewriting git history or commit authors. That's done by hand after this ships (see Notes).
- Publishing to npm or changing the package name.
- The repo move itself, which the owner does on GitHub.

## Notes
- This ticket's own file names the old handle and name so the reviewer can check AC2. The later history rewrite replaces them in every file and commit, this one included.
- Known places on 2026-10-10: `README.md`, `docs/brief.md` (install row, success measure), `docs/HANDOFF.md`, `docs/panel-mockup.html`, the install message in `scripts/install.mjs`, `speck/ideas/2026-10-10-set-up-speck-by-giving-your-agent-a-prompt.md` (pilot line), `speck/tickets/done/0053-…` (example path).
- Assumption: deleting `docs/HANDOFF.md` rather than editing it (AC3).
- Unverified: `npx github:luroai/speck init` works only once the repo is at `luroai/speck`. The owner moves it, so the builder can't check this.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
