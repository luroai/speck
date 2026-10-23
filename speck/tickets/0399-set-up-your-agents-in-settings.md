---
id: "0399"
title: "Set up your agents in Settings"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0397","0398"]                # ticket ids that must be done first
created: 2026-10-23

---
# 0399 · Set up your agents in Settings

**Status:** 📋 ready

## Problem
There's nowhere in Settings to see which agents you have, add one, or give an API provider its key, apart from the DeepSeek key field 0393 added.

## Outcome
Settings has a "Your agents" group where you see, add and remove your agents.

## Acceptance criteria
1. Settings has a "Your agents" group after Auto-build. It lists each of your agents (0398) with whether it's installed and signed in, or for a provider whether its key is set, and a way to remove it. Removing one a role uses is refused, saying which role.
2. "Add an agent" offers each agent speck knows that isn't in your list. Claude Code, Codex and Cursor can be added when they're installed; one that isn't installed says how to install it. Each API provider, such as DeepSeek, is offered too.
3. Adding an API provider asks for its key in a field that never shows a saved key, and the provider joins your list once the key is saved. The key can be replaced from the agent's row. Adding or removing an agent, or saving a key, makes no commit.
4. The group updates in place, without the view jumping or losing the keyboard focus, and fits a 320 px wide window.
5. No test that passed before this change fails, except checks of 0393's DeepSeek key field, which are changed to check criterion 3.

## Out of scope
- Choosing each role's model: 0400.

## Notes
- Builds on 0398's list and commands, 0389's keys and 0393's key field.
- Waits for 0397, which changes Settings in `templates/panel.html`, and for 0398.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
