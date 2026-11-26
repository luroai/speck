---
id: "0765"
title: "Open a factory floor page at speck serve's address"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "deep"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-26
started: "2026-11-26T19:39:37.424Z"

---
# 0765 · Open a factory floor page at speck serve's address

**Status:** 🔨 building

## Problem
On a laptop the panel is one narrow column showing one lane of one project at a time. The user wants a page for a wide window that shows every project as a station and a project's whole board side by side.

## Outcome
speck serve's address has a factory floor page: a row of project stations over the chosen project's four lanes side by side, in the instrument-panel look.

## Acceptance criteria
1. `/floor` at `speck serve`'s address opens the factory floor, and All projects has a link to it; the panel and All projects are otherwise unchanged.
2. It shows a station for each project on the list that isn't off, numbered, with its name, its state, how many tickets are building, queued, need you and shipped in the last 7 days, and a line of tickets shipped per day over 14 days.
3. Choosing a station shows that project's Capture, Plan, Build and Shipped side by side below the stations, each with its count and its cards (id, title, status colour and one line of detail), and the choice is kept when the page reloads.
4. The page updates by itself within 5 seconds of a change in any project, and at window widths under 1024 px it lays the four lanes out two by two and the stations in two rows, with no sideways scroll.
5. The brief's `speck serve` row describes the factory floor and its address. No test that passed before this change fails.

## Out of scope
- The line, Virgil's dial and the subscriptions' power: tickets of their own.
- Acting on tickets from the floor.

## Notes
- A new page at `speck serve`'s address, for a laptop or desktop window. It doesn't replace or change the panel, which stays the phone and side-panel view (decided 2026-11-26).
- Design: mockup D, "Stations, instrument panel", on the user's private design canvas (2026-11-25/26): near-black ground with faint grid lines, one signal orange (#FF6A1F) for anything moving or needing you, green for shipped, small spaced-out monospace capitals for labels, big thin numbers, panels with corner-bracket marks. Use the fonts the panel already ships and no fonts from the network.
- The front is `scripts/serve-front.mjs`; each project's board comes from its own panel, as All projects already gathers summaries.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
