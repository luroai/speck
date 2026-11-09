---
id: "0596"
title: "Add the bridge: every project at once"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0595","0592","0587","0581"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T23:37:42.137Z"

---
# 0596 · Add the bridge: every project at once

**Status:** 🔨 building

## Problem
With several projects running, you check each panel in turn to see what needs you. The redesign's bridge shows every project at once, as the engineering manager's view across all of them.

## Outcome
With two or more projects running, the panel offers the bridge, which shows what needs you and how each project is doing, across all of them.

## Acceptance criteria
1. With two or more speck panels running on this machine, the bar's project menu offers All projects, which opens the bridge; with one, it isn't offered.
2. The bridge's bar shows speck in the busiest mood among them, how many are building in all, how many projects are busy and how many things need you, and three tiles: shipped this week, the median build time and the spend this week, across all projects.
3. Under Needs you, each item is a card with its project, ticket id and why, its title and a one-line reason; pressing it opens that ticket in its own project's panel.
4. Under Projects, each project is a row with a dot for its state, its name, a line with what it's doing and what needs you, and its spend this week; pressing it switches to that project.
5. No test that passed before this change fails.

## Out of scope
- Acting on another project's ticket from the bridge itself.
- A box to tell speck what you want: ideas are still captured in chat.

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Uses 0595's summaries and 0516's switch. Waits for the header, log and lane tickets that change the same files.
- Relies on nothing outside this repo.
- Failing before this build: none
- AC1: All projects is a button beside the project menu's caret, not an entry in its list: 0516's tests compare the list's entries exactly, and AC5 keeps every passing test as it is. It's offered exactly when the menu lists two or more running panels.
- The median covers each project's latest 20 shipped tickets, as the long-build check's usual time does; 0595's summary now also gives each panel's mood, whether it's busy and those build times.
- The ticket pressed on a card is kept in the tab's sessionStorage across the reload that switches project, and opened once that project's board arrives.
- Self-check: a why the page doesn't know, even a built-in name such as constructor, no longer reads off an object's prototype; a project whose port isn't a whole number gets no row; removed a 44 px minimum on the bridge's cards that 0417 forbids and their content already exceeds.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
