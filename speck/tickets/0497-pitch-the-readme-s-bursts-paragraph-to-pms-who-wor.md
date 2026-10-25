---
id: "0497"
title: "Pitch the README's bursts paragraph to PMs who work with tech teams"                # one outcome, no "and"
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
after: ["0496"]                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T10:24:05.325Z"

---
# 0497 · Pitch the README's bursts paragraph to PMs who work with tech teams

**Status:** 🔨 building

## Problem
The README's third paragraph sells speck through a phone ("check the panel on your phone afterwards"), and who speck is for sits apart, lower down, in one thin line. The people speck is built for, PMs and others who've worked alongside tech teams without writing the code, should see themselves straight away, with the bursts of ticketing up a batch, walking away and coming back that they'll recognise.

## Outcome
The README's opening says speck was built by a PM for PMs and non-technical people used to working with tech teams, and that it fits working in bursts, with no mention of a phone.

## Acceptance criteria
1. The paragraph that starts "It fits the way you really work, in bursts" is replaced by one that says speck was built by a product manager, for product managers and other people who've worked alongside tech teams without writing the code. (checked by review)
2. The new paragraph describes working in bursts: ticketing up a batch, going away, coming back to what's shipped and setting the next batch going. It ends with speck stopping only when it needs you, with one plain question. (checked by review)
3. The new paragraph doesn't mention a phone. (checked by review)
4. The separate line "speck was built by a product manager, for people who decide what gets built but don't write the code. Engineers use it too." is gone, and the new paragraph keeps that engineers use speck too. (checked by review)
5. No test that passed before this change fails.

## Out of scope
- Naming speck in place of "It" in the rest of the README: 0496.
- The phone in The clever bits ("It fits in your pocket") and The panel section, which stay.

## Notes
- Wording agreed with the user on 2026-10-25, to use as it is unless review finds a fact wrong:
  > speck was built by a product manager, for product managers and anyone who has spent years working alongside tech teams without writing the code themselves. You already know how to shape a piece of work and tell when it's done. speck fits the way that work really happens, in bursts between everything else: ticket up a batch before a meeting, come back afterwards to see what's shipped, and set the next batch going before you log off. speck stops only when it needs you, with one plain question. Engineers use speck too.
- Waits for 0496: both change the README's opening paragraphs, on lines next to each other.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
