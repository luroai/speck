---
id: "0733"
title: "Fix the full suite failing on main at 487ca18"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24

---
# 0733 · Fix the full suite failing on main at 487ca18

**Status:** 📋 ready

## Problem
The full suite fails on main at commit 487ca18 (487ca183b955d7bd0f1c3f015b336cfd6303e6d0). Failing tests:
- 0067 AC2: in a real browser, an open page keeps its list across a restart and Set ready works without a reload
- 0182 AC3: Chromium has closed within 10 s of a test file finishing that ran out of time under --test-timeout
- 0453 AC2: on a phone at a pixel ratio of 3, Full ticket (0587: on a Plan ticket), Close, Save, a document's button and the Pipeline log's filter show all four sides of their border
- 0476 AC2: a sideways scroll on a trackpad and the arrow keys change lane in the same time; with reduced motion, without sliding
- 0476 AC3: the tabs stay in step with the cards, and the lane open and each lane's scroll place survive the refresh and a pop-up
- 0543 AC2, AC3 and AC4: in a real browser, at the root and under a proxy's path, the page's files load from under it and Chrome reads the manifest
- 0600 AC1 AC2 AC3 AC4: in the light look at 320 px, the lanes are flat lists in the views' margins and type, and the views share one heading and back link
- 0600 AC1 AC2 AC3 AC4: in the dark look at 320 px, the lanes are flat lists in the views' margins and type, and the views share one heading and back link
- 0604 AC1, AC3 and AC4: at 320 px the status and a 20-character project show in full, a longer one ends in "…", and Settings and the menu are where they should be
- 0606 AC2: in a real browser with a scrollbar on the lane, 479 px shows two to a row and 480 px four, closed and open
- 0607 AC1, AC2 and AC3: at 320 and 1280 px, Settings and speck have as much room beside them as above and below, and the bar keeps its size and three lines
- 0624 AC2, AC3 and AC4: in a real browser, in both looks, at 320, 479 and 480 px, the tiles fill their rows and long values wrap within them
- 0694 AC5: at 375 px wide the By model table fits the lane with no horizontal scroll
- 0669 AC2: the panel server answers the builder route, guarded as the level route is
- 0568 AC4: at 320 px the list and its line fit the width, however long the words
- 0595 AC1, AC4: a real panel gives its own summary through its record, and its own part only to another panel
- 0031 AC1: speck panel serves on 127.0.0.1 at the given port, prints the URL and keeps running
- 0031 AC1: without --port it uses 4777
- 0031 AC1: a port in use exits non-zero naming the port, and a bad --port is refused
- 0415 AC2 and AC4: the real panel serves run.log at /api/run-log whatever the request adds, and tells an open page of each write within its 2-second refresh
- 0202 AC1, AC2: a stalled run ends every process it started, in a group of its own or orphaned, and nothing else
- 0229 AC1: a full run starts its files by their last recorded times, and records each file's time for the next

## Outcome
The full suite passes on main again.

## Acceptance criteria
1. Each of these tests passes on main again: 0067 AC2: in a real browser, an open page keeps its list across a restart and Set ready works without a reload, 0182 AC3: Chromium has closed within 10 s of a test file finishing that ran out of time under --test-timeout, 0453 AC2: on a phone at a pixel ratio of 3, Full ticket (0587: on a Plan ticket), Close, Save, a document's button and the Pipeline log's filter show all four sides of their border, 0476 AC2: a sideways scroll on a trackpad and the arrow keys change lane in the same time; with reduced motion, without sliding, 0476 AC3: the tabs stay in step with the cards, and the lane open and each lane's scroll place survive the refresh and a pop-up, 0543 AC2, AC3 and AC4: in a real browser, at the root and under a proxy's path, the page's files load from under it and Chrome reads the manifest, 0600 AC1 AC2 AC3 AC4: in the light look at 320 px, the lanes are flat lists in the views' margins and type, and the views share one heading and back link, 0600 AC1 AC2 AC3 AC4: in the dark look at 320 px, the lanes are flat lists in the views' margins and type, and the views share one heading and back link, 0604 AC1, AC3 and AC4: at 320 px the status and a 20-character project show in full, a longer one ends in "…", and Settings and the menu are where they should be, 0606 AC2: in a real browser with a scrollbar on the lane, 479 px shows two to a row and 480 px four, closed and open, 0607 AC1, AC2 and AC3: at 320 and 1280 px, Settings and speck have as much room beside them as above and below, and the bar keeps its size and three lines, 0624 AC2, AC3 and AC4: in a real browser, in both looks, at 320, 479 and 480 px, the tiles fill their rows and long values wrap within them, 0694 AC5: at 375 px wide the By model table fits the lane with no horizontal scroll, 0669 AC2: the panel server answers the builder route, guarded as the level route is, 0568 AC4: at 320 px the list and its line fit the width, however long the words, 0595 AC1, AC4: a real panel gives its own summary through its record, and its own part only to another panel, 0031 AC1: speck panel serves on 127.0.0.1 at the given port, prints the URL and keeps running, 0031 AC1: without --port it uses 4777, 0031 AC1: a port in use exits non-zero naming the port, and a bad --port is refused, 0415 AC2 and AC4: the real panel serves run.log at /api/run-log whatever the request adds, and tells an open page of each write within its 2-second refresh, 0202 AC1, AC2: a stalled run ends every process it started, in a group of its own or orphaned, and nothing else, 0229 AC1: a full run starts its files by their last recorded times, and records each file's time for the next.
2. No test that passed before this change fails.

## Out of scope
- Changes the failing tests don't need.

## Notes
<!-- Constraints, links and decisions. Optional. -->

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
