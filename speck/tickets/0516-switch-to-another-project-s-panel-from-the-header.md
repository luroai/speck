---
id: "0516"
title: "Switch to another project's panel from the header"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-10-11-show-all-your-projects-in-one-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-26

---
# 0516 · Switch to another project's panel from the header

**Status:** 📝 draft

## Problem
Each speck project has its own panel on its own port, so someone working on several projects (speck, speck-site, carbon) has to remember each panel's address to move between them. There's no way to get from one project's panel to another's.

## Outcome
From any project's panel, you can open the panel of any other speck project running on the same machine, from the panel's header.

## Acceptance criteria
1. While two or more speck panels are running on the same machine, each one's header has a project menu listing every other running panel by its project's folder name. With no other panel running, the header shows no menu.
2. Choosing a project in the menu opens that project's panel in the same browser tab, where its buttons work as they do when it's opened directly.
3. A panel that stops, whether by `speck panel --stop`, Ctrl+C or being killed, leaves every other panel's menu within 10 seconds, and one that starts joins it within 10 seconds, without reloading the page.
4. On a page opened through a panel's `--url` address, each project in the menu opens at that project's own `--url` address, and a project whose panel has no `--url` isn't listed there. On a page opened at `127.0.0.1` or `localhost`, each opens at its own local port.
5. No test that passed before this change fails.

## Out of scope
- One panel showing every project's tickets, and a build limit across projects: these stay in the source idea, which isn't ticketed by this.
- Starting or stopping another project's panel or `speck run` from the menu.
- Projects whose `.speck/` copy is older than this change: their panels join the menu once that project updates speck.

## Notes
- First step of `speck/ideas/2026-10-11-show-all-your-projects-in-one-panel.md` (its 2026-10-13 note). The user asked for this step only, 2026-10-26; the rest of the idea stays an idea.
- The list of running panels lives in the user's home folder (for example `~/.config/speck/panels/`), as `~/.config/speck/private-words` does, never in a repo: it holds folder paths.
- Each panel stays its own process on its own port, with its own token: the menu only links to the other panel's address.
- Header: `templates/panel.html`, `templates/panel-header.js` and `templates/panel-header.css`. Server: `scripts/panel.mjs` (at the 600-line limit for `scripts/`) and `scripts/panel-background.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
