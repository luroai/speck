---
id: "0576"
title: "Call speck by the name you chose wherever it speaks"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0575"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T18:03:21.956Z"

---
# 0576 · Call speck by the name you chose wherever it speaks

**Status:** 🔨 building

## Problem
Once you've named your engineering manager (0575), speck should call it by that name wherever it speaks or acts, or the name means nothing. Today `speck status`, the panel and `speck run`'s log all say "speck asked you…", "speck will take its recommendation…" and "speck will look into it…".

## Outcome
Wherever the engineering manager speaks or acts, speck uses the name you gave it; everywhere speck means the tool, it still says speck.

## Acceptance criteria
1. With `speck_name` set to `Virgil`, `speck status` says `Virgil` where it says `speck` today for the engineering manager's questions, what it's looking into, its actions and the recommendations it took, will take or took in the last 7 days; with `speck_name` unset, it says `speck` as today.
2. The panel does the same wherever the engineering manager speaks or acts: a blocked ticket's card when it will take the recommendation, its questions with their Answer and Dismiss buttons, the line saying who went with a recommendation, the Decided for you list, and the status words for a ticket it's looking into.
3. `speck run`'s log uses the name in its lines about the engineering manager, such as `0412: Virgil will look into it, as watch is decide: …`.
4. Where speck means the tool, it still says speck: its commands, `speck run`, the panel's title and the Notes lines speck writes into tickets, which keep `(chosen by speck, …)` so earlier and later tickets are read the same way.
5. No test that passed before this change fails.

## Out of scope
- The setting itself and the role's description (0575).
- Renaming speck the tool or its commands.

## Notes
- Asked for 2026-11-09: speck is the character, your engineering manager, and you can call it whatever you like, as you can name your agents in other tools (the user's is Virgil). Its role goes in the Settings view's explanation and the docs. Builders and reviewers stay swappable underneath; your own agent (Claude, Cursor or another) stays the one you talk to.
- Today the engineering manager speaks as speck in, among others: `scripts/foreman-agent.mjs` ("speck will look into it"), `scripts/foreman-took.mjs` ("speck will take its recommendation" and the 7-day list), `scripts/split-off.mjs`, `templates/panel-model.js` ("Blocked · speck will take its recommendation", "speck will answer") and `templates/panel.js`. The Notes lines are parsed by `wentWithLines` and `choseOnce`, which is why they keep `speck`.
- Waits for 0575, which adds `speck_name`.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
