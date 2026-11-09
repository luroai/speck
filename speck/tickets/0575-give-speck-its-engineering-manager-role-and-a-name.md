---
id: "0575"
title: Let you name speck, your engineering manager                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: []                # ticket ids that must be done first
created: 2026-11-09

---
# 0575 · Let you name speck, your engineering manager

**Status:** 📝 draft

## Problem
speck's watcher acts like an engineering manager (it takes the calls, unblocks builds and tells you what it did) but nothing says so: the Settings view calls its group Watching and describes its settings one by one, and the docs never say what its job is. Nor can you name it, though people who work with it daily, like the user, think of it by a name of their own.

## Outcome
speck is described everywhere as your engineering manager, with a short account of its job, and you can give it a name of your own for each project.

## Acceptance criteria
1. `speck_name` is a project setting, `speck` by default. `speck config set speck_name "Virgil"` saves it in `speck/config.yml`. A name must be 1 to 24 characters of letters, digits, spaces, hyphens and apostrophes, starting with a letter; anything else is refused with a message saying what's allowed, changing nothing.
2. In the Settings view, the group that was Watching is headed "Your engineering manager" and still sits under the speck run switch. Its first setting is `speck_name`, which can be changed and saved there like the others, and its explanation says what the engineering manager does and that it can be called anything (checked by review).
3. The explanations of `watch`, `watch_agent`, `watch_model` and `watch_effort` call the engineering manager by the name `speck_name` gives ("What Virgil does when a build stops with a question…"), and `speck` when it's unset.
4. `docs/brief.md` has a section on the engineering manager that names `speck_name` and says what the role does, how it differs from your own agent and from the builder and reviewer, and that the `watch` settings are its settings. The README says in one sentence that speck works as your engineering manager and can be renamed (checked by review).
5. No test that passed before this change fails.

## Out of scope
- Using the name in speck's messages, `speck status` and the panel's cards (0576).
- Renaming the `watch` settings or the `speck` command.
- Giving the engineering manager new abilities, such as checking work in a browser.

## Notes
- Asked for 2026-11-09: speck is the character, your engineering manager, and you can call it whatever you like, as you can name your agents in other tools (the user's is Virgil). Its role goes in the Settings view's explanation and the docs. Builders and reviewers stay swappable underneath; your own agent (Claude, Cursor or another) stays the one you talk to.
- Suggested wording for the role, to adapt: "speck is your engineering manager. Once you set a ticket ready, getting it shipped is its job: it runs the builder and reviewer you've chosen, makes the obvious calls when a build asks, gets stuck work moving again, checks the result and tells you what it did and why. It asks you only when there's no clear answer. You decide what gets built; your own agent is who you plan it with. Call it whatever you like."
- Decided: the role is engineering manager, not tech lead (which writes the code and decides the design) or chief of staff (not an engineering role). The setting is `speck_name`, not `name`, so it can't be mistaken for the project's name.
- Today: the group is `{ title: 'Watching', ... }` in `SETTING_GROUPS` in `scripts/settings.mjs`, and `templates/panel-settings.js` finds it by that title (`g.title === 'Watching'`) to put it under the speck run switch, so both change together. Settings are validated in `scripts/config.mjs`. 0485 to 0488 renamed the Foreman to speck; this keeps speck as the default name.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
