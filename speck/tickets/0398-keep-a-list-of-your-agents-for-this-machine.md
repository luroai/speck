---
id: "0398"
title: "Keep a list of your agents for this machine"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-18-find-the-agents-and-models-on-this-machine.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T10:00:15.944Z"

---
# 0398 · Keep a list of your agents for this machine

**Status:** 🔨 building

## Problem
Settings offers every agent speck knows, whether or not it's set up here. DeepSeek appears as a choice before any API key is added, and Claude Code, Codex and Cursor appear whether or not they're installed.

## Outcome
speck keeps a list of the agents you've set up on this machine, and setup fills it with what it finds.

## Acceptance criteria
1. speck keeps the list of your agents for this machine, without a commit. Each can be Claude Code, Codex, Cursor or an API provider speck knows, such as DeepSeek. `speck agents` shows every agent speck knows, whether it's one of yours, whether it's installed and signed in (or, for a provider, whether its key is set), and its models.
2. `speck agents add <agent>` and `speck agents remove <agent>` change the list. Adding a provider whose key isn't set, or an agent that isn't installed, is refused, saying how to fix it. Removing an agent that the builder, reviewer or Foreman uses is refused, naming the role.
3. `speck init`, and the setup skill, add every agent they find installed and signed in, and every provider whose key is set, when this machine has no list yet, and say which they added. An existing list is left as it is.
4. Until this machine has a list, speck treats every agent that's installed and signed in, and every provider whose key is set, as yours. Nothing changes for someone who never sets one up.
5. The README describes your agents and these commands (checked by review). No test that passed before this change fails.

## Out of scope
- Settings: 0399 and 0400.

## Notes
- Checked 2026-10-23: `speck agents` (0288, `scripts/agents.mjs`) already reports whether Claude Code, Codex and Cursor are installed and signed in, and their models. API providers and their keys are in `scripts/providers.mjs` and `scripts/keys.mjs` (0389).
- Keep the list beside this machine's settings from 0386.
- Folds in `speck/ideas/done/2026-10-18-find-the-agents-and-models-on-this-machine.md`, as the user chose on 2026-10-23.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
