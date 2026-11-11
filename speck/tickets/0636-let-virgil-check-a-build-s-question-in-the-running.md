---
id: "0636"
title: "Let speck check a build's question in the running app"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-11-virgil-checks-the-work-in-the-running-app.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0634","0635"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T11:36:54.947Z"

---
# 0636 · Let speck check a build's question in the running app

**Status:** 🔨 building

## Problem
Builds often block with "check this in the app yourself" or "log in and check", and you go with the recommendation almost every time. Each one stops the ticket until you're back, for a check an agent can do by starting the app, signing in and taking screenshots.

## Outcome
With `watch: decide`, or `fix` for a check that clearly passes, speck checks a build's question in the running app itself, carries on and tells you what it saw, with its screenshots in the review pack.

## Acceptance criteria
1. The build skill asks the user to check something in the app only as a blocked question with a `Check in the app: <what to look at>` line beside its other facts, and the ticket's full view and `speck status --json` give that line.
2. With `watch: decide` and `commands.start` set, `speck run` starts its watch agent for a low-risk blocked ticket with that line, once per question, and its brief says to start the app with `speck app`, sign in with `speck logins` when it needs to, keep a screenshot of each thing it checked with `speck picture` and then take one action. It goes with the build's recommendation when what it saw agrees with it, and otherwise asks you, saying what it saw.
3. With `watch: fix`, the agent may go with the recommendation only when it judges that the check clearly passes; anything else it asks you about.
4. Whatever it does, it stops the app it started, its action's line in the ticket's Notes says what it checked and what it saw, and the review pack shows its screenshots with their captions.
5. With `watch: tell` or `off`, high risk or `commands.start` blank, the question waits for you as it does today.

## Out of scope
- Checking the app before a build blocks, such as a check in every build.

## Notes
- Decided 2026-11-11: speck makes the call with `decide`; with `fix` it only passes a check that clearly passes.
- Question facts are in `scripts/question-facts.mjs`; the watch agent's brief and actions in `scripts/foreman-agent.mjs` and `skills/speck-watch/SKILL.md`; `speck picture` keeps pictures (0294).
- After 0634 (`speck app`) and 0635 (`speck logins`).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
