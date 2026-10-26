---
id: "0516"
title: "Switch to another project's panel from the header"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
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
Each speck project has its own panel on its own web address, and the panel's home-screen app belongs to one address. Someone with several projects on speck (speck, speck-site, carbon) has to keep a separate address, or a separate app, for each, and has no way to get from one project's panel to another's.

## Outcome
From one panel, at the address it was opened at, including its home-screen app, you can switch between every speck project whose panel is running on the same machine, each still run entirely by its own panel.

## Acceptance criteria
1. While two or more speck panels are running on the same machine, each one's header has a project menu listing every running panel's project by its folder name, with the one being shown marked. With no other panel running, the header shows no menu.
2. Choosing another project shows that project's panel at the same address the page was opened at, without leaving it, including through a `--url` address, where the other project's panel needs no `--url` of its own. Everything on it works as when that panel is opened directly: its board, its live updates, its review packs and its buttons and settings, which change only that project. Its header's menu switches to any other project, including back.
3. A panel that starts joins every other panel's menu within 10 seconds, and one that stops, whether by `speck panel --stop`, Ctrl+C or being killed, leaves it within 10 seconds, without reloading the page. While the project being shown has no running panel, the page says so and its menu still switches to the others.
4. Only the running speck panels in the menu can be reached through another panel: a request through a panel for any other project, port or address is refused. A request reaching a panel through another needs that panel's own key, as a direct request does, and is refused without it.
5. No test that passed before this change fails.

## Out of scope
- One panel showing every project's tickets together, and a build limit across projects: these stay in the source idea, which isn't ticketed by this.
- Starting or stopping another project's panel or `speck run` from the menu.
- Projects whose `.speck/` copy is older than this change: they join the menu once that project updates speck.
- Keeping light, dark or system appearance separate for each project: the browser keeps it for the address, so one choice applies to every project shown there (the user's choice, 2026-10-26).

## Notes
- First step of `speck/ideas/2026-10-11-show-all-your-projects-in-one-panel.md` (its 2026-10-13 note), changed with the user, 2026-10-26: switching stays at the one address, so the phone's home-screen app (0149, `scope: "/"` in `templates/icons/manifest.webmanifest`) never opens a browser sheet, which a link to another panel's own address does. The rest of the idea stays an idea.
- No crossover between projects: each project's own panel reads its tickets, runs its commands and writes its `speck/config.yml`, through its own `.speck/` copy. The panel at the address only passes requests on to it and its answers back.
- risk: high because it changes who can reach a panel: each panel today answers only its own Host and Origin (`hosts` and `origins` in `scripts/panel.mjs`) and needs the token its page carries.
- The list of running panels lives in the user's home folder (for example `~/.config/speck/panels/`), as `~/.config/speck/private-words` does, never in a repo: it holds folder paths.
- Header: `templates/panel.html`, `templates/panel-header.js` and `templates/panel-header.css`. Server: `scripts/panel.mjs` (at the 600-line limit for `scripts/`) and `scripts/panel-background.mjs`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
