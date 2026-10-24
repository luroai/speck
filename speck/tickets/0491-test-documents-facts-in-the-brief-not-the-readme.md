---
id: "0491"
title: "Test documents' facts in the brief, not the README"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0488"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T20:02:16.837Z"

---
# 0491 · Test documents' facts in the brief, not the README

**Status:** 🔨 building

## Problem
speck's rule that a fact in a document gets a test has left 58 test files reading the README. Each release ticket checks the README names that release's settings, and those checks never retire, so the README's structure is pinned: cutting or rewording it means moving dozens of tests. The README is speck's pitch, not its reference; `docs/brief.md` is the reference.

## Outcome
Facts are tested in the brief, and the README is checked by review, apart from the few things in it that break installs or the page if they're wrong.

## Acceptance criteria
1. The ticket skill, `docs/brief.md`'s "Criteria about documents" and the reviewer prompt say: a criterion about a fact in the README ends with `(checked by review)`, except the setup prompt, the status line's version, the demo pictures and whether its links resolve, which are tested. A fact in any other document, such as the brief, `docs/` or the changelog, is still tested.
2. No test file reads `README.md` except those that check the setup prompt, the status line's version, the `<picture>` block and its images, and that the README's links and anchors resolve. Checked by a test that lists every test file reading `README.md` against that allowed list.
3. Every setting name and command a removed README check looked for is checked in `docs/brief.md` instead, and the brief is given any it doesn't name yet. Checks that looked only for README wording, such as which section names a clever bit, are dropped.
4. No test that passed before this change fails.

## Out of scope
- The README's text (0489, 0490).
- Tests of facts in the brief, the changelog or `docs/releases/`, which stay.

## Notes
- Asked for by the user on 2026-10-24, after finding that 0490's cuts would mean moving dozens of README tests: "can you clean this mess up?"
- Today: the rule is in `skills/speck-ticket/SKILL.md` (step 4, Acceptance criteria), `docs/brief.md` ("Criteria about documents") and `templates/reviewer-prompt.md` (point 2). `skills/speck-build/SKILL.md` names only `(checked by review)` criteria.
- Measured on 2026-10-24: 58 test files read `README.md`, most of them `release-*.test.mjs` (settings each release added) and `readme-0250.test.mjs` (a command or setting for each step and clever bit). Keep `readme-0089` (setup prompt), `readme-0249` and `readme-0306` (pictures), and the status-line checks in the release tests.
- Waits for 0488, which changes the README's and the brief's Foreman wording and the tests that check it.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
