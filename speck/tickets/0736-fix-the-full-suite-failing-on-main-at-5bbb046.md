---
id: "0736"
title: "Fix the full suite failing on main at 5bbb046"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
# 0736 · Fix the full suite failing on main at 5bbb046

**Status:** 📝 draft

## Problem
The full suite fails on main at commit 5bbb046 (5bbb0466df17e16d3dd3a9fdb44997e1ac1ea63c). Failing tests:
- 0723 AC1: a test file that ran out of time under --test-timeout exits only once its Chromium has gone
- 0267 AC1, AC3: rewording and reordering the brief, the changelog and the release notes fails no test
- 0320 AC3: in a real browser, icon.svg loads (0413: the header's mark, checked here too, went with the header row)
- 0051 AC1: the log comes from the main checkout, even when the panel runs in a worktree
- 0054 AC2-AC5: in a real browser, the pane opens, keeps a selection through refreshes and closes with Escape
- 0067 AC1: a code change is served on the same port within 5 seconds, on every route
- 0067 AC2: the token survives a restart, so Set ready works with the token from before it
- 0067 AC4: new code that fails to start leaves the old server serving, shows the error and the next change tries again
- 0067 AC5: the URL prints once, and Ctrl+C stops it with no process left behind
- 0073 AC2: a paused build stops from the panel too
- 0077 AC2 (self-check): choosing the priority a ticket already has commits nothing, even with other edits in it
- 0132 AC3: for a ticket with no review rounds the server answers with no pack and no error
- 0133 AC4: when speck ship refuses, the panel gets its message and the ticket stays approved
- 0140 AC1: at 375 px in the light look, nothing reaches past the right edge, with every list, menu and pane open
- 0145 AC4: the server answers 404 to pause and play and changes nothing; speck pause and speck play still work
- 0159 AC3: b.js() and b.until() give up in their time limits, naming what they waited for
- 0159 AC3: b.loaded() gives up when the page never arrives, naming the page
- 0182 AC3: Chromium has closed within 10 s of a test file finishing that ran out of time under --test-timeout
- 0187 AC1: a ticket changed in a build's own worktree, made after the panel started, reaches an open stream within 1 second
- 0187 AC4: in a real browser, the page rides out the panel stopping and starting again, without "Disconnected", and shows the board as it is
- 0206 AC1 AC2: when opening the page itself is never answered, the 0149 test still ends its panel, and the others pass
- 0229 AC1: a full run starts its files by their last recorded times, and records each file's time for the next

## Outcome
The full suite passes on main again.

## Acceptance criteria
1. Each of these tests passes on main again: 0723 AC1: a test file that ran out of time under --test-timeout exits only once its Chromium has gone, 0267 AC1, AC3: rewording and reordering the brief, the changelog and the release notes fails no test, 0320 AC3: in a real browser, icon.svg loads (0413: the header's mark, checked here too, went with the header row), 0051 AC1: the log comes from the main checkout, even when the panel runs in a worktree, 0054 AC2-AC5: in a real browser, the pane opens, keeps a selection through refreshes and closes with Escape, 0067 AC1: a code change is served on the same port within 5 seconds, on every route, 0067 AC2: the token survives a restart, so Set ready works with the token from before it, 0067 AC4: new code that fails to start leaves the old server serving, shows the error and the next change tries again, 0067 AC5: the URL prints once, and Ctrl+C stops it with no process left behind, 0073 AC2: a paused build stops from the panel too, 0077 AC2 (self-check): choosing the priority a ticket already has commits nothing, even with other edits in it, 0132 AC3: for a ticket with no review rounds the server answers with no pack and no error, 0133 AC4: when speck ship refuses, the panel gets its message and the ticket stays approved, 0140 AC1: at 375 px in the light look, nothing reaches past the right edge, with every list, menu and pane open, 0145 AC4: the server answers 404 to pause and play and changes nothing; speck pause and speck play still work, 0159 AC3: b.js() and b.until() give up in their time limits, naming what they waited for, 0159 AC3: b.loaded() gives up when the page never arrives, naming the page, 0182 AC3: Chromium has closed within 10 s of a test file finishing that ran out of time under --test-timeout, 0187 AC1: a ticket changed in a build's own worktree, made after the panel started, reaches an open stream within 1 second, 0187 AC4: in a real browser, the page rides out the panel stopping and starting again, without "Disconnected", and shows the board as it is, 0206 AC1 AC2: when opening the page itself is never answered, the 0149 test still ends its panel, and the others pass, 0229 AC1: a full run starts its files by their last recorded times, and records each file's time for the next.
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
