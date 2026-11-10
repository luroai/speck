---
id: "0625"
title: "Let speck schedule a resume for later when it looks into a stop"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0622"]                # ticket ids that must be done first
created: 2026-11-10

---
# 0625 · Let speck schedule a resume for later when it looks into a stop

**Status:** 📝 draft

## Problem
When speck's watcher looks into a stop that will clear by itself at a known time, such as a limit or an outage with a stated end, it can only act now: resume, reship, fix, ask, decide or tell. So it either resumes too early or leaves the ticket for you. And when the watcher's own agent is out of usage, as on 2026-11-10, its look fails at once and is noted as "I looked into it and took no action", so nothing is ever looked at again.

## Outcome
The watcher can schedule a ticket's resume for a set time, and a look that couldn't run because of a usage limit is tried again later rather than written off.

## Acceptance criteria
1. `speck watch resume <id> "<instruction>" --at <time>` schedules the resume for that time instead of now, taking a time such as `12:30` (UTC, today or, if passed, tomorrow) or a full ISO date and time; it notes in the ticket's Notes and in `speck run`'s log what it will do and when, for example "I'll resume 0616 at 12:30 UTC: the usage limit resets then.", and counts as the run's one action.
2. At that time `speck run` resumes the build with the instruction, as a resume does now, unless the ticket has moved on meanwhile (0618's check), when it drops it and says so once.
3. `speck status` and the panel's Pipeline log say which resumes are scheduled and when, until they run or are dropped.
4. When the watch agent's own run stops on a usage limit, `speck run` doesn't count it as a look: it doesn't note that it took no action, and it looks into the ticket again once that limit resets (0622).
5. The `speck-watch` skill tells the agent to use `--at` when a stop will clear at a known time, and to say why (checked by review); no test that passed before this change fails.

## Out of scope
- Spotting Claude's own usage limit on a build, which 0622 does without the watcher.
- Running the watcher on another agent while its own is limited.

## Notes
- Asked for 2026-11-10: "I'm pretty sure this is something that speck or Virgil or whatever we call him could understand and fix for us." On 2026-11-10 at 11:57, the watcher looked into 0616's stop on Claude, hit the same usage limit and "took no action"; 0616 waited five hours.
- Decided: the mechanical part (reading the reset time and resuming) is 0622's, as no model can run while the limit holds; the watcher gets the tool to schedule a resume for stops only judgement can read.
- Today: the actions are `ACTIONS` and `foremanAction` in `scripts/foreman-agent.mjs`, whose queue of resumes and `movedOn` check (0618) this builds on; the agent's instructions are `skills/speck-watch/SKILL.md`.
- Waits for 0622, which records when a limit resets.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
