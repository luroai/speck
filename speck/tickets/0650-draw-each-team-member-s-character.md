---
id: "0650"
title: "Draw each team member's character"                # one outcome, no "and"
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
after: []                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T14:17:39.273Z"

---
# 0650 · Draw each team member's character

**Status:** 🔨 building

## Problem
Every member of the team will appear in the panel, and they need to be told apart at a glance. Today only Virgil has a character.

## Outcome
The panel can draw each team member's character: Virgil's as today, and the Builder's, the Reviewer's and QA's as still screens with their own sign and colour.

## Acceptance criteria
1. `SpeckFace.draw` takes a `role` of `manager` (the default, as today), `builder`, `reviewer` or `qa`, and draws the same Premium device for each.
2. The builder's screen shows an ivory prompt and cursor (`> _`), the reviewer's a cyan magnifying glass and QA's violet viewfinder corners with a short bar in the middle, each with the same soft glow as Virgil's visor; red is used only for the manager.
3. The builder, reviewer and QA characters never move, in any mood or setting: only the manager animates, as today.
4. Each draws clearly at every size from 16 px, in the light and the dark look, and has a label naming its member.
5. No test that passed before this change fails.

## Out of scope
- Where they appear: 0652.

## Notes
- Chosen 2026-11-11: option D in https://claude.ai/artifact/2F85xNeCwn9KGxRn3ZbYZQ (the Character options board), whose SVG paths can be reused.
- Colours keep clear of the panel's status colours (orange needs you, blue being worked on, green done, plum ideas): ivory `#F3E3C3`, cyan `#3FD0D4`, violet `#B08CFF` as mocked; check them on both looks.
- `templates/speck-face.js`.
- Failing before this build: none
- The Character options board couldn't be opened from the build's session, so the three signs were drawn afresh from this ticket's description and colours.
- Self-check: dropped a stylesheet rule that stopped animation on members' faces, as it sat outside the reduced-motion block; they have nothing animated to stop (unknown and built-in role names such as `constructor` and `__proto__` fall back to the manager; setMood leaves a member's face alone).

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
