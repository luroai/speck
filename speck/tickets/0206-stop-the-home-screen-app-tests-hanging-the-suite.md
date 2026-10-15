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
- Found while building: 0159 (shipped 2026-10-13, after the idea was captured) had already given every DevTools call a 15-second limit, and the test setup (`tmp.mjs`, 0175) already ends every process a test file left running once its tests are done. So a call that's never answered already failed its own test, and the suite carried on. This build keeps the 15-second limit, which is within AC1's 30 seconds and leaves answered calls exactly as they were (AC3), and adds tests that show all of it with a stand-in browser that can leave chosen calls unanswered.
- The gap it fixes: when opening the page itself went unanswered, the 0149 browser test failed before its `try`, so its panel ran on until the whole file finished. It now stops its panel, and closes its page, as soon as the test ends, even if closing the page fails.
- `SPECK_TEST_DEVTOOLS_MS` shortens the default limit, for 0206's own tests only; nothing else sets it.
- Self-check: a zero, negative or non-numeric `SPECK_TEST_DEVTOOLS_MS` now falls back to 15 seconds rather than failing every call at once.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
