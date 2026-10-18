---
id: "0295"
title: "Open a pull request for an approved ticket in pull request mode"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0294", "0287"]               # ticket ids that must be done first
created: 2026-10-18

---
# 0295 · Open a pull request for an approved ticket in pull request mode

**Status:** 📋 ready

## Problem
speck ships by merging into the base branch and pushing it, with no pull request. Teams, and projects whose base branch only takes changes through pull requests, can't use it.

## Outcome
In pull request mode, an approved ticket gets a GitHub pull request with its review pack, instead of being merged locally.

## Acceptance criteria
1. A new setting, `ship_mode`, takes `local` (the default, as today) or `pr`. It's in the config template with a comment, `speck config set` accepts it, and the Settings view offers it with an explanation.
2. With `pr`, once a ticket is approved, speck pushes its branch and opens a pull request into the base branch with `gh`, titled with the ticket's id and title, its body the ticket's plain review pack (`speck pack <id> --plain`). The pull request's link is kept on the ticket and shown in the panel.
3. Opening it again for the same ticket finds the existing pull request instead of making a second one.
4. When `gh` isn't installed, isn't signed in, or can't open the pull request, the ticket stays approved, nothing is merged, and the panel and speck run say why in one line.
5. With `local`, approval and shipping work exactly as today.

## Out of scope
- Merging the pull request: 0296.
- Requiring approvals on GitHub.

## Notes
- From `speck/ideas/2026-10-08-pr-ship-mode.md`, opening the pull request only after approval, as the user prefers.
- Unverified: `gh pr create --base <base> --head <branch> --title … --body-file …` and `gh pr list --head <branch>` behave as needed. Check them against the installed `gh` before building.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
