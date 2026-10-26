---
id: "0521"
title: "Label ideas an agent raised in Capture"                # one outcome, no "and"
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
after: ["0520"]                # ticket ids that must be done first
created: 2026-10-26

---
# 0521 · Label ideas an agent raised in Capture

**Status:** 📋 ready

## Problem
Both the user and agents put ideas in speck: the user by asking for one to be captured, and agents by raising follow-ups from builds on their own. In Capture (0520) they sit in one list, and the user can't tell at a glance which ideas are theirs and which an agent suggested.

## Outcome
Every idea an agent raised is labelled as an agent's in Capture.

## Acceptance criteria
1. Every new idea note says who raised it on a line of its own after its `Captured:` line: `Raised by: you` when the user asked for it to be captured, or `Raised by: agent` when an agent raised it itself, such as a build's follow-up. `/speck-capture` and `/speck-build` write it, and an agent capturing what the user asked for writes `you`.
2. In Capture, a note raised by an agent shows an `agent` tag on its closed card, in the style of a ticket's bug or task tag, with an explanation on hover or tap. A note raised by the user shows no tag.
3. A note with no `Raised by:` line counts as raised by an agent when it has a `From ticket:` line, and by the user otherwise, so notes captured before this change are labelled too.
4. The agent tag changes nothing else: Capture stays read-only (0520's criterion 3), and the notes stay newest first.
5. No test that passed before this change fails.

## Out of scope
- Naming which agent raised it (builder, reviewer or the watcher).
- Labels anywhere but Capture, such as on tickets made from an agent's idea.

## Notes
- Asked for 2026-10-26: "agents and myself are allowed to capture ideas. Agent ideas need a visual agent label."
- The label means the agent raised the idea, not that an agent wrote the file: the user's own ideas are written by an agent too, on their say-so.
- Today: build follow-ups have `Status: inbox` and a `From ticket:` line (`skills/speck-build/SKILL.md`, section 5 step 1); `/speck-capture` writes `Captured: <date> · Status: idea` (`skills/speck-capture/SKILL.md`). The panel reads notes through `scripts/idea-counts.mjs` and shows them with `noteItem` in `templates/panel.js`.
- After 0520, which makes the Capture lane this labels.
## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
