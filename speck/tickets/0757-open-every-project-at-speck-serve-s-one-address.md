---
id: "0757"
title: "Open every project at speck serve's one address"                # one outcome, no "and"
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
source: "speck/ideas/2026-11-10-run-a-software-factory-from-one-speck-service.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0756"]                # ticket ids that must be done first
created: 2026-11-25
built_on: "0756"
started: "2026-11-26T10:17:23.093Z"

---
# 0757 · Open every project at speck serve's one address

**Status:** 🔨 building

## Problem
Even with `speck serve`, each project's panel is on its own port, and only one sits behind the private tunnel, so from a phone you can reach one project and see the rest only on the bridge. The user wants to open one address on any device and see every project.

## Outcome
`speck serve` answers on one port and one `--url`, opening on All projects, with every project reachable from there.

## Acceptance criteria
1. `speck serve [--port <n>] [--url https://<hostname>]` answers on 127.0.0.1 at that port (4777 by default) and at that https address, with the same Host and Origin checks a panel has today.
2. Its address opens on All projects (the bridge), listing every project on the list, and choosing one shows that project's panel at the same address; the project menu goes back to All projects or to any other project.
3. Every action in a project's panel works through the address as it does on the project's own port: set ready, priority, answer, ship, the run switch, Settings and the live updates.
4. A project whose panel isn't answering stays on the bridge as Not answering, and the rest keep working.
5. The brief describes `speck serve`'s `--port` and `--url` and that it opens on All projects. No test that passed before this change fails.

## Out of scope
- Acting on a project's tickets from the bridge itself (step 2, the factory floor).
- Logins: the address stays behind a private tunnel that makes you log in, as the panel's does today.

## Notes
- Step 1 of the factory (see the source idea): one speck service per machine runs every project behind one address, so the user can sign in from any device and see every project, instead of starting a panel and a `speck run` in each project.
- The panel already shows other projects at one address through its project switcher, a cookie and a proxy to each panel's own port (`route`, `pass`, `choose` in `scripts/panel-projects.mjs`); this can reuse it.
- Each project's panel keeps its own token; the proxy passes requests on as the switcher does now.
- Failing before this build: not checked

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
