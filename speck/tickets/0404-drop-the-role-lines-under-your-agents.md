---
id: "0404"
title: "Drop the role lines under Your agents"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-drop-the-role-lines-under-your-agents.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0403"]                # ticket ids that must be done first
created: 2026-10-23

---
# 0404 · Drop the role lines under Your agents

**Status:** 📋 ready

## Problem
Each agent in Your agents has a line such as "The builder and Foreman use it." or "The reviewer uses it." That repeats what the role lists already show, and adds clutter.

## Outcome
Your agents no longer says which roles use each agent.

## Acceptance criteria
1. In Settings, under Your agents, no agent row shows a line that names the roles using that agent, such as "The builder and Foreman use it." or "The reviewer uses it."
2. Each agent still shows its name, whether it is installed and signed in (or for a provider whether its key is set), and Remove. Removing an agent a role uses is still refused, saying which role, as 0399 does.
3. No test that passed before this change fails, except a check that an agent row names the roles using it, which is changed to check criterion 1.

## Out of scope
- Changing which agents are listed, or how Remove works, beyond dropping the role lines.

## Notes
- Asked for 2026-10-23 from the Your agents rows. The lines come from `agentRow` in `templates/panel.html` (`The ${ROLE_WORDS(roles)} use(s) it.`), fed by `roles` on each agent from `yourAgentsShown` in `scripts/your-agents.mjs`.
- Waits for 0403: both change `templates/panel.html`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
