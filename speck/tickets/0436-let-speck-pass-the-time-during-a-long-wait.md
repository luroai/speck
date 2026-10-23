---
id: "0436"
title: "Let speck pass the time during a long wait"                # one outcome, no "and"
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
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0435"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T21:11:03.198Z"

---
# 0436 · Let speck pass the time during a long wait

**Status:** 🔨 building

## Problem
Since 0414, speck plays an event's animation, then shows the pipeline's state and holds it until the state changes. On a long build that's 40 minutes of watching with the clipboard, so the screen looks stuck.

## Outcome
Between events, speck shows the pipeline's state, and during a long wait it passes the time now and then at a calm pace.

## Acceptance criteria
1. While the Foreman's status word stays `Building <n>` or `Shipping <id>`, speck watches with its clipboard for 2 minutes, then plays a pastime for 1 minute, then watches for 2 minutes, and so on. The pastime is tea, chess, sweeping or messy, picked at random and never the same as the one before, with its caption from a fixed set. The top row keeps showing the status word throughout.
2. While the word stays `Waiting`, speck is grumpy for 2 minutes, then follows the same rhythm of 1-minute pastimes and 2 minutes grumpy.
3. While the word stays `Idle`, speck changes to another pastime every 3 minutes, never the same as the one before. After 15 minutes of `Idle`, it falls asleep and stays asleep until the word changes or an event plays, as 0414 set.
4. While the word is `Needs you <n>`, speck keeps the question mark with no pastimes, and while it's `Off`, speck stays asleep.
5. An event interrupts at once, as 0414 set. After it, and whenever the status word changes, the rhythm starts again from the state's own animation.

## Out of scope
- The events and their animations (0414).
- Captions written by a model.

## Notes
- The user asked for this on 2026-10-23: on a long build, speck only watched the build. Agreed: 2 minutes watching, 1-minute pastimes, and Needs you stays as the question mark.
- Changes 0414's criterion 3 for `Building`, `Shipping`, `Waiting` and `Idle`. 0414's tests for those change to match.
- Waits for 0435: both change `templates/panel.html`. 0430 waits for it too, as the split moves the screen's code.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
