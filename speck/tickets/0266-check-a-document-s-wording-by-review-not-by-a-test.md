---
id: "0266"
title: "Check a document's wording by review, not by a test"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-17

---
# 0266 · Check a document's wording by review, not by a test

**Status:** 📋 ready

## Problem
speck's build skill writes at least one test for every acceptance criterion, so a criterion about a document's wording ("the README opens with the tagline, then the plain line") becomes a test that pins the exact sentence and where it sits. The next edit to that document, by hand or by a later ticket, fails the suite and holds up every ship, as a README edit made on GitHub did on 2026-10-17. Once speck takes on tasks that aren't code, such as document edits, every one would leave tests like these behind.

## Outcome
A criterion about how a document reads is checked by the reviewer reading the document, not by a test. Tests about documents check only facts that can go wrong.

## Acceptance criteria
1. The ticket skill (`skills/speck-ticket/SKILL.md`) says that a criterion about a document's wording, tone, order or layout ends with `(checked by review)`. A criterion about a fact in a document keeps no marker and is tested: a command, a setting's name, a version, a file name, a link, or a name that mustn't appear. A document here is any file written for people to read, such as the README, `docs/` and the changelog.
2. The build skill (`skills/speck-build/SKILL.md`) says that the builder writes no test for a criterion marked `(checked by review)`, and never adds a test that checks a document's exact wording, or the order of its sentences, paragraphs or headings. Its self-check asks for a test only for the facts in the docs it changed, not for every sentence it added.
3. The reviewer prompt (`templates/reviewer-prompt.md`) says that the reviewer judges a criterion marked `(checked by review)` by reading the document as it is now, and cites the passage as its evidence. A missing test is no finding for it. A test the change adds that checks a document's exact wording or order is a blocking finding.
4. `docs/brief.md` describes the rule in one place: which document criteria are checked by review, and which facts in documents are tested.

## Out of scope
- Removing the tests that already pin documents' wording: 0267.
- Tests that check the wording of the skills or the reviewer prompt. Those files are instructions to agents, not documents for people, and stay as they are.

## Notes
- This ticket's own criteria are about the wording of skills and docs. Check them by review. Don't add tests that pin the new wording, which would be the very thing this ticket rules out.
- Seen on 2026-10-17: a README edit on GitHub failed 0249 AC1, 0250 AC1, 0251 AC1–AC3 and AC5, and 0255 AC1 on main, and needed fix ticket 0262.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
