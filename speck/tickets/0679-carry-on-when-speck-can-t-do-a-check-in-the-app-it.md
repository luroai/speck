---
id: "0679"
title: "Carry on when speck can't do a check in the app itself"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T13:36:06.042Z"

---
# 0679 · Carry on when speck can't do a check in the app itself

**Status:** 🔨 building

## Problem
When a build asks for a check in the running app that speck's agent can't make, such as how something sounds or how a page behaves in a browser it can't run, the agent asks you, and the build stops until you answer. The rest of the ticket, its remaining work and its review rounds, could be finished in that time, leaving you one look at the end.

## Outcome
With `watch: decide`, a check speck can't make is left for you at the end: the build carries on with its recommendation, and the ticket waits approved with the check listed.

## Acceptance criteria
1. speck's agent has a third action for a check in the app, beside `decide` and `ask`: `speck watch leave <id> --saw "<why it couldn't make the check>"`. With `watch: decide` and a low-risk ticket it goes with the build's recommendation as `decide` does, counts towards the 3 recommendations speck may take for a ticket, and writes the check, in the build's own words, in the ticket's Notes as left for you. It refuses where `decide` refuses.
2. The agent's brief for a check says when to use it: only when what the check asks for is something it can't see or do, such as a sound, another device, or a browser or account it can't use. It says never to use it when what it saw disagrees with the recommendation, or for a check it could make. (checked by review)
3. Auto-ship leaves a ticket with a check left for you approved, giving the check as its reason, and its review pack lists each check left for you above its changes. `speck ship <id>` run by you ships it.
4. The brief describes the action in its `speck watch` row and in its paragraph on checks in the app, which no longer says such a question is never taken unchecked.
5. No test that passed before this change fails.

## Out of scope
- Checks speck's agent can make: nothing changes for them.
- `watch: fix`, `tell` and `off`, and high-risk tickets: the question waits for you as today.
- Marking a left check as done: shipping the ticket is your word on it.

## Notes
- This changes a rule the brief states today: "Such a question is never taken unchecked." Decision: the check still happens before anything ships, by you, at the end of the build and not in the middle of it.
- Checks in the app came in 0636 (`scripts/app-check.mjs`, whose `CHECK_ACTIONS` are `decide` and `ask`, and `scripts/foreman-agent.mjs`). QA (0651) makes the checks when it's set, and gets the same action.
- `autoShipWhyNot` in `scripts/ship.mjs` gives auto-ship's reasons for leaving a ticket, which `speck status` and the panel already show.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
