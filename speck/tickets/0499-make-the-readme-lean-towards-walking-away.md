---
id: "0499"
title: "Make the README lean towards walking away"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0498"]                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T12:23:10.121Z"

---
# 0499 · Make the README lean towards walking away

**Status:** 🔨 building

## Problem
The README says two things at once: plan, walk away and come back to it shipped, and also that nothing ships until you say so and the judgement stays with you. A reader can't tell which speck is, and auto-ship, the thing that makes "come back to it shipped" true, isn't mentioned until How it works, and then only as a setting.

## Outcome
The README leans one way, towards walking away and coming back to finished work, and pitches auto-ship early, in a human way: ship the first few yourself, then switch it on once you're confident.

## Acceptance criteria
1. The opening, from the tagline to the picture, leans towards walking away and coming back to finished work. It no longer also says that nothing ships until you say so. (checked by review)
2. Before the picture, the README mentions auto-ship in a human way: ship the first few yourself from their review packs, and once you're confident, turn on auto-ship and speck ships approved work while you're away. (checked by review)
3. How it works, "Your second decision: what ships" and Who it's for match that lean: shipping by hand is where you start, auto-ship is where you go once you trust it, and the review pack is there to check the work whenever you want. No section says the call on every ship stays with you. (checked by review)
4. The facts stay right: auto-ship is off until you turn it on, covers low-risk tickets unless you change `auto_ship_risk`, and a task never ships by itself. (checked by review)
5. No test that passed before this change fails.

## Out of scope
- Changing `auto_ship`'s default, or what setup recommends for it.
- The tagline, which stays "Plan in ten minutes. Come back to it shipped."
- `docs/brief.md`, which keeps describing the two gates in full.
- What 0496, 0497 and 0498 change, other than to fit this lean.

## Notes
- The user chose on 2026-10-25 to lean towards walking away, not towards "you decide what ships".
- Suggested wording for the review pack paragraph in the opening (today "You don't need to read the code… Nothing ships until you say so, or until you let speck ship low-risk work by itself."):
  > You don't need to read the code to check the work. Every ticket comes with a one-page review pack in plain English, with the reviewer's evidence for each criterion. Ship the first few yourself from their review packs. Once you're confident, turn on auto-ship, and speck ships approved work while you're away.
- Keep it human: no setting names in the opening. Setting names (`auto_ship`, `auto_ship_risk`) can stay in How it works.
- Don't start a sentence or label with "It" for speck, as 0496 sets out.
- Checked 2026-10-25: auto-ship is off by default, `auto_ship_risk` is `[low]` by default, and a task never ships by itself (`docs/brief.md`, principle 4). It can be turned on in the panel's Settings or with `speck config set auto_ship true`.
- Waits for 0498, the last of the README tickets before it: all of them change the opening paragraphs.
- Asked for by the user on 2026-10-25.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
