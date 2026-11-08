---
id: "0564"
title: "Take every recommendation with watch: decide"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0563"]                # ticket ids that must be done first
created: 2026-11-08

---
# 0564 · Take every recommendation with watch: decide

**Status:** 📋 ready

## Problem
Most blocked questions end with you pressing Go with the recommendation: in this repo, 15 of the 17 recommendations taken were picked by hand. `watch: fix` takes one only when no option changes what you'd notice and the recommendation is a clear winner, so most questions still wait for you, and their builds sit blocked until you look.

## Outcome
With `watch: decide`, speck takes the recommendation of every blocked question that has one and carries on, waiting for you only where it shouldn't decide.

## Acceptance criteria
1. `watch` takes `decide` as well as `off`, `tell` and `fix`, in `speck config set`, `speck/config.yml` and the Settings view, which explains it. Any other value is still refused.
2. With `watch: decide`, each of `speck run`'s checks takes the recommendation of a blocked ticket whose question has one, whatever its "Changes what you'd notice" and "Clear winner" lines say, as the Go with the recommendation button does: it adds `- Went with the recommendation: <option> (chosen by speck, as watch is decide, <YYYY-MM-DD HH:MM> UTC).` to the ticket's Notes and resumes its build.
3. With `watch: decide`, a blocked ticket waits for you when its question has no recommendation, when its risk is high, or when speck has already taken 3 recommendations for it.
4. With `watch: decide`, everything `watch: fix` does still happens, a ticket speck will decide doesn't count under Needs you, and its card says speck will take the recommendation, as with `fix`.
5. With `off`, `tell` or `fix`, blocked questions are handled exactly as before, `docs/brief.md` describes `decide`, and no test that passed before this change fails.

## Out of scope
- The watch agent's own questions (0567).
- Holding back a ticket whose criteria changed (0565).
- Making `decide` the default for new projects.
- Size-guard splits, which 0563 handles under `fix` and so under `decide`.

## Notes
- Asked for 2026-11-08: the user goes with speck's recommendation almost every time, so speck should decide and tell them rather than ask ("ticket up 1": the watcher deciding). In this repo 15 of 17 recommendations taken were picked by hand in the panel, and 10 of the watch agent's 13 actions were questions.
- Decided: a new value rather than widening `fix`, so anyone who wants speck to ask about noticeable changes keeps `fix`.
- Today: `FIXING` and `FIXING_SAYS` in `scripts/foreman.mjs` (about line 36), `fixable(t)` (about line 46), `foremanFixQueue` in `scripts/foreman-fix.mjs`, `goWith` and `choseOnce` in `scripts/go-with.mjs` (once per ticket today), `watch` validated in `scripts/config.mjs`, explained in `scripts/settings.mjs`, commented in `templates/config.yml`, and described in `docs/brief.md`'s `speck panel` and `speck config set` rows. Places that check for `'fix'` and must count `decide` too: `scripts/foreman-agent.mjs` (about lines 233 and 314), `scripts/foreman-took.mjs` (about line 34), `scripts/foreman.mjs` (about lines 110 and 124).
- Waits for 0563, which adds the size-guard fact this needs and changes the same functions. 0563 is a draft with a decision still open.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
