---
id: "0400"
title: "Choose each role's model from your agents"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-18-find-the-agents-and-models-on-this-machine.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0399"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T10:50:07.524Z"

---
# 0400 · Choose each role's model from your agents

**Status:** 🔨 building

## Problem
Builder, Reviewer and Foreman each have an agent list and a separate model list, which offer agents you haven't set up and make you choose twice.

## Outcome
Each role picks one model from your agents' models.

## Acceptance criteria
1. Builder, Reviewer and Foreman each have one list, made up only of your agents' models and grouped by agent, such as "Codex · GPT-6.1 Sol" or "DeepSeek · V4 Pro", with each agent's own default as an entry. An agent that isn't one of yours doesn't appear.
2. Choosing an entry sets the role's agent and model together, for example `reviewer: codex` with `reviewer_model: gpt-6.1-sol`, saved for this machine as 0387 saves them. Effort is offered beside it only for an agent that takes one.
3. The reviewer list has the Claude subagent as one entry under Claude Code, named for running in the builder's session. The Foreman list has an entry for using the builder's agent, which is today's blank Foreman.
4. A choice the same-model check refuses is refused when saved, saying why, as today. A role whose saved agent is no longer one of yours says so and asks you to choose again.
5. No test that passed before this change fails, except checks of the separate agent and model lists, which are changed to check these criteria.

## Out of scope
- Reading an API provider's models from its own API: the models in speck's provider list are used (0393).

## Notes
- Checked 2026-10-23: Settings shows foreman, builder and reviewer as their own lists, each with a model list under it filled for the chosen agent (0369, 0381), and DeepSeek among them whether or not its key is set.
- The user chose on 2026-10-23 to keep the Claude subagent reviewer as an entry under Claude Code.
- Waits for 0399.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
