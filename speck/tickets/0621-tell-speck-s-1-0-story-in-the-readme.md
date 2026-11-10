---
id: "0621"
title: "Tell speck's 1.0 story in the README"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-10

---
# 0621 · Tell speck's 1.0 story in the README

**Status:** 📋 ready

## Problem
1.0 changes what speck is: it works as your engineering manager, which you can name, takes the obvious calls itself and reports them in Decided for you, looks into stops and slow builds, and asks you only when there's no clear answer. The README still tells the 0.x story: "How it works" says speck waits for you at two decisions, "speck asks, then moves on" is its headline behaviour, the watcher is one bullet about `watch: fix`, and the engineering manager is a single sentence tacked onto the first paragraph. Anyone arriving at 1.0 wouldn't learn its main idea, or how to switch it on.

## Outcome
The README leads with speck as your engineering manager, who gets your tickets shipped, makes the obvious calls and tells you what it did, and says how to turn that on.

## Acceptance criteria
1. The README's opening introduces speck as your engineering manager: you decide what gets built with your own agent; speck runs the builder and reviewer you chose, makes the obvious calls, gets stuck work moving and tells you what it did, asking only when there's no clear answer; and you can give it a name of your own (checked by review).
2. "How it works" describes the 1.0 flow: your decision on what gets built, then speck managing everything between, taking a build's recommendation and reporting it in Decided for you, and shipping by itself once you trust it with auto-ship, which waits for you on high-risk tickets and changed criteria (checked by review).
3. The README says how to have speck take the obvious calls, by choosing `decide` for `watch` in the panel's Settings or with `speck config set watch decide`, and how to name it, with `speck_name` (checked by review).
4. "The clever bits" describes what speck does as your engineering manager in 1.0, including looking into stops and builds that run long and holding back a ticket whose criteria changed, and no longer presents asking as its main behaviour (checked by review).
5. The README's setup prompt, status line, pictures and links still pass their tests, and no other test that passed before this change fails.

## Out of scope
- The status line, the demo pictures and the release notes, which the 1.0.0 release ticket (0598) updates.
- The landing page, which lives in its own repo.
- Changing `watch`'s default.

## Notes
- Asked for 2026-11-10: "Is there also something that's going to update the README text with the new feature, the main watcher concept?" Nothing was: 0575 added one sentence, 0597 updated only the panel section and the pictures, and 0598 writes the changelog and release notes.
- The role, as agreed on 2026-11-09: speck is your engineering manager. Once you set a ticket ready, getting it shipped is its job: it runs the builder and reviewer you've chosen, makes the obvious calls when a build asks, gets stuck work moving again, checks the result and tells you what it did and why. You decide what gets built; your own agent is who you plan it with. You can call it whatever you like (the user's is Virgil).
- Keep the README's voice: plain British English, written for product managers, no one's name. Use the no-ai-slop pass the README has had before if it helps.
- Relies on nothing outside this repo.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
