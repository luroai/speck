---
id: "0182"
title: "Start Chromium once per test file"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0175"]                # ticket ids that must be done first
created: 2026-10-14
started: "2026-10-14T21:44:02.138Z"

---
# 0182 · Start Chromium once per test file

**Status:** 🔨 building

## Problem
Each of the 50 real-browser tests starts a Chromium of its own, about half a second and a few hundred MB each time. On 2026-10-14 these tests took 178 of the suite's 1,229 seconds of test time (14%), and every new panel ticket tends to add more. Each build runs the full suite three or four times, so this cost is paid on every build.

## Outcome
A test file's real-browser tests share one Chromium, so the browser tests take noticeably less time and memory, and check exactly what they did before.

## Acceptance criteria
1. A test file starts Chromium at most once, however many of its tests use a real browser.
2. Each test still starts with a fresh page that keeps nothing from the test before it: no storage, cookies, open dialogs, selection, scroll position or window size.
3. Chromium has closed within 10 seconds of the test file finishing, whether its tests passed, failed or timed out.
4. On the same quiet machine, the real-browser tests' total time across a full run is at least 30% lower than before this change. The ticket's Notes give both figures.
5. No test that passed before this change fails.

## Out of scope
- Tests that use the fake page (`fakePage()`), which start no browser.
- Ending processes left behind by other tests (0175).
- Running the browser tests less often.

## Notes
- `browserPage()` in `test/support/panel.mjs` starts Chromium with a new profile for every call. It's used 49 times across 41 test files.
- Builds after 0175, which changes how test files clean up what they start.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
