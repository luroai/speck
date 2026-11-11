---
id: "0639"
title: "Bring the README up to date for 1.1"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0638"]                # ticket ids that must be done first
created: 2026-11-11

---
# 0639 · Bring the README up to date for 1.1

**Status:** 📋 ready

## Problem
Since 1.0.0, speck checks a build's question in the running app itself, works out how to start each project's app, keeps test logins on your machine, carries on after usage limits, ships on quick tests with the whole suite run after, and auto-ships only rounds its own reviewer run recorded. The README says none of this, so someone reading it, or you coming back to it, doesn't know speck can do these.

## Outcome
The README describes what speck does as of 1.1.

## Acceptance criteria
1. The README says, in plain words for someone who doesn't write code, that speck checks a build's question in the running app itself, signing in with test logins kept on your machine, and shows its screenshots in the review pack, and that it works out how to start a project's app the first time it needs to (checked by review).
2. The README says that speck carries a build on by itself once an agent's usage limit resets, and that its watch agent moves to another of your agents while its own is limited (checked by review).
3. The README says that a ticket ships by itself only when speck's own run of the reviewer approved it, and that ships wait for the quick tests while the whole suite runs on the base branch after ships, when you set `commands.test_full` (checked by review).
4. Every command and setting the README names exists as it names it, and every link in it resolves.
5. No test that passed before this change fails.

## Out of scope
- The version, the status line, the "Built with speck" figures and the demo pictures: the release ticket (Prepare release 1.1.0) does those.
- `docs/brief.md`: each ticket's build already kept it up to date.

## Notes
- Asked for 2026-11-11: "update the docs on the repo for 1.1".
- Covers what shipped since `v1.0.0`: 0622 to 0637, and 0638 once it ships. 0626 to 0628 changed only tests and checks, so need no mention.
- Fit the new points into the README's existing sections, such as "Everything in between", "The clever bits" and "Under the hood", rather than adding a long new section.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
