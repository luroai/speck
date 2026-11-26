---
id: "0762"
title: "Leave a project out of speck serve without removing it"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/2026-11-10-run-a-software-factory-from-one-speck-service.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0757","0758"]                # ticket ids that must be done first
created: 2026-11-26

---
# 0762 · Leave a project out of speck serve without removing it

**Status:** 📝 draft

## Problem
Under `speck serve`, the only way to keep a project out is `speck projects remove`, which forgets it, so bringing it back means adding it again. The user wants to keep some projects, such as a paused side project, off the factory floor and out of the service without losing them from the list.

## Outcome
A project can be turned off in the list: `speck serve` neither runs nor shows it until it's turned on again.

## Acceptance criteria
1. `speck projects off <name or folder>` keeps the project on the list but marks it off, and `speck projects on <name or folder>` turns it back on; `speck projects` shows which are off. Neither changes anything in the project.
2. While a project is off, `speck serve` doesn't start or restart its panel or its `speck run`, and within 10 seconds of it being turned off, stops the panel `speck serve` started for it. A panel or `speck run` started by hand is left running.
3. At `speck serve`'s address, All projects and the project menu leave out a project that is off, or not on the list at all, even when its panel is running, and nothing it has counts in the totals.
4. Within 10 seconds of a project being turned on again, `speck serve` starts its panel, its `speck run` if that was on, and shows it.
5. The brief's command table describes `speck projects off` and `speck projects on`. No test that passed before this change fails.

## Out of scope
- Hiding a project from a panel started by hand outside `speck serve`.

## Notes
- Asked for by the user on 2026-11-25, before building 1.7.0: "the ability to not show or to not include a project in speck serve".
- Builds on the list (0755), `speck serve` (0756), its one address and All projects (0757) and its runs (0758), so it waits for 0757 and 0758.
- A project never joins the list by itself: only `speck projects add` puts it there (0755).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
