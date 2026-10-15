---
id: "0206"
title: "Stop the home-screen app tests hanging the suite"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-13-stop-the-home-screen-app-test-hanging-the-suite.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0198"]                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T14:47:21.062Z"

---
# 0206 · Stop the home-screen app tests hanging the suite

**Status:** 🔨 building

## Problem
The panel's home-screen app tests (0149) drive headless Chrome, and each call to it waits for an answer with no time limit. When Chrome doesn't answer, the whole suite hangs until speck's stall limit ends it after 5 minutes, and the run fails, so a build or ship fails at random and loses those minutes.

## Outcome
A call to the test browser that's never answered fails its own test within a time limit, and the rest of the suite carries on.

## Acceptance criteria
1. Every call the test helpers make to the browser (`browserPage()` and its `send` in `test/support/panel.mjs`) fails with an error naming the call if it isn't answered within 30 seconds, and the test that made it fails.
2. When that happens, the browser and the panel that test started are ended, and the other tests in the file and the suite still run.
3. A call that's answered in time works exactly as before.
4. No test that passed before this change fails.

## Out of scope
- Making the browser tests quicker (0198).
- Why Chrome sometimes doesn't answer.

## Notes
- Asked for 2026-10-15, for release 0.4.0.
- From 0152's build: about one full run in three hung at test 714, with a panel server and Chrome open under `test/panel-0149.test.mjs`.
- Builds after 0198, which may change the same browser test helpers.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
